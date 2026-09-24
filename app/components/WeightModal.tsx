"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  productName: string;
  pricePerKg: number;
  minWeight?: number;
  weightIncrement?: number;
  onConfirm: (weight: number) => void;
  onClose: () => void;
}

// خيارات وزن موسعة (حتى 5 كجم)
const WEIGHT_OPTIONS = [
  50, 100, 150, 200, 250, 300, 400, 500, 750, 
  1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000
];

export default function WeightModal({ 
  productName, 
  pricePerKg, 
  minWeight = 50, 
  weightIncrement = 50,
  onConfirm, 
  onClose 
}: Props) {
  const [selectedWeight, setSelectedWeight] = useState(minWeight);
  const [customWeight, setCustomWeight] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const totalPrice = (selectedWeight / 1000) * pricePerKg;

  // عند تغيير الوزن المخصص، تحديث الوزن المختار
  useEffect(() => {
    if (useCustom && customWeight) {
      const w = Number(customWeight);
      if (w >= minWeight) {
        // تقريب للزيادة المحددة
        const rounded = Math.round(w / weightIncrement) * weightIncrement;
        setSelectedWeight(rounded);
      }
    }
  }, [customWeight, useCustom, minWeight, weightIncrement]);

  const handleCustomChange = (value: string) => {
    setCustomWeight(value);
    setUseCustom(true);
  };

  const handleOptionClick = (w: number) => {
    setSelectedWeight(w);
    setUseCustom(false);
    setCustomWeight("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full md:w-[480px] rounded-t-3xl md:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-sidr-green">{productName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          السعر: <span className="font-bold text-sidr-brown">{pricePerKg} جنيه / كجم</span>
        </p>

        <p className="text-sm font-semibold mb-2">اختر الوزن المطلوب:</p>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4 max-h-60 overflow-y-auto">
          {WEIGHT_OPTIONS.map((w) => (
            <button
              key={w}
              onClick={() => handleOptionClick(w)}
              className={`py-2 px-2 rounded-xl text-sm font-semibold transition ${
                !useCustom && selectedWeight === w
                  ? "bg-sidr-green text-white shadow-md"
                  : "bg-sidr-cream text-sidr-green border border-sidr-green/30 hover:bg-sidr-light-green"
              }`}
            >
              {w >= 1000 ? `${w / 1000} كجم` : `${w} جم`}
            </button>
          ))}
        </div>

        {/* حقل إدخال وزن مخصص */}
        <div className="bg-sidr-cream rounded-xl p-4 mb-4">
          <label className="block text-sm font-semibold mb-2">أو اكتب وزناً مخصصاً (بالجرام):</label>
          <input
            type="number"
            value={customWeight}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder={`الحد الأدنى: ${minWeight} جرام`}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-sidr-green focus:outline-none bg-white"
            min={minWeight}
          />
          {customWeight && Number(customWeight) < minWeight && (
            <p className="text-red-500 text-xs mt-1">
              الحد الأدنى للوزن هو {minWeight} جرام
            </p>
          )}
          {useCustom && customWeight && Number(customWeight) >= minWeight && (
            <p className="text-green-600 text-xs mt-1">
              سيتم تقريبه إلى: {selectedWeight} جرام
            </p>
          )}
        </div>

        <div className="bg-sidr-light-green rounded-2xl p-4 mb-4 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600 block">الوزن المختار:</span>
            <span className="font-bold text-sidr-green">
              {selectedWeight >= 1000 ? `${selectedWeight / 1000} كجم` : `${selectedWeight} جم`}
            </span>
          </div>
          <div className="text-left">
            <span className="text-sm text-gray-600 block">الإجمالي:</span>
            <span className="text-xl font-bold text-sidr-brown">{totalPrice.toFixed(2)} جنيه</span>
          </div>
        </div>

        <button
          onClick={() => { onConfirm(selectedWeight); onClose(); }}
          disabled={useCustom && (!customWeight || Number(customWeight) < minWeight)}
          className="w-full bg-sidr-green hover:bg-sidr-green/90 disabled:bg-gray-400 text-white py-3 rounded-xl font-bold transition"
        >
          تأكيد الإضافة للسلة
        </button>
      </div>
    </div>
  );
}
