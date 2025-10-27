// apps/web/src/services/api/cv.ts
import { http } from "../http";

const ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const API = `${ORIGIN}/api`;

export type CV = {
  id: string;
  userId?: string | null;
  originalFilename: string;
  storagePath: string;
  parsedText?: string | null;
  lang?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UploadCVResponse = {
  ok: boolean;
  cvId: string;
  parts: number;
  storagePath: string;
  publicUrl?: string;
  parsed: boolean;
  textLength?: number;
};

export function buildPublicUrl(cv: CV): string | null {
  const base =
    process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BASE ||
    process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL;
  if (!base) return null;
  return `${base}/${cv.storagePath}`;
}

export const cvApi = {
  async upload(file: File): Promise<UploadCVResponse> {
    const url = `${API}/cv/upload`;
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(url, { method: "POST", body: form });
    const raw = await res.text();

    // حاول نقرأ JSON؛ لو فشل نرمي خطأ واضح
    let payload: any = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      throw new Error(
        `Unexpected response from upload. Status ${res.status}. Body: ${raw?.slice(0, 200)}`
      );
    }
    if (!res.ok) {
      const msg = payload?.error || res.statusText || "Upload failed";
      throw new Error(String(msg));
    }

    // 🔧 التطبيع: السيرفر الآن يرجّع { id, filename, url }
    // نعيد الشكل القديم المتوقع من الواجهة { cvId, parts, storagePath, publicUrl, parsed, textLength }
    const normalized: UploadCVResponse = {
      ok: payload?.ok ?? true,
      cvId: payload?.cvId ?? payload?.id, // <— المهم!
      parts: payload?.parts ?? 0,
      storagePath: payload?.storagePath ?? payload?.path ?? "",
      publicUrl: payload?.publicUrl ?? payload?.url ?? undefined,
      parsed: payload?.parsed ?? true,
      textLength: payload?.textLength ?? undefined,
    };

    if (!normalized.cvId) {
      throw new Error("Upload response missing cvId");
    }

    return normalized;
  },

  async list(): Promise<{ items: CV[] }> {
    return http.get(`/cv`);
  },

  async getById(id: string): Promise<{ cv: CV }> {
    return http.get(`/cv/${id}`);
  },
};
