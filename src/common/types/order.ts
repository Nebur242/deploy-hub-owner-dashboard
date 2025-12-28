import { LicenseOption } from "./license";
import { User } from "./user";

export enum OrderStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  FAILED = "failed",
  PROCESSING = "processing",
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
  PROCESSING = "processing",
}

export interface BillingInfo {
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
  address?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
}

export interface Order {
  id: string;
  user_id: string;
  license_id: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  reference_number: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  is_active: boolean;
  expires_at?: string | null;
  license: LicenseOption;
  payments?: Payment[];
  user?: User;
  billing?: BillingInfo;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_id?: string;
  payment_gateway_response?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
  order: Order;
}

export interface ProcessPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  paymentGatewayResponse?: string;
}
