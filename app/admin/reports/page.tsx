"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { 
  Loader2, TrendingUp, ShoppingBag, DollarSign, Users, 
  Calendar, Package, MapPin, Award, RefreshCw, BarChart3
} from "lucide-react";

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  final_total: number;
  products_total: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  area_id: number;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_name: string;
  quantity: number;
  weight: number | null;
  total_price: number;
  sale_type: string;
}

interface DeliveryArea {
  id: number;
  name: string;
}

type DateFilter = "today" | "week" | "month" | "all";

export default function AdminReportsPage() {
  const { authorized } = useRoleGuard(["admin"]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, itemsRes, areasRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*"),
      supabase.from("delivery_areas").select("id, name"),
    ]);

    if (ordersRes.data) setOrders(ordersRes.data);
    if (itemsRes.data) setOrderItems(itemsRes.data);
    if (areasRes.data) setAreas(areasRes.data);
    setLoading(false);
  };

  useEffect(() => {
    if (authorized) fetchData();
  }, [authorized]);

  // تصفية الطلبات حسب التاريخ
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter((o) => {
      // استثناء الطلبات الملغية من الإحصائيات
      if (o.status === "cancelled") return false;
      
      const orderDate = new Date(o.created_at);
      
      switch (dateFilter) {
        case "today":
          return orderDate >= startOfToday;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        case "all":
        default:
          return true;
      }
    });
  }, [orders, dateFilter]);

  // الإحصائيات
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.final_total), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueCustomers = new Set(filteredOrders.map(o => o.customer_name)).size;

    return { totalRevenue, totalOrders, avgOrderValue, uniqueCustomers };
  }, [filteredOrders]);

  // الطلبات حسب الحالة
  const ordersByStatus = useMemo(() => {
    const statuses = ["new", "confirmed", "preparing", "delivering", "delivered", "cancelled"];
    const counts: Record<string, number> = {};
    statuses.forEach(s => counts[s] = 0);
    orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return counts;
  }, [orders]);

  // المنتجات الأكثر مبيعاً
  const topProducts = useMemo(() => {
    const filteredOrderIds = new Set(filteredOrders.map(o => o.id));
    const productStats: Record<string, { name: string; count: number; revenue: number }> = {};

    orderItems.forEach(item => {
      if (!filteredOrderIds.has(item.order_id)) return;
      
      if (!productStats[item.product_name]) {
        productStats[item.product_name] = { name: item.product_name, count: 0, revenue: 0 };
      }
      productStats[item.product_name].count += (item.quantity || 1);
      productStats[item.product_name].revenue += Number(item.total_price);
    });

    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders, orderItems]);

  // المبيعات حسب المنطقة
  const salesByArea = useMemo(() => {
    const areaStats: Record<number, { name: string; orders: number; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      if (!order.area_id) return;
      const areaName = areas.find(a => a.id === order.area_id)?.name || "غير محدد";
      
      if (!areaStats[order.area_id]) {
        areaStats[order.area_id] = { name: areaName, orders: 0, revenue: 0 };
      }
      areaStats[order.area_id].orders++;
      areaStats[order.area_id].revenue += Number(order.final_total);
    });

    return Object.values(areaStats).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, areas]);

  // آخر 5 طلبات
  const recentOrders = useMemo(() => {
    return filteredOrders.slice(0, 5);
  }, [filteredOrders]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} جنيه`;
  };

  const maxRevenue = Math.max(...salesByArea.map(a => a.revenue), 1);
  const maxTopRevenue = Math.max(...topProducts.map(p => p.revenue), 1);

  if (authorized === null || loading) {
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

  const STATUS_LABELS: Record<string, string> = {
    new: "جديد",
    confirmed: "تم التأكيد",
    preparing: "قيد التجهيز",
    delivering: "خرج للتوصيل",
    delivered: "تم التسليم",
    cancelled: "ملغي",
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sidr-green flex items-center gap-2">
            <BarChart3 className="w-7 h-7" /> التقارير والإحصائيات
          </h1>
          <p className="text-gray-500 text-sm">نظرة شاملة على أداء المتجر</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* فلتر التاريخ */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm overflow-x-auto">
        <div className="flex gap-2">
          {[
            { value: "today", label: "اليوم" },
            { value: "week", label: "آخر 7 أيام" },
            { value: "month", label: "آخر 30 يوم" },
            { value: "all", label: "الكل" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value as DateFilter)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                dateFilter === opt.value ? "bg-sidr-green text-white shadow-sm" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border-r-4 border-sidr-green">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-semibold">إجمالي الإيرادات</span>
            <DollarSign className="w-5 h-5 text-sidr-green" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-sidr-brown">{stats.totalRevenue.toFixed(0)} جنيه</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border-r-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-semibold">عدد الطلبات</span>
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border-r-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-semibold">متوسط الطلب</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.avgOrderValue.toFixed(0)} جنيه</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border-r-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-semibold">عدد العملاء</span>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.uniqueCustomers}</p>
        </div>
      </div>

      {/* الطلبات حسب الحالة */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" /> الطلبات حسب الحالة (كل الفترات)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Object.entries(ordersByStatus).map(([status, count]) => {
            const colors: Record<string, string> = {
              new: "bg-blue-50 text-blue-700 border-blue-200",
              confirmed: "bg-purple-50 text-purple-700 border-purple-200",
              preparing: "bg-yellow-50 text-yellow-700 border-yellow-200",
              delivering: "bg-orange-50 text-orange-700 border-orange-200",
              delivered: "bg-green-50 text-green-700 border-green-200",
              cancelled: "bg-red-50 text-red-700 border-red-200",
            };
            return (
              <div key={status} className={`rounded-xl p-3 border-2 ${colors[status]}`}>
                <p className="text-xs font-semibold mb-1">{STATUS_LABELS[status]}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* المنتجات الأكثر مبيعاً */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" /> المنتجات الأكثر مبيعاً
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد بيانات في هذه الفترة</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        index === 0 ? "bg-yellow-400 text-yellow-900" :
                        index === 1 ? "bg-gray-300 text-gray-700" :
                        index === 2 ? "bg-orange-300 text-orange-900" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-semibold text-sm truncate">{product.name}</span>
                    </div>
                    <span className="text-sm font-bold text-sidr-brown flex-shrink-0 mr-2">
                      {product.revenue.toFixed(0)} جنيه
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sidr-green h-full rounded-full transition-all"
                      style={{ width: `${(product.revenue / maxTopRevenue) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">عدد القطع: {product.count}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* المبيعات حسب المنطقة */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> المبيعات حسب المنطقة
          </h2>
          {salesByArea.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد بيانات في هذه الفترة</p>
          ) : (
            <div className="space-y-4">
              {salesByArea.map((area) => (
                <div key={area.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm truncate">{area.name}</span>
                    <span className="text-sm font-bold text-sidr-brown flex-shrink-0 mr-2">
                      {area.revenue.toFixed(0)} جنيه
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sidr-brown h-full rounded-full transition-all"
                      style={{ width: `${(area.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">عدد الطلبات: {area.orders}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* آخر الطلبات */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-sidr-green mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> آخر الطلبات
        </h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">لا توجد طلبات في هذه الفترة</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-sidr-cream rounded-xl flex-wrap gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-bold text-sidr-green text-sm">{order.order_number}</span>
                  <span className="text-xs text-gray-500 truncate">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                  <span className="font-bold text-sidr-brown text-sm">{formatCurrency(Number(order.final_total))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}