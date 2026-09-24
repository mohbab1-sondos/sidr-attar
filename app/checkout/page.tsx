"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart, CartItem } from "../context/CartContext";
import { ArrowRight, CheckCircle2, MessageCircle, MapPin, Phone, User, CreditCard, Truck, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface DeliveryArea {
  id: number;
  name: string;
  fee: number;
}

interface StoreSettings {
  whatsapp_number: string;
  free_delivery: boolean;
  cod_enabled: boolean;
  vodafone_cash_enabled: boolean;
  vodafone_cash_number: string | null;
  instapay_enabled: boolean;
  instapay_account: string | null;
}

interface OrderSnapshot {
  cart: CartItem[];
  cartTotal: number;
  deliveryFee: number;
  finalTotal: number;
  formData: any;
  selectedArea: any;
  paymentMethod: string;
  paymentMethodLabel: string;
  orderId: number;
}

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "", phone: "", whatsapp: "", city: "", areaId: "", address: "", landmark: "", notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderSnapshot, setOrderSnapshot] = useState<OrderSnapshot | null>(null);
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLSelectElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [settingsRes, areasRes] = await Promise.all([
        supabase.from("store_settings").select("*").limit(1).single(),
        supabase.from("delivery_areas").select("id, name, fee").eq("is_active", true).order("id", { ascending: true }),
      ]);

      if (settingsRes.data) {
        setStoreSettings(settingsRes.data);
        
        const methods = [];
        if (settingsRes.data.cod_enabled) {
          methods.push({ id: "cod", name: "الدفع عند الاستلام", description: "ادفع نقداً عند استلام الطلب" });
        }
        if (settingsRes.data.vodafone_cash_enabled) {
          methods.push({ 
            id: "vodafone", 
            name: "فودافون كاش", 
            description: `التحويل إلى: ${settingsRes.data.vodafone_cash_number || "-"}` 
          });
        }
        if (settingsRes.data.instapay_enabled) {
          methods.push({ 
            id: "instapay", 
            name: "إنستاباي", 
            description: `التحويل إلى: ${settingsRes.data.instapay_account || "-"}` 
          });
        }
        setPaymentMethods(methods);
        if (methods.length > 0) setPaymentMethod(methods[0].id);
      }

      if (areasRes.data) setDeliveryAreas(areasRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const selectedArea = deliveryAreas.find((a) => a.id === Number(formData.areaId));
  const freeDelivery = storeSettings?.free_delivery || false;
  const deliveryFee = freeDelivery ? 0 : selectedArea ? selectedArea.fee : 0;
  const finalTotal = cartTotal + deliveryFee;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "الاسم مطلوب";
    if (!formData.phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    if (!formData.city.trim()) newErrors.city = "المدينة مطلوبة";
    if (!formData.areaId) newErrors.areaId = "اختر منطقة التوصيل";
    if (!formData.address.trim()) newErrors.address = "العنوان التفصيلي مطلوب";
    if (!paymentMethod) newErrors.payment = "اختر طريقة الدفع";
    setErrors(newErrors);
    return newErrors;
  };

  const scrollToFirstError = (errs: Record<string, string>) => {
    const fieldOrder = ["name", "phone", "city", "areaId", "address"];
    for (const field of fieldOrder) {
      if (errs[field]) {
        const refMap: Record<string, any> = {
          name: nameRef, phone: phoneRef, city: cityRef, areaId: areaRef, address: addressRef,
        };
        refMap[field]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        refMap[field]?.current?.focus();
        return;
      }
    }
  };

  const buildWhatsAppMessage = (snapshot: OrderSnapshot, orderNum: string) => {
    let msg = `🛒 *طلب جديد – عطارة سدرة*\n`;
    msg += `رقم الطلب: *${orderNum}*\n\n`;
    msg += `👤 *بيانات العميل:*\n`;
    msg += `الاسم: ${snapshot.formData.name}\n`;
    msg += `الهاتف: ${snapshot.formData.phone}\n`;
    if (snapshot.formData.whatsapp) msg += `واتساب: ${snapshot.formData.whatsapp}\n`;
    msg += `المدينة: ${snapshot.formData.city}\n`;
    msg += `المنطقة: ${snapshot.selectedArea?.name || "-"}\n`;
    msg += `العنوان: ${snapshot.formData.address}\n`;
    if (snapshot.formData.landmark) msg += `علامة مميزة: ${snapshot.formData.landmark}\n`;
    if (snapshot.formData.notes) msg += `ملاحظات: ${snapshot.formData.notes}\n`;
    msg += `\n📦 *المنتجات:*\n`;
    snapshot.cart.forEach((item, i) => {
      msg += `${i + 1}. ${item.name}`;
      if (item.saleType === "weight") msg += ` (${item.weight} جم)`;
      else msg += ` (${item.quantity} قطعة)`;
      msg += ` → ${item.totalPrice.toFixed(2)} جنيه\n`;
    });
    msg += `\n💰 *الإجمالي:*\n`;
    msg += `المنتجات: ${snapshot.cartTotal.toFixed(2)} جنيه\n`;
    msg += `التوصيل: ${snapshot.deliveryFee.toFixed(2)} جنيه\n`;
    msg += `*الإجمالي النهائي: ${snapshot.finalTotal.toFixed(2)} جنيه*\n\n`;
    msg += `💳 *طريقة الدفع:* ${snapshot.paymentMethodLabel}`;
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrorBanner(false);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setShowErrorBanner(true);
      setTimeout(() => {
        scrollToFirstError(validationErrors);
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }

    setIsSubmitting(true);
    const newOrderNumber = `DS-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: newOrderNumber,
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_whatsapp: formData.whatsapp || null,
          city: formData.city,
          area_id: Number(formData.areaId),
          address: formData.address,
          landmark: formData.landmark || null,
          notes: formData.notes || null,
          payment_method: paymentMethod,
          products_total: cartTotal,
          delivery_fee: deliveryFee,
          final_total: finalTotal,
          status: "new",
          whatsapp_sent: false,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        product_name: item.name,
        price: item.price,
        sale_type: item.saleType,
        quantity: item.quantity,
        weight: item.weight || null,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      const currentPaymentMethod = paymentMethods.find((p) => p.id === paymentMethod);
      const snapshot: OrderSnapshot = {
        cart: JSON.parse(JSON.stringify(cart)),
        cartTotal,
        deliveryFee,
        finalTotal,
        formData: { ...formData },
        selectedArea,
        paymentMethod,
        paymentMethodLabel: currentPaymentMethod?.name || "",
        orderId: orderData.id,
      };
      setOrderSnapshot(snapshot);
      setOrderNumber(newOrderNumber);
      setOrderPlaced(true);
      clearCart();
    } catch (err: any) {
      console.error("❌ خطأ في حفظ الطلب:", err);
      alert(`عذراً، حدث خطأ أثناء حفظ الطلب: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!orderSnapshot || !storeSettings) return;
    const msg = buildWhatsAppMessage(orderSnapshot, orderNumber);
    const url = `https://wa.me/${storeSettings.whatsapp_number}?text=${encodeURIComponent(msg)}`;
    
    // فتح واتساب أولاً
    window.open(url, "_blank");

    // تحديث حالة الإرسال في قاعدة البيانات
    try {
      const { error } = await supabase
        .from("orders")
        .update({ whatsapp_sent: true })
        .eq("id", orderSnapshot.orderId);
      
      if (error) {
        console.error("خطأ في تحديث حالة الإرسال:", error);
      } else {
        setWhatsappSent(true);
      }
    } catch (e) {
      console.error("خطأ غير متوقع:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidr-cream">
        <Loader2 className="w-10 h-10 text-sidr-green animate-spin" />
      </div>
    );
  }

  if (orderPlaced && orderSnapshot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-sidr-cream text-center">
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full">
          <CheckCircle2 className="w-20 h-20 text-sidr-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-sidr-green mb-2">تم استلام طلبك!</h2>
          <p className="text-gray-600 mb-4">رقم طلبك هو:</p>
          <p className="text-3xl font-bold text-sidr-brown mb-6 tracking-wider">{orderNumber}</p>
          <div className="bg-sidr-cream rounded-xl p-4 mb-6 text-right">
            <p className="text-sm text-gray-600 mb-2">ملخص سريع:</p>
            <p className="text-sm">عدد المنتجات: <span className="font-bold">{orderSnapshot.cart.length}</span></p>
            <p className="text-sm">الإجمالي: <span className="font-bold text-sidr-brown">{orderSnapshot.finalTotal.toFixed(2)} جنيه</span></p>
          </div>
          
          {whatsappSent ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <p className="text-green-700 text-sm font-semibold text-right">
                تم إرسال الطلب إلى واتساب المتجر بنجاح. سنتواصل معك قريباً لتأكيد الطلب.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                تم حفظ طلبك بنجاح. لإتمام الطلب، يرجى إرسال تفاصيل الطلب إلى واتساب المتجر بالضغط على الزر أدناه.
              </p>
              <button
                onClick={handleSendWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#1eb356] text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-3 shadow-md mb-3"
              >
                <MessageCircle className="w-6 h-6" /> إرسال الطلب إلى واتساب
              </button>
            </>
          )}
          
          <Link href="/" className="block w-full bg-sidr-cream text-sidr-green py-3 rounded-xl font-bold hover:bg-sidr-light-green transition">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-bold text-sidr-green mb-4">سلتك فارغة</h2>
        <Link href="/" className="bg-sidr-green text-white px-8 py-3 rounded-full font-bold hover:bg-sidr-green/90 transition">
          تسوق الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sidr-cream pb-24">
      <header className="bg-sidr-green text-white sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/cart" className="p-2 hover:bg-sidr-light-green/20 rounded-full transition"><ArrowRight className="w-6 h-6" /></Link>
          <h1 className="text-xl font-bold">إتمام الطلب</h1>
        </div>
      </header>

      <form ref={formRef} onSubmit={handleSubmit} className="container mx-auto px-4 py-6 max-w-3xl" noValidate>
        
        {showErrorBanner && Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700 mb-1">الرجاء إكمال البيانات التالية:</p>
              <ul className="text-sm text-red-600 list-disc list-inside">
                {Object.values(errors).map((err, i) => (<li key={i}>{err}</li>))}
              </ul>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2"><User className="w-5 h-5" /> بيانات العميل</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">الاسم <span className="text-red-500">*</span></label>
              <input ref={nameRef} type="text" name="name" value={formData.name} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border-2 ${errors.name ? "border-red-500 bg-red-50" : "border-gray-200"} focus:border-sidr-green focus:outline-none transition`}
                placeholder="اسمك الكامل" />
              {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">رقم الهاتف <span className="text-red-500">*</span></label>
              <input ref={phoneRef} type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border-2 ${errors.phone ? "border-red-500 bg-red-50" : "border-gray-200"} focus:border-sidr-green focus:outline-none transition`}
                placeholder="01xxxxxxxxx" />
              {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">رقم الواتساب (اختياري)</label>
              <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">المدينة <span className="text-red-500">*</span></label>
              <input ref={cityRef} type="text" name="city" value={formData.city} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border-2 ${errors.city ? "border-red-500 bg-red-50" : "border-gray-200"} focus:border-sidr-green focus:outline-none transition`}
                placeholder="مثال: القاهرة" />
              {errors.city && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.city}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">منطقة التوصيل <span className="text-red-500">*</span></label>
              <select ref={areaRef} name="areaId" value={formData.areaId} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border-2 ${errors.areaId ? "border-red-500 bg-red-50" : "border-gray-200"} focus:border-sidr-green focus:outline-none bg-white transition`}>
                <option value="">اختر المنطقة</option>
                {deliveryAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} {freeDelivery ? "(مجاني)" : `- ${area.fee} جنيه`}
                  </option>
                ))}
              </select>
              {errors.areaId && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.areaId}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">العنوان التفصيلي <span className="text-red-500">*</span></label>
              <input ref={addressRef} type="text" name="address" value={formData.address} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border-2 ${errors.address ? "border-red-500 bg-red-50" : "border-gray-200"} focus:border-sidr-green focus:outline-none transition`}
                placeholder="اسم الشارع، رقم العمارة، رقم الشقة" />
              {errors.address && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.address}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">علامة مميزة / أقرب نقطة</label>
              <input type="text" name="landmark" value={formData.landmark} onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                placeholder="مثال: بجوار مسجد النور" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">ملاحظات إضافية</label>
              <input type="text" name="notes" value={formData.notes} onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none transition"
                placeholder="أي ملاحظات على الطلب" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> طريقة الدفع</h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <label key={method.id}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  paymentMethod === method.id ? "border-sidr-green bg-sidr-light-green/40" : "border-gray-200 hover:border-sidr-green/40"
                }`}>
                <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id}
                  onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 accent-sidr-green" />
                <div className="flex-grow">
                  <p className="font-bold text-sm">{method.name}</p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> ملخص الطلب</h2>
          <div className="space-y-3 mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name} {item.saleType === "weight" ? `(${item.weight} جم)` : `× ${item.quantity}`}
                </span>
                <span className="font-semibold">{item.totalPrice.toFixed(2)} جنيه</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>إجمالي المنتجات</span><span>{cartTotal.toFixed(2)} جنيه</span></div>
            <div className="flex justify-between text-gray-600">
              <span>رسوم التوصيل {freeDelivery && "(مجاني)"}</span>
              <span>{selectedArea ? `${deliveryFee.toFixed(2)} جنيه` : "اختر المنطقة"}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
              <span>الإجمالي النهائي</span>
              <span className="text-sidr-brown">{finalTotal.toFixed(2)} جنيه</span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}
          className="w-full bg-sidr-green hover:bg-sidr-green/90 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-lg transition shadow-md flex items-center justify-center gap-2">
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> جاري حفظ الطلب...</>
          ) : (
            "تأكيد الطلب"
          )}
        </button>
      </form>
    </div>
  );
}
