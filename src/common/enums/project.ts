export enum TechStack {
  REACT = "react",
  NEXTJS = "nextjs",
  //   VUE = "vue",
  //   ANGULAR = "angular",
  //   NODE = "node",
  //   NESTJS = "nestjs",
  //   DJANGO = "django",
  //   FLASK = "flask",
  //   LARAVEL = "laravel",
  //   OTHER = "other",
}

export enum Visibility {
  PUBLIC = "public",
  PRIVATE = "private",
  FEATURED = "featured",
}

export enum ModerationStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CHANGES_PENDING = "changes_pending",
}

export enum DeploymentStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELED = "canceled",
}

export enum DeploymentProvider {
  NETLIFY = "netlify",
  VERCEL = "vercel",
  CUSTOM = "custom",
  // AWS = "aws",
  // GCP = "gcp",
  // AZURE = "azure",
  // GITHUB_PAGES = "github_pages",
}

export enum Currency {
  USD = "USD",
  EUR = "EUR",
}

export enum PurchaseStatus {
  PENDING = "pending",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  PAST_DUE = "past_due",
  PAUSED = "paused",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}
