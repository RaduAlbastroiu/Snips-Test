import useStore from "../store/use-store";
import { useMemo } from "react";

const SelectionOverlay = () => {
  const selectionIntervals = useStore((state) => state.selectionIntervals);
  const duration = useStore((state) => state.duration);

  const gradient = useMemo(() => {
    if (!selectionIntervals.length || duration <= 0) {
      return null;
    }

    const shade = "rgba(17, 17, 17, 0.6)";
    const highlight = "rgba(17, 17, 17, 0)";

    const normalized = selectionIntervals
      .map(({ startMs, endMs, label }) => ({
        label,
        start: Math.max(0, Math.min(startMs, duration)),
        end: Math.max(0, Math.min(endMs, duration))
      }))
      .filter(({ start, end }) => end > start)
      .sort((a, b) => a.start - b.start)
      .reduce<{ start: number; end: number; label?: string }[]>(
        (acc, current) => {
          const last = acc[acc.length - 1];
          if (last && current.start <= last.end) {
            last.end = Math.max(last.end, current.end);
          } else {
            acc.push({ ...current });
          }
          return acc;
        },
        []
      );

    if (!normalized.length) {
      return null;
    }

    const stops: string[] = [];
    const pushRange = (color: string, start: number, end: number) => {
      const startPercent = (start / duration) * 100;
      const endPercent = (end / duration) * 100;
      stops.push(`${color} ${startPercent}%`, `${color} ${endPercent}%`);
    };

    let cursor = 0;
    normalized.forEach(({ start, end }) => {
      if (start > cursor) {
        pushRange(shade, cursor, start);
      }
      pushRange(highlight, start, end);
      cursor = end;
    });

    if (cursor < duration) {
      pushRange(shade, cursor, duration);
    }

    if (!stops.length) {
      return null;
    }

    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [selectionIntervals, duration]);

  if (!gradient) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[110] transition-opacity duration-200"
      style={{
        backgroundImage: gradient
      }}
    />
  );
};

export default SelectionOverlay;

