<script>
  import { tick } from "svelte";

  import questionBank from "./question-bank.js";
  import { boardRevealSteps, createSession, shuffle } from "./game.js";
  import LandingScreen from "./screens/LandingScreen.svelte";
  import QuizScreen from "./screens/QuizScreen.svelte";
  import ResultScreen from "./screens/ResultScreen.svelte";

  let view = $state("landing");
  let session = $state([]);
  let currentIndex = $state(0);
  let score = $state(0);
  let visibleBoard = $state([]);
  let choices = $state([]);
  let choicesReady = $state(false);
  let answerResult = $state(null);
  let startupError = $state("");
  let renderSequence = 0;

  const currentQuestion = $derived(session[currentIndex]);
  const reducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  $effect(() => {
    document.body.dataset.view = view;
  });

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function focusElement(selector) {
    await tick();
    window.requestAnimationFrame(() => {
      document.querySelector(selector)?.focus({ preventScroll: true });
    });
  }

  function showStartupError(error) {
    renderSequence += 1;
    startupError = error instanceof Error ? error.message : String(error);
  }

  async function prepareQuestion(question) {
    const sequence = ++renderSequence;
    const revealSteps = boardRevealSteps(question);

    answerResult = null;
    visibleBoard = [];
    choices = [];
    choicesReady = false;

    if (revealSteps.length > 0) {
      visibleBoard = [...revealSteps[0].cards];
    }

    if (revealSteps.length > 1) {
      await wait(reducedMotion ? 0 : 520);
      if (sequence !== renderSequence) {
        return;
      }
      visibleBoard = [...revealSteps[0].cards, ...revealSteps[1].cards];
    }

    if (sequence !== renderSequence) {
      return;
    }

    choices = shuffle([question.answer, question.distractor]);
    choicesReady = true;
    await focusElement("#prompt");
  }

  function showQuestion(question) {
    prepareQuestion(question).catch(showStartupError);
  }

  function startSession() {
    try {
      session = createSession(questionBank);
      currentIndex = 0;
      score = 0;
      startupError = "";
      view = "game";
      showQuestion(session[0]);
    } catch (error) {
      showStartupError(error);
    }
  }

  function handleAnswer(selected) {
    if (answerResult || !choicesReady) {
      return;
    }

    const correct = selected === currentQuestion.answer;
    if (correct) {
      score += 1;
    }
    answerResult = { correct, selected };
    focusElement("#next-question");
  }

  function showResult() {
    renderSequence += 1;
    view = "result";
    focusElement("#retry");
  }

  function goNext() {
    if (currentIndex === session.length - 1) {
      showResult();
      return;
    }

    currentIndex += 1;
    showQuestion(session[currentIndex]);
  }

  function showLanding(shouldFocus = true) {
    renderSequence += 1;
    startupError = "";
    answerResult = null;
    view = "landing";
    if (shouldFocus) {
      focusElement("#start-game");
    }
  }
</script>

<main class="app-shell">
  {#if startupError}
    <p class="error" role="alert">{startupError}</p>
  {:else if view === "landing"}
    <LandingScreen onStart={startSession} />
  {:else if view === "game"}
    <QuizScreen
      question={currentQuestion}
      {currentIndex}
      total={session.length}
      {visibleBoard}
      {choices}
      {choicesReady}
      {answerResult}
      onLeave={showLanding}
      onAnswer={handleAnswer}
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
