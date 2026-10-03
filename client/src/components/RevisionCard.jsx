export default function RevisionCard({ title, terms, image, onRestart }) {
  return (
    <section className="rise">
      <div className="print-area card p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Revision card</p>
        <h1 className="headline mt-2 text-4xl">{title}</h1>
        {image?.previewUrl && <img src={image.previewUrl} alt="" className="mt-6 max-h-48 rounded-xl" />}
        <table className="mt-6 w-full text-left">
          <thead>
            <tr className="border-b border-line text-sm text-muted">
              <th className="py-2 pr-4 font-medium">Term</th>
              <th className="py-2 font-medium">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.term} className="border-b border-line align-top">
                <td className="py-3 pr-4 font-semibold">{t.term}</td>
                <td className="py-3">{t.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 text-xs text-muted">Made with Doodle Mind</p>
      </div>

      <div className="no-print mt-8 flex flex-wrap gap-3">
        <button onClick={() => window.print()} className="btn-primary text-lg">Print card</button>
        <button onClick={onRestart} className="btn-ghost text-lg">Try another diagram</button>
      </div>
    </section>
  );
}
