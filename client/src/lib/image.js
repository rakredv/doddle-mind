const MAX_EDGE = 1600;
const MAX_BYTES = 10 * 1024 * 1024;

export const ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
export const TYPE_MESSAGE = 'Only JPEG, PNG or WebP images are supported.';

const fail = (code, message) => Object.assign(new Error(message), { code });

// Reads the file header so a renamed PDF or text file can not pass as an image.
async function sniffType(file) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export async function prepareImage(file) {
  if (!file || !(await sniffType(file))) throw fail('bad_type', TYPE_MESSAGE);
  if (file.size > MAX_BYTES) throw fail('too_large', 'That image is larger than 10 MB. Please choose a smaller one.');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw fail('bad_image', "That image couldn't be read. Try a different file.");
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg', previewUrl: dataUrl, sampleId: null };
}
