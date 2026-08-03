const SOUND_URLS = Object.freeze({
  start: "/sounds/kettei_33.mp3",
  correct: "/sounds/audiostock_106548.mp3",
  wrong: "/sounds/kettei_2.mp3",
  complete: "/sounds/kettei_37.mp3",
  perfect: "/sounds/kettei_21.mp3",
});

class SoundEffect {
  constructor(url, AudioConstructor = globalThis.Audio) {
    if (typeof AudioConstructor !== "function") {
      throw new TypeError("Audio is unavailable");
    }

    this.audio = new AudioConstructor(url);
    this.audio.preload = "auto";
  }

  preload() {
    this.audio.load?.();
  }

  play() {
    try {
      this.audio.currentTime = 0;
      const playback = this.audio.play();
      playback?.catch?.(() => {});
    } catch {
      // Sound failures must not stop the quiz.
    }
  }

  stop() {
    this.audio.pause?.();
    try {
      this.audio.currentTime = 0;
    } catch {
      // Some browsers reject currentTime before metadata is ready.
    }
  }
}

function createSoundEffects(AudioConstructor = globalThis.Audio) {
  const effects = Object.fromEntries(
    Object.entries(SOUND_URLS).map(([name, url]) => [
      name,
      new SoundEffect(url, AudioConstructor),
    ]),
  );

  return Object.freeze({
    preload() {
      Object.values(effects).forEach((effect) => effect.preload());
    },
    play(name) {
      effects[name]?.play();
    },
    stopAll() {
      Object.values(effects).forEach((effect) => effect.stop());
    },
  });
}

export { SOUND_URLS, SoundEffect, createSoundEffects };
