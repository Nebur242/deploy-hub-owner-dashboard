import { LicensePeriod } from "@/common/types/license";

/**
 * Format currency display
 * @param currency Currency code (e.g., 'USD')
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (currency: string, amount: number) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  });
  return formatter.format(amount);
};

/**
 * Format period display for license billing period
 * @param period LicensePeriod enum value
 * @returns Human-readable period string
 */
export const formatPeriod = (period: LicensePeriod) => {
  switch (period) {
    case LicensePeriod.WEEKLY:
      return "Weekly";
    case LicensePeriod.BIWEEKLY:
      return "Bi-weekly";
    case LicensePeriod.MONTHLY:
      return "Monthly";
    case LicensePeriod.YEARLY:
      return "Yearly";
    case LicensePeriod.FOREVER:
      return "Lifetime";
    default:
      return period;
  }
};

/**
 * Format date
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
