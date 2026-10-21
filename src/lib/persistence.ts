export function confirmedMutation<T>(
  result: { data: T | null; error: unknown },
  missingMessage = "The saved record was not returned.",
) {
  if (result.error) throw result.error;
  if (result.data === null) throw new Error(missingMessage);
  return result.data;
}
