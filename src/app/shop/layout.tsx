import type { Metadata } from 'next';
import { CartProvider } from '@/contexts/CartContext';
import ShopNavbar from '@/components/shop/ShopNavbar';

export const metadata: Metadata = {
  title: 'THENIJOBS Store',
  description: 'Shop local products from Theni',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ShopNavbar />
      <main className="min-h-screen bg-[#0a0a1a] pt-16">{children}</main>
    </CartProvider>
  );
}
