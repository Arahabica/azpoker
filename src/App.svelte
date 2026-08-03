<script lang="ts">
  import { onDestroy, tick } from "svelte";

  import { createSession, shuffle } from "./game.ts";
  import { loadQuestionPool, rememberQuestions } from "./question-loader.ts";
  import { getQuestionTimeLimitMs } from "./question-timer.ts";
  import { createSoundEffects } from "./sound-effects.ts";
  import type { SoundEffects } from "./sound-effects.ts";
  import type {
    AnswerResult,
    PercentChoice,
    Question,
    QuestionAnswer,
    QuestionOutcome,
    SoundName,
  } from "./types.ts";
  import LandingScreen from "./screens/LandingScreen.svelte";
  import PrepareScreen from "./screens/PrepareScreen.svelte";
  import QuizScreen from "./screens/QuizScreen.svelte";
  import ResultScreen from "./screens/ResultScreen.svelte";

  type View = "landing" | "prepare" | "game" | "result";

  interface SettleQuestionOptions {
    correct: boolean;
    selected: QuestionAnswer | null;
    timedOut: boolean;
    elapsedMs: number;
  }

  let view = $state<View>("landing");
  let session = $state<Question[]>([]);
  let currentIndex = $state(0);
  let score = $state(0);
  let choices = $state<PercentChoice[]>([]);
  let answerResult = $state<AnswerResult | null>(null);
  let outcomes = $state<(QuestionOutcome | null)[]>([]);
  let startupError = $state("");
  let starting = $state(false);
  let preparationReady = $state(false);
  let soundEnabled = $state(true);
  let sessionElapsedMs = $state(0);
  let sessionTimeLimitMs = $state(0);
  let soundEffects: SoundEffects | undefined;

  const currentQuestion = $derived(session[currentIndex]);
  const timeoutCount = $derived(
    outcomes.filter((outcome) => outcome === "timeout").length,
  );

  async function focusElement(selector: string): Promise<void> {
    await tick();
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
    });
  }

  function showStartupError(error: unknown): void {
    startupError = error instanceof Error ? error.message : String(error);
  }

  function ensureSoundEffects() {
    const AudioContextConstructor = globalThis.AudioContext
      ?? (globalThis as typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;
    if (!soundEffects && typeof AudioContextConstructor === "function") {
      try {
        soundEffects = createSoundEffects({
          AudioContextConstructor,
          fetchImpl: globalThis.fetch,
        });
      } catch {
        return undefined;
      }
    }
    return soundEffects;
  }

  async function preloadSoundEffects(): Promise<void> {
    const effects = ensureSoundEffects();
    if (!effects) return;
    const resumePromise = soundEnabled
      ? effects.resume()
      : Promise.resolve(false);
    await Promise.all([effects.preload(), resumePromise]);
  }

  function setSoundEnabled(enabled: boolean): void {
    soundEnabled = Boolean(enabled);
    if (soundEnabled) {
      preloadSoundEffects();
    } else {
      soundEffects?.stopAll();
    }
  }

  function playSound(name: SoundName): void {
    if (soundEnabled) {
      ensureSoundEffects()?.play(name);
    }
  }

  async function preloadGameFonts(): Promise<void> {
    if (typeof document === "undefined" || !document.fonts) return;
    await Promise.allSettled([
      document.fonts.load('400 1rem "Kosugi Maru Game"'),
      document.fonts.load('400 1rem "M PLUS Rounded 1c UI"'),
      document.fonts.load('400 1rem "Arbutus Slab"'),
    ]);
  }

  function prepareQuestion(question: Question): void {
    answerResult = null;
    choices = question.answerType === "hand"
      ? []
      : shuffle([question.answer, question.distractor]);
    focusElement("#prompt");
  }

  async function selectSession(): Promise<Question[]> {
    let pool: Question[] = [];
    let nextSession: Question[] | undefined;
    const refreshOrder: readonly ("BC" | "A" | "D" | null)[] = [
      null,
      "BC",
      "A",
      "D",
    ];
    for (let attempt = 0; attempt < refreshOrder.length; attempt += 1) {
      pool = await loadQuestionPool(
        Math.random,
        globalThis.fetch,
        refreshOrder[attempt] ?? null,
      );
      try {
        nextSession = createSession(pool);
        break;
      } catch {
        // 条件を作りやすい問題群から順に100問を入れ替える。
      }
    }
    if (!nextSession) throw new Error("問題を選べませんでした");
    return nextSession;
  }

  async function prepareSession(): Promise<void> {
    if (starting) return;
    starting = true;
    preparationReady = false;
    startupError = "";
    try {
      const [nextSession] = await Promise.all([
        selectSession(),
        preloadGameFonts(),
        preloadSoundEffects(),
      ]);
      session = nextSession;
      rememberQuestions(session);
      currentIndex = 0;
      score = 0;
      outcomes = Array(nextSession.length).fill(null);
      sessionElapsedMs = 0;
      sessionTimeLimitMs = nextSession.reduce(
        (total, question) => total + getQuestionTimeLimitMs(question),
        0,
      );
      preparationReady = true;
      focusElement("#start-quiz");
    } catch (error) {
      showStartupError(error);
    } finally {
      starting = false;
    }
  }

  function showPreparation(): void {
    startupError = "";
    preparationReady = false;
    answerResult = null;
    outcomes = [];
    sessionElapsedMs = 0;
    sessionTimeLimitMs = 0;
    view = "prepare";
    focusElement("#prepare-title");
    prepareSession();
  }

  function startSession(): void {
    if (starting || !preparationReady || session.length === 0) return;
    playSound("start");
    view = "game";
    prepareQuestion(session[0]!);
  }

  function settleQuestion({
    correct,
    selected,
    timedOut,
    elapsedMs,
  }: SettleQuestionOptions): boolean {
    if (answerResult) {
      return false;
    }

    if (correct) {
      score += 1;
    }
    const question = currentQuestion;
    if (!question) return false;
    const timeLimitMs = getQuestionTimeLimitMs(question);
    sessionElapsedMs += Math.min(
      timeLimitMs,
      Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0),
    );
    let outcome: QuestionOutcome = "wrong";
    if (timedOut) {
      outcome = "timeout";
    } else if (correct) {
      outcome = "correct";
    }
    outcomes[currentIndex] = outcome;
    answerResult = { correct, selected, timedOut };
    playSound(correct ? "correct" : "wrong");
    focusElement("#next-question");
    return true;
  }

  function handleAnswer(selected: QuestionAnswer, elapsedMs: number): void {
    const question = currentQuestion;
    if (!question) return;
    settleQuestion({
      correct: selected === question.answer,
      selected,
      timedOut: false,
      elapsedMs,
    });
  }

  function handleTimeout(questionIndex: number, elapsedMs: number): void {
    if (view !== "game" || questionIndex !== currentIndex) {
      return;
    }

    settleQuestion({
      correct: false,
      selected: null,
      timedOut: true,
      elapsedMs,
    });
  }

  function showResult(): void {
    playSound(score === session.length ? "perfect" : "complete");
    view = "result";
    focusElement("#retry");
  }

  function goNext(): void {
    if (currentIndex === session.length - 1) {
      showResult();
      return;
    }

    currentIndex += 1;
    prepareQuestion(session[currentIndex]!);
  }

  function showLanding(shouldFocus = true): void {
    startupError = "";
    answerResult = null;
    outcomes = [];
    sessionElapsedMs = 0;
    sessionTimeLimitMs = 0;
    preparationReady = false;
    soundEffects?.stopAll();
    view = "landing";
    if (shouldFocus) {
      focusElement("#start-game");
    }
  }

  onDestroy(() => soundEffects?.destroy());
</script>

<main class="app-shell">
  {#if view === "landing"}
    <LandingScreen onStart={showPreparation} />
  {:else if view === "prepare"}
    <PrepareScreen
      {soundEnabled}
      loading={starting}
      ready={preparationReady}
      error={startupError}
      onSoundChange={setSoundEnabled}
      onStart={startSession}
      onRetry={prepareSession}
    />
  {:else if view === "game" && currentQuestion}
    <QuizScreen
      question={currentQuestion}
      {currentIndex}
      total={session.length}
      {choices}
      {answerResult}
      {outcomes}
      onLeave={showLanding}
      onAnswer={handleAnswer}
      onTimeout={handleTimeout}
      onNext={goNext}
    />
  {:else if view === "result"}
    <ResultScreen
      {score}
      total={session.length}
      elapsedMs={sessionElapsedMs}
      timeLimitMs={sessionTimeLimitMs}
      {timeoutCount}
      onRetry={showPreparation}
      onHome={showLanding}
    />
  {/if}
</main>

<style>
  .app-shell {
    position: relative;
    width: 100%;
    max-width: var(--app-max-width);
    min-height: 100vh;
    min-height: 100dvh;
    margin: 0 auto;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 32%, rgb(87 236 186 / 16%), transparent 54%),
      repeating-linear-gradient(
        118deg,
        transparent 0,
        transparent 4px,
        rgb(255 255 255 / 1.8%) 5px,
        transparent 6px
      ),
      linear-gradient(160deg, var(--felt-light), var(--felt) 50%, var(--felt-dark));
    isolation: isolate;
  }

  .app-shell::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(90deg, rgb(0 0 0 / 12%), transparent 9%, transparent 91%, rgb(0 0 0 / 12%)),
      radial-gradient(ellipse at 50% 56%, transparent 45%, rgb(0 31 24 / 18%) 100%);
    content: "";
    pointer-events: none;
  }

  @media (min-width: 481px) {
    .app-shell {
      border-right: 1px solid rgb(255 255 255 / 8%);
      border-left: 1px solid rgb(255 255 255 / 8%);
      box-shadow: 0 0 4rem rgb(0 0 0 / 46%);
    }
  }
</style>
