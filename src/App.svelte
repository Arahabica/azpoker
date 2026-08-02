<script>
  import { tick } from "svelte";

  import { createSession, shuffle } from "./game.js";
  import { loadQuestionPool, rememberQuestions } from "./question-loader.js";
  import LandingScreen from "./screens/LandingScreen.svelte";
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

  const currentQuestion = $derived(session[currentIndex]);

  async function focusElement(selector) {
    await tick();
    window.requestAnimationFrame(() => {
      document.querySelector(selector)?.focus({ preventScroll: true });
    });
  }

  function showStartupError(error) {
    startupError = error instanceof Error ? error.message : String(error);
  }

  function prepareQuestion(question) {
    answerResult = null;
    choices = question.answerType === "hand"
      ? []
      : shuffle([question.answer, question.distractor]);
    focusElement("#prompt");
  }

  async function startSession() {
    if (starting) return;
    starting = true;
    try {
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
      session = nextSession;
      rememberQuestions(session);
      currentIndex = 0;
      score = 0;
      outcomes = Array(nextSession.length).fill(null);
      startupError = "";
      view = "game";
      prepareQuestion(session[0]);
    } catch (error) {
      showStartupError(error);
    } finally {
      starting = false;
    }
  }

  function settleQuestion({ correct, selected, timedOut }) {
    if (answerResult) {
      return false;
    }

    if (correct) {
      score += 1;
    }
    let outcome = "wrong";
    if (timedOut) {
      outcome = "timeout";
    } else if (correct) {
      outcome = "correct";
    }
    outcomes[currentIndex] = outcome;
    answerResult = { correct, selected, timedOut };
    focusElement("#next-question");
    return true;
  }

  function handleAnswer(selected) {
    settleQuestion({
      correct: selected === currentQuestion.answer,
      selected,
      timedOut: false,
    });
  }

  function handleTimeout(questionIndex) {
    if (view !== "game" || questionIndex !== currentIndex) {
      return;
    }

    settleQuestion({
      correct: false,
      selected: null,
      timedOut: true,
    });
  }

  function showResult() {
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
    view = "landing";
    if (shouldFocus) {
      focusElement("#start-game");
    }
  }
</script>

<main class="app-shell">
  {#if startupError}
    <div class="error" role="alert">
      <p>{startupError}</p>
      <button type="button" onclick={startSession}>もう一度</button>
    </div>
  {:else if view === "landing"}
    <LandingScreen onStart={startSession} {starting} />
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
      onRetry={startSession}
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

  .error {
    position: absolute;
    top: 50%;
    right: var(--gutter);
    left: var(--gutter);
    z-index: 20;
    padding: 1rem;
    border: 1px solid var(--wrong);
    border-radius: 0.9rem;
    background: #231619;
    color: #ffd7d9;
    font-family: "M PLUS Rounded 1c UI", "Kosugi Maru Game", sans-serif;
    line-height: 1.6;
    transform: translateY(-50%);
  }

  .error button {
    margin-top: 0.8rem;
    padding: 0.7rem 1rem;
    border: 0;
    border-radius: 0.7rem;
    background: var(--accent);
    color: var(--accent-ink);
    font: inherit;
  }

  @media (min-width: 481px) {
    .app-shell {
      border-right: 1px solid rgb(255 255 255 / 8%);
      border-left: 1px solid rgb(255 255 255 / 8%);
      box-shadow: 0 0 4rem rgb(0 0 0 / 46%);
    }
  }
</style>
