<script>
  let { score, total, onRetry, onHome } = $props();
</script>

<section id="result" class="screen result-screen" aria-labelledby="result-title">
  <div class="result-content">
    <h2 id="result-title">結果</h2>
    <p class="score">{score} / {total}</p>
  </div>
  <div class="result-actions">
    <button id="retry" class="primary-action" type="button" onclick={onRetry}>もう一度</button>
    <button id="back-home" class="secondary-action" type="button" onclick={onHome}>トップへ</button>
  </div>
</section>
