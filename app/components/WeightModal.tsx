"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface Props {
  productName: string;
  pricePerKg: number;
  onConfirm: (weight: number) => void;
  onClose: () => void;
}

const WEIGHT_OPTIONS = [50, 100, 150, 200, 250, 300, 350, 400, 500, 750, 1000];

export default function WeightModal({ productName, pricePerKg, onConfirm, onClose }: Props) {
  const [selectedWeight, setSelectedWeight] = useState(250);
  const totalPrice = (selectedWeight / 1000) * pricePerKg;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full md:w-96 rounded-t-3xl md:rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-sidr-green">{productName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">اختر الوزن المطلوب (السعر لكل كيلو: {pricePerKg} جنيه)</p>
        <div className="grid grid-cols-3 gap-2 mb-6 max-h-60 overflow-y-auto">
          {WEIGHT_OPTIONS.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeight(w)}
              className={`py-2 px-3 rounded-xl text-sm font-semibold transition ${
                selectedWeight === w
                  ? "bg-sidr-green text-white shadow-md"
                  : "bg-sidr-cream text-sidr-green border border-sidr-green/30 hover:bg-sidr-light-green"
              }`}
            >
              {w} جم
            </button>
          ))}
        </div>
        <div className="bg-sidr-cream rounded-2xl p-4 mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">الإجمالي:</span>
          <span className="text-xl font-bold text-sidr-brown">{totalPrice.toFixed(2)} جنيه</span>
        </div>
        <button
          onClick={() => { onConfirm(selectedWeight); onClose(); }}
          className="w-full bg-sidr-green hover:bg-sidr-green/90 text-white py-3 rounded-xl font-bold transition"
        >
          تأكيد الإضافة للسلة
        </button>
      </div>
    </div>
  );
}