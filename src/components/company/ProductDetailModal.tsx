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

  const phone = (product.phone || '9487654321').replace(/[^0-9+]/g, '');
  const whatsapp = (product.whatsapp || product.phone || '9487654321').replace(/[^0-9]/g, '');

  const priceDisplay = product.price
    ? `₹${Number(product.price).toLocaleString('en-IN')}`
    : product.priceRange || 'Contact for Price';

  const handleWhatsAppEnquire = (customMessage?: string) => {
    const text = customMessage || `Hi, I saw your product "${product.name}" on THENIJOBS Marketplace (${priceDisplay}). I would like to place an order/enquire.`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Hi ${product.companyName}, I want to order "${product.name}" (${priceDisplay}).\n\nOrder Note: ${orderNote.trim() || 'Please contact me regarding delivery and payment.'}`;
    handleWhatsAppEnquire(msg);
    toast.success('Order enquiry opened on WhatsApp!');
    setShowOrderForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
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
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ShieldCheck size={12} /> Verified Seller
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 font-bold">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Main Image */}
          <div className="w-full h-64 bg-gray-100 rounded-2xl overflow-hidden relative flex items-center justify-center border border-gray-200">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6 text-gray-400 space-y-2">
                <Package size={48} className="mx-auto" />
                <p className="text-xs font-semibold">No Product Image Available</p>
              </div>
            )}
            <span className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/80 text-white font-extrabold text-sm shadow-md">
              {priceDisplay}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1 font-semibold text-gray-900">
                <Building2 size={14} className="text-emerald-600" /> {product.companyName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-gray-400" /> {product.district || 'Theni'}
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
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
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
                  className="py-3 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-indigo-200"
                >
                  <Phone size={14} /> Call
                </a>
              )}
              {whatsapp && (
                <button
                  onClick={() => handleWhatsAppEnquire()}
                  className="py-3 px-3 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
              )}
              <button
                onClick={() => setShowOrderForm(!showOrderForm)}
                className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <ShoppingCart size={14} /> Order / Enquire
              </button>
            </div>

            {/* Instant Order Form */}
            {showOrderForm && (
              <form onSubmit={handleOrderSubmit} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-emerald-950">Place Quick Order / Enquiry</h4>
                <textarea
                  rows={2}
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder="Specify quantity, delivery location, or special requirements..."
                  className="w-full p-3 rounded-xl bg-white border border-emerald-200 text-xs text-gray-900 outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs"
                >
                  Send Order via WhatsApp
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
                  View Full Company Profile <ExternalLink size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
