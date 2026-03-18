import { motion } from 'framer-motion';

const WORDS = ['PHOTOGRAPHY', 'FILM', 'DIRECTION', 'LONDON', '1996', 'VIC LENTAIGNE', 'EDITORIAL', 'COMMERCIAL', 'PERSONAL', 'SHORTS', 'DOCS', '35MM'];

const ROWS = Array.from({ length: 6 }, (_, row) => ({
  words: [...WORDS, ...WORDS],
  y: 10 + row * 16,
  duration: 20 + row * 5,
  reverse: row % 2 === 1,
}));

export default function ScrollingText({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {ROWS.map((row, i) => (
        <div
          key={i}
          className="absolute w-full flex gap-8 items-center"
          style={{ top: `${row.y}%`, height: '2rem' }}
        >
          <motion.div
            className="flex gap-8 shrink-0 font-mono text-xs font-black uppercase tracking-widest text-[#00ff00] whitespace-nowrap"
            animate={{ x: row.reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
            transition={{ duration: row.duration, repeat: Infinity, ease: 'linear' }}
          >
            {[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((word, j) => (
              <span key={j}>{word} •</span>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
