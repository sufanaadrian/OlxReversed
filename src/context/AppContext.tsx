import type { ReactNode } from "react";
import React, { createContext, useState } from "react";

export type Request = {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  type: "product" | "service";
  datePosted: string;
  status: "active" | "closed";
  offersCount: number;
  location?: string;
};

export type Offer = {
  id: string;
  requestId: string;
  sellerName: string;
  rating: number;
  price: number;
  description: string;
  status: "pending" | "accepted" | "rejected";
};

type AppContextType = {
  requests: Request[];
  myRequests: Request[];
  interestedRequests: Request[];
  offers: Offer[];
  addInterestedRequest: (request: Request) => void;
  removeInterestedRequest: (requestId: string) => void;
  addRequest: (request: Request) => void;
  updateOfferStatus: (offerId: string, status: "accepted" | "rejected") => void;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

const mockRequests: Request[] = [
  {
    id: "1",
    title: "Need a Toyota Camry 2018 or newer",
    description:
      "Looking for a well-maintained Toyota Camry, preferably silver or white. Under 60k miles.",
    category: "Vehicles",
    budgetMin: 15000,
    budgetMax: 22000,
    type: "product",
    datePosted: "2024-12-15",
    status: "active",
    offersCount: 8,
    location: "San Francisco, CA",
  },

  {
    id: "2",
    title: "Web designer for small business website",
    description:
      "Need a modern, responsive website for a local business. 4–5 pages, clean design.",
    category: "Services",
    budgetMin: 1200,
    budgetMax: 2500,
    type: "service",
    datePosted: "2024-12-16",
    status: "active",
    offersCount: 11,
    location: "Remote",
  },

  {
    id: "3",
    title: "iPhone 14 Pro (128GB or 256GB)",
    description:
      "Looking for an unlocked iPhone 14 Pro in excellent condition. Battery health above 90%.",
    category: "Electronics & Tech",
    budgetMin: 750,
    budgetMax: 950,
    type: "product",
    datePosted: "2024-12-17",
    status: "active",
    offersCount: 6,
    location: "New York, NY",
  },

  {
    id: "4",
    title: "Apartment to rent – 1 bedroom",
    description:
      "Searching for a 1-bedroom apartment close to public transport. Furnished preferred.",
    category: "Real Estate",
    budgetMin: 900,
    budgetMax: 1300,
    type: "service",
    datePosted: "2024-12-18",
    status: "active",
    offersCount: 4,
    location: "Berlin, DE",
  },

  {
    id: "5",
    title: "Personal trainer (3 months program)",
    description:
      "Looking for a certified personal trainer for weight loss and strength training.",
    category: "Services",
    budgetMin: 600,
    budgetMax: 1200,
    type: "service",
    datePosted: "2024-12-19",
    status: "active",
    offersCount: 9,
    location: "Los Angeles, CA",
  },

  {
    id: "6",
    title: "Gaming laptop – RTX 3060 or better",
    description:
      "Need a gaming laptop in good condition. Minimum 16GB RAM, SSD required.",
    category: "Electronics & Tech",
    budgetMin: 900,
    budgetMax: 1400,
    type: "product",
    datePosted: "2024-12-20",
    status: "active",
    offersCount: 5,
    location: "Austin, TX",
  },

  {
    id: "7",
    title: "Event photographer for birthday party",
    description:
      "Looking for a photographer for a 4-hour birthday event. Indoor, casual style.",
    category: "Services",
    budgetMin: 300,
    budgetMax: 600,
    type: "service",
    datePosted: "2024-12-21",
    status: "active",
    offersCount: 7,
    location: "London, UK",
  },
];

const mockOffers: Offer[] = [
  {
    id: "1",
    requestId: "1",
    sellerName: "John Dealer",
    rating: 4.8,
    price: 18500,
    description:
      "2019 Toyota Camry, Silver, 45k miles. Excellent condition with service history.",
    status: "accepted",
  },
  {
    id: "2",
    requestId: "1",
    sellerName: "AutoHub Motors",
    rating: 4.6,
    price: 20000,
    description:
      "2020 Toyota Camry XLE, White, 30k miles. Like new with warranty.",
    status: "rejected",
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [requests] = useState<Request[]>(mockRequests);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [interestedRequests, setInterestedRequests] = useState<Request[]>([]);
  const [offers, setOffers] = useState<Offer[]>(mockOffers);

  const addInterestedRequest = (request: Request) => {
    setInterestedRequests((prev) =>
      prev.some((r) => r.id === request.id) ? prev : [...prev, request],
    );
  };

  const removeInterestedRequest = (requestId: string) => {
    setInterestedRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const addRequest = (request: Request) => {
    setMyRequests((prev) => [request, ...prev]);
  };

  const updateOfferStatus = (
    offerId: string,
    status: "accepted" | "rejected",
  ) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status } : o)),
    );
  };

  return (
    <AppContext.Provider
      value={{
        requests,
        myRequests,
        interestedRequests,
        offers,
        addInterestedRequest,
        removeInterestedRequest,
        addRequest,
        updateOfferStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
