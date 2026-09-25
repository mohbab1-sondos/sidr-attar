"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { Loader2, Plus, Edit, Trash2, X, Save, Tag, AlertCircle } from "lucide-react";

interface Category {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const { authorized } = useRoleGuard(["admin", "sales"]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("خطأ في جلب التصنيفات:", error);
    } else {
      setCategories(data || []);
    }

    const { data: products } = await supabase.from("products").select("category_id");
    if (products) {
      const counts: Record<number, number> = {};
      products.forEach((p) => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });
      setProductCounts(counts);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (authorized) fetchData();
  }, [authorized]);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", sort_order: categories.length + 1 });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, sort_order: cat.sort_order });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError("اسم التصنيف مطلوب");
      return;
    }
    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      sort_order: Number(formData.sort_order) || 0,
    };

    let error;
    if (editingCategory) {
      const res = await supabase.from("categories").update(payload).eq("id", editingCategory.id);
      error = res.error;
    } else {
      const res = await supabase.from("categories").insert(payload);
      error = res.error;
    }

    if (error) {
      setFormError("حدث خطأ: " + error.message);
      setSaving(false);
      return;
    }

    setIsModalOpen(false);
    setSaving(false);
    fetchData();
  };

  const handleDelete = async (cat: Category) => {
    const count = productCounts[cat.id] || 0;
    const message = count > 0
      ? `هذا التصنيف يحتوي على ${count} منتج.\nعند الحذف، ستُصبح هذه المنتجات "بدون تصنيف".\n\nهل أنت متأكد من الحذف؟`
      : `هل أنت متأكد من حذف تصنيف "${cat.name}"؟`;

    if (!confirm(message)) return;

    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) {
      alert("خطأ في الحذف: " + error.message);
      return;
    }
    fetchData();
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
          <h1 className="text-2xl font-bold text-sidr-green">التصنيفات</h1>
          <p className="text-gray-500 text-sm">إدارة تصنيفات المنتجات</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-sidr-green hover:bg-sidr-green/90 text-white px-5 py-3 rounded-xl font-bold transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة تصنيف
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sidr-green animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">لا توجد تصنيفات</p>
          <button
            onClick={openAddModal}
            className="text-sidr-green font-bold hover:underline"
          >
            إضافة أول تصنيف
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border-2 border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sidr-light-green flex items-center justify-center">
                    <Tag className="w-6 h-6 text-sidr-green" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sidr-green text-lg">{cat.name}</h3>
                    <p className="text-xs text-gray-400">ترتيب: {cat.sort_order}</p>
                  </div>
                </div>
              </div>

              <div className="bg-sidr-cream rounded-xl p-3 mb-4 text-center">
                <p className="text-xs text-gray-500 mb-1">عدد المنتجات</p>
                <p className="text-2xl font-bold text-sidr-brown">{productCounts[cat.id] || 0}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(cat)}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100 py-2 rounded-xl text-sm font-bold transition"
                >
                  <Edit className="w-4 h-4" /> تعديل
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 py-2 rounded-xl text-sm font-bold transition"
                >
                  <Trash2 className="w-4 h-4" /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 p-4 md:p-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-sidr-green">
                {editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">اسم التصنيف <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormError(""); }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                  placeholder="مثال: زيوت، عسل، أعشاب"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">ترتيب الظهور</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                  placeholder="1، 2، 3..."
                />
                <p className="text-xs text-gray-400 mt-1">الأرقام الأصغر تظهر أولاً</p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {formError}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-4 md:p-6 flex gap-3">
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
                  <><Save className="w-5 h-5" /> {editingCategory ? "حفظ التعديلات" : "إضافة"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}