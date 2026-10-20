import "server-only";

import { cache } from "react";
import type { Catalog } from "./types";
import { serverClient } from "./supabase/server";

export const loadPublicCatalog = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    const { data, error } = await (await serverClient()).rpc("public_catalog", {
      p_slug: slug,
    });
    if (error || !data) return null;
    return data as Catalog;
  } catch {
    return null;
  }
});
