"use client";
import { useEffect, useRef, useState } from "react";
import { imageObjectName, savedImageName } from "./image-name";
import { browserClient } from "./supabase/client";
export type ImageBucket = "product-images" | "business-logos";
export async function deleteStoredImage(
  url: string,
  bucket: ImageBucket,
  sid: string,
) {
  const source = new URL(url);
  const service = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  const prefix = `/storage/v1/object/public/${bucket}/`;
  if (source.origin !== service.origin || !source.pathname.startsWith(prefix))
    throw new Error(
      "The image is detached, but its source is outside Talix and cannot be deleted here.",
    );
  const path = decodeURIComponent(source.pathname.slice(prefix.length));
  if (!path.startsWith(`${sid}/`))
    throw new Error("This image belongs to another business.");
  const db = browserClient();
  const { data, error } = await db.storage.from(bucket).remove([path]);
  if (error) throw error;
  if (!data?.length) {
    const folder = path.slice(0, path.lastIndexOf("/")),
      name = path.slice(path.lastIndexOf("/") + 1);
    const result = await db.storage.from(bucket).list(folder, { search: name });
    if (result.error) throw result.error;
    if (result.data?.some((item) => item.name === name))
      throw new Error(
        "The image is still used elsewhere or you do not have permission to delete it.",
      );
  }
}
// File selection is local. Upload occurs only when Save is submitted.
export function useImageDraft(
  initial: string | null,
  bucket: ImageBucket,
  sid: string,
) {
  const [saved, setSaved] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [localPreview, setLocalPreview] = useState("");
  const uploaded = useRef<{ file: File; url: string } | null>(null);
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);
  function choose(value: File) {
    if (
      value.size > 5242880 ||
      !["image/jpeg", "image/png", "image/webp"].includes(value.type)
    )
      throw new Error("Choose a JPEG, PNG or WebP image up to 5 MB.");
    setLocalPreview(URL.createObjectURL(value));
    setFile(value);
    setRemoved(false);
  }
  async function prepare() {
    if (!file) return removed ? null : saved;
    if (uploaded.current?.file === file) return uploaded.current.url;
    if (uploaded.current) {
      await deleteStoredImage(uploaded.current.url, bucket, sid);
      uploaded.current = null;
    }
    const db = browserClient(),
      path = `${sid}/${imageObjectName(crypto.randomUUID(), file.name)}`;
    const { error } = await db.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const url = db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    uploaded.current = { file, url };
    return url;
  }
  async function discard() {
    if (uploaded.current)
      await deleteStoredImage(uploaded.current.url, bucket, sid);
    uploaded.current = null;
    setFile(null);
    setRemoved(false);
    setLocalPreview("");
  }
  function committed(url: string | null) {
    const previous = [
      ...new Set(
        [saved, uploaded.current?.url].filter(
          (old): old is string => !!old && old !== url,
        ),
      ),
    ];
    uploaded.current = null;
    setSaved(url);
    setFile(null);
    setRemoved(false);
    setLocalPreview("");
    return previous;
  }
  return {
    preview: removed ? null : file ? localPreview : saved,
    filename: removed ? null : (file?.name ?? savedImageName(saved)),
    dirty: !!file || removed,
    choose,
    prepare,
    discard,
    committed,
    clear: () => {
      setFile(null);
      setRemoved(true);
      setLocalPreview("");
    },
  };
}
