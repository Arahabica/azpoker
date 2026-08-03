import type { SoundName } from "./types.ts";

type AudioContextConstructor = new (
  contextOptions?: AudioContextOptions,
) => AudioContext;

interface SoundEffectsOptions {
  AudioContextConstructor?: AudioContextConstructor;
  fetchImpl?: typeof fetch;
}

const SOUND_URLS: Readonly<Record<SoundName, string>> = Object.freeze({
  start: "/sounds/kettei_33.mp3",
  correct: "/sounds/audiostock_106548.mp3",
  wrong: "/sounds/kettei_2.mp3",
  complete: "/sounds/kettei_37.mp3",
  perfect: "/sounds/kettei_21.mp3",
});

class SoundEffects {
  readonly context: AudioContext;
  readonly fetchImpl: typeof fetch;
  readonly buffers = new Map<SoundName, AudioBuffer>();
  readonly pendingLoads = new Map<SoundName, Promise<AudioBuffer>>();
  readonly activeSources = new Set<AudioBufferSourceNode>();

  constructor({ AudioContextConstructor, fetchImpl }: SoundEffectsOptions) {
    if (typeof AudioContextConstructor !== "function") {
      throw new TypeError("Web Audio API is unavailable");
    }
    if (typeof fetchImpl !== "function") {
      throw new TypeError("fetch is unavailable");
    }

    this.context = new AudioContextConstructor();
    this.fetchImpl = fetchImpl;
  }

  isRunning(): boolean {
    return this.context.state === "running";
  }

  async resume(): Promise<boolean> {
    if (this.isRunning()) return true;
    try {
      await this.context.resume();
      return this.isRunning();
    } catch {
      return false;
    }
  }

  async load(name: SoundName): Promise<AudioBuffer | null> {
    const buffered = this.buffers.get(name);
    if (buffered) return buffered;
    const pendingLoad = this.pendingLoads.get(name);
    if (pendingLoad) return pendingLoad;

    const url = SOUND_URLS[name];
    if (!url) return null;

    const pending = (async () => {
      const response = await this.fetchImpl(url);
      if (!response.ok) throw new Error(`Failed to load sound: ${name}`);
      const encoded = await response.arrayBuffer();
      const buffer = await this.context.decodeAudioData(encoded);
      this.buffers.set(name, buffer);
      return buffer;
    })();
    this.pendingLoads.set(name, pending);

    try {
      return await pending;
    } catch {
      return null;
    } finally {
      this.pendingLoads.delete(name);
    }
  }

  async preload(): Promise<boolean> {
    const buffers = await Promise.all(
      (Object.keys(SOUND_URLS) as SoundName[]).map((name) => this.load(name)),
    );
    return buffers.every(Boolean);
  }

  start(buffer: AudioBuffer): boolean {
    try {
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      this.activeSources.add(source);
      source.onended = () => this.activeSources.delete(source);
      source.start(0);
      return true;
    } catch {
      return false;
    }
  }

  play(name: SoundName): Promise<boolean> {
    const buffer = this.buffers.get(name);
    if (buffer && this.context.state === "running") {
      return Promise.resolve(this.start(buffer));
    }

    return Promise.all([this.resume(), buffer ?? this.load(name)])
      .then(([ready, loaded]) => {
        if (!ready || !loaded) return false;
        return this.start(loaded);
      })
      .catch(() => false);
  }

  stopAll(): void {
    for (const source of this.activeSources) {
      try {
        source.stop(0);
      } catch {
        // The source may already have ended.
      }
    }
    this.activeSources.clear();
  }

  destroy(): void {
    this.stopAll();
    try {
      this.context.close?.().catch?.(() => {});
    } catch {
      // Sound cleanup must not stop the app from being destroyed.
    }
  }
}

function createSoundEffects({
  AudioContextConstructor = globalThis.AudioContext
    ?? (globalThis as typeof globalThis & {
      webkitAudioContext?: AudioContextConstructor;
    }).webkitAudioContext,
  fetchImpl = globalThis.fetch,
}: SoundEffectsOptions = {}): SoundEffects {
  return new SoundEffects({ AudioContextConstructor, fetchImpl });
}

export { SOUND_URLS, SoundEffects, createSoundEffects };
