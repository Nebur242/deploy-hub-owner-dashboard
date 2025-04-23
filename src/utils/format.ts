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
 * Format duration display
 * @param days Number of days
 * @returns Human-readable duration string
 */
export const formatDuration = (days: number) => {
  if (days === 0) return "Unlimited";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
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
