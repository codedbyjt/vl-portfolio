import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Instagram, Facebook, Linkedin } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

const FILM_ITEMS = [
  {
    id: 1,
    youtubeId: "iHMOYP-L4jc",
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

export default function FilmPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filmCategory, setFilmCategory] = useState<'shorts' | 'docs' | 'film'>('shorts');

  const filteredFilms = FILM_ITEMS.filter(item => item.category === filmCategory);

  return (
    <div className="h-screen w-full bg-black flex flex-col font-sans">
      
      {/* Main Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 px-3 pt-2 pb-1 md:px-6 md:pt-3 md:pb-2 lg:pt-4 lg:pb-2 z-50 bg-black"
      >
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
              className="fixed top-0 right-0 h-full w-full md:w-96 bg-black border-l-4 border-[#00ff00] z-50 shadow-[-10px_0_50px_rgba(0,255,0,0.2)]"
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

                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/photography');
                    }}
                    className="group relative text-left"
                  >
                    <span className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
                      style={{ WebkitTextStroke: "2px #00ff00" }}
                    >
                      Photography
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
                      <span className="text-3xl md:text-4xl font-bold uppercase tracking-tighter text-[#00ff00]"
                        style={{ WebkitTextStroke: "2px #00ff00" }}
                      >
                        Film & Direction
                      </span>
                      <div className="h-0.5 bg-[#00ff00] mt-2 w-full" />
                    </div>
                  </motion.div>

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

                  <p className="font-mono text-xs text-[#00ff00]/50 mt-2">
                    hello@viclentaigne.com
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Compact Navigation Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-[70px] md:top-[100px] lg:top-[130px] left-0 right-0 z-40 px-4 md:px-8 py-2 bg-black border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 relative z-10">
          {/* Film & Direction Label */}
          <div className="px-4 md:px-5 py-2 border-2 border-[#00ff00] bg-[#00ff00] text-black font-semibold uppercase text-xs md:text-sm tracking-tight shadow-[2px_2px_0px_0px_rgba(0,255,0,0.4)]">
            Film & Direction
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/20 hidden md:block"></div>

          {/* Sub-categories */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilmCategory('shorts')}
              className={`px-3 md:px-4 py-1.5 border-2 font-mono font-normal uppercase text-[10px] md:text-xs tracking-tight transition-all ${
                filmCategory === 'shorts'
                  ? 'border-[#00ff00] bg-[#00ff00] text-black'
                  : 'border-white/30 bg-transparent text-white/60 hover:border-white/60 hover:text-white'
              }`}
            >
              Shorts
            </button>
            <button
              onClick={() => setFilmCategory('docs')}
              className={`px-3 md:px-4 py-1.5 border-2 font-mono font-normal uppercase text-[10px] md:text-xs tracking-tight transition-all ${
                filmCategory === 'docs'
                  ? 'border-[#00ff00] bg-[#00ff00] text-black'
                  : 'border-white/30 bg-transparent text-white/60 hover:border-white/60 hover:text-white'
              }`}
            >
              Docs
            </button>
            <button
              onClick={() => setFilmCategory('film')}
              className={`px-3 md:px-4 py-1.5 border-2 font-mono font-normal uppercase text-[10px] md:text-xs tracking-tight transition-all ${
                filmCategory === 'film'
                  ? 'border-[#00ff00] bg-[#00ff00] text-black'
                  : 'border-white/30 bg-transparent text-white/60 hover:border-white/60 hover:text-white'
              }`}
            >
              Film
            </button>
          </div>

          {/* Info Text */}
          <div className="ml-auto hidden lg:block">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
              Reel 2026
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="fixed top-[120px] md:top-[145px] lg:top-[175px] bottom-[40px] left-0 right-0 overflow-y-auto bg-black">
        <div className="px-4 md:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {filteredFilms.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-video border-2 border-black bg-black overflow-hidden mb-4">
                    {'youtubeId' in item && item.youtubeId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${item.youtubeId}?rel=0&modestbranding=1`}
                        title={item.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full border-0"
                      />
                    ) : (
                      <>
                        <ImageWithFallback 
                          src={(item as any).src}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <Play fill="white" size={24} />
                          </div>
                        </div>
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-end border-b-2 border-white/20 pb-2">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black uppercase font-mono text-white">{item.title}</h3>
                      <p className="text-xs font-mono text-white/40 uppercase tracking-widest">{item.role} // {item.year}</p>
                    </div>
                    <span className="text-xs font-mono border-2 border-[#00ff00] bg-[#00ff00] text-black px-3 py-1 uppercase font-bold hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_rgba(0,255,0,0.4)] transition-all">WATCH</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <footer className="mt-16 md:mt-24 pt-8 border-t border-white/10 text-center font-mono text-xs uppercase text-white/30">
              End of Reel
            </footer>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 py-2 px-4 md:px-8 bg-black z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[8px] font-mono uppercase tracking-wider text-white/30">
          <span>©1996 VIC LENTAIGNE</span>
          <span>FILM & DIRECTION</span>
        </div>
      </footer>

    </div>
  );
}
