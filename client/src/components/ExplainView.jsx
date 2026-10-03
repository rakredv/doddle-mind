import OptionPills from './OptionPills.jsx';
import PartsList from './PartsList.jsx';
import { LANGUAGES } from '../lib/i18n.js';

export default function ExplainView({ lesson, image, language, onLanguage, onNext }) {
  return (
    <section className="rise">
      <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">{lesson.diagramType}</span>
      <h1 className="headline mt-4 text-4xl sm:text-5xl">{lesson.title}</h1>

      {image?.previewUrl && <img src={image.previewUrl} alt={lesson.title} className="card mt-8 max-h-80 w-full object-contain p-2" />}

      <div className="mt-8">
        <OptionPills label="Language" options={LANGUAGES} value={language} onChange={onLanguage} />
      </div>

      <p className="mt-8 text-lg leading-8">{lesson.explanation}</p>
      <PartsList parts={lesson.parts} />

      <button onClick={onNext} className="btn-primary mt-10 text-lg">Test me</button>
    </section>
  );
}
