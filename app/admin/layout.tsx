"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { Leaf, ShoppingBag, Package, Tag, Settings, LogOut, Loader2, Menu, X } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // إذا كنا في صفحة تسجيل الدخول، لا نطبق أي حماية
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    let mounted = true;

    // دالة للتحقق من الجلسة
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error("خطأ في التحقق من الجلسة:", error);
          if (!isLoginPage) router.push("/admin/login");
          setLoading(false);
          return;
        }

        if (data.session?.user) {
          setUser(data.session.user);
        } else if (!isLoginPage) {
          router.push("/admin/login");
        }
      } catch (err) {
        console.error("خطأ غير متوقع:", err);
        if (!isLoginPage) router.push("/admin/login");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkAuth();

    // الاستماع لتغييرات الجلسة
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        if (!isLoginPage) router.push("/admin/login");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // إذا كنا في صفحة الدخول، اعرض المحتوى مباشرة بدون أي تحقق
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sidr-cream">
        <Loader2 className="w-10 h-10 text-sidr-green animate-spin" />
        <p className="text-sm text-gray-500 mt-4">جاري التحقق من الجلسة...</p>
      </div>
    );
  }

  const menuItems = [
    { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
    { href: "/admin/products", label: "المنتجات", icon: Package },
    { href: "/admin/categories", label: "التصنيفات", icon: Tag },
    { href: "/admin/settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <aside className={`fixed md:static inset-y-0 right-0 z-50 w-64 bg-sidr-green text-white transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="p-6 border-b border-sidr-light-green/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-sidr-light-green" />
              <div>
                <h1 className="font-bold">عطارة سدرة</h1>
                <p className="text-xs text-sidr-light-green">لوحة التحكم</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive ? "bg-sidr-light-green text-sidr-green font-bold" : "hover:bg-sidr-light-green/20"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidr-light-green/20">
          <p className="text-xs text-sidr-light-green mb-2 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white py-2 rounded-xl transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="w-6 h-6 text-sidr-green" />
          </button>
          <span className="font-bold text-sidr-green">لوحة التحكم</span>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}