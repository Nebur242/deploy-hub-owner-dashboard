// License Ticket Status
export enum LicenseTicketStatus {
  OPEN = "open",
  PENDING_OWNER_RESPONSE = "pending_owner_response",
  PENDING_USER_RESPONSE = "pending_user_response",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

// License Ticket Priority
export enum LicenseTicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// License Ticket Category
export enum LicenseTicketCategory {
  GENERAL = "general",
  TECHNICAL = "technical",
  DEPLOYMENT = "deployment",
  CONFIGURATION = "configuration",
  BUG_REPORT = "bug_report",
  FEATURE_REQUEST = "feature_request",
  OTHER = "other",
}

// Message Sender Type
export enum MessageSenderType {
  USER = "user",
  OWNER = "owner",
}

// Deployment reference for ticket
export interface TicketDeployment {
  id: string;
  status: string;
  environment: string;
  branch?: string;
  deployment_url?: string;
  created_at: string;
  configuration?: {
    id: string;
    name: string;
  };
}

// License Ticket Message
export interface LicenseTicketMessage {
  id: string;
  content: string;
  ticket_id: string;
  sender_id: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url?: string;
  };
  sender_type: MessageSenderType;
  read: boolean;
  read_at?: string;
  attachments: string[];
  created_at: string;
}

// License Ticket
export interface LicenseTicket {
  id: string;
  subject: string;
  description: string;
  status: LicenseTicketStatus;
  priority: LicenseTicketPriority;
  category: LicenseTicketCategory;
  user_license_id: string;
  user_license?: {
    id: string;
    license?: {
      id: string;
      name: string;
    };
  };
  user_id: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url?: string;
  };
  owner_id: string;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url?: string;
  };
  license_id: string;
  license?: {
    id: string;
    name: string;
    description: string;
  };
  deployment_id?: string;
  deployment?: TicketDeployment;
  attachments?: string[];
  messages?: LicenseTicketMessage[];
  resolved_at?: string;
  last_message_at?: string;
  unread_by_user: boolean;
  unread_by_owner: boolean;
  created_at: string;
  updated_at: string;
}

// Create Ticket Message DTO
export interface CreateTicketMessageDto {
  content: string;
  attachments?: string[];
}

// Update License Ticket DTO
export interface UpdateLicenseTicketDto {
  status?: LicenseTicketStatus;
  priority?: LicenseTicketPriority;
  category?: LicenseTicketCategory;
  subject?: string;
}

// Query License Tickets Params
export interface QueryLicenseTicketsParams {
  page?: number;
  limit?: number;
  status?: LicenseTicketStatus;
  priority?: LicenseTicketPriority;
  category?: LicenseTicketCategory;
  user_license_id?: string;
  license_id?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  unread?: boolean;
}

// License Ticket Statistics
export interface LicenseTicketStatistics {
  total: number;
  open: number;
  pending_response: number;
  in_progress: number;
  resolved: number;
  closed: number;
  unread: number;
}
