export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-[13px] uppercase tracking-widest text-gray-400 font-medium">About</h1>
      </div>

      <div className="px-6 py-10 max-w-xl">

        <p className="text-[15px] text-gray-900 leading-relaxed mb-8">
          Vic Lentaigne is a photographer and visual director based in London, specialising in editorial,
          commercial, and personal visual storytelling.
        </p>

        <div className="mb-8">
          <p className="text-[12px] uppercase tracking-widest text-gray-400 mb-3">Services</p>
          <ul className="space-y-1 text-[14px] text-gray-700">
            <li>Editorial Photography</li>
            <li>Commercial Campaigns</li>
            <li>Film &amp; Direction</li>
          </ul>
        </div>

        <div className="mb-8">
          <p className="text-[12px] uppercase tracking-widest text-gray-400 mb-3">Selected Clients</p>
          <ul className="space-y-1 text-[14px] text-gray-700">
            <li>Vogue</li>
            <li>i-D Magazine</li>
            <li>Dazed</li>
            <li>Nike</li>
            <li>Adidas</li>
            <li>Spotify</li>
          </ul>
        </div>

        <div>
          <p className="text-[12px] uppercase tracking-widest text-gray-400 mb-3">Contact</p>
          <a
            href="mailto:hello@viclentaigne.com"
            className="text-[14px] text-gray-900 hover:text-gray-400 transition-colors"
          >
            hello@viclentaigne.com
          </a>
        </div>

      </div>
    </div>
  );
}
