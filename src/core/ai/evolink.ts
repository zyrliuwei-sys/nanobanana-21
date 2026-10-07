/**
 * Evolink image generation (async task API).
 *
 *   POST {base}/v1/images/generations  -> { id, status, progress, ... }
 *   GET  {base}/v1/tasks/{id}          -> { status, progress, results[], error }
 *
 * status: pending | processing | completed | failed. Result URLs expire after
 * 24 hours, so callers must copy them to their own storage.
 */

export const EVOLINK_DEFAULT_BASE_URL = 'https://api.evolink.ai';

export type EvolinkTaskStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface EvolinkTask {
  id: string;
  status: EvolinkTaskStatus;
  progress: number;
  results: string[];
  error?: { code?: string; message?: string };
  usageUsd?: number;
}

export interface EvolinkImageRequest {
  model: string;
  prompt: string;
  size?: string;
  quality?: '1K' | '2K' | '4K';
  imageUrls?: string[];
}

export class EvolinkClient {
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    baseUrl?: string
  ) {
    this.baseUrl = (baseUrl || EVOLINK_DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  private async request(path: string, init?: RequestInit): Promise<any> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      signal: AbortSignal.timeout(30_000),
    });
    const text = await resp.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // non-JSON error body
    }
    if (!resp.ok) {
      const msg = json?.error?.message || json?.message || text.slice(0, 300);
      throw new Error(`evolink ${resp.status}: ${msg}`);
    }
    return json;
  }

  async submitImage(req: EvolinkImageRequest): Promise<EvolinkTask> {
    const body: Record<string, unknown> = {
      model: req.model,
      prompt: req.prompt,
    };
    if (req.size) body.size = req.size;
    if (req.quality) body.quality = req.quality;
    if (req.imageUrls?.length) body.image_urls = req.imageUrls;
    const json = await this.request('/v1/images/generations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!json?.id) throw new Error('evolink: no task id returned');
    return toTask(json);
  }

  async getTask(id: string): Promise<EvolinkTask> {
    return toTask(await this.request(`/v1/tasks/${encodeURIComponent(id)}`));
  }
}

function toTask(json: any): EvolinkTask {
  const results: string[] = Array.isArray(json.results)
    ? json.results.filter((u: unknown) => typeof u === 'string')
    : [];
  return {
    id: String(json.id),
    status: json.status,
    progress: Number(json.progress) || 0,
    results,
    error: json.error,
    usageUsd: json.usage?.cost?.usd,
  };
}
