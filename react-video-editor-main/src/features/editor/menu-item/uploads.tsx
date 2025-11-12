/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useState } from "react";
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
import ModalUpload from "@/components/modal-upload";
import { API_ENDPOINTS } from "@/constants/api";

export const Uploads = () => {
  const { setShowUploadModal, uploads, pendingUploads, activeUploads } =
    useUploadStore();

  const [selections, setSelections] = useState<
    Array<{
      id: string;
      name: string;
      episodes: Record<string, { start: number; end: number }>;
    }>
  >([]);
  const [areSelectionsVisible, setAreSelectionsVisible] = useState(false);
  const [isLoadingSelections, setIsLoadingSelections] = useState(false);
  const [selectionsError, setSelectionsError] = useState<string | null>(null);

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
                  {selections.map((selection) => (
                    <Card key={selection.id} className="p-3">
                      <div className="text-sm font-semibold">
                        {selection.name}
                      </div>
                      {Object.keys(selection.episodes).length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {Object.entries(selection.episodes).map(
                            ([episodeName, range]) => (
                              <div
                                key={episodeName}
                                className="text-xs text-muted-foreground"
                              >
                                {episodeName}: {range.start} - {range.end}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-muted-foreground">
                          No episodes in this selection.
                        </div>
                      )}
                    </Card>
                  ))}
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
