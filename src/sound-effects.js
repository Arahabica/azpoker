const SOUND_URLS = Object.freeze({
  start: "/sounds/kettei_33.mp3",
  correct: "/sounds/audiostock_106548.mp3",
  wrong: "/sounds/kettei_2.mp3",
  complete: "/sounds/kettei_37.mp3",
  perfect: "/sounds/kettei_21.mp3",
});

class SoundEffects {
  constructor({ AudioContextConstructor, fetchImpl }) {
    if (typeof AudioContextConstructor !== "function") {
      throw new TypeError("Web Audio API is unavailable");
    }
    if (typeof fetchImpl !== "function") {
      throw new TypeError("fetch is unavailable");
    }

    this.context = new AudioContextConstructor();
    this.fetchImpl = fetchImpl;
    this.buffers = new Map();
    this.pendingLoads = new Map();
    this.activeSources = new Set();
  }

  async resume() {
    if (this.context.state === "running") return true;
    try {
      await this.context.resume();
      return this.context.state === "running";
    } catch {
      return false;
    }
  }

  async load(name) {
    if (this.buffers.has(name)) return this.buffers.get(name);
    if (this.pendingLoads.has(name)) return this.pendingLoads.get(name);

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

  async preload() {
    const buffers = await Promise.all(
      Object.keys(SOUND_URLS).map((name) => this.load(name)),
    );
    return buffers.every(Boolean);
  }

  start(buffer) {
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

  play(name) {
    const buffer = this.buffers.get(name);
    if (buffer && this.context.state === "running") {
      return Promise.resolve(this.start(buffer));
    }

    return Promise.all([this.resume(), buffer ?? this.load(name)])
      .then(([ready, loaded]) => ready && Boolean(loaded) && this.start(loaded))
      .catch(() => false);
  }

  stopAll() {
    for (const source of this.activeSources) {
      try {
        source.stop(0);
      } catch {
        // The source may already have ended.
      }
    }
    this.activeSources.clear();
  }

  destroy() {
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
    ?? globalThis.webkitAudioContext,
  fetchImpl = globalThis.fetch,
} = {}) {
  return new SoundEffects({ AudioContextConstructor, fetchImpl });
}

export { SOUND_URLS, SoundEffects, createSoundEffects };
