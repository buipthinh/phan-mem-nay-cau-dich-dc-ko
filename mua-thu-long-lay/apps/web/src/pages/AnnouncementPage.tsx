import { useStore } from '../lib/store';

const PRESETS = [
  'Trời đang mưa: các suất diễn chuyển vào nhà bạt cạnh Quảng trường Lá Phong.',
  'Suất diễn tối lùi 30 phút do thời tiết.',
  'Có trẻ đi lạc tại khu trò chơi, phụ huynh vui lòng tới điểm thông tin ở cổng chính.',
];

export function AnnouncementPage() {
  const { data, setAnnouncement } = useStore();
  const a = data.announcement;

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">Phương án thời tiết và tình huống khẩn</span>
        <h1>Thông báo cho khách</h1>
        <p className="hint">Thông báo đang bật sẽ hiện thành dải màu ở đầu app của mọi khách và gửi thông báo đẩy.</p>
      </header>
      <section className="card form">
        <label className="label" htmlFor="ann-text">
          Nội dung (tiếng Việt, app tự dịch cho khách)
        </label>
        <textarea id="ann-text" rows={3} value={a.text} onChange={(e) => setAnnouncement({ ...a, text: e.target.value })} />
        <div className="row tight wrap">
          {PRESETS.map((p) => (
            <button key={p} className="chip-btn" onClick={() => setAnnouncement({ ...a, text: p })}>
              {p.split(':')[0].slice(0, 40)}
            </button>
          ))}
        </div>
        <div className="row between">
          <span className={`badge ${a.active ? 'st-approved' : 'st-missing'}`}>{a.active ? 'Đang phát' : 'Đang tắt'}</span>
          <button
            className={`btn ${a.active ? '' : 'primary'}`}
            onClick={() => setAnnouncement({ ...a, active: !a.active })}
            disabled={!a.text.trim()}
          >
            {a.active ? 'Tắt thông báo' : 'Phát thông báo'}
          </button>
        </div>
      </section>
    </div>
  );
}
