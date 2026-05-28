export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T[];
  pagination: Pagination;
}

export type TaxStatus = "pending" | "paid";
export type PropertyType = "house" | "land" | "car";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface CitizenItem {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface NewsItem {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface TaxItem {
  _id: string;
  citizenId: string;
  propertyId?: string | null;
  title: string;
  amount: number;
  dueDate: string;
  status: TaxStatus;
}

export interface PropertyItem {
  _id: string;
  citizenId: string;
  address: string;
  propertyType: PropertyType;
  details?: string;
}

export interface AppointmentItem {
  _id: string;
  citizenId: string;
  department: string;
  date: string;
  purpose: string;
  status: AppointmentStatus;
}

export interface RequestItem {
  _id: string;
  citizenId: string;
  documentType: string;
  proofFiles?: string[];
  status: RequestStatus;
  adminComment?: string | null;
  legalResponseDays: number;
  createdAt: string;
}

export interface PublicDocumentItem {
  _id: string;
  title: string;
  description?: string | null;
  category: string;
  fileUrl: string;
  uploadedBy: string;
}

export type DataTabId =
  | "stiri"
  | "formulare-tip"
  | "programari"
  | "date-personale"
  | "proprietati"
  | "cereri"
  | "taxe-impozite";

export interface TabDataMap {
  stiri: NewsItem;
  "formulare-tip": PublicDocumentItem;
  programari: AppointmentItem;
  "date-personale": CitizenItem;
  proprietati: PropertyItem;
  cereri: RequestItem;
  "taxe-impozite": TaxItem;
}

export const TAB_ENDPOINTS: Record<DataTabId, string> = {
  stiri: "news",
  "formulare-tip": "public-documents",
  programari: "appointments",
  "date-personale": "citizens",
  proprietati: "properties",
  cereri: "requests",
  "taxe-impozite": "taxes",
};