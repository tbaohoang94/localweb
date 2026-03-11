import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // Auth-Check: Nur eingeloggte User duerfen Sync triggern
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server-Route: Cookies koennen hier nicht gesetzt werden
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Webhook-URL ist server-seitig — nicht im Client-Bundle sichtbar
  const webhookUrl = process.env.N8N_SYNC_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Sync webhook not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(webhookUrl, { method: "POST" });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Webhook responded with " + res.status },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Webhook unreachable" },
      { status: 502 }
    );
  }
}
