import { api } from './api';
import type { Target } from './points';

/** Một thuật ngữ: từ tiếng Việt và cách dịch cố định sang từng ngôn ngữ. */
export interface GlossaryTerm {
  id: number;
  term_vi: string;
  note: string | null;
  updated_at?: string;
  translations: Partial<Record<Target, string>>;
}

const STORAGE_KEY = 'mtll-glossary-v1';

/** Thuật ngữ mẫu, giống phần dữ liệu mẫu trong database/MuaThuLongLay.sql. */
const SEED: GlossaryTerm[] = [
  ['Mùa thu lộng lẫy', 'Splendid Autumn', '灿烂金秋', '찬란한 가을', '華やかな秋', 'Prächtiger Herbst', 'Tên lễ hội'],
  ['cốm', 'com (green rice flakes)', '青米片', '꼼(풋쌀)', 'コム（青米）', 'Com (grüne Reisflocken)', 'Đặc sản mùa thu Hà Nội'],
  ['áo dài', 'ao dai', '奥黛', '아오자이', 'アオザイ', 'Ao Dai', null],
  ['tranh Đông Hồ', 'Dong Ho folk painting', '东湖民间画', '동호 민화', 'ドンホー版画', 'Dong-Ho-Volksbild', null],
  ['múa lân', 'lion dance', '舞狮', '사자춤', '獅子舞', 'Löwentanz', null],
  ['gian hàng', 'stall', '摊位', '부스', '屋台', 'Stand', null],
].map(
  ([term_vi, en, zh, ko, ja, de, note], i) =>
    ({ id: i + 1, term_vi: term_vi!, note, translations: { en, zh, ko, ja, de } }) as GlossaryTerm,
);

/** Chế độ demo (không có API): thuật ngữ lưu trong trình duyệt. */
function loadLocal(): GlossaryTerm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GlossaryTerm[];
  } catch {
    /* dùng dữ liệu mẫu */
  }
  return SEED;
}
function saveLocal(terms: GlossaryTerm[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
  } catch {
    /* bỏ qua */
  }
}

export async function listTerms(token: string | null): Promise<GlossaryTerm[]> {
  if (!token) return loadLocal();
  return api<GlossaryTerm[]>('/glossary', { token });
}

/** Thêm (id = 0) hoặc sửa một thuật ngữ. */
export async function saveTerm(token: string | null, term: GlossaryTerm) {
  if (!token) {
    const terms = loadLocal();
    if (terms.some((t) => t.id !== term.id && t.term_vi.toLowerCase() === term.term_vi.trim().toLowerCase())) {
      throw new Error('Thuật ngữ này đã có rồi');
    }
    const now = new Date().toISOString();
    const next = term.id
      ? terms.map((t) => (t.id === term.id ? { ...term, updated_at: now } : t))
      : [...terms, { ...term, id: Math.max(0, ...terms.map((t) => t.id)) + 1, updated_at: now }];
    saveLocal(next);
    return;
  }
  const body = { term_vi: term.term_vi, note: term.note, translations: term.translations };
  if (term.id) await api(`/glossary/${term.id}`, { method: 'PUT', token, body });
  else await api('/glossary', { method: 'POST', token, body });
}

export async function deleteTerm(token: string | null, id: number) {
  if (!token) {
    saveLocal(loadLocal().filter((t) => t.id !== id));
    return;
  }
  await api(`/glossary/${id}`, { method: 'DELETE', token });
}
