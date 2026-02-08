
export type Language = 'en' | 'hi';

export interface Service {
  id: string;
  _id?: string;
  // sometimes backend returns a serviceId mapping
  serviceId?: string | { _id?: string };
  name: { en: string; hi?: string };
  features: { en: string; hi?: string };
  time: string;
  rate: string;
  videoUrl: string;
  thumbnail: string;
  category?: string;
  baseRate?: number;
  offerOn?: boolean;
  likes?: number;
  views?: number;
  description?: any;
}

export interface Order {
  id: string;
  serviceName: string;
  status: 'Pending' | 'Done';
  date: string;
  rate: string;
  startHour?: number;
  endHour?: number;
  services?: Array<{ serviceId: string; serviceName: string; price: number; duration: string }>;
  customerName?: string;
  address?: string;
  totalPrice?: number;
  totalDuration?: string;
}

export interface AppState {
  language: Language;
  currentTab: 'home' | 'reels' | 'trending' | 'profile';
  selectedService: Service | null;
  orders: Order[];
  isBookingOpen: boolean;
}
