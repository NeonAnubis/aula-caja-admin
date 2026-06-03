import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  const url = new URL(request.url);
  return NextResponse.redirect(`${url.origin}/`, { status: 303 });
}
