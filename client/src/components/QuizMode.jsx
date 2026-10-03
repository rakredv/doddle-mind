import { useState } from 'react';
import ScoreRing from './ScoreRing.jsx';

export default function QuizMode({ questions }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[i];
  const answered = picked !== null;

  function choose(n) {
    if (answered) return;
    setPicked(n);
    if (n === q.answerIndex) setScore((s) => s + 1);
  }

  function next() {
    if (i + 1 === questions.length) return setDone(true);
    setI(i + 1);
    setPicked(null);
  }

  function restart() {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="rise text-center">
        <ScoreRing score={score} total={questions.length} />
        <p className="mt-6 text-xl font-light">
          {score === questions.length ? 'Perfect score!' : score >= questions.length / 2 ? 'Nice work. A little more revision and you have it.' : 'Good start. Read the explanation again and retry.'}
        </p>
        <button onClick={restart} className="btn-primary mt-6">Try again</button>
      </div>
    );
  }

  return (
    <div className="rise" key={q.id}>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full bg-accent transition-all" style={{ width: `${(i / questions.length) * 100}%` }} />
      </div>
      <p className="text-sm text-muted">Question {i + 1} of {questions.length}</p>
      <h2 className="mt-2 text-2xl font-light leading-9">{q.text}</h2>

      <div role="group" aria-label="Answer options" className="mt-6 space-y-3">
        {q.options.map((opt, n) => {
          const isAnswer = n === q.answerIndex;
          const state = !answered ? '' : isAnswer ? '!border-good bg-good/10' : n === picked ? '!border-bad bg-bad/10' : 'opacity-50';
          return (
            <button
              key={opt}
              onClick={() => choose(n)}
              disabled={answered}
              aria-pressed={n === picked}
              className={`card flex w-full items-center gap-3 px-5 py-4 text-left transition-colors ${answered ? '' : 'hover:border-accent'} ${state}`}
            >
              <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-sm text-muted">
                {answered && isAnswer ? '✓' : answered && n === picked ? '✕' : 'ABCD'[n]}
              </span>
              <span className="flex-1">{opt}</span>
              {answered && isAnswer && <span className="text-sm font-semibold text-good">Correct</span>}
              {answered && n === picked && !isAnswer && <span className="text-sm font-semibold text-bad">Not quite</span>}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {answered && (
          <p className="rise card mt-5 bg-accent-soft px-5 py-4 text-sm">{q.explanation}</p>
        )}
      </div>

      {answered && (
        <button onClick={next} className="btn-primary mt-6">{i + 1 === questions.length ? 'See results' : 'Next question'}</button>
      )}
    </div>
  );
}
