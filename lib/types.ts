export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  category: "basic" | "acrylic" | "addon";
  emoji: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;           // preferences, nail size, style
  lastVisit?: string;
  lastService?: string;
  depositPaid?: boolean;
  noShowCount?: number;
  totalSpent?: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  duration?: number; // minutes, from service
  date: string;
  time: string;
  depositPaid: boolean;
  depositKept?: boolean;    // true when no-show deposit is kept
  status: "upcoming" | "done" | "cancelled" | "no-show";
  notes?: string;
  createdAt: string;
}
