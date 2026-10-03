export default function ScoreRing({ score, total }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = total ? score / total : 0;
  return (
    <div className="relative mx-auto h-32 w-32" role="img" aria-label={`Score ${score} out of ${total}`}>
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-3xl font-light">{score}/{total}</span>
    </div>
  );
}
