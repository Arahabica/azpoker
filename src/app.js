(function startApplication() {
  "use strict";

  const bank = globalThis.QUESTION_BANK;
  const game = globalThis.AnzanPokerGame;
  const elements = {
    error: document.querySelector("#app-error"),
    game: document.querySelector("#game"),
    result: document.querySelector("#result"),
    progress: document.querySelector("#progress"),
    stage: document.querySelector("#stage"),
    prompt: document.querySelector("#prompt"),
    hole: document.querySelector("#hole-cards"),
    board: document.querySelector("#board-cards"),
    choices: document.querySelector("#choices"),
    feedback: document.querySelector("#feedback"),
    feedbackTitle: document.querySelector("#feedback-title"),
    actual: document.querySelector("#actual-probability"),
    explanation: document.querySelector("#explanation"),
    next: document.querySelector("#next-question"),
    score: document.querySelector("#score"),
    retry: document.querySelector("#retry"),
  };

  let session = [];
  let currentIndex = 0;
  let score = 0;

  function showStartupError(message) {
    elements.error.hidden = false;
    elements.error.textContent = message;
    elements.game.hidden = true;
  }

  function currentQuestion() {
    return session[currentIndex];
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
    elements.result.hidden = true;
    elements.game.hidden = false;
    renderQuestion();
  }

  function renderQuestion() {
    const question = currentQuestion();

    elements.progress.textContent = `${currentIndex + 1} / ${session.length}`;
    elements.stage.textContent = game.stageLabel(question.stage);
    elements.prompt.textContent = question.prompt;
    elements.hole.textContent = game.formatCards(question.hole);
    elements.board.textContent =
      question.board.length > 0 ? game.formatCards(question.board) : "まだありません";
    elements.feedback.hidden = true;
    elements.next.hidden = true;
    elements.choices.replaceChildren();

    const choiceLabels = game.shuffle([question.answer, question.distractor]);
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

    requestAnimationFrame(() => {
      elements.choices.querySelector("button")?.focus({ preventScroll: true });
    });
  }

  function handleAnswer(event) {
    const question = currentQuestion();
    const selected = event.currentTarget.dataset.choice;
    const correct = selected === question.answer;
    if (correct) {
      score += 1;
    }

    for (const button of elements.choices.querySelectorAll("button")) {
      button.disabled = true;
      if (button.dataset.choice === question.answer) {
        button.classList.add("is-correct");
      } else if (button.dataset.choice === selected) {
        button.classList.add("is-wrong");
      }
    }

    elements.feedbackTitle.textContent = correct ? "正解" : "惜しい";
    elements.feedbackTitle.dataset.result = correct ? "correct" : "wrong";
    elements.actual.textContent = game.formatActualPercent(question.trueP);
    elements.explanation.textContent = question.explain;
    elements.feedback.hidden = false;
    elements.next.hidden = false;
    elements.next.textContent =
      currentIndex === session.length - 1 ? "結果を見る" : "次の問題";
    elements.next.focus({ preventScroll: true });
  }

  function showResult() {
    elements.game.hidden = true;
    elements.result.hidden = false;
    elements.score.textContent = `${score} / ${session.length}`;
    elements.retry.focus({ preventScroll: true });
  }

  function goNext() {
    if (currentIndex === session.length - 1) {
      showResult();
      return;
    }

    currentIndex += 1;
    renderQuestion();
  }

  if (!bank || !game) {
    showStartupError("問題データを読み込めませんでした。ページを再読み込みしてください。");
    return;
  }

  elements.next.addEventListener("click", goNext);
  elements.retry.addEventListener("click", startSession);
  startSession();
})();
