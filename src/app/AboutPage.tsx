import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Instagram, Facebook, Linkedin } from 'lucide-react';

export default function AboutPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white relative overflow-y-auto font-sans">
      
      {/* Background Noise/Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 px-4 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 lg:pt-8 lg:pb-6 z-40 bg-white"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-4 md:gap-8">
          <div className="flex-1 flex justify-end">
            <div className="inline-block">
              <h1 
                className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-transparent" 
                style={{ WebkitTextStroke: "2px #00ff00" }}
              >
                About
              </h1>
              <div className="w-full h-0.5 bg-[#00ff00] mt-1"></div>
            </div>
          </div>
          
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

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="relative text-left"
                  >
                    <div className="inline-block">
                      <span className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[#00ff00]"
                        style={{ WebkitTextStroke: "2px #00ff00" }}
                      >
                        About
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
                      navigate('/shop');
                    }}
                    className="group relative text-left"
                  >
                    <span className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent group-hover:text-[#00ff00] transition-all duration-300"
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

                {/* Footer */}
                <div className="pt-8 border-t border-gray-200">
                  <p className="font-mono text-xs uppercase tracking-wider text-gray-400">
                    © 2026 Vic Lentaigne
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-[100px] md:pt-[120px] pb-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 
              className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-6 text-transparent"
              style={{ WebkitTextStroke: "2px #00ff00" }}
            >
              VIC LENTAIGNE
            </h2>
            <div className="h-2 w-32 bg-[#00ff00] mb-8"></div>
            <p className="text-xl md:text-2xl font-bold uppercase tracking-tight mb-4">
              PHOTOGRAPHER & VISUAL DIRECTOR
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl">
              Based in London, specializing in editorial, commercial, and personal visual storytelling 
              that blends raw authenticity with cinematic precision.
            </p>
          </motion.div>

          {/* Bio Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16 grid md:grid-cols-2 gap-8"
          >
            <div>
              <h3 className="text-2xl font-black uppercase mb-4 border-b-2 border-black pb-2">
                Background
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                With over a decade of experience capturing stories through the lens, I've worked 
                with brands, publications, and artists to create images that resonate beyond the frame.
              </p>
              <p className="text-gray-700 leading-relaxed">
                My approach combines technical precision with spontaneous moments, resulting in 
                work that feels both intentional and alive.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-black uppercase mb-4 border-b-2 border-black pb-2">
                Approach
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                I believe in collaboration over direction. Every project is a conversation between 
                subject, environment, and vision.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Whether it's editorial portraiture or commercial campaigns, the goal is always 
                the same: create something honest, striking, and unforgettable.
              </p>
            </div>
          </motion.div>

          {/* Services Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-black uppercase mb-6 border-b-4 border-[#00ff00] pb-3 inline-block">
              Services
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Editorial Photography",
                  desc: "Magazine features, artist portraits, and visual storytelling for print and digital publications."
                },
                {
                  title: "Commercial Work",
                  desc: "Brand campaigns, product photography, and creative direction for businesses and agencies."
                },
                {
                  title: "Film & Direction",
                  desc: "Short films, documentaries, music videos, and cinematography for narrative projects."
                }
              ].map((service, i) => (
                <div 
                  key={i}
                  className="border-2 border-black p-6 hover:bg-[#00ff00] hover:translate-y-[-4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group"
                >
                  <h4 className="font-black uppercase text-lg mb-3 group-hover:text-black">
                    {service.title}
                  </h4>
                  <p className="text-sm text-gray-600 group-hover:text-black">
                    {service.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Selected Clients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-black uppercase mb-6 border-b-4 border-black pb-3 inline-block">
              Selected Clients
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "VOGUE", "I-D MAGAZINE", "DAZED", "NIKE",
                "ADIDAS", "SPOTIFY", "APPLE", "HYPEBEAST"
              ].map((client, i) => (
                <div 
                  key={i}
                  className="border-2 border-black p-4 text-center font-black uppercase text-xs md:text-sm hover:bg-black hover:text-[#00ff00] transition-colors duration-300"
                >
                  {client}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-black text-white p-8 md:p-12 border-4 border-[#00ff00]"
          >
            <h3 className="text-3xl md:text-4xl font-black uppercase mb-4">
              LET'S WORK TOGETHER
            </h3>
            <p className="text-gray-300 mb-6 max-w-xl">
              Available for commissions, collaborations, and creative projects worldwide.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <a 
                href="mailto:hello@viclentaigne.com"
                className="inline-block px-8 py-4 bg-[#00ff00] text-black font-black uppercase border-2 border-[#00ff00] hover:bg-black hover:text-[#00ff00] transition-all duration-300 text-center"
              >
                Get in Touch
              </a>
              <a 
                href="#instagram"
                className="inline-block px-8 py-4 bg-black text-[#00ff00] font-black uppercase border-2 border-[#00ff00] hover:bg-[#00ff00] hover:text-black transition-all duration-300 text-center"
              >
                Follow on Instagram
              </a>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-300 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[8px] md:text-[10px] font-mono uppercase tracking-wider text-black">
            ©1996 VIC LENTAIGNE
          </span>
          <div className="flex gap-6 text-[8px] md:text-[10px] font-mono uppercase tracking-wider">
            <a href="mailto:hello@viclentaigne.com" className="hover:text-[#00ff00] transition-colors">
              hello@viclentaigne.com
            </a>
            <span className="text-gray-400">ACID INK: #RF2238</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
