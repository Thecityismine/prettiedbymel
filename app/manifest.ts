import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prettied by Mel",
    short_name: "PbM",
    description: "Nail appointments & client management",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait",
    categories: ["beauty", "lifestyle", "business"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Clients",
        short_name: "Clients",
        url: "/clients",
        description: "View your client book",
      },
      {
        name: "New Appointment",
        short_name: "Book",
        url: "/appointments/new",
        description: "Book a new appointment",
      },
      {
        name: "Pricing",
        short_name: "Prices",
        url: "/pricing",
        description: "View your service menu",
      },
    ],
  };
}
