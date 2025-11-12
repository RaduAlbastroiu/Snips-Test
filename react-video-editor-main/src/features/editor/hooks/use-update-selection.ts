import { useState, useCallback } from "react";
import { API_ENDPOINTS } from "@/constants/api";
import { SelectionInterval } from "../store/use-store";

type EpisodeRange = {
  start: number;
  end: number;
};

type SelectionPayload = {
  name: string;
  episodes: Record<string, EpisodeRange>;
  id: string;
};

export const useUpdateSelection = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateSelection = useCallback(
    async (
      selection: SelectionPayload,
      intervals: SelectionInterval[],
      onSuccess?: (updatedSelection: SelectionPayload) => void
    ) => {
      const episodesPayload = intervals.reduce<Record<string, EpisodeRange>>(
        (acc, interval) => {
          if (interval.serverSelectionId !== selection.id) {
            return acc;
          }
          const prefix = `${selection.id}-`;
          if (!interval.id.startsWith(prefix)) {
            return acc;
          }
          const episodeName = interval.id.slice(prefix.length);
          const originalRange = selection.episodes[episodeName];
          const originalStartMs = Math.round(originalRange?.start * 1000);
          const originalEndMs = Math.round(originalRange?.end * 1000);
          const nextStartMs = Math.round(interval.startMs);
          const nextEndMs = Math.round(interval.endMs);

          if (nextStartMs === originalStartMs && nextEndMs === originalEndMs) {
            return acc;
          }

          acc[episodeName] = {
            start: Math.round(interval.startMs / 1000),
            end: Math.round(interval.endMs / 1000),
          };
          return acc;
        },
        {}
      );

      if (!Object.keys(episodesPayload).length) {
        return;
      }

      console.log("episodes", episodesPayload);

      setIsUpdating(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_ENDPOINTS.SELECTIONS}/${selection.id}/addEpisode`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(episodesPayload),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update selection (${response.status})`);
        }

        const updated = await response.json();
        onSuccess?.(updated);
      } catch (err) {
        const errorInstance =
          err instanceof Error ? err : new Error(String(err));
        setError(errorInstance);
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return { isUpdating, error, updateSelection };
};
