-- =====================================================================
-- Aula Caja . bootstrap SQL (run once in Supabase Dashboard > SQL Editor
-- AFTER `npx prisma db push` has created the tables)
-- =====================================================================

-- ---------------------------------------------------------------------
--  Auto-create a public.profiles row when a new auth user signs up.
--  The trigger fires regardless of whether email confirmation is enabled.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_role text;
begin
  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- First user becomes ADMIN. Everyone else defaults to CASHIER.
  if (select count(*) from public.profiles) = 0 then
    v_role := 'ADMIN';
  else
    v_role := coalesce(new.raw_user_meta_data->>'role', 'CASHIER');
  end if;

  insert into public.profiles (id, email, full_name, role, active, created_at, updated_at)
  values (new.id, new.email, v_full_name, v_role::"UserRole", true, now(), now())
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
--  Touch profiles when auth.users.email or metadata changes
-- ---------------------------------------------------------------------
create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email      = new.email,
         full_name  = coalesce(new.raw_user_meta_data->>'full_name', full_name),
         updated_at = now()
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_update();

-- ---------------------------------------------------------------------
--  Helper: current user role
-- ---------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
--  Row-Level Security
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.students            enable row level security;
alter table public.products            enable row level security;
alter table public.sales               enable row level security;
alter table public.sale_items          enable row level security;
alter table public.recharges           enable row level security;
alter table public.treasury_movements  enable row level security;
alter table public.suppliers           enable row level security;
alter table public.purchase_orders     enable row level security;
alter table public.purchase_order_items enable row level security;

-- profiles: a user can read/update only their own row
drop policy if exists "profiles_self_read"   on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_admin_read"  on public.profiles;

create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_admin_read"
  on public.profiles for select
  using (public.current_user_role() = 'ADMIN');

-- staff tables (students, products, sales, recharges, treasury, suppliers, POs)
-- Authenticated cashiers + admins can read. Admins can also write.
-- The service-role client (used in our server actions) bypasses RLS anyway,
-- so write-policies for "anon"/"authenticated" stay restrictive on purpose.
do $body$
declare
  t text;
begin
  for t in
    select unnest(array[
      'students','products','sales','sale_items','recharges',
      'treasury_movements','suppliers','purchase_orders','purchase_order_items'
    ])
  loop
    execute format('drop policy if exists "%s_staff_read" on public.%I', t, t);
    execute format(
      'create policy "%s_staff_read" on public.%I for select using (
         public.current_user_role() in (''ADMIN'',''CASHIER''))',
      t, t
    );
  end loop;
end
$body$;

-- ---------------------------------------------------------------------
--  Atomic sale flow (charge cart against student balance + stock)
--  Returns the new sale id on success, raises an exception otherwise.
-- ---------------------------------------------------------------------
create or replace function public.record_sale(
  p_folio          text,
  p_student_id     text,
  p_cashier_id     uuid,
  p_payment_method "PaymentMethod",
  p_items          jsonb,         -- [{productId, quantity}, ...]
  p_discount_cents int default 0,
  p_notes          text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id      text := concat('sa_', gen_random_uuid()::text);
  v_subtotal     int := 0;
  v_total        int;
  v_item         jsonb;
  v_product      record;
  v_qty          int;
  v_line_total   int;
  v_balance      int;
begin
  -- Lock and validate products + stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty <= 0 then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    select * into v_product
      from public.products
     where id = v_item->>'productId'
       for update;

    if not found then
      raise exception 'product_not_found:%', v_item->>'productId' using errcode = '23503';
    end if;
    if not v_product.active then
      raise exception 'product_inactive:%', v_product.sku using errcode = '23000';
    end if;
    if v_product.stock < v_qty then
      raise exception 'insufficient_stock:%:%', v_product.sku, v_product.stock using errcode = '23514';
    end if;

    v_line_total := v_product.price_cents * v_qty;
    v_subtotal := v_subtotal + v_line_total;

    -- decrement stock
    update public.products set stock = stock - v_qty, updated_at = now()
      where id = v_product.id;
  end loop;

  v_total := greatest(v_subtotal - coalesce(p_discount_cents, 0), 0);

  -- If paying with balance, lock student + check + debit
  if p_payment_method = 'BALANCE' then
    if p_student_id is null then
      raise exception 'student_required_for_balance' using errcode = '23514';
    end if;

    select balance_cents into v_balance
      from public.students
     where id = p_student_id
       for update;

    if not found then
      raise exception 'student_not_found' using errcode = '23503';
    end if;
    if v_balance < v_total then
      raise exception 'insufficient_balance:%:%', v_balance, v_total using errcode = '23514';
    end if;

    update public.students
       set balance_cents = balance_cents - v_total,
           updated_at = now()
     where id = p_student_id;
  end if;

  -- insert sale header
  insert into public.sales (
    id, folio, student_id, cashier_id,
    subtotal_cents, discount_cents, total_cents,
    payment_method, status, notes, created_at
  ) values (
    v_sale_id, p_folio, p_student_id, p_cashier_id,
    v_subtotal, coalesce(p_discount_cents, 0), v_total,
    p_payment_method, 'COMPLETED', p_notes, now()
  );

  -- insert sale items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = v_item->>'productId';
    v_qty := (v_item->>'quantity')::int;
    v_line_total := v_product.price_cents * v_qty;
    insert into public.sale_items (
      id, sale_id, product_id, product_name, quantity, price_cents, total_cents
    ) values (
      concat('si_', gen_random_uuid()::text),
      v_sale_id, v_product.id, v_product.name,
      v_qty, v_product.price_cents, v_line_total
    );
  end loop;

  -- treasury record (income)
  insert into public.treasury_movements (
    id, type, amount_cents, account, concept, reference, created_by_id, created_at
  ) values (
    concat('tm_', gen_random_uuid()::text),
    'INCOME',
    v_total,
    case p_payment_method
      when 'BALANCE' then 'Saldo prepagado'
      when 'CASH'    then 'Caja chica'
      when 'CARD'    then 'Conekta'
    end,
    concat('Venta ', p_folio),
    p_folio,
    p_cashier_id,
    now()
  );

  return v_sale_id;
end;
$$;

-- ---------------------------------------------------------------------
--  Atomic recharge flow (credit student balance + treasury entry)
-- ---------------------------------------------------------------------
create or replace function public.record_recharge(
  p_folio          text,
  p_student_id     text,
  p_amount_cents   int,
  p_method         "RechargeMethod",
  p_recorded_by_id uuid,
  p_reference      text default null,
  p_notes          text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recharge_id text := concat('rc_', gen_random_uuid()::text);
  v_student     record;
begin
  if p_amount_cents <= 0 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  select * into v_student from public.students where id = p_student_id for update;
  if not found then
    raise exception 'student_not_found' using errcode = '23503';
  end if;

  update public.students
     set balance_cents = balance_cents + p_amount_cents,
         updated_at = now()
   where id = p_student_id;

  insert into public.recharges (
    id, folio, student_id, amount_cents, method, reference, recorded_by_id, notes, created_at
  ) values (
    v_recharge_id, p_folio, p_student_id, p_amount_cents,
    p_method, p_reference, p_recorded_by_id, p_notes, now()
  );

  insert into public.treasury_movements (
    id, type, amount_cents, account, concept, reference, created_by_id, created_at
  ) values (
    concat('tm_', gen_random_uuid()::text),
    'INCOME',
    p_amount_cents,
    case p_method
      when 'CASH'              then 'Caja chica'
      when 'OXXO'              then 'Conekta'
      when 'SPEI'              then 'BBVA Empresarial'
      when 'CARD'              then 'Conekta'
      when 'MERCADO_PAGO'      then 'Mercado Pago'
      when 'MANUAL_ADJUSTMENT' then 'Ajuste manual'
    end,
    concat('Recarga ', p_folio, ' . ', v_student.full_name),
    p_folio,
    p_recorded_by_id,
    now()
  );

  return v_recharge_id;
end;
$$;

-- ---------------------------------------------------------------------
--  Atomic refund flow (reverse a completed sale)
--  Restores stock, credits student balance (if BALANCE),
--  marks the sale as REFUNDED and writes a compensating treasury
--  movement so financial reports stay correct.
-- ---------------------------------------------------------------------
create or replace function public.record_refund(
  p_sale_id    text,
  p_cashier_id uuid,
  p_reason     text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale        record;
  v_item        record;
  v_treasury_id text := concat('tm_', gen_random_uuid()::text);
begin
  -- Lock the sale; raise if it doesn't exist or is not refundable.
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale_not_found' using errcode = '23503';
  end if;
  if v_sale.status <> 'COMPLETED' then
    raise exception 'sale_not_refundable:%', v_sale.status using errcode = '23514';
  end if;

  -- Restore stock for every line item.
  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    update public.products
       set stock      = stock + v_item.quantity,
           updated_at = now()
     where id = v_item.product_id;
  end loop;

  -- Credit the student's balance back when the sale was paid with saldo.
  if v_sale.payment_method = 'BALANCE' and v_sale.student_id is not null then
    update public.students
       set balance_cents = balance_cents + v_sale.total_cents,
           updated_at    = now()
     where id = v_sale.student_id;
  end if;

  -- Mark sale as refunded and append the reason to notes.
  update public.sales
     set status = 'REFUNDED',
         notes  = case
                    when p_reason is not null
                      then trim(both ' ' from concat(coalesce(notes, ''), ' | Refund: ', p_reason))
                    else notes
                  end
   where id = p_sale_id;

  -- Compensating treasury entry: an EXPENSE that offsets the original INCOME.
  insert into public.treasury_movements (
    id, type, amount_cents, account, concept, reference, created_by_id, created_at
  ) values (
    v_treasury_id,
    'EXPENSE',
    v_sale.total_cents,
    case v_sale.payment_method
      when 'BALANCE' then 'Saldo prepagado'
      when 'CASH'    then 'Caja chica'
      when 'CARD'    then 'Conekta'
    end,
    concat(
      'Devolución venta ', v_sale.folio,
      case when p_reason is not null then concat(' . ', p_reason) else '' end
    ),
    v_sale.folio,
    p_cashier_id,
    now()
  );

  return v_sale.folio;
end;
$$;

-- ---------------------------------------------------------------------
--  Tutor portal . parent ↔ student links table is created by Prisma.
--  RLS for parent-side reads.
-- ---------------------------------------------------------------------
do $body$
begin
  if exists (select 1 from information_schema.tables
              where table_schema = 'public'
                and table_name   = 'parent_student_links') then
    execute 'alter table public.parent_student_links enable row level security';

    execute 'drop policy if exists "psl_parent_read" on public.parent_student_links';
    execute 'create policy "psl_parent_read"
               on public.parent_student_links for select
               using (parent_id = auth.uid())';

    execute 'drop policy if exists "psl_staff_read" on public.parent_student_links';
    execute 'create policy "psl_staff_read"
               on public.parent_student_links for select
               using (public.current_user_role() in (''ADMIN'', ''CASHIER''))';
  end if;
end
$body$;

-- ---------------------------------------------------------------------
--  Tutor portal . allow parents to read their linked students + recharges
-- ---------------------------------------------------------------------
do $body$
begin
  -- A parent can SELECT a student row if a link to it exists.
  if exists (select 1 from information_schema.tables
              where table_schema = 'public' and table_name = 'students') then
    execute 'drop policy if exists "students_parent_read" on public.students';
    execute 'create policy "students_parent_read"
               on public.students for select
               using (exists (
                 select 1 from public.parent_student_links psl
                  where psl.student_id = id and psl.parent_id = auth.uid()
               ))';
  end if;

  if exists (select 1 from information_schema.tables
              where table_schema = 'public' and table_name = 'recharges') then
    execute 'drop policy if exists "recharges_parent_read" on public.recharges';
    execute 'create policy "recharges_parent_read"
               on public.recharges for select
               using (exists (
                 select 1 from public.parent_student_links psl
                  where psl.student_id = recharges.student_id
                    and psl.parent_id  = auth.uid()
               ))';
  end if;

  if exists (select 1 from information_schema.tables
              where table_schema = 'public' and table_name = 'sales') then
    execute 'drop policy if exists "sales_parent_read" on public.sales';
    execute 'create policy "sales_parent_read"
               on public.sales for select
               using (exists (
                 select 1 from public.parent_student_links psl
                  where psl.student_id = sales.student_id
                    and psl.parent_id  = auth.uid()
               ))';
  end if;
end
$body$;
