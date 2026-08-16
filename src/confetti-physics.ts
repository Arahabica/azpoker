export const PERFECT_CONFETTI_COUNT = 720;
export const PERFECT_CONFETTI_EMISSION_DURATION_MS = 3_200;
export const PERFECT_CONFETTI_GRAVITY = 0.22;

const CONFETTI_EXIT_Y = 1.08;
const CONFETTI_COLORS = [
  "#f1c40f",
  "#ff6b6f",
  "#20ca91",
  "#f8f5ec",
  "#7d8cff",
] as const;

export type ConfettiShape = "rectangle" | "wide" | "circle";

export interface ConfettiParticle {
  id: number;
  emittedAtMs: number;
  lifetimeMs: number;
  originX: number;
  originY: number;
  velocityX: number;
  velocityY: number;
  gravity: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  shape: ConfettiShape;
  rotation: number;
  angularVelocity: number;
  flipPhase: number;
  flipVelocity: number;
}

export interface ConfettiPosition {
  x: number;
  y: number;
}

function confettiNoise(index: number, salt: number): number {
  let value =
    Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 4_294_967_295;
}

function getLifetimeSeconds(
  originY: number,
  velocityY: number,
  gravity: number,
): number {
  const distanceToExit = CONFETTI_EXIT_Y - originY;
  return (
    (-velocityY + Math.sqrt(velocityY ** 2 + 2 * gravity * distanceToExit)) /
    gravity
  );
}

export function createPerfectConfettiParticles(
  count = PERFECT_CONFETTI_COUNT,
): ConfettiParticle[] {
  const particles = Array.from({ length: count }, (_, index) => {
    const fromLeft = index % 2 === 0;
    const direction = fromLeft ? 1 : -1;
    const originInset = 0.025 + confettiNoise(index, 0) * 0.055;
    const originY = -0.035 + confettiNoise(index, 1) * 0.07;
    const velocityY = -(0.025 + confettiNoise(index, 2) * 0.03);
    const gravity = PERFECT_CONFETTI_GRAVITY;
    const lifetimeSeconds = getLifetimeSeconds(originY, velocityY, gravity);
    const baseEmissionTime =
      count <= 1
        ? 0
        : (index / (count - 1)) * PERFECT_CONFETTI_EMISSION_DURATION_MS;
    const emittedAtMs = Math.min(
      PERFECT_CONFETTI_EMISSION_DURATION_MS,
      Math.max(0, baseEmissionTime + (confettiNoise(index, 3) - 0.5) * 10),
    );
    const shapeNoise = confettiNoise(index, 4);
    const shape: ConfettiShape =
      shapeNoise > 0.9 ? "circle" : shapeNoise > 0.63 ? "wide" : "rectangle";
    const size = 0.76 + confettiNoise(index, 5) * 0.48;
    const width =
      shape === "wide"
        ? (3.7 + confettiNoise(index, 6) * 2.1) * size
        : (2.1 + confettiNoise(index, 6) * 1.7) * size;
    const height =
      shape === "circle"
        ? width
        : shape === "wide"
          ? (2 + confettiNoise(index, 7) * 1.4) * size
          : (3.8 + confettiNoise(index, 7) * 3) * size;
    const rotationDirection = confettiNoise(index, 8) > 0.5 ? 1 : -1;

    return {
      id: index,
      emittedAtMs,
      lifetimeMs: lifetimeSeconds * 1_000,
      originX: fromLeft ? -originInset : 1 + originInset,
      originY,
      velocityX: direction * (0.2 + confettiNoise(index, 9) * 0.32),
      velocityY,
      gravity,
      width,
      height,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length]!,
      opacity: 0.78 + confettiNoise(index, 10) * 0.22,
      shape,
      rotation: confettiNoise(index, 11) * Math.PI * 2,
      angularVelocity:
        rotationDirection * (3.2 + confettiNoise(index, 12) * 5.8),
      flipPhase: confettiNoise(index, 13) * Math.PI * 2,
      flipVelocity: 4.5 + confettiNoise(index, 14) * 6.5,
    } satisfies ConfettiParticle;
  });

  return particles.sort((left, right) => left.emittedAtMs - right.emittedAtMs);
}

export function getConfettiPosition(
  particle: ConfettiParticle,
  ageSeconds: number,
): ConfettiPosition {
  return {
    x: particle.originX + particle.velocityX * ageSeconds,
    y:
      particle.originY +
      particle.velocityY * ageSeconds +
      0.5 * particle.gravity * ageSeconds ** 2,
  };
}

export function getConfettiAnimationDurationMs(
  particles: readonly ConfettiParticle[],
): number {
  return particles.reduce(
    (duration, particle) =>
      Math.max(duration, particle.emittedAtMs + particle.lifetimeMs),
    0,
  );
}
