"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, CartItem } from "../context/CartContext";
import { ArrowRight, CheckCircle2, MessageCircle, MapPin, Phone, User, CreditCard, Truck } from "lucide-react";

// إعدادات المتجر
const STORE_WHATSAPP = "201559077281"; // رقم واتساب المتجر (بدون + وبدون مسافات)
const FREE_DELIVERY = false; // تغيير إلى true لتفعيل التوصيل المجاني الشامل

const DELIVERY_AREAS = [
  { id: 1, name: "المنطقة الأولى - وسط البلد", fee: 20, isActive: true },
  { id: 2, name: "المنطقة الثانية - المعادي", fee: 35, isActive: true },
  { id: 3, name: "المنطقة الثالثة - مدينة نصر", fee: 45, isActive: true },
  { id: 4, name: "المنطقة الرابعة - أكتوبر", fee: 60, isActive: false },
];

const PAYMENT_METHODS = [
  { id: "cod", name: "الدفع عند الاستلام", isActive: true, icon: Truck, description: "ادفع نقداً عند استلام الطلب" },
  { id: "vodafone", name: "فودافون كاش", isActive: true, icon: Phone, description: "التحويل إلى رقم: 01000000000" },
  { id: "instapay", name: "إنستاباي", isActive: true, icon: CreditCard, description: "التحويل إلى: sidr@instapay" },
];

interface OrderSnapshot {
  cart: CartItem[];
  cartTotal: number;
  deliveryFee: number;
  finalTotal: number;
  formData: any;
  selectedArea: any;
  paymentMethod: string;
}

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "", phone: "", whatsapp: "", city: "", areaId: "", address: "", landmark: "", notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderSnapshot, setOrderSnapshot] = useState<OrderSnapshot | null>(null);

  const selectedArea = DELIVERY_AREAS.find((a) => a.id === Number(formData.areaId));
  const deliveryFee = FREE_DELIVERY ? 0 : selectedArea ? selectedArea.fee : 0;
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    const pm = PAYMENT_METHODS.find((p) => p.id === snapshot.paymentMethod);
    msg += `💳 *طريقة الدفع:* ${pm?.name || "-"}`;
    return msg;
  };

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من صحة البيانات وإظهار تنبيه إذا كان هناك خطأ
    if (!validate()) {
      alert("الرجاء تعبئة جميع الحقول المطلوبة بشكل صحيح. تأكد من اختيار منطقة التوصيل وكتابة العنوان بالكامل.");
      return;
    }

    const newOrderNumber = `DS-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(newOrderNumber);

    // حفظ لقطة كاملة من بيانات الطلب قبل تفريغ السلة
    const snapshot: OrderSnapshot = {
      cart: JSON.parse(JSON.stringify(cart)),
      cartTotal,
      deliveryFee,
      finalTotal,
      formData: { ...formData },
      selectedArea,
      paymentMethod,
    };
    setOrderSnapshot(snapshot);
    setOrderPlaced(true);
    clearCart();
  };

    const newOrderNumber = `DS-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(newOrderNumber);

    // حفظ لقطة كاملة من بيانات الطلب قبل تفريغ السلة
    const snapshot: OrderSnapshot = {
      cart: JSON.parse(JSON.stringify(cart)),
      cartTotal,
      deliveryFee,
      finalTotal,
      formData: { ...formData },
      selectedArea,
      paymentMethod,
    };
    setOrderSnapshot(snapshot);
    setOrderPlaced(true);
    clearCart();
  };

  const handleSendWhatsApp = () => {
    if (!orderSnapshot) return;
    const msg = buildWhatsAppMessage(orderSnapshot, orderNumber);
    const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // شاشة تأكيد الطلب
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

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            لإتمام الطلب، يرجى إرسال تفاصيل الطلب إلى واتساب المتجر بالضغط على الزر أدناه.
          </p>
          <button
            onClick={handleSendWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#1eb356] text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-3 shadow-md mb-3"
          >
            <MessageCircle className="w-6 h-6" />
            إرسال الطلب إلى واتساب
          </button>
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

      <form onSubmit={handleSubmit} className="container mx-auto px-4 py-6 max-w-3xl">
        {/* بيانات العميل */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2"><User className="w-5 h-5" /> بيانات العميل</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">الاسم <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border ${errors.name ? "border-red-500" : "border-gray-200"} focus:border-sidr-green focus:outline-none`}
                placeholder="اسمك الكامل" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">رقم الهاتف <span className="text-red-500">*</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border ${errors.phone ? "border-red-500" : "border-gray-200"} focus:border-sidr-green focus:outline-none`}
                placeholder="01xxxxxxxxx" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">رقم الواتساب (اختياري)</label>
              <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sidr-green focus:outline-none"
                placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">المدينة <span className="text-red-500">*</span></label>
              <input type="text" name="city" value={formData.city} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border ${errors.city ? "border-red-500" : "border-gray-200"} focus:border-sidr-green focus:outline-none`}
                placeholder="مثال: القاهرة" />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">منطقة التوصيل <span className="text-red-500">*</span></label>
              <select name="areaId" value={formData.areaId} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border ${errors.areaId ? "border-red-500" : "border-gray-200"} focus:border-sidr-green focus:outline-none bg-white`}>
                <option value="">اختر المنطقة</option>
                {DELIVERY_AREAS.filter((a) => a.isActive).map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} {FREE_DELIVERY ? "(مجاني)" : `- ${area.fee} جنيه`}
                  </option>
                ))}
              </select>
              {errors.areaId && <p className="text-red-500 text-xs mt-1">{errors.areaId}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">العنوان التفصيلي <span className="text-red-500">*</span></label>
              <input type="text" name="address" value={formData.address} onChange={handleChange}
                className={`w-full px-4 py-2 rounded-xl border ${errors.address ? "border-red-500" : "border-gray-200"} focus:border-sidr-green focus:outline-none`}
                placeholder="اسم الشارع، رقم العمارة، رقم الشقة" />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">علامة مميزة / أقرب نقطة</label>
              <input type="text" name="landmark" value={formData.landmark} onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sidr-green focus:outline-none"
                placeholder="مثال: بجوار مسجد النور" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">ملاحظات إضافية</label>
              <input type="text" name="notes" value={formData.notes} onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sidr-green focus:outline-none"
                placeholder="أي ملاحظات على الطلب" />
            </div>
          </div>
        </div>

        {/* طريقة الدفع */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> طريقة الدفع</h2>
          <div className="space-y-3">
            {PAYMENT_METHODS.filter((p) => p.isActive).map((method) => {
              const Icon = method.icon;
              return (
                <label key={method.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                    paymentMethod === method.id ? "border-sidr-green bg-sidr-light-green/40" : "border-gray-200 hover:border-sidr-green/40"
                  }`}>
                  <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 accent-sidr-green" />
                  <Icon className="w-5 h-5 text-sidr-green" />
                  <div className="flex-grow">
                    <p className="font-bold text-sm">{method.name}</p>
                    <p className="text-xs text-gray-500">{method.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* ملخص الطلب */}
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
              <span>رسوم التوصيل</span>
              <span>{selectedArea ? `${deliveryFee.toFixed(2)} جنيه` : "اختر المنطقة"}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
              <span>الإجمالي النهائي</span>
              <span className="text-sidr-brown">{finalTotal.toFixed(2)} جنيه</span>
            </div>
          </div>
        </div>

        <button type="submit"
          className="w-full bg-sidr-green hover:bg-sidr-green/90 text-white py-4 rounded-xl font-bold text-lg transition shadow-md">
          تأكيد الطلب
        </button>
      </form>
    </div>
  );
}