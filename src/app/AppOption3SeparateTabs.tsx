import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// --- Data ---

const PHOTO_ITEMS = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1708704854844-9a5193be3394?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwcGhvdG9ncmFwaHQlMjBlZGl0b3JpYWwvfGVufDF8fHx8MTc2OTc1ODU4Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "VOGUE ITALIA / 1999",
    category: "editorial"
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1743335962347-15f35ef125a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBob3RvZ3JhcGh5JTIwYXJ0aXN0aWMlMjBncmFpbnl8ZW58MXx8fHwxNzY5NzU4NTgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "UNTITLED PORTRAIT SERIES",
    category: "personal"
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1598474821521-ca48a956f925?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHBvbGFyb2lkJTIwdGV4dHVyZXxlbnwxfHx8fDE3Njk3NTg1ODN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "ACID WASH DREAMS",
    category: "personal"
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxmnYXNoaW9uJTIwcGhvdG9ncmFwaHklMjBqrGJ5JTIwcGhvdG9ncmFwaHklMjBnaXJsJTIwbG9vayUyMGF3YXl8ZW58MXx8fHwxNzY5NzU4NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "SUMMER HAZE",
    category: "commercial"
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxmjYXNoaW9uJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzY5NzU4NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "NEON DEMONS",
    category: "editorial"
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxmnYXNoaW9uJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzY5NzU4NTgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    caption: "BACKSTAGE PASS",
    category: "commercial"
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

type TabType = 'editorial' | 'personal' | 'commercial' | 'film';

export default function AppOption3SeparateTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('editorial');
  const isMobile = useIsMobile();

  const filteredPhotos = PHOTO_ITEMS.filter(item => item.category === activeTab);
  const isPhotoTab = activeTab !== 'film';

  return (
    <div className="h-screen w-full bg-white relative overflow-hidden font-sans">
      
      {/* Background Noise/Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Main Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 px-4 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 lg:pt-8 lg:pb-6 z-40 bg-white border-b-2 border-gray-200"
      >
        <div className="max-w-7xl mx-auto">
          <h1 
            className="text-3xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-transparent" 
            style={{ WebkitTextStroke: "2px #00ff00" }}
          >
            VIC LENTAIGNE
          </h1>
          <div className="w-full h-1 bg-[#00ff00] mt-2"></div>
        </div>
      </motion.header>

      {/* All Main Tabs - Editorial, Personal, Commercial, Film, About */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-[100px] md:top-[120px] lg:top-[160px] left-0 right-0 z-30 px-4 md:px-8 bg-white py-2 border-b-2 border-gray-200"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 md:gap-3">
          <button
            onClick={() => setActiveTab('editorial')}
            className={`px-3 md:px-5 lg:px-6 py-2 md:py-2.5 border-3 border-black font-black uppercase text-xs md:text-sm lg:text-base tracking-tight transition-all duration-300 ${
              activeTab === 'editorial'
                ? 'bg-[#00ff00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-0'
                : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            Editorial
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3 md:px-5 lg:px-6 py-2 md:py-2.5 border-3 border-black font-black uppercase text-xs md:text-sm lg:text-base tracking-tight transition-all duration-300 ${
              activeTab === 'personal'
                ? 'bg-[#00ff00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-0'
                : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`px-3 md:px-5 lg:px-6 py-2 md:py-2.5 border-3 border-black font-black uppercase text-xs md:text-sm lg:text-base tracking-tight transition-all duration-300 ${
              activeTab === 'commercial'
                ? 'bg-[#00ff00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-0'
                : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            Commercial
          </button>
          <button
            onClick={() => setActiveTab('film')}
            className={`px-3 md:px-5 lg:px-6 py-2 md:py-2.5 border-3 border-black font-black uppercase text-xs md:text-sm lg:text-base tracking-tight transition-all duration-300 ${
              activeTab === 'film'
                ? 'bg-[#00ff00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-0'
                : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            Film & Direction
          </button>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="pt-[180px] md:pt-[200px] lg:pt-[240px] pb-16 px-4 md:px-8 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Photography Content (Editorial, Personal, Commercial) */}
          <AnimatePresence mode="wait">
            {isPhotoTab && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 md:mb-12 border-b-4 border-black pb-4 flex items-baseline justify-between">
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter">{activeTab}</h2>
                  <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest">Photography Works</span>
                </div>
                
                <ResponsiveMasonry columnsCountBreakPoints={{350: 1, 750: 2, 900: 3}}>
                  <Masonry gutter="2rem">
                    {filteredPhotos.map((item) => (
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
                
                <footer className="mt-16 md:mt-24 pt-8 border-t border-black text-center font-mono text-xs uppercase text-gray-500">
                  End of Reel
                </footer>
              </motion.div>
            )}

            {/* Film Tab Content */}
            {activeTab === 'film' && (
              <motion.div
                key="film"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 md:mb-12 border-b-4 border-black pb-4 flex items-baseline justify-between">
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter">Film & Direction</h2>
                  <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-gray-600">Reel 2026</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {FILM_ITEMS.map((item) => (
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
      
      {/* Footer */}
      <footer 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 py-2 px-4 z-40"
      >
        <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-wider text-black">
          <span>©1996 VIC LENTAIGNE</span>
          <span>ACID INK: #RF2238</span>
        </div>
      </footer>

    </div>
  );
}
