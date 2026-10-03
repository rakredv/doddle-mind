export default function QuestionCard({ index, question, value, onChange }) {
  const id = `ans-${question.id}`;
  return (
    <div className="card p-5 sm:p-6">
      <label htmlFor={id} className="block text-lg font-light">
        <span className="mr-2 text-sm font-semibold text-accent">Q{index}</span>
        {question.text}
      </label>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer…"
        className="mt-3 w-full resize-y rounded-2xl border border-line bg-bg p-3 text-base"
      />
    </div>
  );
}
