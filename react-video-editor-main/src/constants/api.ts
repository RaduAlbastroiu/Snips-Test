const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

export const API_ENDPOINTS = {
  CHAT: "/api/chat",
  GENERATE_IMAGE: "/api/generate-image",
  GENERATE_AUDIO: "/api/generate-audio",
  SCHEMA: "/api/schema",
  SELECTIONS: `${BACKEND_BASE_URL}/selections`,
  SCHEME: {
    BASE: "https://scheme.combo.sh",
    CREATE: "https://scheme.combo.sh/schemes",
    RUN: (id: string) => `https://scheme.combo.sh/run/${id}`
  }
} as const;

export { BACKEND_BASE_URL };
