// apps/api/src/services/job-service.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type JobRequirement = {
  id?: string;
  requirement: string;
  mustHave: boolean;
  weight: number; // 0..10
};

export type Job = {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  requirements: JobRequirement[];
};

export class JobService {
  constructor(private readonly db: SupabaseClient) {}

  /** إنشاء وظيفة جديدة */
  async createJob(title: string, description: string): Promise<Job> {
    const { data, error } = await this.db
      .from('Job')
      .insert({ title, description })
      .select('*')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      createdAt: data.createdAt ?? data.created_at,
      requirements: [],
    };
  }

  /** جلب قائمة الوظائف مع أول دفعة متطلبات لكل وظيفة */
  async list(): Promise<Job[]> {
    const { data: jobs, error } = await this.db
      .from('Job')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const result: Job[] = (jobs ?? []).map((j: any) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      createdAt: j.createdAt ?? j.created_at,
      requirements: [],
    }));

    if (result.length === 0) return result;

    // اجلب المتطلبات دفعة واحدة لكل الوظائف
    const ids = result.map(j => j.id);
    const { data: reqs, error: reqErr } = await this.db
      .from('JobRequirement')
      .select('*')
      .in('jobId', ids)
      .order('weight', { ascending: false });

    if (reqErr) throw reqErr;

    const grouped = new Map<string, JobRequirement[]>();
    (reqs ?? []).forEach((r: any) => {
      const arr = grouped.get(r.jobId) ?? [];
      arr.push({
        id: r.id,
        requirement: r.requirement,
        mustHave: !!r.mustHave,
        weight: Number(r.weight ?? 0),
      });
      grouped.set(r.jobId, arr);
    });

    result.forEach(j => {
      j.requirements = grouped.get(j.id) ?? [];
    });

    return result;
  }

  /** جلب وظيفة واحدة مع متطلباتها */
  async getById(id: string): Promise<Job | null> {
    const { data: job, error } = await this.db
      .from('Job')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // لو Not Found رجّع null بدل رمي خطأ
      if ((error as any).code === 'PGRST116' /* no rows */) return null;
      throw error;
    }

    const { data: reqs, error: reqErr } = await this.db
      .from('JobRequirement')
      .select('*')
      .eq('jobId', id)
      .order('weight', { ascending: false });

    if (reqErr) throw reqErr;

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      createdAt: job.createdAt ?? job.created_at,
      requirements: (reqs ?? []).map((r: any) => ({
        id: r.id,
        requirement: r.requirement,
        mustHave: !!r.mustHave,
        weight: Number(r.weight ?? 0),
      })),
    };
  }

  /** إضافة متطلبات لوظيفة */
  async addRequirements(jobId: string, items: JobRequirement[]): Promise<void> {
    if (!items.length) return;

    const rows = items.map(it => ({
      jobId,
      requirement: it.requirement,
      mustHave: !!it.mustHave,
      weight: Number(it.weight ?? 0),
    }));

    const { error } = await this.db.from('JobRequirement').insert(rows);
    if (error) throw error;
  }

  /** تحديث متطلب واحد */
  async updateRequirement(
    reqId: string,
    patch: Partial<Pick<JobRequirement, 'requirement' | 'mustHave' | 'weight'>>
  ): Promise<void> {
    const payload: Record<string, any> = {};
    if (patch.requirement !== undefined) payload.requirement = patch.requirement;
    if (patch.mustHave !== undefined) payload.mustHave = !!patch.mustHave;
    if (patch.weight !== undefined) payload.weight = Number(patch.weight);

    const { error } = await this.db
      .from('JobRequirement')
      .update(payload)
      .eq('id', reqId);

    if (error) throw error;
  }

  /** حذف متطلب واحد */
  async deleteRequirement(reqId: string): Promise<void> {
    const { error } = await this.db
      .from('JobRequirement')
      .delete()
      .eq('id', reqId);

    if (error) throw error;
  }

  /**
   * اقتراح متطلبات من نص JD
   * خوارزمية بسيطة: تقسيم سطور/نِقَاط + وسم must/nice وتخمين الوزن.
   */
  async suggestFromJD(jdText: string): Promise<JobRequirement[]> {
    const lines = jdText
      .split(/\r?\n|[•\-–]\s+/g)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 30); // لا نبالغ

    const items: JobRequirement[] = lines.map(l => {
      const lower = l.toLowerCase();
      const must =
        lower.includes('must') ||
        lower.includes('required') ||
        lower.includes('mandatory') ||
        lower.includes('ينبغي') ||
        lower.includes('إلزامي') ||
        lower.includes('أساسي');

      const nice =
        lower.includes('nice to have') ||
        lower.includes('preferred') ||
        lower.includes('plus') ||
        lower.includes('يفضّل') ||
        lower.includes('ميزة');

      let weight = must ? 10 : nice ? 3 : 5;

      // محاولة استخراج وزن بصيغة W3/W5
      const wMatch = lower.match(/\bw\s*([0-9]{1,2})\b/);
      if (wMatch) weight = Math.max(0, Math.min(10, Number(wMatch[1])));

      return {
        requirement: l,
        mustHave: must,
        weight,
      };
    });

    // إزالة التكرارات البسيطة
    const uniq: JobRequirement[] = [];
    const seen = new Set<string>();
    for (const it of items) {
      const key = it.requirement.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(it);
      }
    }

    return uniq.slice(0, 20);
  }
}
