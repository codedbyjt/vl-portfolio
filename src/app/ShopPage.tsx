import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Instagram, Facebook, Linkedin } from 'lucide-react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
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

export default function ShopPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems, addToCart, cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // Restore scroll position when coming back to the shop
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('shopScrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      sessionStorage.removeItem('shopScrollPosition');
    }
  }, []);

  const handleProductClick = (productId: number) => {
    // Save current scroll position before navigating
    sessionStorage.setItem('shopScrollPosition', window.scrollY.toString());
    navigate(`/shop/${productId}`);
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
            <div className="w-full h-0.5 bg-[#00ff00] mt-2"></div>
          </div>

          {/* Cart Icon */}
          {totalItems > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative mx-4 md:mx-6"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-6 h-6 md:w-7 md:h-7 text-[#00ff00]" strokeWidth={1.5} />
              <span className="absolute -top-2 -right-2 bg-black text-[#00ff00] rounded-full w-6 h-6 flex items-center justify-center text-xs font-black border-2 border-[#00ff00]">
                {totalItems}
              </span>
            </motion.button>
          )}
          
          {/* Fancy Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative w-12 h-12 md:w-14 md:h-14 flex flex-col items-center justify-center gap-1.5 group"
            aria-label="Menu"
          >
            <motion.span
              animate={isMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
              className="w-8 h-0.5 bg-[#00ff00] transition-all group-hover:w-10"
            />
            <motion.span
              animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-8 h-0.5 bg-[#00ff00] transition-all group-hover:w-10"
            />
            <motion.span
              animate={isMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
              className="w-8 h-0.5 bg-[#00ff00] transition-all group-hover:w-10"
            />
          </button>
        </div>
      </motion.header>

      {/* Slide-out Menu Panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-96 bg-white border-l-4 border-[#00ff00] z-50 shadow-[-10px_0_50px_rgba(0,255,0,0.2)]"
            >
              <div className="p-8 h-full flex flex-col">
                {/* Header and Close Button */}
                <div className="flex items-start justify-between mb-4">
                  <h2 
                    className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent" 
                    style={{ WebkitTextStroke: "2px #00ff00" }}
                  >
                    VIC LENTAIGNE
                  </h2>
                  
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-10 h-10 flex items-center justify-center group"
                    aria-label="Close menu"
                  >
                    <span className="text-3xl font-black text-[#00ff00] group-hover:rotate-90 transition-transform">×</span>
                  </button>
                </div>
                <div className="w-full h-0.5 bg-[#00ff00] mb-8"></div>

                {/* Menu Items */}
                <nav className="flex-1 flex flex-col gap-6">
                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/');
                    }}
                    className="group relative text-left"
                  >
                    <span className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      Portfolio
                    </span>
                    <motion.div 
                      className="h-0.5 bg-[#00ff00] mt-2"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>

                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/about');
                    }}
                    className="group relative text-left"
                  >
                    <span className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      About
                    </span>
                    <motion.div 
                      className="h-0.5 bg-[#00ff00] mt-2"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative text-left"
                  >
                    <div className="inline-block">
                      <span className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[#00ff00]"
                        style={{ WebkitTextStroke: "2px #00ff00" }}
                      >
                        Shop
                      </span>
                      <div className="h-0.5 bg-[#00ff00] mt-2 w-full" />
                    </div>
                  </motion.div>
                </nav>

                {/* Social Media Icons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="border-t-2 border-[#00ff00] pt-6 mt-6"
                >
                  <div className="flex gap-6 mb-6">
                    <a 
                      href="https://instagram.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:scale-110 transition-transform"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-8 h-8 text-[#00ff00]" strokeWidth={1.5} />
                    </a>
                    <a 
                      href="https://facebook.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:scale-110 transition-transform"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-8 h-8 text-[#00ff00]" strokeWidth={1.5} />
                    </a>
                    <a 
                      href="https://linkedin.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:scale-110 transition-transform"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-8 h-8 text-[#00ff00]" strokeWidth={1.5} />
                    </a>
                  </div>

                  <p className="font-mono text-xs uppercase tracking-widest text-gray-600">
                    Available for commissions
                  </p>
                  <p className="font-mono text-xs text-gray-400 mt-2">
                    hello@viclentaigne.com
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Summary Panel */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            
            {/* Cart Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-96 bg-white border-l-4 border-[#00ff00] z-50 shadow-[-10px_0_50px_rgba(0,255,0,0.2)]"
            >
              <div className="p-8 h-full flex flex-col">
                {/* Header and Close Button */}
                <div className="flex items-start justify-between mb-4">
                  <h2 
                    className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent" 
                    style={{ WebkitTextStroke: "2px #00ff00" }}
                  >
                    Your Cart
                  </h2>
                  
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-10 h-10 flex items-center justify-center group"
                    aria-label="Close cart"
                  >
                    <span className="text-3xl font-black text-[#00ff00] group-hover:rotate-90 transition-transform">×</span>
                  </button>
                </div>
                <div className="w-full h-0.5 bg-[#00ff00] mb-8"></div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-xl font-mono text-gray-400 uppercase tracking-wider">
                        Your cart is empty
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cart.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-2 border-[#00ff00] p-4"
                        >
                          <div className="flex gap-4">
                            <img 
                              src={item.image} 
                              alt={item.title}
                              className="w-20 h-20 object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="font-black text-sm uppercase tracking-tight text-[#00ff00]">
                                {item.title}
                              </h3>
                              <p className="font-mono text-sm mt-1">{item.price}</p>
                              
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 border-2 border-[#00ff00] flex items-center justify-center font-black text-[#00ff00] hover:bg-[#00ff00] hover:text-black transition-colors"
                                >
                                  -
                                </button>
                                <span className="font-mono text-sm w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 border-2 border-[#00ff00] flex items-center justify-center font-black text-[#00ff00] hover:bg-[#00ff00] hover:text-black transition-colors"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="ml-auto text-xs font-mono uppercase text-red-500 hover:text-red-700 transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Checkout Section */}
                {cart.length > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="border-t-2 border-[#00ff00] pt-6 mt-6"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-black uppercase text-lg tracking-tight">Total:</span>
                      <span className="font-black text-2xl text-[#00ff00]">{totalPrice}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        // For now, just navigate to first item's checkout
                        // You can customize this to handle multiple items
                        const firstItem = SHOP_ITEMS.find(item => item.id === cart[0].id);
                        if (firstItem?.checkoutUrl) {
                          window.location.href = firstItem.checkoutUrl;
                        }
                      }}
                      className="w-full py-4 bg-[#00ff00] text-black font-black text-lg uppercase tracking-tight hover:bg-black hover:text-[#00ff00] border-2 border-[#00ff00] transition-colors"
                    >
                      Checkout
                    </button>
                    
                    <p className="font-mono text-xs text-center text-gray-400 mt-4">
                      Powered by Stripe Secure Checkout
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-[100px] md:pt-[120px] lg:pt-[160px] pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Shop Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-gray-600 mb-8">
              Limited Edition Prints & Zines
            </p>
          </motion.div>

          {/* Shop Products Grid */}
          <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3}}>
            <Masonry gutter="2rem">
              {SHOP_ITEMS.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: item.id * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => handleProductClick(item.id)}
                >
                  {/* Product Image */}
                  <div className="relative overflow-hidden bg-white h-[400px] flex items-center justify-center mb-4">
                    <ImageWithFallback 
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="space-y-2 mb-4">
                    <div className="border-b-2 border-black pb-2 flex justify-between items-end">
                      <div>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-1 group-hover:text-[#00ff00] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-lg md:text-xl font-black text-[#00ff00]">
                          {item.price}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({
                              id: item.id,
                              title: item.title,
                              price: item.price,
                              image: item.image,
                            });
                          }}
                          className="text-xs font-mono border-2 border-black bg-white px-3 py-1 uppercase font-bold hover:bg-black hover:text-[#00ff00] transition-all"
                        >
                          BUY
                        </button>
                        <span className="text-xs font-mono border-2 border-black bg-[#00ff00] px-3 py-1 uppercase font-bold hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">VIEW</span>
                      </div>
                    </div>

                    <p className="font-mono text-[10px] uppercase tracking-wider leading-relaxed text-gray-700">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-2 h-2 bg-[#00ff00] animate-pulse"></div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                        {item.stock}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </Masonry>
          </ResponsiveMasonry>

          {/* Shop Footer */}
          <footer className="mt-16 md:mt-24 pt-8 border-t-2 border-black text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Powered by Stripe Secure Checkout
            </p>
          </footer>
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
