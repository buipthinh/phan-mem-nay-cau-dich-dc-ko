import { festival } from '@mtll/shared';
import { useStore } from '../lib/store';

const SLOT_LABEL = { morning: 'Sáng', noon: 'Trưa', afternoon: 'Chiều', evening: 'Tối' } as const;

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export function SchedulePage() {
  const { data, updateShow } = useStore();
  const lo = toMin(festival.opens);
  const hi = toMin(festival.closes);
  const pct = (t: string) => ((toMin(t) - lo) / (hi - lo)) * 100;
  const ticks = Array.from({ length: (hi - lo) / 120 + 1 }, (_, i) => lo / 60 + i * 2);

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">Sân khấu Trăng Thu · lặp lại mỗi ngày lễ hội</span>
        <h1>Lịch biểu diễn</h1>
        <p className="hint">App khách gửi thông báo nhắc trước mỗi suất 15 phút. Đổi giờ ở đây thì lịch nhắc trong app cập nhật theo.</p>
      </header>

      <section className="card">
        <div className="day" aria-hidden>
          {data.shows.map((s) => (
            <div
              key={s.id}
              className="blk"
              style={{ left: `${pct(s.start)}%`, width: `${pct(s.end) - pct(s.start)}%` }}
              title={s.name.vi}
            />
          ))}
        </div>
        <div className="ticks" aria-hidden>
          {ticks.map((h) => (
            <span key={h} style={{ left: `${((h * 60 - lo) / (hi - lo)) * 100}%` }}>
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>
      </section>

      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Buổi</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Tên tiết mục</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {data.shows.map((s) => {
              const invalid = toMin(s.end) <= toMin(s.start);
              return (
                <tr key={s.id}>
                  <td>{SLOT_LABEL[s.slot]}</td>
                  <td>
                    <label className="sr-only" htmlFor={`start-${s.id}`}>
                      Giờ bắt đầu {s.name.vi}
                    </label>
                    <input id={`start-${s.id}`} type="time" value={s.start} onChange={(e) => updateShow({ ...s, start: e.target.value })} />
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`end-${s.id}`}>
                      Giờ kết thúc {s.name.vi}
                    </label>
                    <input
                      id={`end-${s.id}`}
                      type="time"
                      value={s.end}
                      aria-invalid={invalid}
                      onChange={(e) => updateShow({ ...s, end: e.target.value })}
                    />
                    {invalid && <span className="error small">Phải sau giờ bắt đầu</span>}
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`name-${s.id}`}>
                      Tên tiết mục
                    </label>
                    <input
                      id={`name-${s.id}`}
                      value={s.name.vi}
                      onChange={(e) => updateShow({ ...s, name: { ...s.name, vi: e.target.value } })}
                    />
                  </td>
                  <td className="muted">{s.description.vi}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
