"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { Leaf, ShoppingBag, Package, Tag, Settings, LogOut, Loader2, Menu, X, Users, BarChart3 } from "lucide-react";

interface MenuItem {
  href: string;
  label: string;
  icon: any;
  badge?: number;
  roles: string[];
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const isLoginPage = pathname === "/admin/login";

  const fetchNewOrdersCount = async () => {
    try {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");
      
      if (!error && count !== null) {
        setNewOrdersCount(count);
      }
    } catch (err) {
      console.error("خطأ في جلب عدد الطلبات:", err);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("user_id", userId)
        .single();
      
      if (error || !data) {
        console.error("لا يوجد بروفايل للمستخدم:", error);
        return null;
      }

      if (!data.is_active) {
        alert("حسابك معطل. يرجى التواصل مع المدير.");
        await supabase.auth.signOut();
        router.push("/admin/login");
        return null;
      }

      return data.role;
    } catch (err) {
      console.error("خطأ في جلب الدور:", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

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
          const role = await fetchUserRole(data.session.user.id);
          if (mounted && role) {
            setUserRole(role);
            fetchNewOrdersCount();
          } else if (!isLoginPage) {
            router.push("/admin/login");
          }
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

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setUserRole(null);
        if (!isLoginPage) router.push("/admin/login");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, isLoginPage]);

  useEffect(() => {
    if (isLoginPage || !user) return;

    const interval = setInterval(() => {
      fetchNewOrdersCount();
    }, 30000);

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchNewOrdersCount();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isLoginPage, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

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

  const allMenuItems: MenuItem[] = [
    { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag, badge: newOrdersCount, roles: ["admin", "sales", "delivery"] },
    { href: "/admin/products", label: "المنتجات", icon: Package, roles: ["admin", "sales"] },
    { href: "/admin/categories", label: "التصنيفات", icon: Tag, roles: ["admin", "sales"] },
    { href: "/admin/reports", label: "التقارير", icon: BarChart3, roles: ["admin"] },
    { href: "/admin/users", label: "المستخدمون", icon: Users, roles: ["admin"] },
    { href: "/admin/settings", label: "الإعدادات", icon: Settings, roles: ["admin"] },
  ];

  const menuItems = allMenuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  const getRoleLabel = (role: string | null) => {
    if (role === "admin") return "مدير";
    if (role === "sales") return "مبيعات";
    if (role === "delivery") return "مندوب توصيل";
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <aside className={`fixed md:static inset-y-0 right-0 z-50 w-64 bg-sidr-green text-white transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"} flex flex-col`}>
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

        <nav className="p-4 space-y-1 flex-grow overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const hasBadge = item.badge && item.badge > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition ${
                  isActive ? "bg-sidr-light-green text-sidr-green font-bold" : "hover:bg-sidr-light-green/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {hasBadge && (
                  <span className={`flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold ${
                    isActive ? "bg-sidr-green text-white" : "bg-red-500 text-white animate-pulse"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidr-light-green/20">
          <div className="mb-3">
            <p className="text-xs text-sidr-light-green truncate">{user?.email}</p>
            <p className="text-xs text-sidr-light-green/70 mt-0.5">الدور: {getRoleLabel(userRole)}</p>
          </div>
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
          <button onClick={() => setSidebarOpen(true)} className="p-2 relative">
            <Menu className="w-6 h-6 text-sidr-green" />
            {newOrdersCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {newOrdersCount}
              </span>
            )}
          </button>
          <span className="font-bold text-sidr-green">لوحة التحكم</span>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}