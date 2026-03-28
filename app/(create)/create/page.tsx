"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { resizePhoto } from "@/lib/photo-utils";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  X,
  Loader2,
  ImagePlus,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

interface PhotoEntry {
  /** Local unique key for React */
  localId: string;
  /** Object URL for the thumbnail preview */
  previewUrl: string;
  /** Upload progress 0-100 */
  progress: number;
  /** Convex storage ID once uploaded */
  storageId: Id<"_storage"> | null;
  /** Error message if upload failed */
  error: string | null;
  /** Whether this photo is currently uploading */
  uploading: boolean;
}

// ── Constants ────────────────────────────────────────────────────────

const MAX_PHOTOS = 6;
const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/heic": [".heic"],
  "image/heif": [".heif"],
};

// ── Step Indicator ───────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ["Photos", "Details", "Generate"];
  return (
    <div className="flex items-center justify-center gap-2" role="navigation" aria-label="Progress">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isComplete = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-6 sm:w-10 ${
                  isComplete ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {step}
              </span>
              <span
                className={`hidden text-xs font-medium sm:inline ${
                  isActive
                    ? "text-foreground"
                    : isComplete
                      ? "text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Photo Thumbnail ──────────────────────────────────────────────────

function PhotoThumbnail({
  photo,
  onRemove,
  onRetry,
}: {
  photo: PhotoEntry;
  onRemove: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.previewUrl}
        alt="Uploaded photo"
        className="size-full object-cover"
      />

      {/* Upload progress overlay */}
      {photo.uploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
          <Loader2 className="size-5 animate-spin text-white" />
          <div className="mx-3 h-1.5 w-4/5 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${photo.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {photo.error && (
        <button
          onClick={onRetry}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 text-white"
          aria-label="Upload failed. Tap to retry."
        >
          <AlertCircle className="size-5 text-red-400" />
          <span className="text-xs font-medium">Tap to retry</span>
        </button>
      )}

      {/* Remove button */}
      {!photo.uploading && !photo.error && (
        <button
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 focus-visible:opacity-100 group-hover:opacity-100"
          aria-label="Remove photo"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function PhotoUploadPage() {
  const router = useRouter();
  const createScope = useMutation(api.scopes.create);
  const generateUploadUrl = useMutation(api.scopes.generateUploadUrl);
  const addPhoto = useMutation(api.scopes.addPhoto);
  const removePhotoMutation = useMutation(api.scopes.removePhoto);

  const [scopeId, setScopeId] = useState<Id<"scopes"> | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  const uploadedCount = photos.filter((p) => p.storageId !== null).length;
  const isAnyUploading = photos.some((p) => p.uploading);
  const canProceed = uploadedCount > 0 && !isAnyUploading && !navigating;

  // ── Upload a single file ──────────────────────────────────────────

  const uploadFile = useCallback(
    async (file: File, currentScopeId: Id<"scopes">, localId: string) => {
      try {
        // Update progress: resizing
        setPhotos((prev) =>
          prev.map((p) =>
            p.localId === localId ? { ...p, progress: 10, uploading: true, error: null } : p,
          ),
        );

        // Resize the photo
        const resized = await resizePhoto(file);

        setPhotos((prev) =>
          prev.map((p) => (p.localId === localId ? { ...p, progress: 30 } : p)),
        );

        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        setPhotos((prev) =>
          prev.map((p) => (p.localId === localId ? { ...p, progress: 50 } : p)),
        );

        // Upload to Convex storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: resized,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const { storageId } = (await response.json()) as {
          storageId: Id<"_storage">;
        };

        setPhotos((prev) =>
          prev.map((p) => (p.localId === localId ? { ...p, progress: 80 } : p)),
        );

        // Add the photo to the scope
        await addPhoto({ scopeId: currentScopeId, storageId });

        // Mark as complete
        setPhotos((prev) =>
          prev.map((p) =>
            p.localId === localId
              ? { ...p, progress: 100, storageId, uploading: false }
              : p,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed";
        setPhotos((prev) =>
          prev.map((p) =>
            p.localId === localId
              ? { ...p, error: message, uploading: false, progress: 0 }
              : p,
          ),
        );
      }
    },
    [generateUploadUrl, addPhoto],
  );

  // ── Handle file drop ──────────────────────────────────────────────

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setGlobalError(null);

      // Enforce max photos
      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) {
        setGlobalError(`Maximum ${MAX_PHOTOS} photos allowed.`);
        return;
      }
      const filesToUpload = acceptedFiles.slice(0, remaining);
      if (acceptedFiles.length > remaining) {
        setGlobalError(
          `Only ${remaining} more photo${remaining === 1 ? "" : "s"} allowed. Extra files were ignored.`,
        );
      }

      // Create scope if we haven't yet
      let currentScopeId = scopeId;
      if (!currentScopeId) {
        try {
          currentScopeId = await createScope();
          setScopeId(currentScopeId);
        } catch (err) {
          setGlobalError(
            err instanceof Error
              ? err.message
              : "Failed to create scope. Please try again.",
          );
          return;
        }
      }

      // Create photo entries with previews
      const newEntries: PhotoEntry[] = filesToUpload.map((file) => ({
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        storageId: null,
        error: null,
        uploading: true,
      }));

      setPhotos((prev) => [...prev, ...newEntries]);

      // Upload all in parallel
      for (let i = 0; i < filesToUpload.length; i++) {
        uploadFile(filesToUpload[i], currentScopeId!, newEntries[i].localId);
      }
    },
    [scopeId, photos.length, createScope, uploadFile],
  );

  // ── Remove a photo ────────────────────────────────────────────────

  const removePhoto = useCallback(
    async (localId: string) => {
      const photo = photos.find((p) => p.localId === localId);
      if (!photo) return;

      // Remove the preview URL
      URL.revokeObjectURL(photo.previewUrl);

      // Remove from state immediately
      setPhotos((prev) => prev.filter((p) => p.localId !== localId));

      // Remove from Convex if it was uploaded
      if (photo.storageId && scopeId) {
        try {
          await removePhotoMutation({
            scopeId,
            storageId: photo.storageId,
          });
        } catch {
          // Silently fail — the photo is already removed from UI
        }
      }
    },
    [photos, scopeId, removePhotoMutation],
  );

  // ── Retry a failed upload ─────────────────────────────────────────

  const retryUpload = useCallback(
    (localId: string) => {
      if (!scopeId) return;
      const photo = photos.find((p) => p.localId === localId);
      if (!photo || !photo.error) return;

      // We need the original file, but we only have the preview URL.
      // Re-fetch from the object URL won't work reliably.
      // Instead, remove the failed entry and prompt user to re-add.
      setGlobalError("Please re-add the photo to retry.");
      removePhoto(localId);
    },
    [scopeId, photos, removePhoto],
  );

  // ── Dropzone config ───────────────────────────────────────────────

  const dropzoneDisabled = photos.length >= MAX_PHOTOS;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: MAX_PHOTOS - photos.length,
    disabled: dropzoneDisabled,
    multiple: true,
  });

  // ── Navigate to details ───────────────────────────────────────────

  const handleNext = () => {
    if (!scopeId || !canProceed) return;
    setNavigating(true);
    router.push(`/create/details/${scopeId}`);
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold tracking-tight">ScopePro</p>
        <StepIndicator current={1} />
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Upload photos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add up to {MAX_PHOTOS} photos of the job site. We'll use them to
            generate your scope of work.
          </p>
        </div>

        {/* Global error */}
        {globalError && (
          <div
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0" />
            {globalError}
          </div>
        )}

        {/* Layout: Drop zone + thumbnails */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`flex min-h-[200px] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
              dropzoneDisabled
                ? "cursor-not-allowed border-border bg-muted/50 opacity-60"
                : isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
            } ${photos.length === 0 ? "lg:min-h-[320px]" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={
              dropzoneDisabled
                ? `Maximum ${MAX_PHOTOS} photos reached`
                : "Drop photos or tap to browse"
            }
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-center">
              {isDragActive ? (
                <>
                  <Upload className="size-8 text-primary" />
                  <p className="text-sm font-medium text-primary">
                    Drop photos here
                  </p>
                </>
              ) : dropzoneDisabled ? (
                <>
                  <ImagePlus className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Maximum {MAX_PHOTOS} photos reached
                  </p>
                </>
              ) : (
                <>
                  <Camera className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop photos or tap to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WebP, HEIC — up to {MAX_PHOTOS} photos
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail grid */}
          {photos.length > 0 && (
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
              {photos.map((photo) => (
                <PhotoThumbnail
                  key={photo.localId}
                  photo={photo}
                  onRemove={() => removePhoto(photo.localId)}
                  onRetry={() => retryUpload(photo.localId)}
                />
              ))}

              {/* Add more placeholder */}
              {photos.length < MAX_PHOTOS && (
                <div
                  {...getRootProps()}
                  className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <input {...getInputProps()} />
                  <ImagePlus className="size-5" />
                  <span className="text-xs">Add more</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Photo count */}
        {photos.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {uploadedCount} of {MAX_PHOTOS} photos uploaded
            {isAnyUploading && " — uploading..."}
          </p>
        )}
      </main>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {uploadedCount === 0
              ? "Upload at least 1 photo to continue"
              : `${uploadedCount} photo${uploadedCount === 1 ? "" : "s"} ready`}
          </p>
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            size="lg"
            className="gap-1.5"
          >
            {navigating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Next
                <ArrowRight className="size-4" data-icon="inline-end" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
