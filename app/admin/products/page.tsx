"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { 
  Loader2, Plus, Search, Edit, Trash2, X, Save, 
  Package, Eye, EyeOff 
} from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  sale_type: "piece" | "weight" | "package";
  category_id: number | null;
  image_url: string | null;
  is_available: boolean;
  min_weight: number | null;
  weight_increment: number | null;
  sort_order: number | null;
}

const emptyProduct = {
  name: "",
  description: "",
  price: 0,
  sale_type: "piece" as "piece" | "weight" | "package",
  category_id: null as number | null,
  image_url: "",
  is_available: true,
  min_weight: 50,
  weight_increment: 50,
  sort_order: 0,
};

export default function AdminProductsPage() {
  const { authorized } = useRoleGuard(["admin", "sales"]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<any>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    const [prodsRes, catsRes] = await Promise.all([
      supabase.from("products").select("*").order("sort_order", { ascending: true }),
      supabase.from("categories").select("id, name").order("sort_order", { ascending: true }),
    ]);

    if (prodsRes.error) console.error("خطأ المنتجات:", prodsRes.error);
    else setProducts(prodsRes.data || []);

    if (catsRes.error) console.error("خطأ التصنيفات:", catsRes.error);
    else setCategories(catsRes.data || []);

    setLoading(false);
  };

  useEffect(() => {
    if (authorized) fetchData();
  }, [authorized]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ ...emptyProduct, category_id: categories[0]?.id || null });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      sale_type: product.sale_type,
      category_id: product.category_id,
      image_url: product.image_url || "",
      is_available: product.is_available,
      min_weight: product.min_weight || 50,
      weight_increment: product.weight_increment || 50,
      sort_order: product.sort_order || 0,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "اسم المنتج مطلوب";
    if (!formData.price || formData.price <= 0) errs.price = "السعر يجب أن يكون أكبر من صفر";
    if (!formData.category_id) errs.category_id = "اختر تصنيفاً";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      price: Number(formData.price),
      sale_type: formData.sale_type,
      category_id: Number(formData.category_id),
      image_url: formData.image_url?.trim() || null,
      is_available: formData.is_available,
      min_weight: formData.sale_type === "weight" ? Number(formData.min_weight) : null,
      weight_increment: formData.sale_type === "weight" ? Number(formData.weight_increment) : null,
      sort_order: Number(formData.sort_order) || 0,
    };

    let error;
    if (editingProduct) {
      const res = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      error = res.error;
    } else {
      const res = await supabase.from("products").insert(payload);
      error = res.error;
    }

    if (error) {
      alert("حدث خطأ أثناء الحفظ: " + error.message);
      setSaving(false);
      return;
    }

    setIsModalOpen(false);
    setSaving(false);
    fetchData();
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`هل أنت متأكد من حذف "${product.name}"؟\nلا يمكن التراجع عن هذه العملية.`)) return;
    
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      alert("خطأ في الحذف: " + error.message);
      return;
    }
    fetchData();
  };

  const toggleAvailability = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_available: !product.is_available })
      .eq("id", product.id);

    if (error) {
      alert("خطأ في التحديث: " + error.message);
      return;
    }
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory = filterCategory === "all" || p.category_id === Number(filterCategory);
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (id: number | null) => {
    return categories.find((c) => c.id === id)?.name || "بدون تصنيف";
  };

  const getSaleTypeLabel = (type: string) => {
    if (type === "piece") return "قطعة";
    if (type === "weight") return "بالوزن";
    return "عبوة";
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
          <h1 className="text-2xl font-bold text-sidr-green">المنتجات</h1>
          <p className="text-gray-500 text-sm">إدارة المنتجات والأسعار والتوفر</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-sidr-green hover:bg-sidr-green/90 text-white px-5 py-3 rounded-xl font-bold transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none bg-white"
        >
          <option value="all">كل التصنيفات</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sidr-green animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد منتجات لعرضها</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sidr-cream">
                <tr className="text-right text-sm text-gray-600">
                  <th className="p-4 font-semibold">المنتج</th>
                  <th className="p-4 font-semibold">التصنيف</th>
                  <th className="p-4 font-semibold">السعر</th>
                  <th className="p-4 font-semibold">طريقة البيع</th>
                  <th className="p-4 font-semibold">حالة التوفر</th>
                  <th className="p-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className="font-bold text-sidr-green">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{getCategoryName(product.category_id)}</td>
                    <td className="p-4 font-bold text-sidr-brown">{Number(product.price).toFixed(2)} جنيه</td>
                    <td className="p-4">
                      <span className="text-xs bg-sidr-light-green text-sidr-green px-3 py-1 rounded-full font-semibold">
                        {getSaleTypeLabel(product.sale_type)}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleAvailability(product)}
                        className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-bold transition border-2 ${
                          product.is_available 
                            ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100" 
                            : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                        }`}
                      >
                        {product.is_available ? (
                          <><Eye className="w-3 h-3" /> متوفر - إيقاف</>
                        ) : (
                          <><EyeOff className="w-3 h-3" /> موقوف - تفعيل</>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4">
                <div className="flex gap-3 mb-3">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="font-bold text-sidr-green mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{getCategoryName(product.category_id)}</p>
                    <p className="text-sidr-brown font-bold">{Number(product.price).toFixed(2)} جنيه</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => toggleAvailability(product)}
                    className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-bold border-2 ${
                      product.is_available 
                        ? "bg-green-50 text-green-700 border-green-300" 
                        : "bg-red-50 text-red-700 border-red-300"
                    }`}
                  >
                    {product.is_available ? (
                      <><Eye className="w-3 h-3" /> متوفر - إيقاف</>
                    ) : (
                      <><EyeOff className="w-3 h-3" /> موقوف - تفعيل</>
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border-2 border-blue-300 font-bold"
                  >
                    <Edit className="w-3 h-3" /> تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 border-2 border-red-300 font-bold"
                  >
                    <Trash2 className="w-3 h-3" /> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 md:p-6 flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-sidr-green">
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">اسم المنتج <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl border-2 ${formErrors.name ? "border-red-500" : "border-gray-200"} focus:border-sidr-green focus:outline-none transition`}
                  placeholder="مثال: زيت حبة البركة"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">الوصف (اختياري)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition resize-none"
                  placeholder="وصف مختصر للمنتج"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">السعر (جنيه) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl border-2 ${formErrors.price ? "border-red-500" : "border-gray-200"} focus:border-sidr-green focus:outline-none transition`}
                  />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">التصنيف <span className="text-red-500">*</span></label>
                  <select
                    value={formData.category_id || ""}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl border-2 ${formErrors.category_id ? "border-red-500" : "border-gray-200"} focus:border-sidr-green focus:outline-none bg-white transition`}
                  >
                    <option value="">اختر تصنيفاً</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {formErrors.category_id && <p className="text-red-500 text-xs mt-1">{formErrors.category_id}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">طريقة البيع</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "piece", label: "قطعة" },
                    { value: "weight", label: "بالوزن" },
                    { value: "package", label: "عبوة" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, sale_type: opt.value })}
                      className={`py-2 rounded-xl text-sm font-semibold transition ${
                        formData.sale_type === opt.value
                          ? "bg-sidr-green text-white shadow-sm"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.sale_type === "weight" && (
                <div className="grid grid-cols-2 gap-4 bg-sidr-cream rounded-xl p-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">الحد الأدنى للوزن (جم)</label>
                    <input
                      type="number"
                      value={formData.min_weight}
                      onChange={(e) => setFormData({ ...formData, min_weight: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">مقدار الزيادة (جم)</label>
                    <input
                      type="number"
                      value={formData.weight_increment}
                      onChange={(e) => setFormData({ ...formData, weight_increment: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">رابط الصورة (URL)</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                  placeholder="https://..."
                  dir="ltr"
                />
                {formData.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.image_url} alt="معاينة" className="mt-2 w-24 h-24 rounded-xl object-cover" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">ترتيب الظهور</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="w-5 h-5 accent-sidr-green"
                    />
                    <span className="text-sm font-semibold">متوفر للبيع</span>
                  </label>
                </div>
              </div>
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
                  <><Save className="w-5 h-5" /> {editingProduct ? "حفظ التعديلات" : "إضافة المنتج"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}