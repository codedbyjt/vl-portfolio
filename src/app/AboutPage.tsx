import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white relative overflow-y-auto font-sans">
      
      {/* Background Noise/Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Header with Back Button */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 px-4 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 lg:pt-8 lg:pb-6 z-40 bg-white border-b-4 border-[#00ff00]"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <ArrowLeft className="w-6 h-6 text-[#00ff00] group-hover:translate-x-[-4px] transition-transform" />
            <span className="font-mono text-xs uppercase tracking-wider text-gray-600 group-hover:text-black">
              Back to Portfolio
            </span>
          </button>
          
          <h1 
            className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-transparent" 
            style={{ WebkitTextStroke: "2px #00ff00" }}
          >
            About
          </h1>
        </div>
      </motion.header>

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
