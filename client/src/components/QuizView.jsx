import QuestionCard from './QuestionCard.jsx';

export default function QuizView({ questions, answers, onAnswer, onSubmit }) {
  const done = questions.filter((q) => answers[q.id]?.trim()).length;
  return (
    <section className="rise">
      <p className="text-muted" aria-live="polite">Answer in your own words. {done} of {questions.length} answered.</p>

      <div className="mt-6 space-y-5">
        {questions.map((q, i) => (
          <QuestionCard key={q.id} index={i + 1} question={q} value={answers[q.id] ?? ''} onChange={(t) => onAnswer(q.id, t)} />
        ))}
      </div>

      <button onClick={onSubmit} disabled={done === 0} className="btn-primary mt-10 text-lg">Check answers</button>
    </section>
  );
}
