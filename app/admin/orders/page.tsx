"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, RefreshCw, ShoppingBag, ChevronDown, ChevronUp, Phone, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  city: string;
  address: string;
  landmark: string;
  notes: string;
  payment_method: string;
  products_total: number;
  delivery_fee: number;
  final_total: number;
  status: string;
  created_at: string;
  area_id: number;
  whatsapp_sent: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "جديد", color: "bg-blue-100 text-blue-700" },
  confirmed: { label: "تم التأكيد", color: "bg-purple-100 text-purple-700" },
  preparing: { label: "قيد التجهيز", color: "bg-yellow-100 text-yellow-700" },
  delivering: { label: "خرج للتوصيل", color: "bg-orange-100 text-orange-700" },
  delivered: { label: "تم التسليم", color: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700" },
};

const STATUS_OPTIONS = [
  { value: "new", label: "جديد" },
  { value: "confirmed", label: "تم التأكيد" },
  { value: "preparing", label: "قيد التجهيز" },
  { value: "delivering", label: "خرج للتوصيل" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("خطأ في جلب الطلبات:", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleOrderDetails = async (orderId: number) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);

    if (!orderItems[orderId]) {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (!error && data) {
        setOrderItems((prev) => ({ ...prev, [orderId]: data }));
      }
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert("حدث خطأ أثناء تحديث الحالة: " + error.message);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  };

  const filteredOrders = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("ar-EG", { 
      year: "numeric", month: "short", day: "numeric", 
      hour: "2-digit", minute: "2-digit" 
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sidr-green">الطلبات</h1>
          <p className="text-gray-500 text-sm">إدارة ومتابعة طلبات العملاء</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* فلتر الحالة */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
              filterStatus === "all" ? "bg-sidr-green text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            الكل ({orders.length})
          </button>
          {STATUS_OPTIONS.map((opt) => {
            const count = orders.filter((o) => o.status === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                  filterStatus === opt.value ? "bg-sidr-green text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sidr-green animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد طلبات لعرضها</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-bold text-lg text-sidr-green">{order.order_number}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_LABELS[order.status]?.color || "bg-gray-100"}`}>
                        {STATUS_LABELS[order.status]?.label || order.status}
                      </span>
                      {order.whatsapp_sent ? (
                        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> تم الإرسال للواتساب
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-orange-100 text-orange-700 border border-orange-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> لم تُرسل للواتساب
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-sidr-brown">{Number(order.final_total).toFixed(2)} جنيه</p>
                    <p className="text-xs text-gray-400">
                      {order.products_total} + {order.delivery_fee} توصيل
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{order.customer_name} - {order.customer_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{order.city} - {order.address}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-sidr-green focus:outline-none bg-white"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => toggleOrderDetails(order.id)}
                    className="flex items-center gap-2 text-sidr-green hover:bg-sidr-light-green px-4 py-2 rounded-xl transition text-sm font-semibold"
                  >
                    {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {expandedOrder === order.id ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                  </button>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="bg-gray-50 border-t border-gray-100 p-4 md:p-6">
                  <h4 className="font-bold text-sidr-green mb-3">المنتجات:</h4>
                  {orderItems[order.id] ? (
                    <div className="space-y-2 mb-4">
                      {orderItems[order.id].map((item: any) => (
                        <div key={item.id} className="flex justify-between bg-white rounded-xl p-3 text-sm">
                          <span>
                            {item.product_name}
                            {item.sale_type === "weight" ? ` (${item.weight} جم)` : ` × ${item.quantity}`}
                          </span>
                          <span className="font-bold">{Number(item.total_price).toFixed(2)} جنيه</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">جاري التحميل...</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-xl p-4">
                      <p className="font-bold mb-2">بيانات التوصيل:</p>
                      <p className="text-gray-600 mb-1">المدينة: {order.city}</p>
                      <p className="text-gray-600 mb-1">العنوان: {order.address}</p>
                      {order.landmark && <p className="text-gray-600 mb-1">علامة مميزة: {order.landmark}</p>}
                      {order.notes && <p className="text-gray-600 mb-1">ملاحظات: {order.notes}</p>}
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <p className="font-bold mb-2">الدفع:</p>
                      <p className="text-gray-600 mb-1">الطريقة: {order.payment_method === "cod" ? "الدفع عند الاستلام" : order.payment_method === "vodafone" ? "فودافون كاش" : "إنستاباي"}</p>
                      {order.customer_whatsapp && <p className="text-gray-600 mb-1">واتساب: {order.customer_whatsapp}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
