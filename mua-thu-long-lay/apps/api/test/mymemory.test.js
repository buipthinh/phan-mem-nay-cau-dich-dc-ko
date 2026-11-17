import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyGlossary, splitText, translateText } from '../src/mymemory.js';

const terms = [
  { term_vi: 'cốm', translations: { en: 'com (green rice flakes)' } },
  { term_vi: 'tranh Đông Hồ', translations: { en: 'Dong Ho folk painting' } },
  { term_vi: 'tranh', translations: { en: 'picture' } },
];

test('thuật ngữ được thay nguyên từ, không phân biệt hoa thường, từ dài thay trước', () => {
  assert.equal(applyGlossary('Cốm làng Vòng và tranh Đông Hồ', terms, 'en'), 'com (green rice flakes) làng Vòng và Dong Ho folk painting');
  assert.equal(applyGlossary('cốmx không đổi', terms, 'en'), 'cốmx không đổi');
  assert.equal(applyGlossary('cốm', terms, 'ko'), 'cốm', 'ngôn ngữ chưa có thuật ngữ thì giữ nguyên');
});

test('đoạn dài được cắt thành các phần không quá giới hạn, cắt ở cuối câu', () => {
  const text = 'Câu một rất dài. '.repeat(40);
  const parts = splitText(text, 100);
  assert.ok(parts.every((p) => p.length <= 100));
  assert.ok(parts.every((p) => p.endsWith('.')));
  assert.equal(parts.join(' '), text.trim());
});

test('gọi MyMemory đúng cặp ngôn ngữ và ghép kết quả', async () => {
  const urls = [];
  const fakeFetch = async (url) => {
    urls.push(new URL(url));
    return { status: 200, json: async () => ({ responseStatus: 200, responseData: { translatedText: 'Hello' } }) };
  };
  assert.equal(await translateText('Xin chào', 'zh', [], fakeFetch), 'Hello');
  assert.equal(urls[0].searchParams.get('langpair'), 'vi|zh-CN');
  assert.equal(urls[0].searchParams.get('q'), 'Xin chào');
});

test('hết lượt dịch miễn phí thì báo lỗi dễ hiểu', async () => {
  const fakeFetch = async () => ({
    status: 200,
    json: async () => ({
      responseStatus: 429,
      responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY' },
    }),
  });
  await assert.rejects(translateText('Xin chào', 'en', [], fakeFetch), /hết lượt dịch miễn phí/);
});
