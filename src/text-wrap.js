const NATURAL_BREAK_AFTER = Object.freeze([
  "ボードのストレートで",
  "ボードのフラッシュで",
  "ストレートの両端待ち",
  "ストレートの内側待ち",
  "負けている手札の",
  "勝っている手札の",
  "両方の役の種類が",
  "手札のペアより",
  "手札のペアで",
  "手札のペアが",
  "ほかの誰かが",
  "ほかの誰かの",
  "次の1枚でも",
  "次のカードで",
  "最後の1枚で",
  "ストレートと",
  "ストレートか",
  "フラッシュか",
  "相手全員が",
  "を持つ相手が",
  "次の1枚で",
  "あと1枚で",
  "低いペアが",
  "今の役のまま",
  "同じペアで",
  "自分より",
  "ボードより",
  "2人卓で",
  "6人卓で",
  "相手が",
  "相手の",
  "ボードに",
  "ボードが",
  "ストレート",
]);

function splitAtNaturalBreaks(value) {
  const text = String(value);
  const boundaries = new Set([0, text.length]);

  for (let index = 0; index < text.length; index += 1) {
    const phrase = NATURAL_BREAK_AFTER.find((candidate) =>
      text.startsWith(candidate, index)
    );
    if (!phrase) continue;
    boundaries.add(index + phrase.length);
    index += phrase.length - 1;
  }

  const positions = [...boundaries].sort((left, right) => left - right);
  return positions
    .slice(0, -1)
    .map((start, index) => text.slice(start, positions[index + 1]))
    .filter(Boolean);
}

export { NATURAL_BREAK_AFTER, splitAtNaturalBreaks };
