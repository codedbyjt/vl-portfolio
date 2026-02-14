import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, X } from 'lucide-react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

// --- Data ---

const PHOTO_ITEMS = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1708704854844-9a5193be3394?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwcGhvdG9ncmFwaHQlMjBlZGl0b3JpYWwvfGVufDF8fHx8MTc2OTc1ODU4Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "VOGUE ITALIA / 1999"
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1743335962347-15f35ef125a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBob3RvZ3JhcGh5JTIwYXJ0aXN0aWMlMjBncmFpbnl8ZW58MXx8fHwxNzY5NzU4NTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "UNTITLED PORTRAIT SERIES"
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1598474821521-ca48a956f925?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHBvbGFyb2lkJTIwdGV4dHVyZXxlbnwxfHx8fDE3Njk3NTg1ODN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "ACID WASH DREAMS"
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxmnYXNoaW9uJTIwcGhvdG9ncmFwaHklMjBqrGJ5JTIwcGhvdG9ncmFwaHklMjBnaXJsJTIwbG9vayUyMGF3YXl8ZW58MXx8fHwxNzY5NzU4NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "SUMMER HAZE"
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxmjYXNoaW9uJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzY5NzU4NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "NEON DEMONS"
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxmnYXNoaW9uJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzY5NzU4NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "BACKSTAGE PASS"
  }
];

const FILM_ITEMS = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1758390851225-63cbe6306f45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaWxtJTIwc2V0JTIwcHJvZHVjdGlvbiUyMGJlaGluZCUyMHRoZSUyMHNjZW5lcyUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3Njk3NTg1ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "THE LAST TAKE",
    role: "DIRECTOR",
    year: "2025"
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1636954935820-4554642e6fa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHNjZW5lJTIwc3RpbGwlMjBmcmFtZSUyMGNpbmVtYXRpYyUyMGNvbG9yJTIwZ3JhZGluZ3xlbnwxfHx8fDE3Njk3NTg1ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "MIDNIGHT RUNNER",
    role: "DOP",
    year: "2024"
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjaTmZW1hdGljJTIwdmlkZWQlMjBshovdG9ncmFwaHl8ZW58MXx8fHwxNzY5NzU4NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "ECHOES",
    role: "DIRECTOR",
    year: "2023"
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw4fHxjaTmZW1hdGljJTIwdmlkZWQlMjBshovdG9ncmFwaHl8ZW58MXx8fHwxNzY5NzU4NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "DESERT MIRAGE",
    role: "ART DIRECTOR",
    year: "2022"
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

export default function App() {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'photo' | 'film' | null>(null);
  const isMobile = useIsMobile();

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSection(null);
    setHoveredSection(null);
  };

  // --- Animation Variants ---
  
  // Left Side (Photo)
  const leftVariants = {
    initial: { 
      width: isMobile ? '100%' : '50%',
      height: isMobile ? '50%' : '100%',
      opacity: 1 
    },
    animate: {
      width: isMobile 
        ? '100%' 
        : activeSection === 'photo' ? '100%' : activeSection === 'film' ? '0%' : '50%',
      height: isMobile 
        ? activeSection === 'photo' ? '100%' : activeSection === 'film' ? '0%' : '50%'
        : '100%',
      opacity: activeSection === 'film' ? 0 : 1
    }
  };

  // Right Side (Film)
  const rightVariants = {
    initial: { 
      width: isMobile ? '100%' : '50%',
      height: isMobile ? '50%' : '100%',
      opacity: 1 
    },
    animate: {
      width: isMobile 
        ? '100%' 
        : activeSection === 'film' ? '100%' : activeSection === 'photo' ? '0%' : '50%',
      height: isMobile 
        ? activeSection === 'film' ? '100%' : activeSection === 'photo' ? '0%' : '50%'
        : '100%',
      opacity: activeSection === 'photo' ? 0 : 1
    }
  };

  return (
    <div className="h-screen w-full bg-[#e8e2d5] relative overflow-hidden font-sans">
      
      {/* Background Noise/Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Main Header (Visible in Split View) */}
      <AnimatePresence>
        {!activeSection && (
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 text-center py-6 lg:py-8 z-40 pointer-events-none mix-blend-difference"
          >
             <h1 className="text-[12px] lg:text-[14px] tracking-[0.3em] uppercase mb-1 font-mono text-[#39FF14] font-black drop-shadow-md">VIC LENTAIGNE</h1>
             <p className="text-[9px] tracking-[0.25em] uppercase text-gray-400 font-mono">
               PHOTOGRAPHER & DIRECTOR
             </p>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Close Button (Visible when Active) */}
      <AnimatePresence>
        {activeSection && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBack}
            className="fixed top-6 right-6 z-[60] w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors border-2 border-white"
          >
            <X size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Split Container */}
      <div className="flex flex-col lg:flex-row w-full h-full relative">
        
        {/* Split Line */}
        <AnimatePresence>
          {!activeSection && (
            <>
               {/* Vertical Line (Desktop) */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-yellow-400 -translate-x-1/2 z-30"
              ></motion.div>
              {/* Horizontal Line (Mobile) */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                className="block lg:hidden absolute top-1/2 left-0 right-0 h-0.5 bg-yellow-400 -translate-y-1/2 z-30"
              ></motion.div>
            </>
          )}
        </AnimatePresence>

        {/* --- PHOTOGRAPHY SECTION (LEFT) --- */}
        <motion.div
          className={`relative overflow-hidden ${activeSection === 'film' ? 'pointer-events-none' : ''}`}
          variants={leftVariants}
          initial="initial"
          animate="animate"
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          {/* Inner Container for alignment */}
          <div className="w-full h-full relative flex flex-col">
            
            {/* Expanded Content: Portfolio Grid */}
            <AnimatePresence>
              {activeSection === 'photo' && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute inset-0 z-20 overflow-y-auto bg-white"
                >
                  <div className="container mx-auto px-4 py-24 max-w-7xl">
                    <div className="mb-12 border-b-4 border-black pb-4 flex items-baseline justify-between">
                      <h2 className="text-6xl font-black uppercase tracking-tighter">Photography</h2>
                      <span className="font-mono text-xs uppercase tracking-widest">Selected Works 1999—2026</span>
                    </div>
                    
                    <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3}}>
                      <Masonry gutter="2rem">
                        {PHOTO_ITEMS.map((item) => (
                          <div key={item.id} className="group cursor-pointer">
                            <div className="relative overflow-hidden border-2 border-black bg-gray-100">
                               <ImageWithFallback 
                                 src={item.src} 
                                 alt={item.caption}
                                 className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-500 ease-in-out transform group-hover:scale-105"
                               />
                               <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-multiply pointer-events-none"></div>
                            </div>
                            <div className="mt-2 flex justify-between items-center border-b border-gray-300 pb-1">
                              <p className="font-mono text-[10px] uppercase tracking-wider">{item.caption}</p>
                              <span className="font-mono text-[10px] text-gray-400">#00{item.id}</span>
                            </div>
                          </div>
                        ))}
                      </Masonry>
                    </ResponsiveMasonry>
                    
                    <footer className="mt-24 pt-8 border-t border-black text-center font-mono text-xs uppercase text-gray-500">
                      End of Reel
                    </footer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed/Initial Content: Card */}
            <div className={`flex-1 flex flex-col items-center justify-center lg:items-end lg:pr-12 bg-[#e8e2d5] transition-opacity duration-300 ${activeSection === 'photo' ? 'opacity-0 pointer-events-none absolute inset-0' : ''}`}>
               <div 
                className="scale-90 lg:scale-100 border-4 border-black bg-white relative transform transition-transform hover:lg:scale-[1.02] w-[85%] lg:w-full max-w-[440px] cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col mt-12 lg:mt-0"
                onMouseEnter={() => setHoveredSection('photo')}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => setActiveSection('photo')}
              >
                {/* Title Area */}
                <div className="p-5 pb-0">
                  <h2 className="text-2xl lg:text-3xl font-black leading-[0.9] mb-1 tracking-tight">PHOTOGRAPHY</h2>
                  <h2 className="text-2xl lg:text-3xl font-black leading-[0.9] mb-4 tracking-tight">& VISUAL ART</h2>
                  
                  {/* Category Tabs */}
                  <div className="flex gap-2 mb-4">
                    <div className="bg-[#5CA4FF] px-3 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[9px] lg:text-[10px] uppercase tracking-wider font-bold font-mono">POLAROIDS</span>
                    </div>
                    <div className="bg-[#5CA4FF] px-3 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[9px] lg:text-[10px] uppercase tracking-wider font-bold font-mono">PORTRAITS</span>
                    </div>
                  </div>
                </div>

                {/* Image Area */}
                <div className="px-5 pb-5 flex-grow">
                  <div className="relative aspect-[4/5] overflow-hidden border-2 border-black">
                     <ImageWithFallback
                        src="https://images.unsplash.com/photo-1613723984367-a9b7ee9052d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodCUyMGNpdHklMjBsaWdodHMlMjBuZW9ufGVufDF8fHx8MTc2OTc1ODA0NHww&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="Preview"
                        className="w-full h-full object-cover grayscale contrast-125"
                     />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="px-5 pb-5 pt-3 border-t-4 border-black flex justify-between items-center group mt-auto">
                  <p className="text-[10px] lg:text-[11px] font-mono font-bold uppercase"><span className="font-black">VIC_L</span> // PHOTO</p>
                  <span className="text-[10px] lg:text-[11px] uppercase tracking-wider font-mono bg-black text-white px-3 py-1.5 font-bold group-hover:bg-red-600 transition-colors">ENTER →</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* --- FILM SECTION (RIGHT) --- */}
        <motion.div
          className={`relative overflow-hidden ${activeSection === 'photo' ? 'pointer-events-none' : ''}`}
          variants={rightVariants}
          initial="initial"
          animate="animate"
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
           <div className="w-full h-full relative flex flex-col">
            
             {/* Expanded Content: Film Grid */}
             <AnimatePresence>
              {activeSection === 'film' && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute inset-0 z-20 overflow-y-auto bg-zinc-900 text-white"
                >
                   <div className="container mx-auto px-4 py-24 max-w-7xl">
                    <div className="mb-12 border-b-4 border-white pb-4 flex items-baseline justify-between">
                      <h2 className="text-6xl font-black uppercase tracking-tighter text-transparent stroke-white" style={{ WebkitTextStroke: "2px white" }}>Film & Dir.</h2>
                      <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Reel 2026</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {FILM_ITEMS.map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                          <div className="relative aspect-video border-2 border-white bg-black overflow-hidden mb-4">
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
                          
                          <div className="flex justify-between items-end border-b border-zinc-700 pb-2">
                            <div>
                              <h3 className="text-2xl font-black uppercase font-mono">{item.title}</h3>
                              <p className="text-xs font-mono text-yellow-400 uppercase tracking-widest">{item.role} // {item.year}</p>
                            </div>
                            <span className="text-xs font-mono border border-white px-2 py-0.5 rounded-full hover:bg-white hover:text-black transition-colors">WATCH</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Collapsed/Initial Content: Card */}
            <div className={`flex-1 flex flex-col items-center justify-center lg:items-start lg:pl-12 bg-[#e8e2d5] transition-opacity duration-300 ${activeSection === 'film' ? 'opacity-0 pointer-events-none absolute inset-0' : ''}`}>
               {/* Card Wrapper - Scaled on mobile to fit */}
               <div 
                className="scale-90 lg:scale-100 border-4 border-black bg-white relative transform transition-transform hover:lg:scale-[1.02] w-[85%] lg:w-full max-w-[440px] cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] mb-12 lg:mb-0"
                onMouseEnter={() => setHoveredSection('film')}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => setActiveSection('film')}
              >
                {/* Title Area */}
                <div className="p-6 pb-0">
                  <h2 className="text-2xl lg:text-3xl font-black leading-[0.9] mb-1 tracking-tight">FILM</h2>
                  <h2 className="text-2xl lg:text-3xl font-black leading-[0.9] mb-5 tracking-tight">& DIRECTION</h2>
                  
                  <div className="flex gap-2 mb-5">
                    <div className="bg-[#5CA4FF] px-3 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[9px] lg:text-[10px] uppercase tracking-wider font-bold font-mono">SHORTS</span>
                    </div>
                    <div className="bg-[#5CA4FF] px-3 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[9px] lg:text-[10px] uppercase tracking-wider font-bold font-mono">DOCS</span>
                    </div>
                  </div>
                </div>

                {/* Video Preview Area */}
                <div className="px-6 pb-5">
                  <div className="bg-black aspect-video relative flex items-center justify-center border-2 border-black overflow-hidden group-hover:border-black/80 transition-colors">
                    <ImageWithFallback 
                        src="https://images.unsplash.com/photo-1636954935820-4554642e6fa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHNjZW5lJTIwc3RpbGwlMjBmcmFtZSUyMGNpbmVtYXRpYyUyMGNvbG9yJTIwZ3JhZGluZ3xlbnwxfHx8fDE3Njk3NTg1ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="Video Preview"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    
                    {/* Retro Glitch Overlay */}
                    <div className="absolute inset-0 mix-blend-overlay opacity-40 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover"></div>

                    <div className="relative z-10 bg-[#e8e2d5] border-2 border-black px-4 py-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <span className="text-[10px] uppercase tracking-wider font-bold font-mono flex items-center gap-1">
                        <Play size={10} fill="black" /> PREVIEW
                      </span>
                    </div>
                    
                    {/* Scanlines */}
                     <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%]"></div>
                  </div>
                  
                  <div className="mt-3 bg-[#FFEA2E] border-2 border-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[9px] lg:text-[10px] uppercase tracking-wider font-bold font-mono text-center">2026 · ROLE: DIRECTOR</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-4 border-t-4 border-black flex justify-between items-center group">
                   <p className="text-[10px] lg:text-[11px] font-mono font-bold uppercase"><span className="font-black">VIC_L</span> // FILM</p>
                   <span className="text-[10px] lg:text-[11px] uppercase tracking-wider font-mono bg-black text-white px-3 py-1.5 font-bold group-hover:bg-blue-500 transition-colors">ENTER →</span>
                </div>
              </div>
            </div>
           </div>
        </motion.div>

      </div>
      
      {/* Footer (Always visible but faded in expanded) */}
      <motion.footer 
        className="fixed bottom-0 left-0 right-0 bg-[#e8e2d5] border-t border-gray-400 py-2 px-4 z-40 pointer-events-none"
        animate={{ opacity: activeSection ? 0 : 1 }}
      >
        <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-wider">
          <span>©1996 VIC LENTAIGNE</span>
          <span>ACID INK: #RF2238</span>
        </div>
      </motion.footer>

    </div>
  );
}
