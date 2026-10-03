import { ERROR_MESSAGES } from '../lib/i18n.js';

export default function ErrorBanner({ error, onDismiss }) {
  // Blocked images are shown on the upload card itself.
  if (!error || error.code === 'unsafe_image') return null;
  const message = ERROR_MESSAGES[error.code] ?? error.message ?? 'Something went wrong.';
  return (
    <div role="alert" className="rise card mb-6 flex items-center justify-between gap-4 !border-bad/40 px-5 py-4">
      <p className="text-sm text-bad">{message}</p>
      <button onClick={onDismiss} className="btn-ghost text-sm">Dismiss</button>
    </div>
  );
}
