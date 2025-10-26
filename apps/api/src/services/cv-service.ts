import type { Supabase } from "../utils/supabase";
import { env } from "../env";
import type { CvRecord } from "../types/cv";
import { nanoid } from "nanoid";

export class CvService {
  private readonly tableName: string;
  private readonly records = new Map<string, CvRecord & { storagePath?: string }>();

  constructor(private readonly supabase: Supabase) {
    this.tableName = env.SUPABASE_CV_TABLE ?? "cvs";
  }

  async uploadCv(buffer: Buffer, filename: string, mimetype?: string): Promise<CvRecord> {
    const id = `cv_${nanoid(10)}`;
    const safeFilename = filename.trim() || `cv-${Date.now()}.pdf`;
    const storagePath = `${id}/${Date.now()}-${safeFilename}`;

    if (this.supabase && env.SUPABASE_STORAGE_BUCKET) {
      const { error: uploadError } = await this.supabase
        .storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .upload(storagePath, buffer, {
          contentType: mimetype ?? "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const publicUrl = this.supabase
        .storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(storagePath).data.publicUrl;

      try {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .insert({ id, filename: safeFilename, url: publicUrl })
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        const record: CvRecord = {
          id: data.id ?? id,
          filename: data.filename ?? safeFilename,
          url: data.url ?? publicUrl,
        };
        this.records.set(record.id, { ...record, storagePath });
        return record;
      } catch (error) {
        await this.supabase
          .storage
          .from(env.SUPABASE_STORAGE_BUCKET)
          .remove([storagePath]);
        throw error instanceof Error ? error : new Error("Upload failed");
      }
    }

    const record: CvRecord = {
      id,
      filename: safeFilename,
      url: undefined,
    };
    this.records.set(id, { ...record, storagePath });
    return record;
  }

  async list(): Promise<CvRecord[]> {
    if (this.supabase && env.SUPABASE_STORAGE_BUCKET) {
      try {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select("id, filename, url")
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          data.forEach((row) => {
            if (row?.id && row?.filename) {
              this.records.set(row.id, {
                id: row.id,
                filename: row.filename,
                url: row.url,
              });
            }
          });
          return data.map((row) => ({
            id: row.id,
            filename: row.filename,
            url: row.url,
          }));
        }
      } catch (error) {
        console.warn("Falling back to in-memory CV list", error);
      }
    }

    return Array.from(this.records.values()).map((record) => ({
      id: record.id,
      filename: record.filename,
      url: record.url,
    }));
  }

  async findByIds(ids: string[]): Promise<CvRecord[]> {
    if (ids.length === 0) return [];

    if (this.supabase && env.SUPABASE_STORAGE_BUCKET) {
      try {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select("id, filename, url")
          .in("id", ids);

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          return data.map((row) => ({
            id: row.id,
            filename: row.filename,
            url: row.url,
          }));
        }
      } catch (error) {
        console.warn("Falling back to in-memory CV lookup", error);
      }
    }

    return ids
      .map((id) => this.records.get(id))
      .filter((value): value is CvRecord & { storagePath?: string } => Boolean(value))
      .map((record) => ({
        id: record.id,
        filename: record.filename,
        url: record.url,
      }));
  }
}
