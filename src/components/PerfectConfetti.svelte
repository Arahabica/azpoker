<script lang="ts">
  import { onMount } from "svelte";

  import {
    createPerfectConfettiParticles,
    getConfettiAnimationDurationMs,
    getConfettiPosition,
    PERFECT_CONFETTI_COUNT,
    PERFECT_CONFETTI_EMISSION_DURATION_MS,
  } from "../confetti-physics.ts";

  let canvasElement = $state<HTMLCanvasElement>();
  const particles = createPerfectConfettiParticles();

  onMount(() => {
    const canvas = canvasElement;
    if (!canvas) return;

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const activeCanvas: HTMLCanvasElement = canvas;
    const activeContext: CanvasRenderingContext2D = context;

    let canvasWidth = 0;
    let canvasHeight = 0;
    let animationFrame: number | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let usesWindowResize = false;

    function resizeCanvas(): void {
      const bounds = activeCanvas.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const physicalWidth = Math.max(1, Math.round(bounds.width * pixelRatio));
      const physicalHeight = Math.max(
        1,
        Math.round(bounds.height * pixelRatio),
      );

      if (
        activeCanvas.width !== physicalWidth ||
        activeCanvas.height !== physicalHeight
      ) {
        activeCanvas.width = physicalWidth;
        activeCanvas.height = physicalHeight;
      }

      canvasWidth = bounds.width;
      canvasHeight = bounds.height;
      activeContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    resizeCanvas();
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(activeCanvas);
    } else {
      window.addEventListener("resize", resizeCanvas);
      usesWindowResize = true;
    }

    const startedAt = performance.now();
    const animationDurationMs = getConfettiAnimationDurationMs(particles);

    function render(frameTime: number): void {
      const elapsedMs = frameTime - startedAt;
      activeContext.clearRect(0, 0, canvasWidth, canvasHeight);

      for (const particle of particles) {
        if (particle.emittedAtMs > elapsedMs) break;

        const ageMs = elapsedMs - particle.emittedAtMs;
        if (ageMs > particle.lifetimeMs) continue;

        const ageSeconds = ageMs / 1_000;
        const position = getConfettiPosition(particle, ageSeconds);
        const x = position.x * canvasWidth;
        const y = position.y * canvasHeight;
        if (
          x < -particle.width ||
          x > canvasWidth + particle.width ||
          y < -particle.height ||
          y > canvasHeight + particle.height
        ) {
          continue;
        }

        activeContext.save();
        activeContext.translate(x, y);
        activeContext.rotate(
          particle.rotation + particle.angularVelocity * ageSeconds,
        );
        activeContext.scale(
          Math.cos(particle.flipPhase + particle.flipVelocity * ageSeconds),
          1,
        );
        activeContext.globalAlpha = particle.opacity;
        activeContext.fillStyle = particle.color;

        if (particle.shape === "circle") {
          activeContext.beginPath();
          activeContext.arc(0, 0, particle.width / 2, 0, Math.PI * 2);
          activeContext.fill();
        } else {
          activeContext.fillRect(
            -particle.width / 2,
            -particle.height / 2,
            particle.width,
            particle.height,
          );
        }
        activeContext.restore();
      }

      if (elapsedMs <= animationDurationMs) {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver?.disconnect();
      if (usesWindowResize) {
        window.removeEventListener("resize", resizeCanvas);
      }
    };
  });
</script>

<canvas
  bind:this={canvasElement}
  class="confetti-canvas"
  width="1"
  height="1"
  aria-hidden="true"
  data-confetti-count={PERFECT_CONFETTI_COUNT}
  data-emission-duration-ms={PERFECT_CONFETTI_EMISSION_DURATION_MS}
></canvas>

<style>
  .confetti-canvas {
    position: absolute;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .confetti-canvas {
      display: none;
    }
  }
</style>
