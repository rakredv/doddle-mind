import { SAMPLES } from '../samples/index.js';

export default function SampleChips({ onPick }) {
  return (
    <p className="mt-6 text-sm text-muted">
      No diagram handy? Try a sample:{' '}
      {SAMPLES.map((s) => (
        <button key={s.id} onClick={() => onPick(s)} className="btn-ghost !px-3 !py-1">
          {s.name}
        </button>
      ))}
    </p>
  );
}
