"use client";

import { useEffect, useMemo, useState } from "react";

type FilePreview = {
  key: string;
  src: string;
  label: string;
};

export function ProductImagesInput() {
  const MAX = 6;
  const [files, setFiles] = useState<Array<File | null>>(Array(MAX).fill(null));
  const [urls, setUrls] = useState<string[]>(Array(MAX).fill(""));

  const filePreviews = useMemo<FilePreview[]>(() => {
    return files
      .map((file, index) => {
        if (!file) return null;
        return {
          key: `file-${index}-${file.name}-${file.size}`,
          src: URL.createObjectURL(file),
          label: `Upload ${index + 1}`,
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
        };
      })
      .filter((entry): entry is FilePreview => Boolean(entry));
  }, [urls]);

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
            <input
              key={`imagesFiles-${index}`}
              type="file"
              name="imagesFiles"
              accept="image/*"
              onChange={(event) => {
                const next = [...files];
                next[index] = event.target.files?.[0] ?? null;
                setFiles(next);
              }}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Ajoute jusqu&apos;à {MAX} images (1 par champ). Uploadées sur
          Cloudinary.
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
