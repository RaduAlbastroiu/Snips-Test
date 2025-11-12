import { useMemo } from "react";
import useStore from "../store/use-store";
import { timeMsToUnits } from "../utils/timeline";
import { TIMELINE_OFFSET_CANVAS_LEFT } from "../constants/constants";
import { useTimelineOffsetX } from "../hooks/use-timeline-offset";

const SelectionTimelineOverlay = ({ scrollLeft }: { scrollLeft: number }) => {
  const timelineOffsetX = useTimelineOffsetX();
  const selectionIntervals = useStore((state) => state.selectionIntervals);
  const scale = useStore((state) => state.scale);

  const segments = useMemo(() => {
    if (!selectionIntervals.length) {
      return [];
    }

    return selectionIntervals
      .filter(({ startMs, endMs }) => endMs > startMs)
      .map(({ id, startMs, endMs }) => {
        const startUnits = timeMsToUnits(startMs, scale.zoom);
        const endUnits = timeMsToUnits(endMs, scale.zoom);
        const width = endUnits - startUnits;
        const left =
          timelineOffsetX +
          TIMELINE_OFFSET_CANVAS_LEFT +
          startUnits -
          scrollLeft;

        return {
          id,
          left,
          width
        };
      })
      .filter(({ width }) => width > 0);
  }, [selectionIntervals, scale.zoom, scrollLeft, timelineOffsetX]);

  if (!segments.length) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {segments.map(({ id, left, width }) => (
        <div
          key={id}
          className="absolute top-0 h-full rounded-sm bg-emerald-500/15 border border-emerald-400/40"
          style={{
            left,
            width
          }}
        />
      ))}
    </div>
  );
};

export default SelectionTimelineOverlay;

