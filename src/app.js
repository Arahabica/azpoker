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
    exact: document.querySelector("#exact-probability"),
    explanation: document.querySelector("#explanation"),
    answerTime: document.querySelector("#answer-time"),
    next: document.querySelector("#next-question"),
    score: document.querySelector("#score"),
    average: document.querySelector("#average-time"),
    retry: document.querySelector("#retry"),
  };

  let session = [];
  let currentIndex = 0;
  let score = 0;
  let answeredAt = 0;
  let timings = [];

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
    timings = [];
    elements.error.hidden = true;
    elements.result.hidden = true;
    elements.game.hidden = false;
    renderQuestion();
  }

  function renderQuestion() {
    const question = currentQuestion();
    const target = game.targetLabel(question.target);

    elements.progress.textContent = `${currentIndex + 1} / ${session.length}`;
    elements.stage.textContent = game.stageLabel(question.stage);
    elements.prompt.textContent = `リバーまでに${target}が完成する確率に近いのは？`;
    elements.hole.textContent = game.formatCards(question.hole);
    elements.board.textContent =
      question.board.length > 0 ? game.formatCards(question.board) : "まだありません";
    elements.feedback.hidden = true;
    elements.next.hidden = true;
    elements.choices.replaceChildren();

    const choiceLabels = game.shuffle([question.answer, question.distractor]);
    for (const choice of choiceLabels) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.textContent = choice;
      button.dataset.choice = choice;
      button.addEventListener("click", handleAnswer);
      elements.choices.append(button);
    }

    answeredAt = performance.now();
    requestAnimationFrame(() => {
      elements.choices.querySelector("button")?.focus({ preventScroll: true });
    });
  }

  function handleAnswer(event) {
    const question = currentQuestion();
    const selected = event.currentTarget.dataset.choice;
    const correct = selected === question.answer;
    const elapsedSeconds = (performance.now() - answeredAt) / 1_000;

    timings.push(elapsedSeconds);
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
    elements.exact.textContent = `厳密値 ${question.trueP.toFixed(1)}%`;
    elements.explanation.textContent = question.explain;
    elements.answerTime.textContent = `${elapsedSeconds.toFixed(1)}秒`;
    elements.feedback.hidden = false;
    elements.next.hidden = false;
    elements.next.textContent =
      currentIndex === session.length - 1 ? "結果を見る" : "次の問題";
    elements.next.focus({ preventScroll: true });
  }

  function showResult() {
    const average =
      timings.reduce((total, seconds) => total + seconds, 0) / timings.length;

    elements.game.hidden = true;
    elements.result.hidden = false;
    elements.score.textContent = `${score} / ${session.length}`;
    elements.average.textContent = `1問あたり平均 ${average.toFixed(1)}秒`;
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
