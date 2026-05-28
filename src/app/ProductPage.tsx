import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const SHOP_ITEMS = [
  {
    id: 1,
    title: "17th Boys Zine",
    price: "£18",
    description: "A limited edition collectable zine, in a numbered run of 200 copies. Risograph printed by Pagemasters in London.",
    image: publicAsset("/17thboys.webp"),
    stock: "Limited Edition",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_live_a1JLP1AbPhUM6K8FmoFVmC2wVkAi5wHpC0HXOaYlCCunWDIeOUV9NlxoHL#fidkdWxOYHwnPyd1blppbHNgWjFSaG5QdGh1fDA9PEZwSl0yf0ptRGtQNicpJ3Zxd2x1YERmZmpwa3EnPydkZmZxWjRXQmhGXzU0TkBDQkNqcUonKSdobGF2Jz9%2BJ2JwbGEnPydnMz1nNmAzZihgYGEzKDEwNzQoZz09NCgyMjxgYTIxYGMwZjdnMTw1MjQnKSdocGxhJz8nMTJkNDI1NTAoMjwxYygxNzYwKDw1Z2EoMT00Zj0yZ2ZkYWQyMzM3NTVkJykndmxhJz8nPWFjYWM1MT0oMWY1NigxNTNhKDxkYTQoMjwxZzAxZjM2PTdhY2c1ZDcxJ3gpJ2dgcWR2Jz9eWCknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJyknd2BjYHd3YHdKd2xibGsnPydtcXF1dj8qKnJycitzbGZpYGtxZGxia2ArZmpoJ3gl",
  },
  {
    id: 2,
    title: "Wrestle A3 Poster",
    price: "£50",
    description: "A very limited edition risograph poster. Edition of 25. Printed on black 170gsm paper with silver ink.",
    image: publicAsset("/wrestlea3poster.webp"),
    stock: "Edition of 25",
    checkoutUrl: "https://checkout.stripe.com/",
  },
  {
    id: 3,
    title: "Torso A3 Poster",
    price: "£35",
    description: "A limited edition risograph poster in a run of 50 editions. Printed on 170gsm paper.",
    image: publicAsset("/torsoa3poster.webp"),
    stock: "Edition of 50",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_live_a1tipYfIL6Qh9Az9Uc17g1B7drBSaZxyLQ64ASUQ4bQX2felUFnFdxE1zJ#fidkdWxOYHwnPyd1blppbHNgWjFSaG5QdGh1fDA9PEZwSl0yf0ptRGtQNicpJ3Zxd2x1YERmZmpwa3EnPydkZmZxWjRXQmhGXzU0TkBDQkNqcUonKSdobGF2Jz9%2BJ2JwbGEnPydhMGFnYzZhNyhnMmBgKDFmN2YoZGMzZihkMmA3NWRgYzI8MGNkNWRkYzcnKSdocGxhJz8nMTJkNDI1NTAoMjwxYygxNzYwKDw1Z2EoMT00Zj0yZ2ZkYWQyMzM3NTVkJykndmxhJz8nPWFjYWM1MT0oMWY1NigxNTNhKDxkYTQoMjwxZzAxZjM2PTdhY2c1ZDcxJ3gpJ2dgcWR2Jz9eWCknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJyknd2BjYHd3YHdKd2xibGsnPydtcXF1dj8qKnJycitzbGZpYGtxZGxia2ArZmpoJ3gl",
  },
];

export default function ProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const product = SHOP_ITEMS.find((item) => item.id === Number(id));

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-8 pb-4 border-b border-gray-100 flex items-center gap-4">
        <button onClick={() => navigate('/shop')} className="text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-[13px] uppercase tracking-widest text-gray-400 font-medium">Shop</h1>
      </div>

      <div className="px-6 py-10 max-w-2xl flex flex-col md:flex-row gap-10">
        <div className="md:w-64 flex-shrink-0 bg-gray-50">
          <img src={product.image} alt={product.title} className="w-full h-auto object-cover" />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-[18px] text-gray-900 font-medium mb-1">{product.title}</h2>
            <p className="text-[12px] uppercase tracking-widest text-gray-400 mb-6">{product.stock}</p>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-8">{product.description}</p>
          </div>

          <div>
            <p className="text-[20px] text-gray-900 font-medium mb-4">{product.price}</p>
            <a
              href={product.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 border border-gray-900 text-[13px] uppercase tracking-widest text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-200"
            >
              Buy Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
