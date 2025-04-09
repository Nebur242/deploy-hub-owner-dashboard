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
