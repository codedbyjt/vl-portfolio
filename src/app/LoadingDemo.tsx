import { useState } from 'react';
import MosaicReveal from './loading-screens/MosaicReveal';
import PolaroidStack from './loading-screens/PolaroidStack';
import SpotlightScanner from './loading-screens/SpotlightScanner';
import GlitchGallery from './loading-screens/GlitchGallery';
import CameraAperture from './loading-screens/CameraAperture';
import HolographicProjection from './loading-screens/HolographicProjection';
import QuantumSplitter from './loading-screens/QuantumSplitter';
import CinematicReveal from './loading-screens/CinematicReveal';
import FilmStripCarousel from './LoadingScreen';

const LOADING_CONCEPTS = [
  { id: 'mosaic',      name: 'Mosaic Reveal',         description: 'Grid of photo tiles flip in with 3D rotation',     component: MosaicReveal },
  { id: 'polaroid',    name: 'Polaroid Stack',         description: 'Vintage polaroid photos shuffle off screen',        component: PolaroidStack },
  { id: 'spotlight',   name: 'Spotlight Scanner',      description: 'Darkroom development with scanning light beam',     component: SpotlightScanner },
  { id: 'glitch',      name: 'Glitch Gallery',         description: 'VHS glitch effects with RGB channel split',         component: GlitchGallery },
  { id: 'aperture',    name: 'Camera Aperture',        description: 'Realistic camera iris opens to reveal the site',    component: CameraAperture },
  { id: 'holographic', name: 'Holographic Projection', description: '3D rotating hologram with floating particles',      component: HolographicProjection },
  { id: 'quantum',     name: 'Quantum Splitter',       description: 'Multi-dimensional image splitting effect',          component: QuantumSplitter },
  { id: 'cinematic',   name: 'Cinematic Reveal',       description: 'Countdown then iris wipe like a film projector',    component: CinematicReveal },
  { id: 'filmstrip',   name: 'Film Strip Carousel',    description: 'Horizontal film strip scrolling with perforations', component: FilmStripCarousel },
];

export default function LoadingDemo() {
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const concept = LOADING_CONCEPTS.find(c => c.id === selectedConcept);
  const LoadingComponent = concept?.component;

  return (
    <div className="min-h-screen bg-black text-white">
      {selectedConcept && LoadingComponent && (
        <LoadingComponent onLoadComplete={() => setSelectedConcept(null)} />
      )}

      {!selectedConcept && (
        <div className="max-w-5xl mx-auto p-8">
          <div className="mb-12">
            <h1
              className="text-6xl font-black uppercase tracking-tighter text-transparent mb-2"
              style={{ WebkitTextStroke: '2px #00ff00' }}
            >
              Loading Screen
            </h1>
            <h2 className="text-6xl font-black uppercase tracking-tighter text-[#00ff00] mb-6">
              Concepts
            </h2>
            <p className="text-gray-400 text-lg font-mono">
              {LOADING_CONCEPTS.length} concepts — click any to preview the full animation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LOADING_CONCEPTS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelectedConcept(c.id)}
                className="group p-6 border-2 border-[#00ff00]/30 hover:border-[#00ff00] hover:bg-[#00ff00]/5 transition-all duration-200 text-left"
              >
                <div className="text-xs font-mono text-[#00ff00]/40 group-hover:text-[#00ff00]/60 mb-3">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-[#00ff00] transition-colors mb-2">
                  {c.name}
                </h3>
                <p className="text-sm text-gray-600 font-mono group-hover:text-gray-400 transition-colors leading-relaxed">
                  {c.description}
                </p>
                <div className="mt-4 text-xs font-mono text-[#00ff00]/40 group-hover:text-[#00ff00] transition-colors">
                  [ PREVIEW ]
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-900">
            <a href="/" className="font-mono text-sm text-gray-700 hover:text-[#00ff00] transition-colors">
              ← back to portfolio
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
