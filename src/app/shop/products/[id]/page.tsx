import ProductDetailPageClient from './ProductDetailPageClient';
import { getProducts } from '@/lib/firebase/shopService';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  try {
    const products = await getProducts();
    if (!products || products.length === 0) {
      return [{ id: 'placeholder' }];
    }
    return products.map((p) => ({
      id: p.id,
    }));
  } catch (err) {
    console.error('Failed to generate static params for products:', err);
    return [{ id: 'placeholder' }];
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  return <ProductDetailPageClient params={params} />;
}

