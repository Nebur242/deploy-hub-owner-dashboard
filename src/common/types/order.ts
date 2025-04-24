import { LicenseOption } from "./license";
import { User } from "./user";

export enum OrderStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  FAILED = "failed",
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  PAYPAL = "paypal",
  BANK_TRANSFER = "bank_transfer",
  STRIPE = "stripe",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export interface Order {
  id: string;
  userId: string;
  licenseId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  referenceNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
  license: LicenseOption;
  payments?: Payment[];
  user?: User;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentGatewayResponse?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  order?: Partial<Order>;
}

export interface ProcessPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  paymentGatewayResponse?: string;
}
