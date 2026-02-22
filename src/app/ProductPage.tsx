import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { useCart } from './CartContext';

const SHOP_ITEMS = [
  {
    id: 1,
    title: "17TH BOYS ZINE",
    price: "£18",
    description: "A LIMITED EDITION COLLECTABLE ZINE, IN A NUMBERED RUN OF 200 COPIES. RISOGRAPH PRINTED BY PAGEMASTERS IN LONDON.",
    image: "/17thboys.webp",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_live_a1JLP1AbPhUM6K8FmoFVmC2wVkAi5wHpC0HXOaYlCCunWDIeOUV9NlxoHL#fidkdWxOYHwnPyd1blppbHNgWjFSaG5QdGh1fDA9PEZwSl0yf0ptRGtQNicpJ3Zxd2x1YERmZmpwa3EnPydkZmZxWjRXQmhGXzU0TkBDQkNqcUonKSdobGF2Jz9%2BJ2JwbGEnPydnMz1nNmAzZihgYGEzKDEwNzQoZz09NCgyMjxgYTIxYGMwZjdnMTw1MjQnKSdocGxhJz8nMTJkNDI1NTAoMjwxYygxNzYwKDw1Z2EoMT00Zj0yZ2ZkYWQyMzM3NTVkJykndmxhJz8nPWFjYWM1MT0oMWY1NigxNTNhKDxkYTQoMjwxZzAxZjM2PTdhY2c1ZDcxJ3gpJ2dgcWR2Jz9eWCknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJyknd2BjYHd3YHdKd2xibGsnPydtcXF1dj8qKnJycitzbGZpYGtxZGxia2ArZmpoJ3gl",
    stock: "LIMITED EDITION"
  },
  {
    id: 2,
    title: "WRESTLE A3 POSTER",
    price: "£50",
    description: "A VERY LIMITED EDITION RISOGRAPH POSTER. EDITION OF 25. PRINTED ON BLACK 170GSM PAPER WITH SILVER INK.",
    image: "/wrestlea3poster.webp",
    checkoutUrl: "https://checkout.stripe.com/", // Add your Stripe checkout URL here
    stock: "EDITION OF 25"
  },
  {
    id: 3,
    title: "TORSO A3 POSTER",
    price: "£35",
    description: "A LIMITED EDITION RISOGRAPH POSTER. IN A RUN OF 50 EDITIONS. PRINTED ON 170GSM PAPER.",
    image: "/torsoa3poster.webp",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_live_a1tipYfIL6Qh9Az9Uc17g1B7drBSaZxyLQ64ASUQ4bQX2felUFnFdxE1zJ#fidkdWxOYHwnPyd1blppbHNgWjFSaG5QdGh1fDA9PEZwSl0yf0ptRGtQNicpJ3Zxd2x1YERmZmpwa3EnPydkZmZxWjRXQmhGXzU0TkBDQkNqcUonKSdobGF2Jz9%2BJ2JwbGEnPydhMGFnYzZhNyhnMmBgKDFmN2YoZGMzZihkMmA3NWRgYzI8MGNkNWRkYzcnKSdocGxhJz8nMTJkNDI1NTAoMjwxYygxNzYwKDw1Z2EoMT00Zj0yZ2ZkYWQyMzM3NTVkJykndmxhJz8nPWFjYWM1MT0oMWY1NigxNTNhKDxkYTQoMjwxZzAxZjM2PTdhY2c1ZDcxJ3gpJ2dgcWR2Jz9eWCknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJyknd2BjYHd3YHdKd2xibGsnPydtcXF1dj8qKnJycitzbGZpYGtxZGxia2ArZmpoJ3gl",
    stock: "EDITION OF 50"
  }
];

export default function ProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { addToCart, getTotalItems } = useCart();
  const totalItems = getTotalItems();

  const product = SHOP_ITEMS.find(item => item.id === Number(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  const handleBuyNow = () => {
    if (product) {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
      });
    }
    // Optionally redirect to checkout or show a success message
    // window.location.href = product.checkoutUrl;
  };

  return (
    <div className="min-h-screen w-full bg-white relative font-sans">
      
      {/* Background Noise/Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[5] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 px-4 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 lg:pt-8 lg:pb-6 z-40 bg-white"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <button 
              onClick={() => navigate('/')}
              className="text-3xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-transparent hover:text-[#00ff00] transition-colors cursor-pointer" 
              style={{ WebkitTextStroke: "2px #00ff00" }}
            >
              VIC LENTAIGNE
            </button>
            <div className="w-full h-1 bg-[#00ff00] mt-2"></div>
          </div>

          {/* Cart Icon */}
          {totalItems > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative mx-4 md:mx-6"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 text-[#00ff00]" strokeWidth={1.5} />
              <span className="absolute -top-2 -right-2 bg-black text-[#00ff00] rounded-full w-6 h-6 flex items-center justify-center text-xs font-black border-2 border-[#00ff00]">
                {totalItems}
              </span>
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-[100px] md:top-[120px] lg:top-[160px] left-4 md:left-8 z-30"
      >
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black font-black uppercase text-xs md:text-sm tracking-tight hover:bg-[#00ff00] transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shop</span>
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="pt-[160px] md:pt-[200px] lg:pt-[240px] pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Product Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="sticky top-[180px] md:top-[220px] lg:top-[260px]">
                <div className="relative bg-white border-4 border-black overflow-hidden max-w-md mx-auto lg:mx-0">
                  <ImageWithFallback 
                    src={product.image}
                    alt={product.title}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              
              {/* Title Section */}
              <div className="border-b-4 border-black pb-6">
                <h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4"
                >
                  {product.title}
                </h1>
                <p className="text-3xl md:text-4xl font-black text-[#00ff00]">
                  {product.price}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <p className="font-mono text-sm md:text-base uppercase tracking-wider leading-relaxed text-gray-700">
                  {product.description}
                </p>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-3 py-4 border-y-2 border-black">
                <div className="w-3 h-3 bg-[#00ff00] animate-pulse"></div>
                <span className="font-mono text-sm uppercase tracking-widest font-bold">
                  {product.stock}
                </span>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                onClick={handleBuyNow}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black text-[#00ff00] py-4 md:py-6 px-8 font-black uppercase text-lg md:text-xl tracking-tight border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,255,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,255,0,1)] hover:translate-y-[-2px] transition-all duration-300"
              >
                Add to Cart
              </motion.button>

              {/* Additional Info */}
              <div className="space-y-3 pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-black mt-2"></div>
                  <p className="font-mono text-xs uppercase tracking-wider text-gray-600">
                    Secure checkout powered by Stripe
                  </p>
                </div>
              </div>

            </motion.div>

          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-300 py-4 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[8px] font-mono uppercase tracking-wider text-black">
          <span>©1996 VIC LENTAIGNE</span>
          <span>ACID INK: #RF2238</span>
        </div>
      </footer>

    </div>
  );
}
