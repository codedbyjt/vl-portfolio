import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// --- Data ---

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
  }
];

const FILM_ITEMS = [
  {
    id: 1,
    src: "/shorts-placeholder.jpg",
    title: "SHORT FILM",
    role: "DIRECTOR",
    year: "2024",
    category: "shorts"
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1636954935820-4554642e6fa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHNjZW5lJTIwc3RpbGwlMjBmcmFtZSUyMGNpbmVtYXRpYyUyMGNvbG9yJTIwZ3JhZGluZ3xlbnwxfHx8fDE3Njk3NTg1ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "MIDNIGHT RUNNER",
    role: "DOP",
    year: "2024",
    category: "film"
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjaTmZW1hdGljJTIwdmlkZWQlMjBshovdG9ncmFwaHl8ZW58MXx8fHwxNzY5NzU4NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "ECHOES",
    role: "DIRECTOR",
    year: "2023",
    category: "docs"
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1758390851225-63cbe6306f45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaWxtJTIwc2V0JTIwcHJvZHVjdGlvbiUyMGJlaGluZCUyMHRoZSUyMHNjZW5lcyUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3Njk3NTg1ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "THE LAST TAKE",
    role: "DIRECTOR",
    year: "2025",
    category: "film"
  }
];

// Helper hook for responsive logic
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

export default function AppOption1SubTabs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'photo' | 'film'>('photo');
  const [photoCategory, setPhotoCategory] = useState<'editorial' | 'personal' | 'commercial'>('editorial');
  const [filmCategory, setFilmCategory] = useState<'shorts' | 'docs' | 'film'>('shorts');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isMobile = useIsMobile();

  const filteredPhotos = PHOTO_ITEMS.filter(item => item.category === photoCategory);
  const filteredFilms = FILM_ITEMS.filter(item => item.category === filmCategory);

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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') previousImage();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lightboxOpen, filteredPhotos.length]);

  return (
    <div className="h-screen w-full bg-white flex flex-col font-sans">
      
      {/* Background Noise/Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[5] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Main Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 px-4 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 lg:pt-8 lg:pb-6 z-50"
        style={{ backgroundColor: 'white' }}
      >
        <div className="absolute inset-0 bg-white -z-10"></div>
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex-1">
            <h1 
              className="text-3xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-transparent" 
              style={{ WebkitTextStroke: "2px #00ff00" }}
            >
              VIC LENTAIGNE
            </h1>
            <div className="w-full h-1 bg-[#00ff00] mt-2"></div>
          </div>
          
          {/* Fancy Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative ml-8 w-12 h-12 md:w-14 md:h-14 flex flex-col items-center justify-center gap-1.5 group"
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
                {/* Close Button */}
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="self-end w-10 h-10 flex items-center justify-center mb-8 group"
                  aria-label="Close menu"
                >
                  <span className="text-3xl font-black text-[#00ff00] group-hover:rotate-90 transition-transform">×</span>
                </button>

                {/* Menu Items */}
                <nav className="flex-1 flex flex-col gap-6">
                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/about');
                    }}
                    className="group relative text-left w-full"
                  >
                    <span className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      About
                    </span>
                    <motion.div 
                      className="h-1 bg-[#00ff00] mt-2"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>

                  <motion.a
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    href="#shop"
                    onClick={() => setIsMenuOpen(false)}
                    className="group relative"
                  >
                    <span className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      Shop
                    </span>
                    <motion.div 
                      className="h-1 bg-[#00ff00] mt-2"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.a>

                  <motion.a
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    href="#contact"
                    onClick={() => setIsMenuOpen(false)}
                    className="group relative"
                  >
                    <span className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      Contact
                    </span>
                    <motion.div 
                      className="h-1 bg-[#00ff00] mt-2"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.a>

                  <motion.a
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    href="#instagram"
                    onClick={() => setIsMenuOpen(false)}
                    className="group relative"
                  >
                    <span className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      Instagram
                    </span>
                    <motion.div 
                      className="h-1 bg-[#00ff00] mt-2"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.a>
                </nav>

                {/* Menu Footer */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="border-t-2 border-[#00ff00] pt-6 mt-6"
                >
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
            <div className="relative w-full h-full flex items-center justify-center p-2 md:p-4">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <ImageWithFallback
                  src={filteredPhotos[currentImageIndex].src}
                  alt={filteredPhotos[currentImageIndex].caption}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
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

      {/* Main Tab Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-[100px] md:top-[120px] lg:top-[160px] left-0 right-0 z-40 px-4 md:px-8 pb-2"
        style={{ backgroundColor: 'white' }}
      >
        <div className="absolute inset-0 bg-white -z-10"></div>
        <div className="max-w-7xl mx-auto flex gap-3 md:gap-4 relative z-10">
          <button
            onClick={() => setActiveTab('photo')}
            className={`relative px-4 md:px-6 lg:px-8 py-2 md:py-3 border-3 border-black font-black uppercase text-sm md:text-base lg:text-xl tracking-tight transition-all duration-300 ${
              activeTab === 'photo'
                ? 'bg-[#00ff00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-0'
                : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            Photography
          </button>
          <button
            onClick={() => setActiveTab('film')}
            className={`relative px-4 md:px-6 lg:px-8 py-2 md:py-3 border-3 border-black font-black uppercase text-sm md:text-base lg:text-xl tracking-tight transition-all duration-300 ${
              activeTab === 'film'
                ? 'bg-[#00ff00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-0'
                : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            Film & Direction
          </button>
        </div>
      </motion.div>

      {/* Sub-tabs - Sticky */}
      <div className="fixed top-[160px] md:top-[180px] lg:top-[220px] left-0 right-0 z-30 px-4 md:px-8 py-3" style={{ backgroundColor: 'white' }}>
        <div className="absolute inset-0 bg-white -z-10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'photo' && (
              <motion.div
                key="photo-subtabs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                <div className="flex gap-4 md:gap-6">
                  <button
                    onClick={() => setPhotoCategory('editorial')}
                    className={`font-mono text-xs md:text-sm uppercase tracking-widest transition-colors ${
                      photoCategory === 'editorial'
                        ? 'text-black font-bold underline decoration-2 underline-offset-4'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Editorial
                  </button>
                  <button
                    onClick={() => setPhotoCategory('personal')}
                    className={`font-mono text-xs md:text-sm uppercase tracking-widest transition-colors ${
                      photoCategory === 'personal'
                        ? 'text-black font-bold underline decoration-2 underline-offset-4'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Personal
                  </button>
                  <button
                    onClick={() => setPhotoCategory('commercial')}
                    className={`font-mono text-xs md:text-sm uppercase tracking-widest transition-colors ${
                      photoCategory === 'commercial'
                        ? 'text-black font-bold underline decoration-2 underline-offset-4'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Commercial
                  </button>
                </div>
                <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-gray-500">Selected Works 1999—2026</span>
              </motion.div>
            )}
            
            {activeTab === 'film' && (
              <motion.div
                key="film-subtabs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                <div className="flex gap-4 md:gap-6">
                  <button
                    onClick={() => setFilmCategory('shorts')}
                    className={`font-mono text-xs md:text-sm uppercase tracking-widest transition-colors ${
                      filmCategory === 'shorts'
                        ? 'text-black font-bold underline decoration-2 underline-offset-4'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Shorts
                  </button>
                  <button
                    onClick={() => setFilmCategory('docs')}
                    className={`font-mono text-xs md:text-sm uppercase tracking-widest transition-colors ${
                      filmCategory === 'docs'
                        ? 'text-black font-bold underline decoration-2 underline-offset-4'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Docs
                  </button>
                  <button
                    onClick={() => setFilmCategory('film')}
                    className={`font-mono text-xs md:text-sm uppercase tracking-widest transition-colors ${
                      filmCategory === 'film'
                        ? 'text-black font-bold underline decoration-2 underline-offset-4'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Film
                  </button>
                </div>
                <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-gray-600">Reel 2026</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content Area */}
      <div className="fixed top-[220px] md:top-[240px] lg:top-[280px] bottom-[40px] left-0 right-0 overflow-y-auto bg-white">
        <div className="px-4 md:px-8 py-8">
          <div className="max-w-7xl mx-auto">
          
          {/* Photography Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'photo' && (
              <motion.div
                key={photoCategory}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPhotos.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="group cursor-pointer"
                      onClick={() => openLightbox(index)}
                    >
                      <div className="relative overflow-hidden bg-white h-[400px] flex items-center justify-center">
                        <ImageWithFallback 
                          src={item.src} 
                          alt={item.caption}
                          className="w-full h-full object-contain md:grayscale md:group-hover:grayscale-0 transition-all duration-500 ease-in-out group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-2 flex justify-between items-center pb-1">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-gray-600">{item.caption}</p>
                        <span className="font-mono text-[10px] text-gray-400">#00{item.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <footer className="mt-16 md:mt-24 pt-8 border-t border-black text-center font-mono text-xs uppercase text-gray-500">
                  End of Reel
                </footer>
              </motion.div>
            )}

            {/* Film Tab Content */}
            {activeTab === 'film' && (
              <motion.div
                key={filmCategory}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {filteredFilms.map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="relative aspect-video border-2 border-black bg-black overflow-hidden mb-4">
                        <ImageWithFallback 
                          src={item.src}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <Play fill="white" size={24} />
                          </div>
                        </div>
                        
                        {/* CRT Scanline Overlay */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
                      </div>
                      
                      <div className="flex justify-between items-end border-b-2 border-black pb-2">
                        <div>
                          <h3 className="text-xl md:text-2xl font-black uppercase font-mono">{item.title}</h3>
                          <p className="text-xs font-mono text-gray-600 uppercase tracking-widest">{item.role} // {item.year}</p>
                        </div>
                        <span className="text-xs font-mono border-2 border-black bg-[#00ff00] px-3 py-1 uppercase font-bold hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">WATCH</span>
                      </div>
                    </div>
                  ))}
                </div>

                <footer className="mt-16 md:mt-24 pt-8 border-t border-black text-center font-mono text-xs uppercase text-gray-500">
                  End of Reel
                </footer>
              </motion.div>
            )}
          </AnimatePresence>

          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 py-2 px-4 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
      >
        <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-wider text-black">
          <span>©1996 VIC LENTAIGNE</span>
          <span>ACID INK: #RF2238</span>
        </div>
      </footer>

    </div>
  );
}
