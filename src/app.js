(function startApplication() {
  "use strict";

  const bank = globalThis.QUESTION_BANK;
  const game = globalThis.AnzanPokerGame;
  const SVG_NS = "http://www.w3.org/2000/svg";
  // 比較ページの3案目を暫定採用。外せば既存のカード面へ戻せる。
  const ACTIVE_CARD_FACE_CLASS = "playing-card--poker001";
  // Bootstrap Icons v1.13.1 の suit-*-fill（MIT）。THIRD_PARTY_NOTICES.md を参照。
  const SUIT_PATHS = Object.freeze({
    h: "M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1",
    d: "M2.45 7.4 7.2 1.067a1 1 0 0 1 1.6 0L13.55 7.4a1 1 0 0 1 0 1.2L8.8 14.933a1 1 0 0 1-1.6 0L2.45 8.6a1 1 0 0 1 0-1.2",
    s: "M7.184 11.246A3.5 3.5 0 0 1 1 9c0-1.602 1.14-2.633 2.66-4.008C4.986 3.792 6.602 2.33 8 0c1.398 2.33 3.014 3.792 4.34 4.992C13.86 6.367 15 7.398 15 9a3.5 3.5 0 0 1-6.184 2.246 20 20 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a20 20 0 0 0 1.582-2.907",
    c: "M11.5 12.5a3.5 3.5 0 0 1-2.684-1.254 20 20 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a20 20 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5",
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
    icon.setAttribute("viewBox", "0 0 16 16");
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

    element.className = `playing-card playing-card--${variant} ${ACTIVE_CARD_FACE_CLASS}`;
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
