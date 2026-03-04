import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

const PHOTO_ITEMS = [
  {
    id: 1,
    src: "/hwa-1.webp",
    caption: "EDITORIAL SERIES / 2024",
    category: "editorial"
  },
  {
    id: 2,
    src: "/hwa-2.webp",
    caption: "EDITORIAL SERIES / 2024",
    category: "editorial"
  },
  {
    id: 3,
    src: "/hwa-3.webp",
    caption: "EDITORIAL SERIES / 2024",
    category: "editorial"
  },
  {
    id: 4,
    src: "/hwa-4.webp",
    caption: "EDITORIAL SERIES / 2024",
    category: "editorial"
  },
  {
    id: 5,
    src: "/hwa-5.webp",
    caption: "EDITORIAL SERIES / 2024",
    category: "editorial"
  },
  {
    id: 6,
    src: "/hwa-6.webp",
    caption: "EDITORIAL SERIES / 2024",
    category: "editorial"
  },
  // Personal category images
  {
    id: 7,
    src: "/PERSONAL/35-14-final03.jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 8,
    src: "/PERSONAL/CampbellKing_March25 166.jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 9,
    src: "/PERSONAL/Greece_Milos000098110033.jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 10,
    src: "/PERSONAL/Vic Lentaigne rose bryony (1).jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 11,
    src: "/PERSONAL/VicLentaigne-Tboys-Roll6 1024.jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 12,
    src: "/PERSONAL/VicLentaigne-Tboys-Roll7 1 copy.jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 13,
    src: "/PERSONAL/VicLentaigne-Tboys-Roll7 copy.jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 14,
    src: "/PERSONAL/VicLentaigne_capetown_176 (1).jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 15,
    src: "/PERSONAL/VicLentaigne_capetown_24 copy (1).jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 16,
    src: "/PERSONAL/VicLentaigne_capetown_247 (1).jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 17,
    src: "/PERSONAL/greg-viclentaigne (1).jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 18,
    src: "/PERSONAL/greg2-viclentaigne (1).jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 19,
    src: "/PERSONAL/immy vicy.jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  },
  {
    id: 20,
    src: "/PERSONAL/viclentaigne-2.jpg",
    caption: "PERSONAL WORK / 2024",
    category: "personal"
  }
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

export default function PhotographyPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [photoCategory, setPhotoCategory] = useState<'editorial' | 'personal' | 'commercial'>('editorial');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isMobile = useIsMobile();

  const filteredPhotos = PHOTO_ITEMS.filter(item => item.category === photoCategory);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % filteredPhotos.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') previousImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, filteredPhotos.length]);

  return (
    <div className="h-screen w-full bg-white flex flex-col font-sans">
      
      {/* Background Noise/Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[5] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Main Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 px-3 pt-2 pb-1 md:px-6 md:pt-3 md:pb-2 lg:pt-4 lg:pb-2 z-50"
        style={{ backgroundColor: 'white' }}
      >
        <div className="absolute inset-0 bg-white -z-10"></div>
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex-1">
            <button
              onClick={() => navigate('/')}
              className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-transparent hover:text-[#00ff00] transition-colors cursor-pointer" 
              style={{ WebkitTextStroke: "2px #00ff00" }}
            >
              VIC LENTAIGNE
            </button>
            <div className="w-full h-0.5 bg-[#00ff00] mt-0.5"></div>
          </div>
          
          {/* Fancy Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative ml-4 w-10 h-10 md:w-12 md:h-12 flex flex-col items-center justify-center gap-1 group"
            aria-label="Menu"
          >
            <motion.span
              animate={isMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-[#00ff00] transition-all group-hover:w-8"
            />
            <motion.span
              animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-6 h-0.5 bg-[#00ff00] transition-all group-hover:w-8"
            />
            <motion.span
              animate={isMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-[#00ff00] transition-all group-hover:w-8"
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
                    className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-transparent" 
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
                    <span className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      Home
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
                    transition={{ delay: 0.15 }}
                    className="relative text-left"
                  >
                    <div className="inline-block">
                      <span className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-[#00ff00]"
                        style={{ WebkitTextStroke: "2px #00ff00" }}
                      >
                        Photography
                      </span>
                      <div className="h-0.5 bg-[#00ff00] mt-2 w-full" />
                    </div>
                  </motion.div>

                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/film');
                    }}
                    className="group relative text-left"
                  >
                    <span className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      Film & Direction
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
                    transition={{ delay: 0.25 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/about');
                    }}
                    className="group relative text-left"
                  >
                    <span className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
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

                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/shop');
                    }}
                    className="group relative text-left"
                  >
                    <span className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      Shop
                    </span>
                    <motion.div 
                      className="h-0.5 bg-[#00ff00] mt-2"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </nav>

                {/* Social Media Icons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="border-t-2 border-[#00ff00] pt-6 mt-6 text-center"
                >
                  <div className="flex gap-6 mb-6 justify-center">
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

                  <p className="font-mono text-xs text-gray-400 mt-2">
                    hello@viclentaigne.com
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 md:top-8 md:right-8 z-10 w-12 h-12 flex items-center justify-center group"
              aria-label="Close lightbox"
            >
              <span className="text-4xl font-black text-[#00ff00] group-hover:rotate-90 transition-transform">×</span>
            </button>

            {/* Previous Button */}
            <button
              onClick={previousImage}
              className="absolute left-4 md:left-8 z-10 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/50 hover:bg-[#00ff00] hover:text-black transition-all group"
              aria-label="Previous image"
            >
              <span className="text-2xl md:text-3xl font-black text-[#00ff00] group-hover:text-black">‹</span>
            </button>

            {/* Next Button */}
            <button
              onClick={nextImage}
              className="absolute right-4 md:right-8 z-10 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/50 hover:bg-[#00ff00] hover:text-black transition-all group"
              aria-label="Next image"
            >
              <span className="text-2xl md:text-3xl font-black text-[#00ff00] group-hover:text-black">›</span>
            </button>

            {/* Image Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full max-w-[100vw] max-h-[100vh] flex items-center justify-center"
              >
                <ImageWithFallback
                  src={filteredPhotos[currentImageIndex].src}
                  alt={filteredPhotos[currentImageIndex].caption}
                  className="w-full h-full object-contain"
                />
                
                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:p-4">
                  <p className="font-mono text-xs md:text-sm uppercase tracking-wider text-[#00ff00]">
                    {filteredPhotos[currentImageIndex].caption}
                  </p>
                  <p className="font-mono text-xs text-gray-400 mt-1">
                    {currentImageIndex + 1} / {filteredPhotos.length}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Navigation Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-[50px] md:top-[70px] lg:top-[85px] left-0 right-0 z-40 px-3 md:px-6 py-1"
        style={{ backgroundColor: 'white' }}
      >
        <div className="absolute inset-0 bg-white -z-10"></div>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 relative z-10">
          {/* Photography Label */}
          <div className="px-3 md:px-4 py-1 border-2 border-black bg-[#00ff00] text-black font-bold uppercase text-[10px] md:text-xs tracking-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Photography
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-gray-300 hidden md:block"></div>

          {/* Sub-categories */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setPhotoCategory('editorial')}
              className={`px-2 md:px-3 py-1 border-2 border-black font-mono font-normal uppercase text-[9px] md:text-[10px] tracking-tight transition-all ${
                photoCategory === 'editorial'
                  ? 'bg-black text-[#00ff00]'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Editorial
            </button>
            <button
              onClick={() => setPhotoCategory('personal')}
              className={`px-2 md:px-3 py-1 border-2 border-black font-mono font-normal uppercase text-[9px] md:text-[10px] tracking-tight transition-all ${
                photoCategory === 'personal'
                  ? 'bg-black text-[#00ff00]'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setPhotoCategory('commercial')}
              className={`px-2 md:px-3 py-1 border-2 border-black font-mono font-normal uppercase text-[9px] md:text-[10px] tracking-tight transition-all ${
                photoCategory === 'commercial'
                  ? 'bg-black text-[#00ff00]'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Commercial
            </button>
          </div>

          {/* Info Text */}
          <div className="ml-auto hidden lg:block">
            <p className="font-mono text-[9px] uppercase tracking-widest text-gray-400">
              Selected Works 1999–2026
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="fixed top-[90px] md:top-[105px] lg:top-[120px] bottom-[30px] left-0 right-0 overflow-y-auto bg-white">
        <div className="px-3 md:px-6 py-2">
          <div className="max-w-7xl mx-auto">
            
            {/* Commercial Portfolio Message */}
            {photoCategory === 'commercial' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 md:p-8 border-4 border-[#00ff00] bg-white text-center"
              >
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-3">
                  Commercial Portfolio
                </h3>
                <p className="font-mono text-sm md:text-base uppercase tracking-widest text-gray-600">
                  Available on Request
                </p>
                <p className="font-mono text-xs text-gray-500 mt-4">
                  Contact: hello@viclentaigne.com
                </p>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-6 lg:gap-8">
              {filteredPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <div className="relative mb-1 min-h-[500px] md:min-h-[600px] lg:min-h-0 flex items-center justify-center bg-gray-50">
                    <ImageWithFallback 
                      src={photo.src}
                      alt={photo.caption}
                      className="w-full h-auto object-contain max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-160px)]"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <p className="font-mono text-xs uppercase tracking-normal text-black">
                      {photo.caption}
                    </p>
                    <p className="font-mono text-xs uppercase tracking-wider text-gray-400">
                      #{String(index + 1).padStart(3, '0')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-300 py-1 px-3 md:px-6 bg-white z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[7px] font-mono uppercase tracking-wider text-black">
          <span>©1996 VIC LENTAIGNE</span>
          <span>PHOTOGRAPHY</span>
        </div>
      </footer>

    </div>
  );
}
