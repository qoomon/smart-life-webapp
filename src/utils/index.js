export function getState(state) {
  if (state === false || state === null || state === undefined || state === 0) {
    return false;
  }
  if (typeof state === "string" && state.toLowerCase() === "false") {
    return false;
  }
  return Boolean(state);
}
