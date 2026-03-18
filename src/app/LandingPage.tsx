import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import SlideshowBurn from './backgrounds/SlideshowBurn';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden relative bg-black">
      
      {/* Slideshow background */}
      <SlideshowBurn />

      {/* Main Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 px-4 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 lg:pt-8 lg:pb-6 z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-end">
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

                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
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
                    transition={{ delay: 0.2 }}
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
                    transition={{ delay: 0.25 }}
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

                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/loading-demo');
                    }}
                    className="group relative text-left"
                  >
                    <span className="text-xl md:text-2xl font-bold uppercase tracking-tighter text-[#00ff00]/50 group-hover:text-[#00ff00] transition-all duration-300">
                      Loading Screens
                    </span>
                    <span className="ml-2 text-xs font-mono text-[#00ff00]/40 group-hover:text-[#00ff00]/70 transition-colors">
                      ↗ 9 concepts
                    </span>
                    <motion.div className="h-0.5 bg-[#00ff00]/50 mt-1" initial={{ width: 0 }} whileHover={{ width: '100%' }} transition={{ duration: 0.3 }} />
                  </motion.button>

                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/backgrounds-demo');
                    }}
                    className="group relative text-left"
                  >
                    <span className="text-xl md:text-2xl font-bold uppercase tracking-tighter text-[#00ff00]/50 group-hover:text-[#00ff00] transition-all duration-300">
                      Backgrounds
                    </span>
                    <span className="ml-2 text-xs font-mono text-[#00ff00]/40 group-hover:text-[#00ff00]/70 transition-colors">
                      ↗ 6 concepts
                    </span>
                    <motion.div className="h-0.5 bg-[#00ff00]/50 mt-1" initial={{ width: 0 }} whileHover={{ width: '100%' }} transition={{ duration: 0.3 }} />
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

      {/* Hero Section */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-8">
        <div className="max-w-7xl w-full">
          
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-5xl md:text-6xl lg:text-8xl font-black uppercase tracking-tighter mb-4 md:mb-6"
              style={{ 
                WebkitTextStroke: "3px #00ff00",
                color: "transparent"
              }}
            >
              VIC LENTAIGNE
            </h2>
            <p className="font-mono text-xs md:text-sm lg:text-base uppercase tracking-widest text-white/60 mb-2">
              Photographer • Director
            </p>
          </motion.div>

          {/* Navigation Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto"
          >
            {/* Photography Card */}
            <motion.button
              onClick={() => navigate('/photography')}
              className="group relative p-6 md:p-12 border-4 border-white/30 bg-black/40 backdrop-blur-sm hover:bg-[#00ff00] hover:border-[#00ff00] transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,255,0,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(0,255,0,0.5)] hover:translate-y-[-4px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <h3 className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-2 md:mb-4 leading-tight text-white group-hover:text-black transition-colors">
                  Photography
                </h3>
                <p className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-white/50 group-hover:text-black/70 transition-colors">
                  Editorial • Personal • Commercial
                </p>
              </div>
              <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-3xl md:text-4xl font-black text-[#00ff00] group-hover:text-black transition-colors">
                →
              </div>
            </motion.button>

            {/* Film & Direction Card */}
            <motion.button
              onClick={() => navigate('/film')}
              className="group relative p-6 md:p-12 border-4 border-white/30 bg-black/40 backdrop-blur-sm hover:bg-[#00ff00] hover:border-[#00ff00] transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,255,0,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(0,255,0,0.5)] hover:translate-y-[-4px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <h3 className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-2 md:mb-4 leading-tight text-white group-hover:text-black transition-colors">
                  Film & Direction
                </h3>
                <p className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-white/50 group-hover:text-black/70 transition-colors">
                  Shorts • Docs • Film
                </p>
              </div>
              <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-3xl md:text-4xl font-black text-[#00ff00] group-hover:text-black transition-colors">
                →
              </div>
            </motion.button>
          </motion.div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-4 px-4 md:px-8 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[8px] font-mono uppercase tracking-wider text-white/40">
          <span>©1996 VIC LENTAIGNE</span>
          <span>ACID INK: #RF2238</span>
        </div>
      </footer>

    </div>
  );
}
