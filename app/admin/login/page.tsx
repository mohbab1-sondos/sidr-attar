"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Leaf, Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("🔍 محاولة تسجيل الدخول للبريد:", email);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      console.log("📦 نتيجة الاتصال بـ Supabase:");
      console.log("  - البيانات:", data);
      console.log("  - الخطأ:", authError);

      if (authError) {
        // ترجمة رسائل الأخطاء الشائعة
        let arabicError = "حدث خطأ أثناء تسجيل الدخول";
        if (authError.message.includes("Invalid login credentials")) {
          arabicError = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        } else if (authError.message.includes("Email not confirmed")) {
          arabicError = "البريد الإلكتروني غير مؤكد. يرجى تأكيد الحساب من Supabase";
        } else if (authError.message.includes("network")) {
          arabicError = "خطأ في الاتصال بالشبكة. تحقق من الإنترنت";
        } else {
          arabicError = `خطأ: ${authError.message}`;
        }
        
        setError(arabicError);
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        console.log("✅ تم تسجيل الدخول بنجاح!");
        console.log("  - المستخدم:", data.user.email);
        console.log("  - سيتم التوجيه إلى /admin/orders");
        
        // إعادة التوجيه مع تحديث الصفحة
        router.refresh();
        router.push("/admin/orders");
      } else {
        setError("لم يتم استلام بيانات صحيحة من الخادم");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("❌ خطأ غير متوقع:", err);
      setError(`خطأ غير متوقع: ${err.message || "يرجى المحاولة مرة أخرى"}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidr-cream px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-md">
        {/* الشعار والعنوان */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sidr-green rounded-full mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-sidr-green">لوحة تحكم عطارة سدرة</h1>
          <p className="text-gray-500 text-sm mt-2">سجل الدخول للمتابعة</p>
        </div>

        {/* النموذج */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                placeholder="admin@sidr-attar.com"
                dir="ltr"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                placeholder="••••••••"
                dir="ltr"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 text-sm rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sidr-green hover:bg-sidr-green/90 disabled:bg-gray-400 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          هذه الصفحة مخصصة لإدارة المتجر فقط
        </p>
      </div>
    </div>
  );
}