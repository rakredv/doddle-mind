export default function Skeleton({ label, image }) {
  return (
    <section className="rise" role="status" aria-live="polite">
      <p className="text-center text-lg font-light text-muted">{label}</p>
      {image?.previewUrl && <img src={image.previewUrl} alt="" className="mx-auto mt-6 max-h-40 rounded-2xl opacity-80" />}
      <div className="mt-8 space-y-3">
        <div className="shimmer h-9 w-2/3" />
        <div className="shimmer h-4 w-full" />
        <div className="shimmer h-4 w-11/12" />
        <div className="shimmer h-4 w-3/4" />
        <div className="shimmer mt-6 h-24 w-full" />
      </div>
    </section>
  );
}
