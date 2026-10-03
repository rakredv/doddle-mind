import { useState } from 'react';

export default function FlashCards({ cards }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];

  const go = (n) => {
    setFlipped(false);
    setI(Math.min(cards.length - 1, Math.max(0, n)));
  };

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') go(i + 1);
    else if (e.key === 'ArrowLeft') go(i - 1);
  }

  return (
    <div onKeyDown={onKeyDown}>
      <p className="mb-4 text-center text-sm text-muted" aria-live="polite">Card {i + 1} of {cards.length}</p>

      <div className="flip">
        <button
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? 'Showing the answer. Press to show the question.' : 'Showing the question. Press to show the answer.'}
          className="block w-full cursor-pointer text-left"
        >
          <div className={`flip-inner ${flipped ? 'on' : ''}`}>
            <div className="face face-front card" aria-hidden={flipped}>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">Question</span>
              <p className="headline mt-4 text-3xl sm:text-4xl">{card.front}</p>
              <span className="mt-auto pt-6 text-sm text-muted">Tap or press Enter to flip</span>
            </div>
            <div className="face face-back card bg-accent-soft" aria-hidden={!flipped}>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">Answer</span>
              <p className="mt-4 text-xl font-light leading-8 sm:text-2xl">{card.back}</p>
              <span className="mt-auto pt-6 text-sm text-muted">Tap to flip back</span>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={() => go(i - 1)} disabled={i === 0} className="btn-ghost disabled:opacity-30">← Previous</button>
        <div className="flex gap-2" aria-hidden>
          {cards.map((c, n) => (
            <span key={c.id} className={`h-2 w-2 rounded-full ${n === i ? 'bg-accent' : 'bg-line'}`} />
          ))}
        </div>
        <button onClick={() => go(i + 1)} disabled={i === cards.length - 1} className="btn-ghost disabled:opacity-30">Next →</button>
      </div>
    </div>
  );
}
