import { useEffect, useRef, useState } from 'react';
import OptionPills from './OptionPills.jsx';
import SampleChips from './SampleChips.jsx';
import { prepareImage } from '../lib/image.js';
import { LANGUAGES, LEVELS } from '../lib/i18n.js';

const STEPS = [
  ['Snap', 'Upload a photo of any diagram.'],
  ['Learn', 'Get an explanation in your language.'],
  ['Test', 'Answer 3 questions and get a revision card.'],
];

export default function UploadZone({ language, level, onOptions, onStart, onError }) {
  const [image, setImage] = useState(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  async function take(file) {
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      onError(e);
    }
  }

  // Paste from clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
      if (file) take(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const onDrop = (e) => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer.files[0]) take(e.dataTransfer.files[0]);
  };

  return (
    <section className="rise text-center">
      <h1 className="headline text-5xl sm:text-6xl">Turn any diagram into a lesson.</h1>
      <p className="mx-auto mt-5 max-w-[34rem] text-lg text-muted">
        Snap a diagram from your textbook. Learn it in English, తెలుగు or हिन्दी.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`card mt-10 border-2 border-dashed p-6 transition-colors sm:p-10 ${over ? 'border-accent bg-accent-soft' : ''}`}
      >
        {image ? (
          <img src={image.previewUrl} alt="Your diagram preview" className="mx-auto max-h-72 rounded-2xl" />
        ) : (
          <div className="py-8">
            <div aria-hidden className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-2xl text-accent">↑</div>
            <p className="text-xl font-light">Drop a diagram here</p>
            <p className="mt-1 text-sm text-muted">or paste from your clipboard</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" aria-label="Choose a diagram image" onChange={(e) => e.target.files[0] && take(e.target.files[0])} />
        <button onClick={() => inputRef.current.click()} className="btn-ghost mt-4">
          {image ? 'Choose a different image' : 'Choose file'}
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <OptionPills label="Language" options={LANGUAGES} value={language} onChange={(v) => onOptions({ language: v })} />
        <OptionPills label="Level" options={LEVELS} value={level} onChange={(v) => onOptions({ level: v })} />
      </div>

      <button disabled={!image} onClick={() => onStart(image)} className="btn-primary mt-8 text-lg">
        Start learning
      </button>

      <SampleChips onPick={(sample) => onStart({ sampleId: sample.id, previewUrl: sample.image, base64: null, mimeType: null })} />

      <ol className="mt-20 grid gap-6 text-left sm:grid-cols-3">
        {STEPS.map(([t, d], i) => (
          <li key={t}>
            <span className="text-sm font-semibold text-accent">0{i + 1}</span>
            <h2 className="text-xl font-light tracking-tight">{t}</h2>
            <p className="text-sm text-muted">{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
