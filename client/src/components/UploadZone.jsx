import { useEffect, useRef, useState } from 'react';
import OptionPills from './OptionPills.jsx';
import SampleChips from './SampleChips.jsx';
import { prepareImage, ACCEPT } from '../lib/image.js';
import { LANGUAGES, LEVELS, UNSAFE_TITLES } from '../lib/i18n.js';

const STEPS = [
  ['Snap', 'Upload a photo of any diagram.'],
  ['Learn', 'Get an explanation in your language.'],
  ['Test', 'Practise with questions, flash cards or a quiz.'],
];

export default function UploadZone({ language, level, image: kept, error, onOptions, onStart }) {
  const [image, setImage] = useState(kept?.base64 ? kept : null);
  const [fileError, setFileError] = useState(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  // A blocked image stays visible, flagged, until the student replaces it.
  const blocked = error?.code === 'unsafe_image' && image === kept ? error : null;
  const problem = blocked
    ? { title: UNSAFE_TITLES[blocked.category] ?? 'Image can not be used', message: blocked.message }
    : fileError && { title: 'This file can not be used', message: fileError };

  async function take(file) {
    try {
      const prepared = await prepareImage(file);
      setFileError(null);
      setImage(prepared);
      if (error) onOptions({ error: null });
    } catch (e) {
      setFileError(e.message);
    }
  }

  // Paste from clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e) => {
      const file = [...(e.clipboardData?.files ?? [])][0];
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
        className={`card mt-10 border-2 border-dashed p-6 transition-colors sm:p-10 ${
          problem ? '!border-bad bg-bad/5' : over ? 'border-accent bg-accent-soft' : ''
        }`}
      >
        {image ? (
          <img src={image.previewUrl} alt="Your diagram preview" className={`mx-auto max-h-72 rounded-2xl ${blocked ? 'opacity-60' : ''}`} />
        ) : (
          <div className="py-8">
            <div aria-hidden className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-2xl text-accent">↑</div>
            <p className="text-xl font-light">Drop a diagram here</p>
            <p className="mt-1 text-sm text-muted">JPEG, PNG or WebP, or paste from your clipboard</p>
          </div>
        )}

        {problem && (
          <div role="alert" className="mx-auto mt-5 max-w-md rounded-2xl border border-bad/40 bg-bad/10 px-4 py-3 text-left">
            <p className="flex items-center gap-2 font-semibold text-bad"><span aria-hidden>⚠</span>{problem.title}</p>
            <p className="mt-1 text-sm">{problem.message}</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-label="Choose a diagram image"
          onChange={(e) => {
            if (e.target.files[0]) take(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <button onClick={() => inputRef.current.click()} className="btn-ghost mt-4">
          {image ? 'Choose a different image' : 'Choose file'}
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <OptionPills label="Language" options={LANGUAGES} value={language} onChange={(v) => onOptions({ language: v })} />
        <OptionPills label="Level" options={LEVELS} value={level} onChange={(v) => onOptions({ level: v })} />
      </div>

      <button disabled={!image || Boolean(blocked)} onClick={() => onStart(image)} className="btn-primary mt-8 text-lg">
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
