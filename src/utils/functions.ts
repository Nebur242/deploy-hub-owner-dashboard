/* eslint-disable @typescript-eslint/no-explicit-any */
export const asyncHandler = async <T, E>(
  promise: Promise<T>
): Promise<[T | null, E | null]> => {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const err = error as E;
    return [null, err];
  }
};

export function parseJSON<T>(json: string): T {
  if (typeof json !== "string") {
    return json as T;
  }
  return JSON.parse(json) as T;
}

export function getErrorMessage(err: unknown): string | null {
  return err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as any).message === "string"
    ? (err as any).message
    : null;
}

// Format currency display
export const formatCurrency = (currency: string, amount: number) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  });
  return formatter.format(amount);
};

// Format duration display
export const formatDuration = (days: number) => {
  if (days === 0) return "Unlimited";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
};

// Format date
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
