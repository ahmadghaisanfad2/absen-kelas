import { seedData } from "./seed";
import type { AppData } from "./types";

const STORAGE_KEY = "absen-kelas:v1";

export function loadAppData(): AppData {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return seedData;
  }

  try {
    const parsed = JSON.parse(raw) as AppData;
    return {
      ...seedData,
      ...parsed,
      attendance: parsed.attendance ?? {}
    };
  } catch {
    return seedData;
  }
}

export function saveAppData(data: AppData) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...data,
      updatedAt: new Date().toISOString()
    })
  );
}

export function resetAppData() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createBackupPayload(data: AppData) {
  return JSON.stringify(
    {
      app: "absen-kelas",
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    },
    null,
    2
  );
}

export function parseBackupPayload(payload: string): AppData {
  const parsed = JSON.parse(payload) as { app?: string; data?: AppData };

  if (parsed.app !== "absen-kelas" || !parsed.data) {
    throw new Error("File backup tidak dikenali sebagai data Absen Kelas.");
  }

  return parsed.data;
}
