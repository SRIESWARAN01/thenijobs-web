'use client';

import { useState } from 'react';
import { Package, X, Phone, MessageCircle, ShoppingCart, Building2, MapPin, ExternalLink, CheckCircle2, ShieldCheck } from 'lucide-react';
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
    const productUrl = `${origin}/services`;
    
    let msg = `🛍️ *PRODUCT ORDER / SERVICE ENQUIRY*\n`;
    msg += `─────────────────────────\n`;
    msg += `📌 *Item:* ${product.name}\n`;
    msg += `💰 *Price:* ${priceDisplay}\n`;
    msg += `🏢 *Company:* ${product.companyName}\n`;
    msg += `📍 *Location:* ${product.district || 'Theni'}, Tamil Nadu\n`;
    if (product.imageUrl) {
      msg += `🖼️ *Photo:* ${product.imageUrl}\n`;
    }
    msg += `🔗 *THENIJOBS Marketplace:* ${productUrl}\n`;
    if (customNote) {
      msg += `📝 *Customer Note:* ${customNote}\n`;
    }
    msg += `─────────────────────────\n`;
    msg += `Hi, I found your listing on THENIJOBS Marketplace and would like to order / get more information. Please let me know availability and delivery details!`;

    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleWhatsAppEnquire(orderNote.trim() || 'Ready to place an order. Please send payment/delivery details.');
    toast.success('Order enquiry opened in WhatsApp!');
    setShowOrderForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 font-outfit" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto font-outfit shadow-2xl border border-gray-200 animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              {product.category || 'Product / Service'}
            </span>
            {product.isVerified && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck size={12} /> Verified Seller
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 font-bold cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Main Image Banner */}
          <div className="w-full h-64 sm:h-72 bg-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center border border-gray-200">
            {product.imageUrl ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-105"
                  style={{ backgroundImage: `url(${product.imageUrl})` }}
                />
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="relative z-10 w-full h-full object-cover sm:object-contain object-center"
                />
              </>
            ) : (
              <div className="text-center p-6 text-gray-400 space-y-2">
                <Package size={48} className="mx-auto" />
                <p className="text-xs font-semibold">No Image Available</p>
              </div>
            )}
            <span className="absolute bottom-3 right-3 z-20 px-3.5 py-1.5 rounded-xl bg-slate-950/85 text-white font-black text-sm shadow-md border border-white/20">
              {priceDisplay}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-gray-900">
                <Building2 size={14} className="text-emerald-600" /> {product.companyName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-gray-400" /> {product.district || 'Theni'}, Tamil Nadu
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {product.description || 'No description provided for this product/service.'}
            </p>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Key Highlights / Specifications:</h4>
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

          {/* Direct CTAs */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="py-3 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-indigo-200 cursor-pointer"
                >
                  <Phone size={14} /> Call Seller
                </a>
              )}
              {whatsapp && (
                <button
                  onClick={() => handleWhatsAppEnquire()}
                  className="py-3 px-3 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:opacity-90"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
              )}
              <button
                onClick={() => setShowOrderForm(!showOrderForm)}
                className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <ShoppingCart size={14} /> Direct Order
              </button>
            </div>

            {/* Instant Order Form */}
            {showOrderForm && (
              <form onSubmit={handleOrderSubmit} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-emerald-950">Place Quick Order / Enquiry Note</h4>
                <textarea
                  rows={2}
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder="Specify quantity, delivery location, or special requirements..."
                  className="w-full p-3 rounded-xl bg-white border border-emerald-200 text-xs text-gray-900 outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  Send Order via WhatsApp Chat
                </button>
              </form>
            )}

            {/* View Company Profile Link */}
            {product.companySlug && (
              <div className="pt-2 text-center">
                <Link
                  href={`/company/${product.companySlug}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  View Full Company Profile &amp; Catalogue <ExternalLink size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
