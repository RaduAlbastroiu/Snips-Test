import { useCallback, useMemo } from "react";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import useStore from "../store/use-store";
import { timeMsToUnits, unitsToTimeMs } from "../utils/timeline";
import { TIMELINE_OFFSET_CANVAS_LEFT } from "../constants/constants";
import { useTimelineOffsetX } from "../hooks/use-timeline-offset";

const SelectionTimelineOverlay = ({ scrollLeft }: { scrollLeft: number }) => {
  const timelineOffsetX = useTimelineOffsetX();
  const setSelectionIntervals = useStore((state) => state.setSelectionIntervals);
  const selectionIntervals = useStore((state) => state.selectionIntervals);
  const scale = useStore((state) => state.scale);
  const duration = useStore((state) => state.duration);

  const handleDragStart = useCallback(
    (
    event:
      | ReactMouseEvent<HTMLDivElement, MouseEvent>
      | ReactTouchEvent<HTMLDivElement>,
      intervalId: string,
      edge: "start" | "end"
    ) => {
      event.preventDefault();
      event.stopPropagation();

      const initialIntervals = useStore.getState().selectionIntervals;
      const targetInterval = initialIntervals.find(
        (interval) => interval.id === intervalId
      );
      if (!targetInterval) {
        return;
      }

      const startClientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;

      const onPointerMove = (moveEvent: MouseEvent | TouchEvent) => {
        if ("preventDefault" in moveEvent) {
          moveEvent.preventDefault();
        }
        const clientX =
          "touches" in moveEvent
            ? moveEvent.touches[0].clientX
            : "changedTouches" in moveEvent
            ? moveEvent.changedTouches[0].clientX
            : (moveEvent as MouseEvent).clientX;
        const deltaPx = clientX - startClientX;
        const deltaMs = unitsToTimeMs(deltaPx, scale.zoom);

        const minDuration = 100; // ensure at least 100 ms duration

        setSelectionIntervals((previous) =>
          previous.map((interval) => {
            if (interval.id !== intervalId) {
              return interval;
            }

            let nextStart = interval.startMs;
            let nextEnd = interval.endMs;

            if (edge === "start") {
            nextStart = Math.min(
              Math.max(targetInterval.startMs + deltaMs, 0),
              interval.endMs - minDuration
            );
            } else {
            nextEnd = Math.max(
              Math.min(targetInterval.endMs + deltaMs, duration),
              nextStart + minDuration
            );
            }

            return {
              ...interval,
              startMs: Math.round(nextStart),
              endMs: Math.round(nextEnd)
            };
          })
        );
      };

      const onPointerUp = () => {
        document.removeEventListener("mousemove", onPointerMove);
        document.removeEventListener("mouseup", onPointerUp);
        document.removeEventListener("touchmove", onPointerMove as any);
        document.removeEventListener("touchend", onPointerUp);
      };

      document.addEventListener("mousemove", onPointerMove);
      document.addEventListener("mouseup", onPointerUp);
      document.addEventListener(
        "touchmove",
        onPointerMove as unknown as EventListener,
        {
          passive: false
        }
      );
      document.addEventListener("touchend", onPointerUp);
    },
    [scale.zoom, setSelectionIntervals, duration]
  );

  const segments = useMemo(() => {
    if (!selectionIntervals.length) {
      return [];
    }

    return selectionIntervals
      .filter(({ startMs, endMs }) => endMs > startMs)
      .map(({ id, startMs, endMs, label }) => {
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
          width,
          interval: { id, startMs, endMs, label }
        };
      })
      .filter(({ width }) => width > 0);
  }, [selectionIntervals, scale.zoom, scrollLeft, timelineOffsetX]);

  if (!segments.length) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-[5]">
      {segments.map(({ id, left, width, interval }) => (
        <div
          key={id}
          className="absolute top-0 h-full rounded-sm bg-emerald-500/15 border border-emerald-400/40"
          style={{
            left,
            width
          }}
        >
          <div
            className="group absolute top-0 left-0 h-full w-2 cursor-col-resize"
              onMouseDown={(e) => handleDragStart(e, interval.id, "start")}
              onTouchStart={(e) => handleDragStart(e, interval.id, "start")}
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400/80 opacity-0 group-hover:opacity-100" />
          </div>
          <div
            className="group absolute top-0 right-0 h-full w-2 cursor-col-resize"
              onMouseDown={(e) => handleDragStart(e, interval.id, "end")}
              onTouchStart={(e) => handleDragStart(e, interval.id, "end")}
          >
            <div className="absolute inset-y-0 right-0 w-1 bg-emerald-400/80 opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SelectionTimelineOverlay;

