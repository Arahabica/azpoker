(function startApplication() {
  "use strict";

  const bank = globalThis.QUESTION_BANK;
  const game = globalThis.AnzanPokerGame;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const SUIT_PATHS = Object.freeze({
    h: "M50 89C42 79 10 59 10 32C10 16 29 8 41 21L50 31L59 21C71 8 90 16 90 32C90 59 58 79 50 89Z",
    d: "M50 5 91 50 50 95 9 50Z",
    s: "M50 6C44 18 12 39 12 61C12 77 32 84 44 71C43 82 38 89 30 94H70C62 89 57 82 56 71C68 84 88 77 88 61C88 39 56 18 50 6Z",
    c: "M50 6C37 6 29 17 31 29C15 25 4 37 4 51C4 65 19 76 32 69C30 81 24 89 16 95H84C76 89 70 81 68 69C81 76 96 65 96 51C96 37 85 25 69 29C71 17 63 6 50 6Z",
  });
  const elements = {
    error: document.querySelector("#app-error"),
    landing: document.querySelector("#landing"),
    game: document.querySelector("#game"),
    result: document.querySelector("#result"),
    logoCards: document.querySelector("#logo-cards"),
    start: document.querySelector("#start-game"),
    leave: document.querySelector("#leave-game"),
    progress: document.querySelector("#progress"),
    progressFill: document.querySelector("#progress-fill"),
    prompt: document.querySelector("#prompt"),
    board: document.querySelector("#board-cards"),
    hole: document.querySelector("#hole-cards"),
    choices: document.querySelector("#choices"),
    feedback: document.querySelector("#feedback"),
    feedbackTitle: document.querySelector("#feedback-title"),
    feedbackMark: document.querySelector("#feedback-mark"),
    actual: document.querySelector("#actual-probability"),
    explanation: document.querySelector("#explanation"),
    next: document.querySelector("#next-question"),
    score: document.querySelector("#score"),
    retry: document.querySelector("#retry"),
    backHome: document.querySelector("#back-home"),
  };

  let session = [];
  let currentIndex = 0;
  let score = 0;
  let renderSequence = 0;
  let answerLocked = false;

  const reducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  function showView(view) {
    elements.landing.hidden = view !== "landing";
    elements.game.hidden = view !== "game";
    elements.result.hidden = view !== "result";
    document.body.dataset.view = view;
  }

  function showStartupError(message) {
    renderSequence += 1;
    elements.error.hidden = false;
    elements.error.textContent = message;
    elements.landing.hidden = true;
    elements.game.hidden = true;
    elements.result.hidden = true;
  }

  function currentQuestion() {
    return session[currentIndex];
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function createSuitIcon(suit, className) {
    const icon = document.createElementNS(SVG_NS, "svg");
    const path = document.createElementNS(SVG_NS, "path");
    icon.classList.add(className);
    icon.setAttribute("viewBox", "0 0 100 100");
    icon.setAttribute("aria-hidden", "true");
    path.setAttribute("d", SUIT_PATHS[suit]);
    icon.append(path);
    return icon;
  }

  function createCardElement(card, index, variant = "board", isNew = false) {
    const details = game.cardDetails(card);
    const element = document.createElement("span");
    const corner = document.createElement("span");
    const rank = document.createElement("span");

    element.className = `playing-card playing-card--${variant}`;
    element.dataset.tone = details.tone;
    element.dataset.rank = details.rank;
    element.style.setProperty("--deal-index", String(index));

    if (variant === "hole") {
      element.style.setProperty("--card-rotation", index === 0 ? "-6deg" : "6deg");
    } else if (variant === "logo") {
      element.style.setProperty("--card-rotation", index === 0 ? "-9deg" : "8deg");
      element.setAttribute("aria-hidden", "true");
    } else {
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", details.ariaLabel);
    }

    if (variant === "hole") {
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", details.ariaLabel);
    }

    if (isNew) {
      element.classList.add("is-new-card");
    }

    corner.className = "card-corner";
    corner.setAttribute("aria-hidden", "true");
    rank.className = "card-rank";
    rank.textContent = details.rank;
    corner.append(rank, createSuitIcon(details.suit, "card-corner-suit"));
    element.append(corner, createSuitIcon(details.suit, "card-center-suit"));
    return element;
  }

  function renderCards(container, cards, variant) {
    container.replaceChildren(
      ...cards.map((card, index) => createCardElement(card, index, variant)),
    );
  }

  function renderLogo() {
    renderCards(elements.logoCards, ["As", "Th"], "logo");
  }

  async function revealBoard(question, sequence) {
    const steps = game.boardRevealSteps(question);

    if (steps.length === 0) {
      return true;
    }

    renderCards(elements.board, steps[0].cards, "board");
    if (steps.length === 1) {
      return true;
    }

    await wait(reducedMotion ? 0 : 520);
    if (sequence !== renderSequence) {
      return false;
    }

    elements.board.append(
      createCardElement(steps[1].cards[0], 3, "board", true),
    );
    return true;
  }

  function renderChoices(question) {
    const choiceLabels = game.shuffle([question.answer, question.distractor]);
    elements.choices.replaceChildren();

    for (const choice of choiceLabels) {
      const button = document.createElement("button");
      const qualifier = document.createElement("span");
      const value = document.createElement("span");
      button.type = "button";
      button.className = "choice";
      qualifier.className = "choice-qualifier";
      qualifier.textContent = "約";
      value.className = "choice-value";
      value.textContent = choice;
      button.append(qualifier, value);
      button.dataset.choice = choice;
      button.addEventListener("click", handleAnswer);
      elements.choices.append(button);
    }
  }

  function showQuestion() {
    renderQuestion().catch((error) => {
      showStartupError(error instanceof Error ? error.message : String(error));
    });
  }

  function startSession() {
    try {
      session = game.createSession(bank);
    } catch (error) {
      showStartupError(error instanceof Error ? error.message : String(error));
      return;
    }

    currentIndex = 0;
    score = 0;
    elements.error.hidden = true;
    elements.progress.setAttribute("aria-valuemax", String(session.length));
    showView("game");
    showQuestion();
  }

  async function renderQuestion() {
    const question = currentQuestion();
    const sequence = ++renderSequence;
    const progress = ((currentIndex + 1) / session.length) * 100;

    answerLocked = false;
    elements.game.dataset.phase = "question";
    elements.progress.setAttribute("aria-valuenow", String(currentIndex + 1));
    elements.progressFill.style.width = `${progress}%`;
    elements.prompt.textContent = question.prompt;
    elements.board.replaceChildren();
    renderCards(elements.hole, question.hole, "hole");
    elements.feedback.hidden = true;
    elements.feedback.removeAttribute("data-result");
    elements.feedbackMark.removeAttribute("data-result");
    elements.choices.replaceChildren();
    elements.choices.classList.remove("is-concealed");
    elements.choices.hidden = true;

    const boardReady = await revealBoard(question, sequence);
    if (!boardReady || sequence !== renderSequence) {
      return;
    }

    renderChoices(question);
    elements.choices.hidden = false;
    requestAnimationFrame(() => {
      elements.prompt.focus({ preventScroll: true });
    });
  }

  function handleAnswer(event) {
    if (answerLocked) {
      return;
    }
    answerLocked = true;

    const question = currentQuestion();
    const selected = event.currentTarget.dataset.choice;
    const correct = selected === question.answer;
    if (correct) {
      score += 1;
    }

    for (const button of elements.choices.querySelectorAll("button")) {
      button.disabled = true;
    }

    const result = correct ? "correct" : "wrong";
    elements.game.dataset.phase = "answer";
    elements.feedback.dataset.result = result;
    elements.feedbackMark.dataset.result = result;
    elements.feedbackTitle.textContent = correct ? "正解" : "不正解";
    elements.actual.textContent = game.formatActualPercent(question.trueP);
    elements.explanation.textContent = question.explain;
    elements.next.textContent =
      currentIndex === session.length - 1 ? "結果を見る" : "次の問題へ";
    elements.choices.classList.add("is-concealed");
    elements.feedback.hidden = false;
    requestAnimationFrame(() => {
      elements.next.focus({ preventScroll: true });
    });
  }

  function showResult() {
    renderSequence += 1;
    elements.feedback.hidden = true;
    elements.score.textContent = `${score} / ${session.length}`;
    showView("result");
    elements.retry.focus({ preventScroll: true });
  }

  function goNext() {
    if (currentIndex === session.length - 1) {
      showResult();
      return;
    }

    currentIndex += 1;
    showQuestion();
  }

  function showLanding(shouldFocus = true) {
    renderSequence += 1;
    elements.feedback.hidden = true;
    showView("landing");
    if (shouldFocus) {
      elements.start.focus({ preventScroll: true });
    }
  }

  if (!bank || !game) {
    showStartupError("問題データを読み込めませんでした。ページを再読み込みしてください。");
    return;
  }

  renderLogo();
  elements.start.addEventListener("click", startSession);
  elements.leave.addEventListener("click", () => showLanding());
  elements.next.addEventListener("click", goNext);
  elements.retry.addEventListener("click", startSession);
  elements.backHome.addEventListener("click", () => showLanding());
  showLanding(false);
})();
