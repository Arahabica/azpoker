import assert from "node:assert/strict";
import test from "node:test";

import {
  SOUND_GAINS,
  SOUND_URLS,
  WARNING_LOOP_END_SECONDS,
  WARNING_LOOP_START_SECONDS,
  createSoundEffects,
} from "../src/sound-effects.ts";

class FakeSource {
  constructor() {
    this.buffer = null;
    this.connectedTo = null;
    this.startedAt = null;
    this.stoppedAt = null;
    this.onended = null;
    this.loop = false;
    this.loopStart = 0;
    this.loopEnd = 0;
  }

  connect(destination) {
    this.connectedTo = destination;
  }

  start(when) {
    this.startedAt = when;
  }

  stop(when) {
    this.stoppedAt = when;
  }
}

class FakeGain {
  constructor() {
    this.gain = { value: 1 };
    this.connectedTo = null;
  }

  connect(destination) {
    this.connectedTo = destination;
  }
}

class FakeAudioContext {
  static instances = [];

  constructor() {
    this.state = "suspended";
    this.destination = { name: "destination" };
    this.decoded = [];
    this.sources = [];
    this.gains = [];
    this.resumeCount = 0;
    this.closeCount = 0;
    FakeAudioContext.instances.push(this);
  }

  async resume() {
    this.resumeCount += 1;
    this.state = "running";
  }

  async decodeAudioData(encoded) {
    const buffer = { encoded };
    this.decoded.push(buffer);
    return buffer;
  }

  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  async close() {
    this.closeCount += 1;
    this.state = "closed";
  }
}

function createFakeFetch() {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(url);
    return {
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode(url).buffer,
    };
  };
  return { fetchImpl, urls };
}

function createReceiverCheckedFetch() {
  const urls = [];
  const fetchImpl = async function (url) {
    if (this !== globalThis) {
      throw new TypeError("Illegal invocation");
    }
    urls.push(url);
    return {
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode(url).buffer,
    };
  };
  return { fetchImpl, urls };
}

test("開始前に6つの効果音を取得してAudioBufferへデコードする", async () => {
  FakeAudioContext.instances = [];
  const { fetchImpl, urls } = createFakeFetch();
  const sounds = createSoundEffects({
    AudioContextConstructor: FakeAudioContext,
    fetchImpl,
  });

  assert.deepEqual(Object.keys(SOUND_URLS), [
    "start",
    "correct",
    "wrong",
    "warning",
    "complete",
    "perfect",
  ]);
  assert.equal(SOUND_URLS.perfect, "/sounds/otologic-ooatari3-7s.mp3");
  assert.equal(await sounds.preload(), true);
  assert.deepEqual(urls, Object.values(SOUND_URLS));
  assert.equal(FakeAudioContext.instances[0].decoded.length, 6);

  await sounds.preload();
  assert.equal(urls.length, 6, "デコード済みの音源を再取得しない");
});

test("Window.fetchの呼び出し元を維持して音源を取得する", async () => {
  const { fetchImpl, urls } = createReceiverCheckedFetch();
  const sounds = createSoundEffects({
    AudioContextConstructor: FakeAudioContext,
    fetchImpl,
  });

  assert.equal(await sounds.preload(), true);
  assert.deepEqual(urls, Object.values(SOUND_URLS));
});

test("再生時にAudioContextを再開してデコード済み音源を即再生する", async () => {
  FakeAudioContext.instances = [];
  const { fetchImpl } = createFakeFetch();
  const sounds = createSoundEffects({
    AudioContextConstructor: FakeAudioContext,
    fetchImpl,
  });
  await sounds.preload();
  await sounds.resume();

  const context = FakeAudioContext.instances[0];
  const playback = sounds.play("correct");
  assert.equal(context.sources.length, 1, "再生時に非同期の読み込みを挟まない");
  assert.equal(await playback, true);
  const source = context.sources[0];
  assert.equal(context.resumeCount, 1);
  assert.equal(
    new TextDecoder().decode(source.buffer.encoded),
    SOUND_URLS.correct,
  );
  const gain = context.gains[0];
  assert.equal(source.connectedTo, gain);
  assert.equal(gain.connectedTo, context.destination);
  assert.equal(gain.gain.value, 1);
  assert.equal(source.startedAt, 0);

  sounds.stopAll();
  assert.equal(source.stoppedAt, 0);
  sounds.destroy();
  assert.equal(context.closeCount, 1);
});

test("時間警告だけ音量を40%に下げて時間切れまで反復できる", async () => {
  FakeAudioContext.instances = [];
  const { fetchImpl } = createFakeFetch();
  const sounds = createSoundEffects({
    AudioContextConstructor: FakeAudioContext,
    fetchImpl,
  });
  await sounds.preload();
  await sounds.resume();

  assert.equal(await sounds.play("warning"), true);
  const context = FakeAudioContext.instances[0];
  const source = context.sources[0];
  assert.equal(context.gains[0].gain.value, 0.4);
  assert.equal(SOUND_GAINS.warning, 0.4);
  assert.equal(source.loop, true);
  assert.equal(source.loopStart, WARNING_LOOP_START_SECONDS);
  assert.equal(source.loopEnd, WARNING_LOOP_END_SECONDS);

  sounds.stopAll();
  assert.equal(source.stoppedAt, 0);
});

test("音源を取得できなくてもクイズ用の処理へ例外を漏らさない", async () => {
  const sounds = createSoundEffects({
    AudioContextConstructor: FakeAudioContext,
    fetchImpl: async () => ({ ok: false }),
  });

  assert.equal(await sounds.preload(), false);
  assert.equal(await sounds.play("wrong"), false);
});

test("Web Audio APIを初期化できない場合は明示的に失敗する", () => {
  assert.throws(
    () =>
      createSoundEffects({ AudioContextConstructor: null, fetchImpl: fetch }),
    /Web Audio API is unavailable/,
  );
});
