export const asyncHandler = async <T, E>(
  promise: Promise<T>,
): Promise<[T | null, E | null]> => {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const err = error as E;
    return [null, err];
  }
};
