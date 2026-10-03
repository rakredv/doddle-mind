import { useReducer, useEffect } from 'react';
import Header from './components/Header.jsx';
import UploadZone from './components/UploadZone.jsx';
import Skeleton from './components/Skeleton.jsx';
import ExplainView from './components/ExplainView.jsx';
import PracticeView from './components/PracticeView.jsx';
import QuizView from './components/QuizView.jsx';
import ResultsView from './components/ResultsView.jsx';
import FlashCards from './components/FlashCards.jsx';
import QuizMode from './components/QuizMode.jsx';
import RevisionCard from './components/RevisionCard.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import { explain, check, flashcards, quiz } from './lib/api.js';

const initial = {
  stage: 'upload', // upload | explaining | explain | practice | card
  mode: 'written', // written | cards | quiz
  written: 'quiz', // quiz | checking | results
  image: null,
  language: 'en',
  level: 'kid',
  lesson: null,
  answers: {},
  review: null,
  cards: null,
  mcq: null,
  busy: false,
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

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [s.stage]);

  const context = () => {
    const { title, parts, explanation } = s.lesson;
    return { title, parts, explanation };
  };

  async function runExplain(image = s.image, language = s.language, level = s.level) {
    set({ image, language, level, stage: 'explaining', error: null });
    try {
      const lesson = await explain({ image, language, level });
      set({ lesson, answers: {}, review: null, cards: null, mcq: null, written: 'quiz', mode: 'written', stage: 'explain' });
    } catch (e) {
      set({ stage: 'upload', error: e });
    }
  }

  async function runCheck() {
    set({ written: 'checking', error: null });
    const questions = s.lesson.questions.map(({ id, text }) => ({ id, text }));
    const answers = questions.map((q) => ({ id: q.id, text: s.answers[q.id] ?? '' }));
    try {
      const review = await check({ image: s.image, context: context(), questions, answers, language: s.language });
      set({ review, written: 'results' });
    } catch (e) {
      set({ written: 'quiz', error: e });
    }
  }

  // Flash cards and quiz are generated the first time their tab opens, then cached.
  async function selectMode(mode) {
    set({ mode, error: null });
    const load = { cards: ['cards', flashcards], quiz: ['mcq', quiz] }[mode];
    if (!load || s[load[0]]) return;
    set({ busy: true });
    try {
      const data = await load[1]({ image: s.image, context: context(), language: s.language, level: s.level });
      set({ [load[0]]: data, busy: false });
    } catch (e) {
      set({ busy: false, error: e });
    }
  }

  const cardTerms = () => s.review?.revisionCard ?? s.lesson.parts.map((p) => ({ term: p.label, meaning: p.meaning }));

  function renderMode() {
    if (s.mode === 'written') {
      if (s.written === 'checking') return <Skeleton label="Marking your answers…" />;
      if (s.written === 'results') {
        return (
          <ResultsView
            questions={s.lesson.questions}
            answers={s.answers}
            review={s.review}
            onNext={() => set({ stage: 'card' })}
          />
        );
      }
      return (
        <QuizView
          questions={s.lesson.questions}
          answers={s.answers}
          onAnswer={(id, text) => dispatch({ type: 'answer', id, text })}
          onSubmit={runCheck}
        />
      );
    }
    const data = s.mode === 'cards' ? s.cards : s.mcq;
    if (s.busy || !data) {
      if (s.error) return <button onClick={() => selectMode(s.mode)} className="btn-primary">Try again</button>;
      return <Skeleton label={s.mode === 'cards' ? 'Making your flash cards…' : 'Writing your quiz…'} />;
    }
    return s.mode === 'cards' ? <FlashCards cards={data.cards} /> : <QuizMode questions={data.questions} />;
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
            image={s.image}
            error={s.error}
            onOptions={set}
            onStart={(image) => runExplain(image)}
          />
        )}

        {s.stage === 'explaining' && <Skeleton label="Checking and reading your diagram…" image={s.image} />}

        {s.stage === 'explain' && (
          <ExplainView
            lesson={s.lesson}
            image={s.image}
            language={s.language}
            onLanguage={(language) => runExplain(s.image, language, s.level)}
            onNext={() => set({ stage: 'practice' })}
          />
        )}

        {s.stage === 'practice' && (
          <PracticeView mode={s.mode} onMode={selectMode} onCard={() => set({ stage: 'card' })}>
            {renderMode()}
          </PracticeView>
        )}

        {s.stage === 'card' && (
          <RevisionCard
            title={s.lesson.title}
            terms={cardTerms()}
            image={s.image}
            onBack={() => set({ stage: 'practice' })}
            onRestart={() => dispatch({ type: 'reset' })}
          />
        )}
      </main>
    </div>
  );
}
