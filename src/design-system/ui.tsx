import { useEffect, useRef, type ReactNode } from "react";
import { X, LoaderCircle, CircleAlert } from "lucide-react";

export function Logo({ wordmark = false }: { wordmark?: boolean }) {
  return (
    <span className="logo">
      <svg
        viewBox="0 0 36 36"
        width="32"
        height="32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M28 8H16a9 9 0 0 0 0 18h4"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M8 28h12a9 9 0 0 0 0-18h-4"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".5"
        />
      </svg>
      {wordmark && (
        <span>
          Sweeply<span className="logo-dot">.</span>
        </span>
      )}
    </span>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <CircleAlert size={28} />
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Busy({ children }: { children: ReactNode }) {
  return (
    <div className="busy" role="status">
      <LoaderCircle className="spin" size={20} />
      {children}
    </div>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice" role="status">
      <CircleAlert size={17} />
      <span>{children}</span>
    </div>
  );
}
export function Dialog({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      aria-labelledby="dialog-title"
    >
      <header>
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Fechar diálogo"
          onClick={close}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Ring({
  value,
  label,
  color,
  detail,
}: {
  value: number | null;
  label: string;
  color: string;
  detail: string;
}) {
  const percent = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      className="metric"
      style={{ "--metric": color } as React.CSSProperties}
    >
      <div className="metric-ring">
        <svg viewBox="0 0 160 160" aria-hidden="true">
          <circle className="ring-track" cx="80" cy="80" r="65" />
          <circle
            className="ring-value"
            cx="80"
            cy="80"
            r="65"
            pathLength="100"
            strokeDasharray={`${percent} 100`}
            transform="rotate(-90 80 80)"
          />
        </svg>
        <strong>
          {value === null ? "—" : Math.round(percent)}
          {value !== null && <small>%</small>}
        </strong>
      </div>
      <h3>{label}</h3>
      <p>{detail}</p>
    </div>
  );
}
export function Sparkline({
  values,
  color,
  label,
}: {
  values: number[];
  color: string;
  label: string;
}) {
  return (
    <svg
      className="sparkline"
      viewBox="0 0 600 100"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <path d="M0 1H600M0 50H600M0 99H600" className="chart-grid" />
      {values.length > 1 && (
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          points={values
            .map(
              (v, i) =>
                `${(i / (values.length - 1)) * 600},${100 - Math.max(0, Math.min(100, v))}`,
            )
            .join(" ")}
        />
      )}
    </svg>
  );
}
