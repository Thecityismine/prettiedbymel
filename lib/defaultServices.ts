import type { Service } from "./types";

export const defaultServices: Service[] = [
  { id: "soak-off", name: "Soak Off", price: 5, category: "basic", emoji: "💧" },
  { id: "gel-manicure", name: "Gel Manicure", price: 15, category: "basic", emoji: "💅" },
  { id: "acrylic-small", name: "Acrylic – Small Length", price: 25, category: "acrylic", emoji: "✨" },
  { id: "acrylic-medium", name: "Acrylic – Medium Length", price: 35, category: "acrylic", emoji: "✨" },
  { id: "acrylic-long", name: "Acrylic – Long Length", price: 45, category: "acrylic", emoji: "✨" },
  { id: "gems-3d", name: "Gems / 3D Add-on", price: 5, category: "addon", emoji: "💎" },
];

export const categoryLabels: Record<Service["category"], string> = {
  basic: "Basic Services",
  acrylic: "Acrylic Sets",
  addon: "Add-ons",
};
