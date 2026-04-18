import { restGet, restPatch } from "./firestoreRest";
import { cacheGet, cacheSet } from "./cache";
import { defaultServices } from "./defaultServices";
import type { Service } from "./types";

const KEY = "services";

export async function loadServices(): Promise<Service[]> {
  const hit = cacheGet<Service[]>(KEY);
  if (hit) {
    if (hit.stale) {
      restGet("settings", "pricing")
        .then((d) => { if (d?.services) cacheSet(KEY, d.services as Service[]); })
        .catch(() => {});
    }
    return hit.data;
  }
  const data = await restGet("settings", "pricing");
  if (data?.services) {
    const services = data.services as Service[];
    cacheSet(KEY, services);
    return services;
  }
  await restPatch("settings", "pricing", { services: defaultServices });
  cacheSet(KEY, defaultServices);
  return defaultServices;
}

export async function saveServices(services: Service[]): Promise<void> {
  await restPatch("settings", "pricing", { services });
  cacheSet(KEY, services);
}
