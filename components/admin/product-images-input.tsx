"use client";

import { useEffect, useMemo, useState } from "react";

type FilePreview = {
  key: string;
  src: string;
  label: string;
  size: number;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const IMAGE_QUALITY = 0.75;

/** Compress image client-side before upload */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= MAX_FILE_SIZE) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          IMAGE_QUALITY,
        );
      };
    };
  });
}

export function ProductImagesInput() {
  const MAX = 6;
  const [files, setFiles] = useState<Array<File | null>>(Array(MAX).fill(null));
  const [urls, setUrls] = useState<string[]>(Array(MAX).fill(""));
  const [fileErrors, setFileErrors] = useState<Array<string>>(
    Array(MAX).fill(""),
  );

  const filePreviews = useMemo<FilePreview[]>(() => {
    return files
      .map((file, index) => {
        if (!file) return null;
        return {
          key: `file-${index}-${file.name}-${file.size}`,
          src: URL.createObjectURL(file),
          label: `Upload ${index + 1}`,
          size: file.size,
        };
      })
      .filter((entry): entry is FilePreview => Boolean(entry));
  }, [files]);

  const urlPreviews = useMemo<FilePreview[]>(() => {
    return urls
      .map((url, index) => {
        const trimmed = url.trim();
        if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
          return null;
        }
        return {
          key: `url-${index}-${trimmed}`,
          src: trimmed,
          label: `URL ${index + 1}`,
          size: 0,
        };
      })
      .filter((entry): entry is FilePreview => Boolean(entry));
  }, [urls]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      const next = [...files];
      next[index] = null;
      setFiles(next);
      return;
    }

    const errors = [...fileErrors];
    if (file.size > MAX_FILE_SIZE * 2) {
      errors[index] =
        `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} MB > 10 MB max)`;
      setFileErrors(errors);
      return;
    }

    try {
      const compressed = await compressImage(file);
      const next = [...files];
      next[index] = compressed;
      setFiles(next);
      errors[index] = "";
      setFileErrors(errors);
    } catch {
      errors[index] = "Erreur lors de la compression";
      setFileErrors(errors);
    }
  };

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.src);
      });
    };
  }, [filePreviews]);

  const previews = [...filePreviews, ...urlPreviews].slice(0, 6);

  return (
    <div className="md:col-span-2 space-y-4">
      <div>
        <label className="text-sm text-neutral-600">Images (upload)</label>
        <div className="mt-1 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: MAX }, (_, index) => (
            <div key={`imagesFiles-${index}`}>
              <input
                type="file"
                name="imagesFiles"
                accept="image/*"
                onChange={(event) => handleFileChange(event, index)}
                className={`w-full rounded-xl border px-3 py-2 text-sm ${
                  fileErrors[index]
                    ? "border-red-300 bg-red-50"
                    : "border-neutral-200"
                }`}
              />
              {fileErrors[index] && (
                <p className="mt-0.5 text-xs text-red-600">
                  {fileErrors[index]}
                </p>
              )}
              {files[index] && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  {(files[index]!.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Ajoute jusqu&apos;à {MAX} images. Compressées auto (max 10 MB par
          fichier).
        </p>
      </div>

      <div>
        <label className="text-sm text-neutral-600">
          Images (URLs, optionnel)
        </label>
        <div className="mt-1 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: MAX }, (_, index) => (
            <input
              key={`imageUrl-${index}`}
              name={`imageUrl${index + 1}`}
              placeholder="https://..."
              value={urls[index]}
              onChange={(event) => {
                const next = [...urls];
                next[index] = event.target.value;
                setUrls(next);
              }}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Tu peux mixer upload + URLs. Maximum total : {MAX} images.
        </p>
      </div>

      <div>
        <p className="text-sm text-neutral-600">Aperçu</p>
        {previews.length === 0 ? (
          <p className="mt-1 text-xs text-neutral-400">
            Aucun aperçu pour le moment.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {previews.map((preview) => (
              <div
                key={preview.key}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"
              >
                <img
                  src={preview.src}
                  alt={preview.label}
                  className="h-24 w-full object-cover"
                />
                <p className="truncate px-2 py-1 text-[10px] text-neutral-500">
                  {preview.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
