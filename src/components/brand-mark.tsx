export function BrandMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="11" width="26" height="26" rx="9" fill="#f2f1ef" stroke="#e7e5e2" strokeWidth="1" />
      <rect x="11" y="3" width="26" height="26" rx="9" fill="#a8481f" />
    </svg>
  );
}
