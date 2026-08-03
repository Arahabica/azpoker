import assert from "node:assert/strict";
import test from "node:test";

import { SOUND_URLS, createSoundEffects } from "../src/sound-effects.js";

class FakeAudio {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.currentTime = 0;
    this.loadCount = 0;
    this.playCount = 0;
    this.pauseCount = 0;
    FakeAudio.instances.push(this);
  }

  load() {
    this.loadCount += 1;
  }

  play() {
    this.playCount += 1;
    return Promise.resolve();
  }

  pause() {
    this.pauseCount += 1;
  }
}

test("開始前に5つの効果音を先読みする", () => {
  FakeAudio.instances = [];
  const sounds = createSoundEffects(FakeAudio);

  assert.deepEqual(Object.keys(SOUND_URLS), [
    "start",
    "correct",
    "wrong",
    "complete",
    "perfect",
  ]);
  assert.equal(FakeAudio.instances.length, 5);
  assert.ok(FakeAudio.instances.every((audio) => audio.preload === "auto"));

  sounds.preload();
  assert.ok(FakeAudio.instances.every((audio) => audio.loadCount === 1));
});

test("同じ効果音を先頭から再生し、終了時に全音声を止める", () => {
  FakeAudio.instances = [];
  const sounds = createSoundEffects(FakeAudio);
  const correct = FakeAudio.instances.find(
    (audio) => audio.url === SOUND_URLS.correct,
  );
  correct.currentTime = 1.5;

  sounds.play("correct");
  assert.equal(correct.currentTime, 0);
  assert.equal(correct.playCount, 1);

  sounds.stopAll();
  assert.ok(FakeAudio.instances.every((audio) => audio.pauseCount === 1));
  assert.ok(FakeAudio.instances.every((audio) => audio.currentTime === 0));
});
