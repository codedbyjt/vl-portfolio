import { useState } from 'react';
import DarkStatic from './backgrounds/DarkStatic';
import GreenStatic from './backgrounds/GreenStatic';
import ScanLines from './backgrounds/ScanLines';
import FilmBurn from './backgrounds/FilmBurn';
import DriftingPhotos from './backgrounds/DriftingPhotos';
import SlideshowBurn from './backgrounds/SlideshowBurn';

const CONCEPTS = [
  { id: 'dark-static',    name: 'Dark Static',      description: 'Heavy TV static — detuned channel, full noise',               component: DarkStatic },
  { id: 'green-static',   name: 'Green Static',     description: 'Night vision / surveillance — green noise grain',              component: GreenStatic },
  { id: 'scanlines',      name: 'CRT Scan Lines',   description: 'Dark grain with rolling horizontal scan bands',                component: ScanLines },
  { id: 'film-burn',      name: 'Film Burn',        description: 'Warm dark grain with random neon green light leaks',           component: FilmBurn },
  { id: 'drifting',       name: 'Drifting Photos',  description: 'Portfolio images slowly floating across a dark field',         component: DriftingPhotos },
  { id: 'slideshow-burn', name: 'Slideshow Burn',   description: 'Full-screen portfolio images crossfading with Ken Burns + film burn flash', component: SlideshowBurn },
];

export default function BackgroundsDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const concept = CONCEPTS.find(c => c.id === selected);
  const BgComponent = concept?.component;

  return (
    <div className="min-h-screen bg-black text-white">

      {selected && BgComponent && (
        <div className="fixed inset-0 z-50">
          <div className="relative w-full h-full">
            <BgComponent />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter text-transparent mb-4"
                style={{ WebkitTextStroke: '3px #00ff00' }}>
                VIC LENTAIGNE
              </h1>
              <p className="font-mono text-xs uppercase tracking-widest text-white/60">Photographer • Director</p>
              <div className="mt-12 grid grid-cols-2 gap-6 w-full max-w-2xl px-8">
                {['Photography', 'Film & Direction'].map(label => (
                  <div key={label} className="border-4 border-white/20 p-8 text-center">
                    <div className="text-2xl font-black uppercase tracking-tighter text-white/40">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setSelected(null)}
              className="absolute top-6 left-6 pointer-events-auto font-mono text-sm text-[#00ff00] border border-[#00ff00] px-4 py-2 hover:bg-[#00ff00] hover:text-black transition-all z-10">
              ← Back
            </button>
            <div className="absolute bottom-6 left-6 font-mono text-xs text-[#00ff00]/60">{concept?.name}</div>
          </div>
        </div>
      )}

      {!selected && (
        <div className="max-w-5xl mx-auto p-8">
          <div className="mb-12">
            <h1 className="text-6xl font-black uppercase tracking-tighter text-transparent mb-2"
              style={{ WebkitTextStroke: '2px #00ff00' }}>Background</h1>
            <h2 className="text-6xl font-black uppercase tracking-tighter text-[#00ff00] mb-6">Concepts</h2>

          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONCEPTS.map((c, i) => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                className="group p-6 border-2 border-[#00ff00]/30 hover:border-[#00ff00] hover:bg-[#00ff00]/5 transition-all duration-200 text-left">
                <div className="text-xs font-mono text-[#00ff00]/40 group-hover:text-[#00ff00]/60 mb-3">{String(i+1).padStart(2,'0')}</div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-[#00ff00] transition-colors mb-2">{c.name}</h3>
                <p className="text-sm text-gray-600 font-mono group-hover:text-gray-400 transition-colors leading-relaxed">{c.description}</p>
                <div className="mt-4 text-xs font-mono text-[#00ff00]/40 group-hover:text-[#00ff00] transition-colors">[ PREVIEW ]</div>
              </button>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-gray-900">
            <a href="/" className="font-mono text-sm text-gray-700 hover:text-[#00ff00] transition-colors">← back to portfolio</a>
          </div>
        </div>
      )}
    </div>
  );
}
