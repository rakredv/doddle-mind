import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sniffImageType } from '../src/imageType.js';

const b64 = (bytes) => Buffer.from(bytes).toString('base64');
const pad = (arr) => [...arr, ...new Array(24 - arr.length).fill(0)];

test('detects jpeg, png and webp from the header', () => {
  assert.equal(sniffImageType(b64(pad([0xff, 0xd8, 0xff, 0xe0]))), 'image/jpeg');
  assert.equal(sniffImageType(b64(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))), 'image/png');
  assert.equal(sniffImageType(b64(pad([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))), 'image/webp');
});

test('rejects pdf, gif and text', () => {
  assert.equal(sniffImageType(b64(Buffer.from('%PDF-1.7 hello world padding'))), null);
  assert.equal(sniffImageType(b64(Buffer.from('GIF89a hello world padding...'))), null);
  assert.equal(sniffImageType(b64(Buffer.from('just some plain text, nothing else'))), null);
});
