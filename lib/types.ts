export interface Service {
  id: string;
  name: string;
  price: number;
  category: "basic" | "acrylic" | "addon";
  emoji: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  lastVisit?: string;
  lastService?: string;
  depositPaid?: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  depositPaid: boolean;
  status: "upcoming" | "done" | "cancelled";
  notes?: string;
  createdAt: string;
}
