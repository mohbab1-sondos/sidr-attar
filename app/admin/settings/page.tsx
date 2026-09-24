"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Loader2, Save, MessageCircle, Truck, CreditCard, MapPin, 
  Plus, Trash2, X, Store, AlertCircle, CheckCircle2 
} from "lucide-react";

interface DeliveryArea {
  id: number;
  name: string;
  fee: number;
  is_active: boolean;
}

interface StoreSettings {
  id: number;
  store_name: string;
  whatsapp_number: string;
  free_delivery: boolean;
  cod_enabled: boolean;
  vodafone_cash_enabled: boolean;
  vodafone_cash_number: string | null;
  instapay_enabled: boolean;
  instapay_account: string | null;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);

  // نموذج إضافة/تعديل منطقة
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [areaForm, setAreaForm] = useState({ name: "", fee: 0, is_active: true });
  const [savingArea, setSavingArea] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [settingsRes, areasRes] = await Promise.all([
      supabase.from("store_settings").select("*").limit(1).single(),
      supabase.from("delivery_areas").select("*").order("id", { ascending: true }),
    ]);

    if (settingsRes.data) {
      setSettings(settingsRes.data);
      setSettingsId(settingsRes.data.id);
    }
    if (areasRes.data) setAreas(areasRes.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings || !settingsId) return;
    setSaving(true);

    const { error } = await supabase
      .from("store_settings")
      .update({
        store_name: settings.store_name,
        whatsapp_number: settings.whatsapp_number,
        free_delivery: settings.free_delivery,
        cod_enabled: settings.cod_enabled,
        vodafone_cash_enabled: settings.vodafone_cash_enabled,
        vodafone_cash_number: settings.vodafone_cash_number,
        instapay_enabled: settings.instapay_enabled,
        instapay_account: settings.instapay_account,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settingsId);

    setSaving(false);

    if (error) {
      alert("خطأ في الحفظ: " + error.message);
      return;
    }

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  // === إدارة مناطق التوصيل ===
  const openAddArea = () => {
    setEditingArea(null);
    setAreaForm({ name: "", fee: 0, is_active: true });
    setIsAreaModalOpen(true);
  };

  const openEditArea = (area: DeliveryArea) => {
    setEditingArea(area);
    setAreaForm({ name: area.name, fee: area.fee, is_active: area.is_active });
    setIsAreaModalOpen(true);
  };

  const handleSaveArea = async () => {
    if (!areaForm.name.trim()) {
      alert("اسم المنطقة مطلوب");
      return;
    }
    setSavingArea(true);

    const payload = {
      name: areaForm.name.trim(),
      fee: Number(areaForm.fee) || 0,
      is_active: areaForm.is_active,
    };

    let error;
    if (editingArea) {
      const res = await supabase.from("delivery_areas").update(payload).eq("id", editingArea.id);
      error = res.error;
    } else {
      const res = await supabase.from("delivery_areas").insert(payload);
      error = res.error;
    }

    setSavingArea(false);

    if (error) {
      alert("خطأ في الحفظ: " + error.message);
      return;
    }

    setIsAreaModalOpen(false);
    fetchData();
  };

  const handleDeleteArea = async (area: DeliveryArea) => {
    if (!confirm(`هل أنت متأكد من حذف "${area.name}"؟\nالطلبات القديمة ستحتفظ ببياناتها.`)) return;

    const { error } = await supabase.from("delivery_areas").delete().eq("id", area.id);
    if (error) {
      alert("خطأ في الحذف: " + error.message);
      return;
    }
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sidr-green animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-bold text-red-700">لا توجد إعدادات في قاعدة البيانات</p>
            <p className="text-red-600 text-sm">يرجى إضافة سجل في جدول store_settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sidr-green">الإعدادات</h1>
          <p className="text-gray-500 text-sm">إعدادات المتجر والتوصيل والدفع</p>
        </div>
      </div>

      {savedMessage && (
        <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-semibold">تم حفظ الإعدادات بنجاح!</p>
        </div>
      )}

      {/* بيانات المتجر */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2">
          <Store className="w-5 h-5" /> بيانات المتجر
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">اسم المتجر</label>
            <input
              type="text"
              value={settings.store_name || ""}
              onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">رقم واتساب المتجر</label>
            <input
              type="text"
              value={settings.whatsapp_number || ""}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
              placeholder="201554042773"
              dir="ltr"
            />
            <p className="text-xs text-gray-400 mt-1">بدون + وبدون مسافات (مثال: 201554042773)</p>
          </div>
        </div>
      </div>

      {/* التوصيل */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" /> التوصيل
        </h2>
        <label className="flex items-center gap-3 cursor-pointer bg-sidr-cream rounded-xl p-4">
          <input
            type="checkbox"
            checked={settings.free_delivery}
            onChange={(e) => setSettings({ ...settings, free_delivery: e.target.checked })}
            className="w-5 h-5 accent-sidr-green"
          />
          <div>
            <p className="font-bold text-sm">تفعيل التوصيل المجاني الشامل</p>
            <p className="text-xs text-gray-500">عند التفعيل، تُصبح رسوم التوصيل صفراً لجميع المناطق.</p>
          </div>
        </label>
      </div>

      {/* طرق الدفع */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> طرق الدفع
        </h2>

        <div className="space-y-4">
          {/* الدفع عند الاستلام */}
          <div className="border-2 border-gray-200 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cod_enabled}
                onChange={(e) => setSettings({ ...settings, cod_enabled: e.target.checked })}
                className="w-5 h-5 accent-sidr-green"
              />
              <div>
                <p className="font-bold">الدفع عند الاستلام</p>
                <p className="text-xs text-gray-500">ادفع نقداً عند استلام الطلب</p>
              </div>
            </label>
          </div>

          {/* فودافون كاش */}
          <div className="border-2 border-gray-200 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={settings.vodafone_cash_enabled}
                onChange={(e) => setSettings({ ...settings, vodafone_cash_enabled: e.target.checked })}
                className="w-5 h-5 accent-sidr-green"
              />
              <div>
                <p className="font-bold">فودافون كاش</p>
                <p className="text-xs text-gray-500">التحويل إلى رقم المحفظة</p>
              </div>
            </label>
            {settings.vodafone_cash_enabled && (
              <input
                type="text"
                value={settings.vodafone_cash_number || ""}
                onChange={(e) => setSettings({ ...settings, vodafone_cash_number: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                placeholder="رقم محفظة فودافون كاش"
                dir="ltr"
              />
            )}
          </div>

          {/* إنستاباي */}
          <div className="border-2 border-gray-200 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={settings.instapay_enabled}
                onChange={(e) => setSettings({ ...settings, instapay_enabled: e.target.checked })}
                className="w-5 h-5 accent-sidr-green"
              />
              <div>
                <p className="font-bold">إنستاباي (InstaPay)</p>
                <p className="text-xs text-gray-500">التحويل إلى حساب إنستاباي</p>
              </div>
            </label>
            {settings.instapay_enabled && (
              <input
                type="text"
                value={settings.instapay_account || ""}
                onChange={(e) => setSettings({ ...settings, instapay_account: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                placeholder="عنوان إنستاباي (مثال: sidr@instapay)"
                dir="ltr"
              />
            )}
          </div>
        </div>
      </div>

      {/* مناطق التوصيل */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-sidr-green flex items-center gap-2">
            <MapPin className="w-5 h-5" /> مناطق التوصيل
          </h2>
          <button
            onClick={openAddArea}
            className="flex items-center gap-2 bg-sidr-green hover:bg-sidr-green/90 text-white px-4 py-2 rounded-xl text-sm font-bold transition"
          >
            <Plus className="w-4 h-4" /> إضافة منطقة
          </button>
        </div>

        {areas.length === 0 ? (
          <p className="text-gray-500 text-center py-8">لا توجد مناطق توصيل. أضف منطقة للبدء.</p>
        ) : (
          <div className="space-y-3">
            {areas.map((area) => (
              <div key={area.id} className="flex items-center gap-3 border-2 border-gray-100 rounded-xl p-4 hover:border-sidr-light-green transition">
                <div className="flex-grow">
                  <p className="font-bold">{area.name}</p>
                  <p className="text-sm text-gray-500">
                    {area.fee === 0 ? "مجاني" : `رسوم: ${area.fee} جنيه`}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${area.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {area.is_active ? "مفعّلة" : "معطّلة"}
                </span>
                <button
                  onClick={() => openEditArea(area)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteArea(area)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* زر الحفظ */}
      <div className="sticky bottom-4 z-20">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full bg-sidr-green hover:bg-sidr-green/90 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
          ) : (
            <><Save className="w-5 h-5" /> حفظ الإعدادات</>
          )}
        </button>
      </div>

      {/* Modal مناطق التوصيل */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setIsAreaModalOpen(false)}>
          <div 
            className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 p-4 md:p-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-sidr-green">
                {editingArea ? "تعديل المنطقة" : "إضافة منطقة جديدة"}
              </h3>
              <button onClick={() => setIsAreaModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">اسم المنطقة <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                  placeholder="مثال: وسط البلد، المعادي"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">رسوم التوصيل (جنيه)</label>
                <input
                  type="number"
                  value={areaForm.fee}
                  onChange={(e) => setAreaForm({ ...areaForm, fee: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                  placeholder="0 = مجاني"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-sidr-cream rounded-xl p-3">
                <input
                  type="checkbox"
                  checked={areaForm.is_active}
                  onChange={(e) => setAreaForm({ ...areaForm, is_active: e.target.checked })}
                  className="w-5 h-5 accent-sidr-green"
                />
                <span className="text-sm font-semibold">مفعّلة (تظهر للعملاء)</span>
              </label>
            </div>

            <div className="border-t border-gray-100 p-4 md:p-6 flex gap-3">
              <button
                onClick={() => setIsAreaModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveArea}
                disabled={savingArea}
                className="flex-1 bg-sidr-green hover:bg-sidr-green/90 disabled:bg-gray-400 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                {savingArea ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
                ) : (
                  <><Save className="w-5 h-5" /> حفظ</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
