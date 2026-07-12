const VIDEO_DB_API = "https://api.videodb.io";
const CLIENT_HEADER = "cerno/0.2";

export type VideoDbAsset = {
  id: string;
  collection_id?: string;
  name?: string;
  length?: number | string;
  stream_url?: string;
  player_url?: string;
};

export type VideoDbShot = {
  videoId: string;
  start: number;
  end: number;
  text: string;
  score?: number;
  streamUrl?: string;
  playerUrl?: string;
};

export type VideoDbTranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

type VideoDbEnvelope = {
  success?: boolean;
  status?: string;
  request_type?: string;
  message?: string;
  data?: unknown;
  response?: VideoDbEnvelope;
};

function finiteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function errorMessage(payload: VideoDbEnvelope, fallback: string) {
  return typeof payload.message === "string" && payload.message.trim() ? payload.message : fallback;
}

export class VideoDbClient {
  constructor(private readonly apiKey: string) {}

  private headers(includeSecret = true) {
    return {
      ...(includeSecret ? { "x-access-token": this.apiKey } : {}),
      "x-videodb-client": CLIENT_HEADER,
      "Content-Type": "application/json",
    };
  }

  private async fetchEnvelope(url: string, init?: RequestInit, includeSecret = true) {
    const response = await fetch(url, {
      ...init,
      headers: { ...this.headers(includeSecret), ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(90_000),
    });
    const text = await response.text();
    let payload: VideoDbEnvelope;
    try {
      payload = JSON.parse(text) as VideoDbEnvelope;
    } catch {
      throw new Error(`VideoDB returned a non-JSON response (${response.status}).`);
    }
    if (!response.ok) {
      throw new Error(`VideoDB request failed (${response.status}): ${errorMessage(payload, "unknown error")}`);
    }
    return payload;
  }

  private async unwrap<T>(payload: VideoDbEnvelope): Promise<T> {
    if (payload.status === "processing" && payload.request_type === "async") {
      throw new Error("VideoDB accepted an asynchronous operation without a callback result.");
    }

    if (payload.status === "processing") {
      const outputUrl = (payload.data as { output_url?: unknown } | undefined)?.output_url;
      if (typeof outputUrl !== "string" || !outputUrl.startsWith("https://")) {
        throw new Error("VideoDB processing response did not include a secure output URL.");
      }
      for (let attempt = 0; attempt < 100; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 5_000));
        const outputHost = new URL(outputUrl).hostname;
        const polled = await this.fetchEnvelope(
          outputUrl,
          undefined,
          outputHost === "api.videodb.io" || outputHost.endsWith(".videodb.io"),
        );
        if (polled.status === "processing" || polled.status === "in_progress") continue;
        return await this.unwrap<T>(polled.response ?? polled);
      }
      throw new Error("VideoDB processing exceeded the bounded eight-minute wait.");
    }

    if (payload.success === false) throw new Error(`VideoDB rejected the request: ${errorMessage(payload, "unknown error")}`);
    return payload.data as T;
  }

  private async request<T>(path: string, init?: RequestInit) {
    const payload = await this.fetchEnvelope(`${VIDEO_DB_API}/${path.replace(/^\//, "")}`, init);
    return await this.unwrap<T>(payload);
  }

  async verify() {
    return await this.request<{ id: string; name?: string }>("collection/default");
  }

  async uploadUrl(url: string, name: string, description: string) {
    const asset = await this.request<VideoDbAsset>("collection/default/upload", {
      method: "POST",
      body: JSON.stringify({
        url,
        name,
        description,
        callback_url: null,
        media_type: null,
      }),
    });
    if (!asset?.id) throw new Error("VideoDB upload returned no media ID.");
    return asset;
  }

  async indexSpokenWords(videoId: string) {
    await this.request<unknown>(`video/${encodeURIComponent(videoId)}/index`, {
      method: "POST",
      body: JSON.stringify({
        index_type: "spoken_word",
        language_code: null,
        segmentation_type: "sentence",
        force: true,
        callback_url: null,
      }),
    });
  }

  async searchSpokenWords(videoId: string, query: string) {
    const data = await this.request<{ results?: Array<{ video_id?: string; docs?: Array<Record<string, unknown>> }> }>(
      `video/${encodeURIComponent(videoId)}/search`,
      {
        method: "POST",
        body: JSON.stringify({
          search_type: "semantic",
          index_type: "spoken_word",
          query,
          score_threshold: 0.25,
          result_threshold: 5,
        }),
      },
    );
    const shots: VideoDbShot[] = [];
    for (const result of data?.results ?? []) {
      for (const doc of result.docs ?? []) {
        const start = finiteNumber(doc.start, -1);
        const end = finiteNumber(doc.end, -1);
        if (start < 0 || end <= start || typeof doc.text !== "string") continue;
        shots.push({
          videoId: result.video_id ?? videoId,
          start,
          end,
          text: doc.text.trim(),
          score: finiteNumber(doc.score, 0),
          streamUrl: typeof doc.stream_link === "string" ? doc.stream_link : undefined,
          playerUrl: typeof doc.player_url === "string" ? doc.player_url : undefined,
        });
      }
    }
    return shots.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
  }

  async transcript(videoId: string, start?: number, end?: number) {
    const params = new URLSearchParams({ segmenter: "sentence", length: "1", force: "false" });
    if (start !== undefined) params.set("start", String(Math.max(0, Math.floor(start))));
    if (end !== undefined) params.set("end", String(Math.max(0, Math.ceil(end))));
    const data = await this.request<{ word_timestamps?: Array<Record<string, unknown>> }>(
      `video/${encodeURIComponent(videoId)}/transcription?${params.toString()}`,
    );
    return (data?.word_timestamps ?? [])
      .map((segment): VideoDbTranscriptSegment | null => {
        const segmentStart = finiteNumber(segment.start, -1);
        const segmentEnd = finiteNumber(segment.end, -1);
        const text = typeof segment.text === "string" ? segment.text.trim() : "";
        return segmentStart >= 0 && segmentEnd > segmentStart && text
          ? { start: segmentStart, end: segmentEnd, text }
          : null;
      })
      .filter((segment): segment is VideoDbTranscriptSegment => segment !== null);
  }

  async momentStream(videoId: string, start: number, end: number, videoLength: number) {
    const safeStart = Math.max(0, start - 3);
    const safeEnd = Math.max(safeStart + 1, Math.min(videoLength || end + 3, end + 3));
    return await this.request<{ stream_url?: string; player_url?: string }>(
      `video/${encodeURIComponent(videoId)}/stream`,
      {
        method: "POST",
        body: JSON.stringify({ timeline: [[safeStart, safeEnd]], length: videoLength }),
      },
    );
  }
}

export function playerUrl(streamUrl?: string, suppliedPlayerUrl?: string) {
  if (suppliedPlayerUrl) return suppliedPlayerUrl;
  return streamUrl ? `https://console.videodb.io/player?url=${encodeURIComponent(streamUrl)}` : undefined;
}
