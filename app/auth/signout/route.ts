import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  const supabase = getServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
