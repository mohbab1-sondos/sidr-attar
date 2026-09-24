"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Leaf, Menu, X, Phone, MessageCircle, Search } from "lucide-react";
import { useCart } from "./context/CartContext";
import WeightModal from "./components/WeightModal";

const mockProducts = [
  { id: 1, name: "زيت حبة البركة الأصلي", price: 120, saleType: "piece", category: "زيوت", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400" },
  { id: 2, name: "عسل سدر جبلي", price: 350, saleType: "piece", category: "عسل", image: "https://images.unsplash.com/photo-1587049352847-4d4b1c1e6f7a?auto=format&fit=crop&q=80&w=400" },
  { id: 3, name: "أعشاب البابونج المجففة", price: 80, saleType: "weight", category: "أعشاب", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400" },
  { id: 4, name: "زيت الزيتون البكر", price: 200, saleType: "piece", category: "زيوت", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400" },
  { id: 5, name: "مرمرية (بردقوش)", price: 60, saleType: "weight", category: "أعشاب", image: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&q=80&w=400" },
  { id: 6, name: "زيت جوز الهند العضوي", price: 150, saleType: "piece", category: "زيوت", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400" },
];

const categories = ["الكل", "زيوت", "عسل", "أعشاب", "مكسرات"];

export default function Home() {
  const { cart, addToCart, cartCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState(""); // حالة البحث
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [weightProduct, setWeightProduct] = useState<any>(null);

  const handleAddToCart = (product: any) => {
    if (product.saleType === "weight") {
      setWeightProduct(product);
    } else {
      const existingItem = cart.find(i => i.productId === product.id);
      if (existingItem) {
        const confirmAdd = window.confirm(
          `"${product.name}" موجود بالفعل في سلتك (الكمية: ${existingItem.quantity}).\n\nهل تريد إضافة قطعة أخرى؟`
        );
        if (!confirmAdd) return;
      }
      addToCart({
        productId: product.id, name: product.name, price: product.price,
        saleType: "piece", image: product.image, quantity: 1, weight: 0,
      });
      alert(`تمت إضافة ${product.name} إلى السلة`);
    }
  };

  // تصفية المنتجات بناءً على التصنيف + نص البحث
  const filteredProducts = mockProducts.filter((p) => {
    const matchesCategory = selectedCategory === "الكل" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-sidr-green text-white sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-sidr-light-green" />
            <h1 className="text-2xl font-bold">عطارة سدرة</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2 hover:bg-sidr-light-green/20 rounded-full transition">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-sidr-brown text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>
              )}
            </Link>
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-sidr-green border-t border-sidr-light-green/30 px-4 py-2">
            <a href="#" className="block py-2">الرئيسية</a>
            <a href="#" className="block py-2">المنتجات</a>
            <a href="#" className="block py-2">تواصل معنا</a>
          </div>
        )}
      </header>

      <section className="bg-sidr-light-green py-12 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-sidr-green mb-4">طبيعة أصيلة بين يديك</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">منصة طلب إلكترونية بسيطة وسريعة تتيح لك اختيار المنتجات والكميات، ثم إرسال الطلب مباشرة إلى المتجر عبر واتساب.</p>
          <button className="bg-sidr-brown hover:bg-sidr-brown/90 text-white font-bold py-3 px-8 rounded-full text-lg transition shadow-lg">تسوق الآن</button>
        </div>
      </section>

      {/* قسم البحث الجديد */}
      <section className="pt-8 px-4">
        <div className="container mx-auto max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن منتج... (مثال: زيت، عسل، بابونج)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-12 py-3 rounded-full border border-gray-200 focus:border-sidr-green focus:outline-none shadow-sm bg-white text-sm"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="py-6 px-4 overflow-x-auto whitespace-nowrap">
        <div className="container mx-auto flex gap-3 justify-start md:justify-center">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                selectedCategory === cat ? "bg-sidr-green text-white shadow-md" : "bg-white text-sidr-green border border-sidr-green hover:bg-sidr-light-green"
              }`}>{cat}</button>
          ))}
        </div>
      </section>

      <section className="py-6 px-4 flex-grow">
        <div className="container mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد منتجات مطابقة لبحثك</p>
              <button 
                onClick={() => { setSearchQuery(""); setSelectedCategory("الكل"); }}
                className="mt-4 text-sidr-green font-bold hover:underline"
              >
                عرض كل المنتجات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100 flex flex-col">
                  <div className="h-40 md:h-48 bg-gray-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    {product.saleType === "weight" && (
                      <span className="absolute top-2 right-2 bg-sidr-brown text-white text-xs px-2 py-1 rounded-md">يباع بالوزن</span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-sidr-green text-sm md:text-base mb-2 line-clamp-2">{product.name}</h3>
                    <div className="mt-auto">
                      <p className="text-sidr-brown font-bold text-lg mb-3">
                        {product.price} جنيه
                        <span className="text-xs text-gray-500 font-normal mr-1">{product.saleType === "weight" ? "/ كجم" : "/ قطعة"}</span>
                      </p>
                      <button onClick={() => handleAddToCart(product)}
                        className="w-full bg-sidr-green hover:bg-sidr-green/90 text-white py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> إضافة للسلة
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-sidr-green text-white py-8 px-4 mt-12">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center justify-center md:justify-start gap-2"><Leaf className="w-5 h-5" /> عطارة سدرة</h3>
            <p className="text-sidr-light-green text-sm">طبيعة أصيلة بين يديك. نقدم أفضل الأعشاب والزيوت الطبيعية.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">تواصل معنا</h4>
            <div className="flex flex-col gap-2 items-center md:items-start text-sm">
              <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> 01000000000</span>
              <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4" /> واتساب: 01000000000</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">روابط سريعة</h4>
            <div className="flex flex-col gap-2 items-center md:items-start text-sm">
              <a href="#" className="hover:text-sidr-light-green">الرئيسية</a>
              <a href="#" className="hover:text-sidr-light-green">المنتجات</a>
              <a href="#" className="hover:text-sidr-light-green">سياسة التوصيل</a>
            </div>
          </div>
        </div>
        <div className="text-center text-sidr-light-green/60 text-xs mt-8 border-t border-sidr-light-green/20 pt-4">
          &copy; {new Date().getFullYear()} عطارة سدرة. جميع الحقوق محفوظة.
        </div>
      </footer>

      {weightProduct && (
        <WeightModal
          productName={weightProduct.name}
          pricePerKg={weightProduct.price}
          onConfirm={(weight) => {
            const existingItem = cart.find(i => i.productId === weightProduct.id && i.weight === weight);
            if (existingItem) {
              const confirmAdd = window.confirm(
                `"${weightProduct.name}" بنفس الوزن (${weight} جم) موجود بالفعل في سلتك.\n\nهل تريد إضافة كمية أخرى؟`
              );
              if (!confirmAdd) return;
            }
            addToCart({
              productId: weightProduct.id, name: weightProduct.name, price: weightProduct.price,
              saleType: "weight", image: weightProduct.image, quantity: 1, weight,
            });
            alert(`تمت إضافة ${weightProduct.name} (${weight} جم) إلى السلة`);
          }}
          onClose={() => setWeightProduct(null)}
        />
      )}
    </div>
  );
}