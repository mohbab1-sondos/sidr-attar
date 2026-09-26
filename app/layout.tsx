import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { createClient } from "@supabase/supabase-js";

const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

// جلب الشعار من قاعدة البيانات لاستخدامه كـ favicon
export async function generateMetadata(): Promise<Metadata> {
  let logoUrl = "/favicon.ico";
  let storeName = "عطارة سدرة";
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("store_settings")
      .select("logo_url, store_name")
      .limit(1)
      .single();

    if (data?.logo_url) logoUrl = data.logo_url;
    if (data?.store_name) storeName = data.store_name;
  } catch (e) {
    // استخدام القيم الافتراضية
  }

  return {
    title: `${storeName} | متجرك الطبيعي`,
    description: "منصة طلب إلكترونية بسيطة وسريعة لاختيار المنتجات والكميات.",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: storeName,
    },
    icons: {
      icon: logoUrl,
      apple: logoUrl,
      shortcut: logoUrl,
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-cairo antialiased`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}