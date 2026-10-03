import ScoreRing from './ScoreRing.jsx';
import VerdictBadge from './VerdictBadge.jsx';

export default function ResultsView({ questions, answers, review, onNext }) {
  return (
    <section className="rise">
      <ScoreRing score={review.score} total={questions.length} />

      <div className="mt-10 space-y-5">
        {questions.map((q, i) => {
          const r = review.results.find((x) => x.id === q.id);
          if (!r) return null;
          return (
            <article key={q.id} className="card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-light"><span className="mr-2 text-sm font-semibold text-accent">Q{i + 1}</span>{q.text}</h2>
                <VerdictBadge verdict={r.verdict} />
              </div>
              <p className="mt-3 text-sm text-muted">Your answer: {answers[q.id]?.trim() || '(blank)'}</p>
              <p className="mt-2">{r.feedback}</p>
            </article>
          );
        })}
      </div>

      <aside className="card mt-8 bg-accent-soft p-6">
        <p className="text-sm font-semibold text-accent">Challenge</p>
        <p className="mt-1 text-xl font-light">{review.challenge}</p>
      </aside>

      <button onClick={onNext} className="btn-primary mt-10 text-lg">Get revision card</button>
    </section>
  );
}
