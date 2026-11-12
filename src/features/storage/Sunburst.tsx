import { useEffect, useRef, useState } from "react";
import type { StorageNode } from "../../types/system";

export const storageColors = [
  "#75a9df",
  "#70bca3",
  "#e9ab70",
  "#bb9fce",
  "#de9290",
  "#8daabc",
  "#c6bb83",
  "#9aafa1",
];
interface Slice {
  key: string;
  node: StorageNode;
  start: number;
  end: number;
  inner: number;
  outer: number;
  color: string;
  opacity: number;
  interactive: boolean;
}
export function layout(
  node: StorageNode,
  depth = 0,
  start = 0,
  end = Math.PI * 2 - 0.001,
  parentColor?: string,
): Slice[] {
  if (depth > 2 || node.size <= 0) return [];
  let cursor = start;
  return node.children.flatMap((child, i) => {
    const next = cursor + ((end - start) * child.size) / node.size;
    const color = parentColor ?? storageColors[i % storageColors.length];
    const shape: Slice = {
      key: `${child.path}#${child.name}`,
      node: child,
      start: cursor,
      end: next,
      inner: 92 + depth * 44,
      outer: 132 + depth * 44,
      color,
      opacity: 1 - depth * 0.16,
      interactive: true,
    };
    const nested = layout(child, depth + 1, cursor, next, color);
    cursor = next;
    return next - shape.start < 0.004 ? nested : [shape, ...nested];
  });
}
function point(radius: number, angle: number) {
  return [240 + radius * Math.sin(angle), 240 - radius * Math.cos(angle)];
}
function arc(s: Slice) {
  const a = point(s.outer, s.start),
    b = point(s.outer, s.end),
    c = point(s.inner, s.end),
    d = point(s.inner, s.start);
  const large = s.end - s.start > Math.PI ? 1 : 0;
  return `M${a} A${s.outer},${s.outer} 0 ${large} 1 ${b} L${c} A${s.inner},${s.inner} 0 ${large} 0 ${d} Z`;
}
function useSlices(root: StorageNode) {
  const [frames, setFrames] = useState<Slice[]>(() =>
    layout(root).map((s) => ({ ...s, inner: 90, outer: 90, opacity: 0 })),
  );
  const current = useRef(frames);
  useEffect(() => {
    const target = layout(root);
    const from = new Map(current.current.map((s) => [s.key, s]));
    const to = new Map(target.map((s) => [s.key, s]));
    const keys = new Set([...from.keys(), ...to.keys()]);
    const reduce =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off";
    const start = performance.now();
    let request: number;
    function frame(now: number) {
      const elapsed = reduce ? 1 : Math.min(1, (now - start) / 440);
      const eased = 1 - (1 - elapsed) ** 3;
      const next =
        elapsed === 1
          ? target
          : [...keys].map((key) => {
              const existing = from.get(key),
                destination = to.get(key);
              const a = existing ?? {
                ...destination!,
                inner: 90,
                outer: 90,
                opacity: 0,
              };
              const b = destination ?? {
                ...a,
                inner: 90,
                outer: 90,
                opacity: 0,
                interactive: false,
              };
              const mix = (x: number, y: number) => x + (y - x) * eased;
              return {
                ...b,
                start: mix(a.start, b.start),
                end: mix(a.end, b.end),
                inner: mix(a.inner, b.inner),
                outer: mix(a.outer, b.outer),
                opacity: mix(a.opacity, b.opacity),
              };
            });
      current.current = next;
      setFrames(next);
      if (elapsed < 1) request = requestAnimationFrame(frame);
    }
    request = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(request);
  }, [root]);
  return frames;
}
export function Sunburst({
  root,
  enter,
  hover,
  children,
}: {
  root: StorageNode;
  enter: (node: StorageNode) => void;
  hover: (node: StorageNode | null) => void;
  children: React.ReactNode;
}) {
  const shapes = useSlices(root);
  return (
    <svg
      className="sunburst"
      viewBox="0 0 480 480"
      role="group"
      aria-label="Mapa hierárquico de armazenamento"
    >
      {shapes.map((s) => (
        <path
          key={s.key}
          d={arc(s)}
          fill={s.color}
          opacity={s.opacity}
          stroke="var(--surface)"
          strokeWidth="2.5"
          style={{ pointerEvents: s.interactive ? "auto" : "none" }}
          tabIndex={s.interactive ? 0 : -1}
          aria-hidden={!s.interactive}
          role="button"
          aria-label={`${s.node.name}, ${s.node.size.toLocaleString("pt-BR")} bytes`}
          onMouseEnter={() => hover(s.node)}
          onMouseLeave={() => hover(null)}
          onFocus={() => hover(s.node)}
          onBlur={() => hover(null)}
          onClick={() => enter(s.node)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              enter(s.node);
            }
          }}
        >
          <title>
            {s.node.path} — {s.node.size.toLocaleString("pt-BR")} bytes
          </title>
        </path>
      ))}
      {children}
    </svg>
  );
}
