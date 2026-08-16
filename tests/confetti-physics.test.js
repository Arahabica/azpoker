import assert from "node:assert/strict";
import test from "node:test";

import {
  createPerfectConfettiParticles,
  getConfettiPosition,
  PERFECT_CONFETTI_COUNT,
  PERFECT_CONFETTI_EMISSION_DURATION_MS,
  PERFECT_CONFETTI_GRAVITY,
} from "../src/confetti-physics.ts";

test("設定された枚数の紙吹雪を噴射時間全体へ均等に分散する", () => {
  const particles = createPerfectConfettiParticles();
  assert.equal(particles.length, PERFECT_CONFETTI_COUNT);
  assert.ok(particles[0].emittedAtMs <= 10);
  assert.ok(
    particles.at(-1).emittedAtMs >= PERFECT_CONFETTI_EMISSION_DURATION_MS - 10,
  );

  let largestInterval = 0;
  for (let index = 1; index < particles.length; index += 1) {
    const previous = particles[index - 1];
    const current = particles[index];
    largestInterval = Math.max(
      largestInterval,
      current.emittedAtMs - previous.emittedAtMs,
    );
  }
  assert.ok(largestInterval < 20);
});

test("紙片は横へ等速、縦へ共通重力の放物線で進む", () => {
  const particle = createPerfectConfettiParticles()[0];
  const start = getConfettiPosition(particle, 0);
  const halfSecond = getConfettiPosition(particle, 0.5);
  const oneSecond = getConfettiPosition(particle, 1);

  const firstHorizontalStep = halfSecond.x - start.x;
  const secondHorizontalStep = oneSecond.x - halfSecond.x;
  assert.ok(Math.abs(firstHorizontalStep - secondHorizontalStep) < 1e-12);

  const verticalSecondDifference = oneSecond.y - 2 * halfSecond.y + start.y;
  assert.ok(
    Math.abs(verticalSecondDifference - PERFECT_CONFETTI_GRAVITY * 0.25) <
      1e-12,
  );
});

test("紙片は画面上部まで上がってから落下する", () => {
  const particles = createPerfectConfettiParticles();
  const highestPoint = Math.min(
    ...particles.map((particle) => {
      const apexAge = -particle.velocityY / particle.gravity;
      return getConfettiPosition(particle, apexAge).y;
    }),
  );

  assert.ok(highestPoint < 0.12);
});

test("噴射口は左右上部の画面外にあり、中央かつ上向きに噴射する", () => {
  const particles = createPerfectConfettiParticles();

  for (const particle of particles) {
    assert.ok(particle.originX < 0 || particle.originX > 1);
    assert.ok(particle.originY >= 0 && particle.originY < 0.25);
    assert.ok(particle.velocityY < 0);
    assert.equal(particle.velocityX > 0, particle.originX < 0);
  }
});
