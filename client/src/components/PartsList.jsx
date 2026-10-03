export default function PartsList({ parts }) {
  return (
    <dl className="card mt-8 divide-y divide-line overflow-hidden">
      {parts.map((p) => (
        <div key={p.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="font-semibold">{p.label}</dt>
          <dd className="text-muted">{p.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}
