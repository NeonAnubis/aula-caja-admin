"use client";

import { useState, useTransition } from "react";
import { setRole, setActive, deleteUser } from "./actions";
import type { UserRole } from "@prisma/client";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  CASHIER: "Cajero",
  PARENT: "Tutor"
};

const ROLE_CLASS: Record<UserRole, string> = {
  ADMIN:
    "bg-brand-50 text-brand-700 border border-brand-100",
  CASHIER:
    "bg-ink-100 text-ink-800 border border-ink-200",
  PARENT:
    "bg-ink-50 text-ink-600 border border-ink-100"
};

export function UserRow({
  user,
  isMe,
  initials,
  createdLabel
}: {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: UserRole;
    active: boolean;
    createdAt: string;
  };
  isMe: boolean;
  initials: string;
  createdLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "err"; text: string } | null
  >(null);

  function call(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setFeedback(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        setFeedback({ kind: "ok", text: r.message ?? "OK" });
      } else {
        setFeedback({ kind: "err", text: r.error ?? "Falló la acción" });
      }
    });
  }

  return (
    <tr className={"transition-colors " + (pending ? "opacity-60" : "hover:bg-ink-50/50")}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-900 font-mono text-xs font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-ink-900">
              {user.fullName ?? <span className="italic text-ink-400">sin nombre</span>}
              {isMe && (
                <span className="ml-2 rounded-md bg-brand-50 px-1.5 py-0.5 text-2xs font-mono uppercase tracking-widest text-brand-700">
                  tú
                </span>
              )}
            </div>
            <div className="truncate font-mono text-2xs text-ink-500">{user.email}</div>
          </div>
        </div>
        {feedback && (
          <p
            className={
              "mt-2 inline-block rounded-md px-2 py-0.5 text-2xs font-semibold " +
              (feedback.kind === "ok"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700")
            }
          >
            {feedback.text}
          </p>
        )}
      </td>

      <td className="px-4 py-3">
        <select
          value={user.role}
          disabled={pending}
          onChange={(e) =>
            call(() => setRole(user.id, e.target.value as UserRole))
          }
          className={
            "h-10 rounded-xl px-3 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:cursor-not-allowed " +
            ROLE_CLASS[user.role]
          }
        >
          <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
          <option value="CASHIER">{ROLE_LABEL.CASHIER}</option>
          <option value="PARENT">{ROLE_LABEL.PARENT}</option>
        </select>
      </td>

      <td className="px-4 py-3">
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-2xs font-bold " +
            (user.active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-ink-100 text-ink-600")
          }
        >
          <span
            className={
              "h-1.5 w-1.5 rounded-full " +
              (user.active ? "bg-emerald-500" : "bg-ink-400")
            }
          />
          {user.active ? "ACTIVO" : "INACTIVO"}
        </span>
      </td>

      <td className="px-4 py-3 font-mono text-2xs text-ink-500">
        {createdLabel}
      </td>

      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            disabled={pending || isMe}
            onClick={() => call(() => setActive(user.id, !user.active))}
            className="h-9 rounded-xl border-2 border-ink-200 bg-white px-3 text-xs font-semibold text-ink-900 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {user.active ? "Desactivar" : "Reactivar"}
          </button>
          <button
            type="button"
            disabled={pending || isMe}
            onClick={() => {
              if (
                confirm(
                  `Eliminar a ${user.fullName ?? user.email}? Esto borra la cuenta de auth y todos sus accesos. No se puede deshacer.`
                )
              )
                call(() => deleteUser(user.id));
            }}
            className="h-9 rounded-xl border-2 border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}
