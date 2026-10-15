// Supabase Edge Function "translate": web quản trị gọi hàm này khi bấm "Dịch tự động".
// Nhận { text, source, target }, trả về { translatedText }.
// Khoá API nằm ở server, không lộ ra trình duyệt:  supabase secrets set GOOGLE_TRANSLATE_API_KEY=...
// Deploy:  supabase functions deploy translate

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const { text, source = 'vi', target } = await req.json().catch(() => ({}));
  if (typeof text !== 'string' || !text.trim() || typeof target !== 'string') {
    return Response.json({ error: 'Cần có text và target.' }, { status: 400, headers: CORS });
  }

  const key = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
  if (!key) return Response.json({ error: 'Chưa cấu hình GOOGLE_TRANSLATE_API_KEY.' }, { status: 500, headers: CORS });

  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source, target: target === 'zh' ? 'zh-CN' : target, format: 'text' }),
  });
  if (!res.ok) return Response.json({ error: `Dịch vụ dịch trả lỗi ${res.status}.` }, { status: 502, headers: CORS });

  const body = await res.json();
  return Response.json({ translatedText: body.data.translations[0].translatedText }, { headers: CORS });
});
