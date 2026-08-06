<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from "svelte";

  import {
    getPageMetadata,
    normalizeAppPath,
    type AppPath,
  } from "./app-route.ts";
  import {
    createInitialGameFlow,
    getAnswerResult,
    getPreparationError,
    getQuestionIndex,
    transitionGameFlow,
  } from "./game-flow.ts";
  import { createSession, shuffle } from "./game.ts";
  import { loadQuestionPool, rememberQuestions } from "./question-loader.ts";
  import {
    LOADING_INDICATOR_DELAY_MS,
    waitLoadingAnimation,
  } from "./loading-timing.ts";
  import { getQuestionTimeLimitMs } from "./question-timer.ts";
  import {
    RESULT_HISTORY_KEY,
    createQuizHistoryEntry,
    createQuizHistoryId,
    readQuizHistory,
    saveQuizHistory,
    type QuizHistoryEntry,
  } from "./result-history.ts";
  import { createSoundEffects } from "./sound-effects.ts";
  import type { SoundEffects } from "./sound-effects.ts";
  import type {
    PercentChoice,
    Question,
    QuestionAnswer,
    QuestionOutcome,
    SoundName,
  } from "./types.ts";
  import CreditsScreen from "./screens/CreditsScreen.svelte";
  import HistoryScreen from "./screens/HistoryScreen.svelte";
  import LandingScreen from "./screens/LandingScreen.svelte";
  import PrepareScreen from "./screens/PrepareScreen.svelte";
  import PreparationLoadingScreen from "./screens/PreparationLoadingScreen.svelte";
  import QuizScreen from "./screens/QuizScreen.svelte";
  import ResultScreen from "./screens/ResultScreen.svelte";
  import TermsScreen from "./screens/TermsScreen.svelte";

  interface Props {
    initialPath?: string;
  }

  type SettleQuestionOptions =
    | {
        questionIndex: number;
        correct: boolean;
        selected: QuestionAnswer;
        timedOut: false;
        elapsedMs: number;
      }
    | {
        questionIndex: number;
        correct: false;
        selected: null;
        timedOut: true;
        elapsedMs: number;
      };

  let { initialPath = "/" }: Props = $props();

  let flow = $state(createInitialGameFlow());
  let currentPath = $state<AppPath>(
    untrack(() => normalizeAppPath(initialPath)),
  );
  let session = $state<Question[]>([]);
  let score = $state(0);
  let choices = $state<PercentChoice[]>([]);
  let outcomes = $state<(QuestionOutcome | null)[]>([]);
  let soundEnabled = $state(true);
  let sessionElapsedMs = $state(0);
  let sessionTimeLimitMs = $state(0);
  let sessionHistoryId = $state("");
  let resultHistory = $state<QuizHistoryEntry[]>([]);
  let soundEffects: SoundEffects | undefined;

  const pageMetadata = $derived(getPageMetadata(currentPath));
  const currentIndex = $derived(getQuestionIndex(flow) ?? 0);
  const currentQuestion = $derived(session[currentIndex]);
  const answerResult = $derived(getAnswerResult(flow));
  const startupError = $derived(getPreparationError(flow));
  const timeoutCount = $derived(
    outcomes.filter((outcome) => outcome === "timeout").length,
  );

  function refreshResultHistory(): void {
    resultHistory = readQuizHistory();
  }

  function focusElement(selector: string): void {
    void tick().then(() => {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(selector)
          ?.focus({ preventScroll: true });
      });
    });
  }

  function ensureSoundEffects() {
    const AudioContextConstructor =
      globalThis.AudioContext ??
      (
        globalThis as typeof globalThis & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
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
      void preloadSoundEffects();
    } else {
      soundEffects?.stopAll();
    }
  }

  function playSound(name: SoundName): void {
    if (soundEnabled) {
      const effects = ensureSoundEffects();
      effects?.stopAll();
      void effects?.play(name);
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
    choices =
      question.answerType === "hand"
        ? []
        : shuffle([question.answer, question.distractor]);
    focusElement("#prompt");
  }

  async function selectSession(): Promise<Question[]> {
    let nextSession: Question[] | undefined;
    const refreshOrder: readonly ("BC" | "A" | "D" | null)[] = [
      null,
      "BC",
      "A",
      "D",
    ];
    for (let attempt = 0; attempt < refreshOrder.length; attempt += 1) {
      const pool = await loadQuestionPool(
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
    const preparingFlow = transitionGameFlow(flow, {
      type: "START_PREPARATION",
    });
    if (preparingFlow === flow) return;
    flow = preparingFlow;

    try {
      const [nextSession] = await waitLoadingAnimation(() =>
        Promise.all([
          selectSession(),
          preloadGameFonts(),
          preloadSoundEffects(),
        ]),
      );
      const readyFlow = transitionGameFlow(flow, {
        type: "PREPARATION_SUCCEEDED",
        totalQuestions: nextSession.length,
      });
      if (readyFlow === flow) return;
      session = nextSession;
      rememberQuestions(session);
      score = 0;
      outcomes = Array<QuestionOutcome | null>(nextSession.length).fill(null);
      sessionElapsedMs = 0;
      sessionTimeLimitMs = nextSession.reduce(
        (total, question) => total + getQuestionTimeLimitMs(question),
        0,
      );
      sessionHistoryId = createQuizHistoryId();
      flow = readyFlow;
      focusElement("#start-quiz");
    } catch (error) {
      const failedFlow = transitionGameFlow(flow, {
        type: "PREPARATION_FAILED",
        message: error instanceof Error ? error.message : String(error),
      });
      if (failedFlow === flow) return;
      flow = failedFlow;
      focusElement("#retry-load");
    }
  }

  function showPreparation(): void {
    void prepareSession();
  }

  function startSession(): void {
    const answeringFlow = transitionGameFlow(flow, {
      type: "START_SESSION",
    });
    if (answeringFlow === flow) return;
    flow = answeringFlow;
    playSound("start");
    prepareQuestion(session[0]!);
  }

  function settleQuestion({
    questionIndex,
    correct,
    selected,
    timedOut,
    elapsedMs,
  }: SettleQuestionOptions): boolean {
    const question = session[questionIndex];
    if (!question) return false;
    const answeredFlow = timedOut
      ? transitionGameFlow(flow, { type: "TIMEOUT", questionIndex })
      : transitionGameFlow(flow, {
          type: "ANSWER",
          questionIndex,
          correct,
          selected,
        });
    if (answeredFlow === flow) return false;

    if (correct) {
      score += 1;
    }
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
    outcomes[questionIndex] = outcome;
    flow = answeredFlow;
    playSound(correct ? "correct" : "wrong");
    focusElement("#next-question");
    return true;
  }

  function handleAnswer(selected: QuestionAnswer, elapsedMs: number): void {
    const questionIndex = currentIndex;
    const question = currentQuestion;
    if (!question) return;
    settleQuestion({
      questionIndex,
      correct: selected === question.answer,
      selected,
      timedOut: false,
      elapsedMs,
    });
  }

  function handleTimeout(questionIndex: number, elapsedMs: number): void {
    settleQuestion({
      questionIndex,
      correct: false,
      selected: null,
      timedOut: true,
      elapsedMs,
    });
  }

  function handleTimeWarning(questionIndex: number): void {
    if (flow.status !== "answering" || questionIndex !== flow.questionIndex) {
      return;
    }
    playSound("warning");
  }

  function goNext(): void {
    const nextFlow = transitionGameFlow(flow, {
      type: "NEXT_QUESTION",
    });
    if (nextFlow === flow) return;
    flow = nextFlow;

    if (nextFlow.status === "result") {
      const historyEntry = createQuizHistoryEntry({
        id: sessionHistoryId || createQuizHistoryId(),
        score,
        total: session.length,
        elapsedMs: sessionElapsedMs,
        timeLimitMs: sessionTimeLimitMs,
        timeoutCount,
      });
      resultHistory = saveQuizHistory(historyEntry);
      playSound(score === session.length ? "perfect" : "complete");
      focusElement("#retry");
      return;
    }

    const nextQuestionIndex = getQuestionIndex(nextFlow);
    if (nextQuestionIndex === null) return;
    const nextQuestion = session[nextQuestionIndex];
    if (nextQuestion) {
      prepareQuestion(nextQuestion);
    }
  }

  function showLanding(shouldFocus = true): void {
    outcomes = [];
    sessionElapsedMs = 0;
    sessionTimeLimitMs = 0;
    sessionHistoryId = "";
    soundEffects?.stopAll();
    flow = transitionGameFlow(flow, { type: "LEAVE" });
    refreshResultHistory();
    if (shouldFocus) {
      focusElement("#start-game");
    }
  }

  function moveToPath(path: AppPath, replace = false): void {
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState(null, "", path);
      } else {
        window.history.pushState(null, "", path);
      }
    }

    currentPath = path;
    showLanding(path === "/");
    if (path !== "/") {
      focusElement("#public-page-title");
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  onMount(() => {
    refreshResultHistory();

    const handlePopState = (): void => {
      currentPath = normalizeAppPath(window.location.pathname);
      showLanding(currentPath === "/");
      if (currentPath !== "/") {
        focusElement("#public-page-title");
      }
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    const handleStorage = (event: StorageEvent): void => {
      if (event.key === RESULT_HISTORY_KEY || event.key === null) {
        refreshResultHistory();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("storage", handleStorage);
    };
  });

  onDestroy(() => soundEffects?.destroy());
</script>

<svelte:head>
  <title>{pageMetadata.title}</title>
  <meta name="description" content={pageMetadata.description} />
</svelte:head>

<main class="app-shell">
  {#if currentPath === "/history"}
    <HistoryScreen history={resultHistory} onNavigate={moveToPath} />
  {:else if currentPath === "/terms"}
    <TermsScreen onNavigate={moveToPath} />
  {:else if currentPath === "/credits"}
    <CreditsScreen onNavigate={moveToPath} />
  {:else if flow.status === "top"}
    <LandingScreen
      history={resultHistory}
      onStart={showPreparation}
      onNavigate={moveToPath}
    />
  {:else if flow.status === "preparing"}
    <PreparationLoadingScreen delayMs={LOADING_INDICATOR_DELAY_MS} />
  {:else if flow.status === "ready" || flow.status === "preparation-error"}
    <PrepareScreen
      {soundEnabled}
      ready={flow.status === "ready"}
      error={startupError}
      onSoundChange={setSoundEnabled}
      onStart={startSession}
      onRetry={prepareSession}
    />
  {:else if (flow.status === "answering" || flow.status === "answered") && currentQuestion}
    <QuizScreen
      question={currentQuestion}
      {currentIndex}
      total={session.length}
      {choices}
      {answerResult}
      {outcomes}
      onLeave={showLanding}
      onAnswer={handleAnswer}
      onTimeWarning={handleTimeWarning}
      onTimeout={handleTimeout}
      onNext={goNext}
    />
  {:else if flow.status === "result"}
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
      radial-gradient(
        circle at 50% 32%,
        rgb(87 236 186 / 16%),
        transparent 54%
      ),
      repeating-linear-gradient(
        118deg,
        transparent 0,
        transparent 4px,
        rgb(255 255 255 / 1.8%) 5px,
        transparent 6px
      ),
      linear-gradient(
        160deg,
        var(--felt-light),
        var(--felt) 50%,
        var(--felt-dark)
      );
    isolation: isolate;
  }

  .app-shell::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(
        90deg,
        rgb(0 0 0 / 12%),
        transparent 9%,
        transparent 91%,
        rgb(0 0 0 / 12%)
      ),
      radial-gradient(
        ellipse at 50% 56%,
        transparent 45%,
        rgb(0 31 24 / 18%) 100%
      );
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
