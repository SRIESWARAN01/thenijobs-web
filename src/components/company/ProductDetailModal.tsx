'use client';

import { useState } from 'react';
import { Package, X, Phone, MessageCircle, ShoppingCart, Building2, MapPin, ExternalLink, CheckCircle2, ShieldCheck, ArrowRight, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

export interface ProductDetailModalProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    priceRange?: string;
    category?: string;
    imageUrl?: string;
    features?: string[];
    websiteUrl?: string;
    productUrl?: string;
    companyName: string;
    companySlug?: string;
    phone?: string;
    whatsapp?: string;
    district?: string;
    isVerified?: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const toast = useToast();
  const [orderNote, setOrderNote] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);

  if (!isOpen || !product) return null;

  const phone = (product.phone || '9360519460').replace(/[^0-9+]/g, '');
  const whatsapp = (product.whatsapp || product.phone || '9360519460').replace(/[^0-9]/g, '');

  const priceDisplay = product.price
    ? `₹${Number(product.price).toLocaleString('en-IN')}`
    : product.priceRange || 'Contact for Price';

  const handleWhatsAppEnquire = (customNote?: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thenijobs.com';
    const pageUrl = product.companySlug
      ? `${origin}/company/${product.companySlug}`
      : `${origin}/services`;
    
    let msg = `🛍️ *NEW PRODUCT / SERVICE ORDER*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏢 *Company:* ${product.companyName}\n`;
    msg += `📦 *Product / Service:* ${product.name}\n`;
    msg += `💰 *Price:* ${priceDisplay}\n`;
    msg += `📍 *Location:* ${product.district || 'Theni'}, Tamil Nadu\n`;
    if (product.imageUrl) {
      msg += `🖼️ *Photo Reference:* ${product.imageUrl}\n`;
    }
    if (product.websiteUrl || product.productUrl) {
      msg += `🌐 *Product Link:* ${product.websiteUrl || product.productUrl}\n`;
    }
    msg += `🔗 *THENIJOBS Page:* ${pageUrl}\n`;
    if (customNote) {
      msg += `📝 *Customer Note / Quantity:* ${customNote}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Hello, I found your listing on THENIJOBS Marketplace and would like to order / inquire about this. Please share availability, payment and delivery options.`;

    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleWhatsAppEnquire(orderNote.trim() || 'Ready to place an order. Please send payment and delivery details.');
    toast.success('Order enquiry opened in WhatsApp!');
    setShowOrderForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 font-outfit" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto font-outfit shadow-2xl border border-gray-200 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
              {product.category || 'Product / Service'}
            </span>
            {product.isVerified && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck size={12} /> Verified Seller
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 font-bold cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Main Image Banner */}
          <div className="w-full h-64 sm:h-72 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center border border-gray-200">
            {product.imageUrl ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center blur-xs opacity-25 scale-105"
                  style={{ backgroundImage: `url(${product.imageUrl})` }}
                />
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="relative z-10 w-full h-full object-contain object-center p-2"
                />
              </>
            ) : (
              <div className="text-center p-6 text-gray-400 space-y-2">
                <Package size={44} className="mx-auto opacity-50" />
                <p className="text-xs font-semibold">No Image Uploaded</p>
              </div>
            )}
            <span className="absolute bottom-3 right-3 z-20 px-3.5 py-1.5 rounded-xl bg-slate-950/90 text-white font-black text-sm shadow-md border border-white/20">
              {priceDisplay}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 leading-snug">{product.name}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
              <span className="flex items-center gap-1 font-bold text-gray-900">
                <Building2 size={14} className="text-emerald-600" /> {product.companyName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-gray-400" /> {product.district || 'Theni'}, Tamil Nadu
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {product.description || 'Verified product/service offered by local business in Theni.'}
            </p>

            {/* External Product URL */}
            {(product.websiteUrl || product.productUrl) && (
              <div className="pt-1">
                <a
                  href={product.websiteUrl || product.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all"
                >
                  <ExternalLink size={13} /> View External Product Website / Catalog
                </a>
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Highlights &amp; Specifications:</h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {product.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order / Enquiry Form (Accordion) */}
          {showOrderForm && (
            <form onSubmit={handleOrderSubmit} className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart size={14} className="text-emerald-600" /> WhatsApp Direct Order Form
                </h4>
                <button type="button" onClick={() => setShowOrderForm(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Quantity / Delivery Address / Special Instructions:</label>
                <textarea
                  rows={2}
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder="e.g. Quantity: 2 Units, Delivery to Cumbum, Please confirm total price."
                  className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900 outline-none focus:border-emerald-500 font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={14} /> Send Order to Business WhatsApp
              </button>
            </form>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="py-3 px-2 sm:px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-indigo-200 cursor-pointer"
                >
                  <Phone size={14} /> Call Seller
                </a>
              )}
              {whatsapp && (
                <button
                  onClick={() => handleWhatsAppEnquire()}
                  className="py-3 px-2 sm:px-3 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:opacity-90"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
              )}
              <button
                onClick={() => setShowOrderForm(!showOrderForm)}
                className="py-3 px-2 sm:px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <ShoppingCart size={14} /> 1-Click Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
