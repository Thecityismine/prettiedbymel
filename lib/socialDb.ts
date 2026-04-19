import { restGet, restPatch } from "./firestoreRest";
import { cacheGet, cacheSet } from "./cache";

export interface SocialLinks {
  instagram: string;
  tiktok: string;
}

const KEY = "social";
const defaults: SocialLinks = { instagram: "", tiktok: "" };

export async function loadSocialLinks(): Promise<SocialLinks> {
  const hit = cacheGet<SocialLinks>(KEY);
  if (hit) {
    if (hit.stale) {
      restGet("settings", "social")
        .then((d) => { if (d) cacheSet(KEY, d as unknown as SocialLinks); })
        .catch(() => {});
    }
    return hit.data;
  }
  const data = await restGet("settings", "social");
  const social = data ? (data as unknown as SocialLinks) : defaults;
  cacheSet(KEY, social);
  return social;
}

export async function saveSocialLinks(s: SocialLinks): Promise<void> {
  await restPatch("settings", "social", s as unknown as Record<string, unknown>);
  cacheSet(KEY, s);
}
