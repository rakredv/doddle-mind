const MAX_EDGE = 1600;
const MAX_BYTES = 10 * 1024 * 1024;

const badImage = (msg) => Object.assign(new Error(msg), { code: 'bad_image' });

export async function prepareImage(file) {
  if (!file || !file.type.startsWith('image/')) throw badImage('Not an image');
  if (file.size > MAX_BYTES) throw badImage('Image too large');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw badImage('Unreadable image');
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
