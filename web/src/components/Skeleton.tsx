export function Skeleton() {
  return (
    <div className="skeleton" aria-busy="true">
      {[100, 80, 88, 44].map((w, i) => <span key={i} style={{ width: `${w}%` }} />)}
      <div className="answer__status">ждём ответ…</div>
    </div>
  );
}
