import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let logoUrl = "/icon-512.png";
  let storeName = "عطارة سدرة";

  try {
    const { data } = await supabase
      .from("store_settings")
      .select("logo_url, store_name")
      .limit(1)
      .single();

    if (data?.logo_url) logoUrl = data.logo_url;
    if (data?.store_name) storeName = data.store_name;
  } catch (e) {
    console.error("فشل جلب الإعدادات للـ manifest:", e);
  }

  const manifest = {
    name: `${storeName} - لوحة التحكم`,
    short_name: "إدارة سدرة",
    description: "لوحة تحكم عطارة سدرة",
    start_url: "/admin/orders",
    display: "standalone",
    background_color: "#FDFBF7",
    theme_color: "#2E5A3E",
    orientation: "portrait",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: logoUrl, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: logoUrl, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: logoUrl, sizes: "any", type: "image/png", purpose: "maskable" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}