import { useReducer, useEffect } from 'react';
import Header from './components/Header.jsx';
import UploadZone from './components/UploadZone.jsx';
import Skeleton from './components/Skeleton.jsx';
import ExplainView from './components/ExplainView.jsx';
import QuizView from './components/QuizView.jsx';
import ResultsView from './components/ResultsView.jsx';
import RevisionCard from './components/RevisionCard.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import { explain, check } from './lib/api.js';

const initial = {
  stage: 'upload', // upload | explaining | explain | quiz | checking | results | card
  image: null,
  language: 'en',
  level: 'kid',
  lesson: null,
  answers: {},
  review: null,
  error: null,
};

function reducer(s, a) {
  switch (a.type) {
    case 'set':
      return { ...s, ...a.patch };
    case 'answer':
      return { ...s, answers: { ...s.answers, [a.id]: a.text } };
    case 'reset':
      return { ...initial, language: s.language, level: s.level };
    default:
      return s;
  }
}

export default function App() {
  const [s, dispatch] = useReducer(reducer, initial);
  const set = (patch) => dispatch({ type: 'set', patch });

  // Scroll to top whenever the stage changes.
  useEffect(() => window.scrollTo({ top: 0 }), [s.stage]);

  async function runExplain(image = s.image, language = s.language, level = s.level) {
    set({ image, language, level, stage: 'explaining', error: null });
    try {
      const lesson = await explain({ image, language, level });
      set({ lesson, answers: {}, review: null, stage: 'explain' });
    } catch (e) {
      set({ stage: 'upload', error: e });
    }
  }

  async function runCheck() {
    set({ stage: 'checking', error: null });
    const questions = s.lesson.questions.map(({ id, text }) => ({ id, text }));
    const answers = questions.map((q) => ({ id: q.id, text: s.answers[q.id] ?? '' }));
    const { title, parts, explanation } = s.lesson;
    try {
      const review = await check({
        image: s.image,
        context: { title, parts, explanation },
        questions,
        answers,
        language: s.language,
      });
      set({ review, stage: 'results' });
    } catch (e) {
      set({ stage: 'quiz', error: e });
    }
  }

  return (
    <div className="min-h-screen">
      <Header onHome={() => dispatch({ type: 'reset' })} showHome={s.stage !== 'upload'} />
      <main className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-8 sm:pt-14">
        <ErrorBanner error={s.error} onDismiss={() => set({ error: null })} />

        {s.stage === 'upload' && (
          <UploadZone
            language={s.language}
            level={s.level}
            onOptions={set}
            onStart={(image) => runExplain(image)}
            onError={(error) => set({ error })}
          />
        )}

        {s.stage === 'explaining' && <Skeleton label="Reading your diagram…" image={s.image} />}

        {s.stage === 'explain' && (
          <ExplainView
            lesson={s.lesson}
            image={s.image}
            language={s.language}
            onLanguage={(language) => runExplain(s.image, language, s.level)}
            onNext={() => set({ stage: 'quiz' })}
          />
        )}

        {s.stage === 'quiz' && (
          <QuizView
            questions={s.lesson.questions}
            answers={s.answers}
            onAnswer={(id, text) => dispatch({ type: 'answer', id, text })}
            onSubmit={runCheck}
          />
        )}

        {s.stage === 'checking' && <Skeleton label="Marking your answers…" />}

        {s.stage === 'results' && (
          <ResultsView
            questions={s.lesson.questions}
            answers={s.answers}
            review={s.review}
            onNext={() => set({ stage: 'card' })}
          />
        )}

        {s.stage === 'card' && (
          <RevisionCard
            title={s.lesson.title}
            terms={s.review.revisionCard}
            image={s.image}
            onRestart={() => dispatch({ type: 'reset' })}
          />
        )}
      </main>
    </div>
  );
}
