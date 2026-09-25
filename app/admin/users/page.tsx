"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { 
  Loader2, Plus, Search, Edit, Trash2, X, Save, 
  Users, Shield, ShoppingBag, Truck, UserCircle, 
  AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Power
} from "lucide-react";

interface UserProfile {
  id: number;
  user_id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "sales" | "delivery";
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  admin: { label: "مدير", color: "bg-purple-100 text-purple-700 border-purple-300", icon: Shield },
  sales: { label: "مبيعات", color: "bg-blue-100 text-blue-700 border-blue-300", icon: ShoppingBag },
  delivery: { label: "مندوب توصيل", color: "bg-orange-100 text-orange-700 border-orange-300", icon: Truck },
};

export default function AdminUsersPage() {
  const { authorized } = useRoleGuard(["admin"]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "sales" as "admin" | "sales" | "delivery",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [savedMessage, setSavedMessage] = useState("");

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("لا توجد جلسة");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    };
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/users", { headers });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "فشل جلب المستخدمين");
      setUsers(data.users || []);
    } catch (err: any) {
      console.error("خطأ:", err);
      alert("فشل جلب المستخدمين: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) fetchUsers();
  }, [authorized]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ email: "", password: "", full_name: "", role: "sales" });
    setFormError("");
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      full_name: user.full_name || "",
      role: user.role,
    });
    setFormError("");
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");

    if (!editingUser) {
      if (!formData.email.trim()) { setFormError("البريد الإلكتروني مطلوب"); return; }
      if (!formData.password) { setFormError("كلمة المرور مطلوبة"); return; }
      if (formData.password.length < 6) { setFormError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    }
    if (!formData.full_name.trim()) { setFormError("الاسم الكامل مطلوب"); return; }

    setSaving(true);

    try {
      const headers = await getAuthHeaders();

      if (editingUser) {
        const body: any = {
          full_name: formData.full_name.trim(),
          role: formData.role,
        };
        if (formData.password) body.new_password = formData.password;

        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers,
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            full_name: formData.full_name.trim(),
            role: formData.role,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }

      setIsModalOpen(false);
      setSavedMessage(editingUser ? "تم تحديث المستخدم بنجاح" : "تم إنشاء المستخدم بنجاح");
      setTimeout(() => setSavedMessage(""), 3000);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`هل أنت متأكد من حذف "${user.full_name || user.email}"؟\nلا يمكن التراجع عن هذه العملية.`)) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSavedMessage("تم حذف المستخدم بنجاح");
      setTimeout(() => setSavedMessage(""), 3000);
      fetchUsers();
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  };

  const toggleActive = async (user: UserProfile) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (err: any) {
      alert("فشل التحديث: " + err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  if (authorized === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sidr-green animate-spin" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">ليس لديك صلاحية الوصول لهذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sidr-green">إدارة المستخدمين</h1>
          <p className="text-gray-500 text-sm">إدارة حسابات الفريق والصلاحيات</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-sidr-green hover:bg-sidr-green/90 text-white px-5 py-3 rounded-xl font-bold transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة مستخدم
        </button>
      </div>

      {savedMessage && (
        <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-semibold">{savedMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو البريد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none bg-white"
        >
          <option value="all">كل الأدوار</option>
          <option value="admin">مدير</option>
          <option value="sales">مبيعات</option>
          <option value="delivery">مندوب توصيل</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sidr-green animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا يوجد مستخدمون لعرضهم</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const roleInfo = ROLE_LABELS[user.role];
            const RoleIcon = roleInfo.icon;
            return (
              <div key={user.id} className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border-2 ${user.is_active ? "border-gray-100" : "border-red-200 bg-red-50/30"}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.is_active ? "bg-sidr-light-green" : "bg-gray-200"}`}>
                    <UserCircle className={`w-6 h-6 ${user.is_active ? "text-sidr-green" : "text-gray-500"}`} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-sidr-green truncate">{user.full_name || "بدون اسم"}</h3>
                    <p className="text-xs text-gray-500 truncate" dir="ltr">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold border-2 ${roleInfo.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleInfo.label}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {user.is_active ? "نشط" : "معطل"}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mb-4">تاريخ الإنشاء: {formatDate(user.created_at)}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(user)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition border-2 ${
                      user.is_active 
                        ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" 
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {user.is_active ? "تعطيل" : "تفعيل"}
                  </button>
                  <button
                    onClick={() => openEditModal(user)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100 transition"
                  >
                    <Edit className="w-3 h-3" /> تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 md:p-6 flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-sidr-green">
                {editingUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  البريد الإلكتروني {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition ${editingUser ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                  placeholder="user@example.com"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  {editingUser ? "كلمة مرور جديدة (اتركها فارغة لعدم التغيير)" : "كلمة المرور"}
                  {!editingUser && <span className="text-red-500"> *</span>}
                </label>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pr-10 pl-12 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                    placeholder={editingUser ? "اتركها فارغة" : "6 أحرف على الأقل"}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                  placeholder="الاسم الكامل"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">الدور والصلاحيات</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "admin", label: "مدير", icon: Shield },
                    { value: "sales", label: "مبيعات", icon: ShoppingBag },
                    { value: "delivery", label: "مندوب", icon: Truck },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = formData.role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: opt.value as any })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition ${
                          isSelected 
                            ? "border-sidr-green bg-sidr-light-green text-sidr-green font-bold" 
                            : "border-gray-200 hover:border-sidr-green/40"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 bg-sidr-cream rounded-xl p-3 text-xs text-gray-600">
                  {formData.role === "admin" && "🔑 صلاحيات كاملة: إدارة الطلبات، المنتجات، الإعدادات، والمستخدمين."}
                  {formData.role === "sales" && "🛒 يمكنه إدارة الطلبات والمنتجات والتصنيفات فقط."}
                  {formData.role === "delivery" && "🚚 يمكنه عرض الطلبات فقط."}
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border-2 border-red-300 text-red-700 text-sm rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 md:p-6 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-sidr-green hover:bg-sidr-green/90 disabled:bg-gray-400 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
                ) : (
                  <><Save className="w-5 h-5" /> {editingUser ? "حفظ التعديلات" : "إضافة المستخدم"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}