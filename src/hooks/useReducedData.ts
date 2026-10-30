import { useSyncExternalStore } from 'react';

type DataConnection = EventTarget & { saveData?: boolean };
const query = '(prefers-reduced-data: reduce)';
const getConnection = () => (navigator as Navigator & { connection?: DataConnection }).connection;
const getSnapshot = () => Boolean(getConnection()?.saveData || window.matchMedia(query).matches);

function subscribe(update: () => void) {
  const connection = getConnection();
  const media = window.matchMedia(query);
  connection?.addEventListener('change', update);
  media.addEventListener('change', update);
  return () => {
    connection?.removeEventListener('change', update);
    media.removeEventListener('change', update);
  };
}

export function useReducedData() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
