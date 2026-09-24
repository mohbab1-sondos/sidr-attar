"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, updateWeight, cartTotal, cartCount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <ShoppingBag className="w-24 h-24 text-sidr-green/30 mb-6" />
        <h2 className="text-2xl font-bold text-sidr-green mb-2">سلة التسوق فارغة</h2>
        <p className="text-gray-500 mb-8">لم تقم بإضافة أي منتجات بعد.</p>
        <Link href="/" className="bg-sidr-green text-white px-8 py-3 rounded-full font-bold hover:bg-sidr-green/90 transition">
          تسوق الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sidr-cream">
      <header className="bg-sidr-green text-white sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-sidr-light-green/20 rounded-full transition"><ArrowRight className="w-6 h-6" /></Link>
          <h1 className="text-xl font-bold">سلة التسوق ({cartCount})</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="space-y-4 mb-6">
          {cart.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sidr-green text-sm md:text-base truncate">{item.name}</h3>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-full transition flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {item.saleType === "weight" 
                      ? `${item.price} جنيه / كجم` 
                      : `${item.price} جنيه / قطعة`}
                  </p>
                  
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    {/* للمنتجات بالوزن: عرض أزرار تعديل الوزن */}
                    {item.saleType === "weight" ? (
                      <div className="flex items-center gap-2 bg-sidr-cream rounded-full p-1">
                        <button 
                          onClick={() => updateWeight(item.id, Math.max(50, item.weight - 50))} 
                          disabled={item.weight <= 50}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-sidr-light-green transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="min-w-[70px] text-center font-bold text-sm px-2">
                          {item.weight >= 1000 ? `${item.weight / 1000} كجم` : `${item.weight} جم`}
                        </span>
                        <button 
                          onClick={() => updateWeight(item.id, item.weight + 50)} 
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-sidr-light-green transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      // للمنتجات بالقطعة: عرض أزرار تعديل الكمية
                      <div className="flex items-center gap-2 bg-sidr-cream rounded-full p-1">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-sidr-light-green transition">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-sidr-light-green transition">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    <span className="font-bold text-sidr-brown text-lg">{item.totalPrice.toFixed(2)} جنيه</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between mb-2 text-gray-600">
            <span>إجمالي المنتجات</span>
            <span>{cartTotal.toFixed(2)} جنيه</span>
          </div>
          <div className="flex justify-between mb-4 text-gray-600">
            <span>رسوم التوصيل</span>
            <span className="text-xs">تُحسب في الخطوة التالية</span>
          </div>
          <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-6">
            <span className="font-bold text-lg">الإجمالي</span>
            <span className="font-bold text-2xl text-sidr-brown">{cartTotal.toFixed(2)} جنيه</span>
          </div>
          <Link href="/checkout" className="block w-full bg-sidr-green hover:bg-sidr-green/90 text-white text-center py-3 rounded-xl font-bold transition">
            إتمام الطلب
          </Link>
        </div>
      </div>
    </div>
  );
}
