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
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  EXPIRED = "expired",
}
