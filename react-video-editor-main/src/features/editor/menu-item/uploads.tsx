/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useMemo, useState } from "react";
import { ADD_AUDIO, ADD_IMAGE, ADD_VIDEO } from "@designcombo/state";
import { dispatch } from "@designcombo/events";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Music,
  Image as ImageIcon,
  Video as VideoIcon,
  Loader2,
  UploadIcon,
} from "lucide-react";
import { generateId } from "@designcombo/timeline";
import { Button } from "@/components/ui/button";
import useUploadStore from "../store/use-upload-store";
import useStore, { SelectionInterval } from "../store/use-store";
import ModalUpload from "@/components/modal-upload";
import { API_ENDPOINTS } from "@/constants/api";
import { useUpdateSelection } from "../hooks/use-update-selection";

type SelectionEntry = {
  id: string;
  name: string;
  episodes: Record<string, { start: number; end: number }>;
};

export const Uploads = () => {
  const { setShowUploadModal, uploads, pendingUploads, activeUploads } =
    useUploadStore();

  const [selections, setSelections] = useState<SelectionEntry[]>([]);
  const selectedSelectionId = useStore((state) => state.selectedSelectionId);
  const setSelectedSelectionId = useStore(
    (state) => state.setSelectedSelectionId
  );
  const setSelectionIntervals = useStore(
    (state) => state.setSelectionIntervals
  );
  const selectionIntervals = useStore((state) => state.selectionIntervals);
  const { isUpdating, updateSelection } = useUpdateSelection();
  const [areSelectionsVisible, setAreSelectionsVisible] = useState(false);
  const [isLoadingSelections, setIsLoadingSelections] = useState(false);
  const [selectionsError, setSelectionsError] = useState<string | null>(null);
  const [updatingSelectionId, setUpdatingSelectionId] = useState<string | null>(
    null
  );

  const intervalLookup = useMemo(() => {
    return selectionIntervals.reduce<Record<string, SelectionInterval>>(
      (acc, interval) => {
        acc[interval.id] = interval;
        return acc;
      },
      {}
    );
  }, [selectionIntervals]);

  const handleSelectionUpdate = useCallback(
    async (selection: SelectionEntry, intervals: SelectionInterval[]) => {
      const episodesPayload = intervals.reduce<
        Record<string, { start: number; end: number }>
      >((acc, interval) => {
        if (interval.serverSelectionId !== selection.id) {
          return acc;
        }
        const prefix = `${selection.id}-`;
        if (!interval.id.startsWith(prefix)) {
          return acc;
        }
        const episodeName = interval.id.slice(prefix.length);
        const originalRange = selection.episodes[episodeName];
        const originalStart = Math.round((originalRange?.start ?? 0) * 1000);
        const originalEnd = Math.round((originalRange?.end ?? 0) * 1000);
        const nextStartMs = Math.round(interval.startMs);
        const nextEndMs = Math.round(interval.endMs);

        if (nextStartMs === originalStart && nextEndMs === originalEnd) {
          return acc;
        }

        acc[episodeName] = {
          start: Math.round(interval.startMs / 1000),
          end: Math.round(interval.endMs / 1000),
        };
        return acc;
      }, {});

      if (!Object.keys(episodesPayload).length) {
        return;
      }

      setUpdatingSelectionId(selection.id);
      try {
        await updateSelection(selection, intervals, (updated) => {
          const normalizedSelection: SelectionEntry = {
            id: updated.id ?? (updated as any)._id ?? selection.id,
            name: updated.name ?? selection.name,
            episodes: Object.fromEntries(
              Object.entries(updated.episodes ?? {}).map(
                ([episodeName, range]) => {
                  const startValue = Number((range as { start: number }).start);
                  const endValue = Number((range as { end: number }).end);
                  return [
                    episodeName,
                    {
                      start: Number.isFinite(startValue) ? startValue : 0,
                      end: Number.isFinite(endValue) ? endValue : 0,
                    },
                  ];
                }
              )
            ),
          };

          setSelections((prev) =>
            prev.map((entry) =>
              entry.id === selection.id ? normalizedSelection : entry
            )
          );

          const updatedIntervals = Object.entries(normalizedSelection.episodes)
            .map(([episodeName, range]) => {
              const start = Number(range.start);
              const end = Number(range.end);
              if (!Number.isFinite(start) || !Number.isFinite(end)) {
                return null;
              }
              const interval: SelectionInterval = {
                id: `${normalizedSelection.id}-${episodeName}`,
                serverSelectionId: normalizedSelection.id,
                startMs: Math.round(start * 1000),
                endMs: Math.round(end * 1000),
                label: normalizedSelection.name,
              };
              return interval;
            })
            .filter(
              (interval): interval is SelectionInterval => interval !== null
            );

          setSelectionIntervals((prev) => {
            const selectionServerId = normalizedSelection.id;
            const others = prev.filter(
              (interval) =>
                interval.serverSelectionId !== selection.id &&
                interval.serverSelectionId !== selectionServerId
            );
            return [...others, ...updatedIntervals];
          });
        });
      } catch (error) {
        console.error("Failed to update selection:", error);
      } finally {
        setUpdatingSelectionId(null);
      }
    },
    [setSelectionIntervals, setSelections, updateSelection]
  );

  // Group completed uploads by type
  const videos = uploads.filter(
    (upload) => upload.type?.startsWith("video/") || upload.type === "video"
  );
  const images = uploads.filter(
    (upload) => upload.type?.startsWith("image/") || upload.type === "image"
  );
  const audios = uploads.filter(
    (upload) => upload.type?.startsWith("audio/") || upload.type === "audio"
  );

  const handleAddVideo = (video: any) => {
    const srcVideo = video.metadata?.uploadedUrl || video.url;

    dispatch(ADD_VIDEO, {
      payload: {
        id: generateId(),
        details: {
          src: srcVideo,
        },
        metadata: {
          previewUrl:
            "https://cdn.designcombo.dev/caption_previews/static_preset1.webp",
        },
      },
      options: {
        resourceId: "main",
        scaleMode: "fit",
      },
    });
  };

  const handleAddImage = (image: any) => {
    const srcImage = image.metadata?.uploadedUrl || image.url;

    dispatch(ADD_IMAGE, {
      payload: {
        id: generateId(),
        type: "image",
        display: {
          from: 0,
          to: 5000,
        },
        details: {
          src: srcImage,
        },
        metadata: {},
      },
      options: {},
    });
  };

  const handleAddAudio = (audio: any) => {
    const srcAudio = audio.metadata?.uploadedUrl || audio.url;
    dispatch(ADD_AUDIO, {
      payload: {
        id: generateId(),
        type: "audio",
        details: {
          src: srcAudio,
        },
        metadata: {},
      },
      options: {},
    });
  };

  const handleViewSelections = useCallback(async () => {
    const nextVisibility = !areSelectionsVisible;
    setAreSelectionsVisible(nextVisibility);

    if (!nextVisibility) {
      return;
    }

    setIsLoadingSelections(true);
    setSelectionsError(null);

    try {
      const response = await fetch(API_ENDPOINTS.SELECTIONS, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch selections (${response.status})`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setSelections(data);
      } else {
        setSelections([]);
      }
    } catch (error) {
      setSelectionsError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching selections."
      );
    } finally {
      setIsLoadingSelections(false);
    }
  }, [areSelectionsVisible]);

  const UploadPrompt = () => (
    <div className="flex items-center justify-center px-4 gap-3">
      <Button
        className="w-full cursor-pointer"
        onClick={() => setShowUploadModal(true)}
      >
        <UploadIcon className="w-4 h-4" />
        <span className="ml-2">Upload</span>
      </Button>
    </div>
  );

  const ViewSelections = () => (
    <div className="flex items-center justify-center px-4 gap-3 mt-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleViewSelections}
      >
        {areSelectionsVisible ? "Hide Selections" : "View Selections"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Your uploads
      </div>
      <ModalUpload />
      <UploadPrompt />
      <ViewSelections />

      {areSelectionsVisible && (
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2">Selections</div>
          {isLoadingSelections && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading selections...
            </div>
          )}
          {selectionsError && (
            <div className="text-xs text-destructive">{selectionsError}</div>
          )}
          {!isLoadingSelections &&
            !selectionsError &&
            (selections.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                No selections found.
              </div>
            ) : (
              <ScrollArea className="rounded-md border">
                <div className="flex flex-col gap-2 p-3">
                  {selections.map((selection) => {
                    const isSelected = selection.id === selectedSelectionId;
                    return (
                      <Card
                        key={selection.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          isSelected ? "border-primary" : ""
                        }`}
                        onClick={() => {
                          const isCurrentlySelected =
                            selectedSelectionId === selection.id;
                          const nextSelection = isCurrentlySelected
                            ? null
                            : selection.id;

                          setSelectedSelectionId(nextSelection);

                          if (nextSelection === null) {
                            setSelectionIntervals([]);
                            return;
                          }

                          const intervals = Object.entries(selection.episodes)
                            .map(([episodeName, range]) => {
                              const start = Number(range.start);
                              const end = Number(range.end);
                              if (
                                Number.isFinite(start) &&
                                Number.isFinite(end)
                              ) {
                                const interval: SelectionInterval = {
                                  id: `${selection.id}-${episodeName}`,
                                  serverSelectionId: selection.id,
                                  startMs: start * 1000,
                                  endMs: end * 1000,
                                  label: selection.name,
                                };
                                return interval;
                              }
                              return null;
                            })
                            .filter(
                              (interval): interval is SelectionInterval =>
                                interval !== null
                            );

                          setSelectionIntervals(intervals);
                        }}
                      >
                        <div className="text-sm font-semibold">
                          {selection.name}
                        </div>
                        {(() => {
                          const selectionEditedIntervals =
                            selectionIntervals.filter(
                              (interval) =>
                                interval.serverSelectionId === selection.id
                            );

                          const rows = Object.entries(selection.episodes).map(
                            ([episodeName, range]) => {
                              const intervalOverride =
                                intervalLookup[
                                  `${selection.id}-${episodeName}`
                                ];
                              const originalStart = range.start;
                              const originalEnd = range.end;
                              const displayStart = intervalOverride
                                ? Math.round(intervalOverride.startMs / 1000)
                                : originalStart;
                              const displayEnd = intervalOverride
                                ? Math.round(intervalOverride.endMs / 1000)
                                : originalEnd;

                              const showEdited =
                                displayStart !== originalStart ||
                                displayEnd !== originalEnd;

                              return {
                                episodeName,
                                originalStart,
                                originalEnd,
                                displayStart,
                                displayEnd,
                                showEdited,
                              };
                            }
                          );

                          const hasEdits = rows.some((row) => row.showEdited);

                          return (
                            <div className="mt-2 space-y-1">
                              {rows.map((row) => (
                                <div
                                  key={row.episodeName}
                                  className="text-xs text-muted-foreground"
                                >
                                  {row.episodeName}: {row.originalStart} -{" "}
                                  {row.originalEnd}
                                  {row.showEdited && (
                                    <span className="ml-2 text-emerald-500">
                                      (edited: {row.displayStart} -{" "}
                                      {row.displayEnd})
                                    </span>
                                  )}
                                </div>
                              ))}
                              {hasEdits && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  disabled={
                                    updatingSelectionId === selection.id ||
                                    isUpdating
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleSelectionUpdate(
                                      selection,
                                      selectionEditedIntervals
                                    );
                                  }}
                                >
                                  {updatingSelectionId === selection.id
                                    ? "Updating..."
                                    : "Update"}
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            ))}
        </div>
      )}

      {/* Uploads in Progress Section */}
      {(pendingUploads.length > 0 || activeUploads.length > 0) && (
        <div className="p-4">
          <div className="font-medium text-sm mb-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            Uploads in Progress
          </div>
          <div className="flex flex-col gap-2">
            {pendingUploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-2">
                <span className="truncate text-xs flex-1">
                  {upload.file?.name || upload.url || "Unknown"}
                </span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            ))}
            {activeUploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-2">
                <span className="truncate text-xs flex-1">
                  {upload.file?.name || upload.url || "Unknown"}
                </span>
                <div className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-xs">{upload.progress ?? 0}%</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {upload.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-10 p-4">
        {/* Videos Section */}
        {videos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <VideoIcon className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Videos</span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="grid grid-cols-3 gap-2 max-w-full">
                {videos.map((video, idx) => (
                  <div
                    className="flex items-center gap-2 flex-col w-full"
                    key={video.id || idx}
                  >
                    <Card
                      className="w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
                      onClick={() => handleAddVideo(video)}
                    >
                      <VideoIcon className="w-8 h-8 text-muted-foreground" />
                    </Card>
                    <div className="text-xs text-muted-foreground truncate w-full text-center">
                      {video.file?.name || video.url || "Video"}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Images Section */}
        {images.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Images</span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="grid grid-cols-3 gap-2 max-w-full">
                {images.map((image, idx) => (
                  <div
                    className="flex items-center gap-2 flex-col w-full"
                    key={image.id || idx}
                  >
                    <Card
                      className="w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
                      onClick={() => handleAddImage(image)}
                    >
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </Card>
                    <div className="text-xs text-muted-foreground truncate w-full text-center">
                      {image.file?.name || image.url || "Image"}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Audios Section */}
        {audios.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Audios</span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="grid grid-cols-3 gap-2 max-w-full">
                {audios.map((audio, idx) => (
                  <div
                    className="flex items-center gap-2 flex-col w-full"
                    key={audio.id || idx}
                  >
                    <Card
                      className="w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
                      onClick={() => handleAddAudio(audio)}
                    >
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </Card>
                    <div className="text-xs text-muted-foreground truncate w-full text-center">
                      {audio.file?.name || audio.url || "Audio"}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};
