import { useSyncExternalStore } from "react";

const query = "(max-width: 767px)";
const snapshot = () => window.matchMedia(query).matches;
function subscribe(update: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
export function useCompactTunnel() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
