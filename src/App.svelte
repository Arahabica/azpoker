<script>
  import { onDestroy, tick } from "svelte";

  import { createSession, shuffle } from "./game.js";
  import { loadQuestionPool, rememberQuestions } from "./question-loader.js";
  import { getQuestionTimeLimitMs } from "./question-timer.js";
  import { createSoundEffects } from "./sound-effects.js";
  import LandingScreen from "./screens/LandingScreen.svelte";
  import PrepareScreen from "./screens/PrepareScreen.svelte";
  import QuizScreen from "./screens/QuizScreen.svelte";
  import ResultScreen from "./screens/ResultScreen.svelte";

  let view = $state("landing");
  let session = $state([]);
  let currentIndex = $state(0);
  let score = $state(0);
  let choices = $state([]);
  let answerResult = $state(null);
  let outcomes = $state([]);
  let startupError = $state("");
  let starting = $state(false);
  let preparationReady = $state(false);
  let soundEnabled = $state(true);
  let sessionElapsedMs = $state(0);
  let sessionTimeLimitMs = $state(0);
  let soundEffects;

  const currentQuestion = $derived(session[currentIndex]);
  const timeoutCount = $derived(
    outcomes.filter((outcome) => outcome === "timeout").length,
  );

  async function focusElement(selector) {
    await tick();
    window.requestAnimationFrame(() => {
      document.querySelector(selector)?.focus({ preventScroll: true });
    });
  }

  function showStartupError(error) {
    startupError = error instanceof Error ? error.message : String(error);
  }

  function ensureSoundEffects() {
    if (!soundEffects && typeof Audio === "function") {
      soundEffects = createSoundEffects(Audio);
    }
    return soundEffects;
  }

  function preloadSoundEffects() {
    if (soundEnabled) {
      ensureSoundEffects()?.preload();
    }
  }

  function setSoundEnabled(enabled) {
    soundEnabled = Boolean(enabled);
    if (soundEnabled) {
      preloadSoundEffects();
    } else {
      soundEffects?.stopAll();
    }
  }

  function playSound(name) {
    if (soundEnabled) {
      ensureSoundEffects()?.play(name);
    }
  }

  async function preloadGameFonts() {
    if (typeof document === "undefined" || !document.fonts) return;
    await Promise.allSettled([
      document.fonts.load('400 1rem "Kosugi Maru Game"'),
      document.fonts.load('400 1rem "M PLUS Rounded 1c UI"'),
      document.fonts.load('400 1rem "Arbutus Slab"'),
    ]);
  }

  function prepareQuestion(question) {
    answerResult = null;
    choices = question.answerType === "hand"
      ? []
      : shuffle([question.answer, question.distractor]);
    focusElement("#prompt");
  }

  async function selectSession() {
    let pool = [];
    let nextSession;
    const refreshOrder = [null, "BC", "A", "D"];
    for (let attempt = 0; attempt < refreshOrder.length; attempt += 1) {
      pool = await loadQuestionPool(Math.random, fetch, refreshOrder[attempt]);
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

  async function prepareSession() {
    if (starting) return;
    starting = true;
    preparationReady = false;
    startupError = "";
    try {
      const [nextSession] = await Promise.all([
        selectSession(),
        preloadGameFonts(),
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

  function showPreparation() {
    startupError = "";
    preparationReady = false;
    answerResult = null;
    outcomes = [];
    sessionElapsedMs = 0;
    sessionTimeLimitMs = 0;
    view = "prepare";
    preloadSoundEffects();
    focusElement("#prepare-title");
    prepareSession();
  }

  function startSession() {
    if (starting || !preparationReady || session.length === 0) return;
    playSound("start");
    view = "game";
    prepareQuestion(session[0]);
  }

  function settleQuestion({ correct, selected, timedOut, elapsedMs }) {
    if (answerResult) {
      return false;
    }

    if (correct) {
      score += 1;
    }
    const timeLimitMs = getQuestionTimeLimitMs(currentQuestion);
    sessionElapsedMs += Math.min(
      timeLimitMs,
      Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0),
    );
    let outcome = "wrong";
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

  function handleAnswer(selected, elapsedMs) {
    settleQuestion({
      correct: selected === currentQuestion.answer,
      selected,
      timedOut: false,
      elapsedMs,
    });
  }

  function handleTimeout(questionIndex, elapsedMs) {
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

  function showResult() {
    playSound(score === session.length ? "perfect" : "complete");
    view = "result";
    focusElement("#retry");
  }

  function goNext() {
    if (currentIndex === session.length - 1) {
      showResult();
      return;
    }

    currentIndex += 1;
    prepareQuestion(session[currentIndex]);
  }

  function showLanding(shouldFocus = true) {
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

  onDestroy(() => soundEffects?.stopAll());
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
  {:else if view === "game"}
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
  {:else}
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
