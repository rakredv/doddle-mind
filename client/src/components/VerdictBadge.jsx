const STYLE = {
  correct: ['Correct', 'text-good'],
  partial: ['Partly right', 'text-warn'],
  incorrect: ['Not quite', 'text-bad'],
};

export default function VerdictBadge({ verdict }) {
  const [text, color] = STYLE[verdict] ?? STYLE.incorrect;
  return <span className={`rounded-full border border-current px-3 py-0.5 text-xs font-semibold ${color}`}>{text}</span>;
}
