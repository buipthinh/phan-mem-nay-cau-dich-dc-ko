/** Ô vuông màu ghi mã gian (F1, G3...), giống tấm biển treo ở gian hàng. */
export function StallCode({ id, color, size = 44 }: { id: string; color: string; size?: number }) {
  return (
    <span className="stall-code" style={{ background: color, width: size, height: size, fontSize: size * 0.34 }}>
      {id}
    </span>
  );
}
