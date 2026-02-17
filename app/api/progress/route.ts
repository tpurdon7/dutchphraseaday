import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeProgressPayload } from "@/lib/progress-sync";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabaseAdmin = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("progress")
      .select("start_date_key, learned_days, typed_attempts_by_date, daily_checkin_by_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ progress: null });
    }

    const progress = normalizeProgressPayload({
      startDateKey: data.start_date_key,
      learnedDays: data.learned_days,
      typedAttemptsByDate: data.typed_attempts_by_date,
      dailyCheckInByDate: data.daily_checkin_by_date
    });

    return NextResponse.json({ progress });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch progress.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = normalizeProgressPayload(await request.json());
    if (!payload) {
      return NextResponse.json({ error: "Invalid progress payload." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("progress").upsert(
      {
        user_id: userId,
        start_date_key: payload.startDateKey,
        learned_days: payload.learnedDays,
        typed_attempts_by_date: payload.typedAttemptsByDate,
        daily_checkin_by_date: payload.dailyCheckInByDate,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save progress.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
