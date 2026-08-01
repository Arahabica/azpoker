# Kosugi Maruタイトルサブセットの再生成

トップの「暗算ポーカー」専用フォントを再生成する手順。

## 現在のファイル

- 出力: `KosugiMaru-Title.woff2`
- 収録文字: `暗算ポーカー`
- 固有グリフ: `暗`、`算`、`ポ`、`ー`、`カ` の5文字
- Unicode range: `U+30AB, U+30DD, U+30FC, U+6697, U+7B97`
- サイズ: 1,512 bytes
- SHA-256: `e0f4effd739000211dd1ebd3bba924a2e86706190a8b64b2cb9387f83af06eb0`

原本はGoogle FontsのKosugi Maru Regularを使う。

- Source: https://github.com/google/fonts/tree/main/apache/kosugimaru
- TTF: https://raw.githubusercontent.com/google/fonts/main/apache/kosugimaru/KosugiMaru-Regular.ttf
- 確認時の原本SHA-256: `4b8d0022c8dadd090ef67cd1f71f130714767af7806cba2eb4ebe4b0271c1d68`
- License: Apache License 2.0（同じディレクトリの `LICENSE.txt`）

## 生成手順

リポジトリのルートで実行する。

```sh
work_dir="$(mktemp -d)"

curl -L \
  https://raw.githubusercontent.com/google/fonts/main/apache/kosugimaru/KosugiMaru-Regular.ttf \
  -o "$work_dir/KosugiMaru-Regular.ttf"

(
  cd "$work_dir"
  fontslice KosugiMaru-Regular.ttf \
    -o subset \
    --weight 400 \
    --text '暗算ポーカー'
)
```

この環境の `fontslice` は、絶対パスを `-o` に渡すとCSS出力時に失敗するため、作業ディレクトリへ移動して相対パスの `subset` を指定する。

`fontslice --text` は、指定文字の優先サブセットに加えて、それ以外の文字を収録した複数のフォールバックファイルも生成する。プロジェクトへ入れるのは、生成CSSの先頭に記載された指定文字専用のWOFF2だけ。

```sh
sed -n '1p' "$work_dir/subset/KosugiMaru-Regular.css"
```

現在のタイトルでは、先頭ルールが次のUnicode rangeを指す。

```text
U+30ab,U+30dd,U+30fc,U+6697,U+7b97
```

対応するファイルを所定の名前でコピーする。

```sh
cp \
  "$work_dir/subset/font-subsets/KosugiMaru-Regular-subset-2e7456a91b234c71f75cce64b055b9ad.woff2" \
  assets/fonts/kosugi-maru/KosugiMaru-Title.woff2
```

ほかのWOFF／WOFF2はコピーしない。

## 検証

収録コードポイントを確認する。

```sh
ttx -q \
  -o "$work_dir/KosugiMaru-Title-cmap.ttx" \
  -t cmap \
  assets/fonts/kosugi-maru/KosugiMaru-Title.woff2

rg -o 'code="0x[0-9a-f]+"' \
  "$work_dir/KosugiMaru-Title-cmap.ttx" \
  | sort -u
```

期待値:

```text
code="0x30ab"
code="0x30dd"
code="0x30fc"
code="0x6697"
code="0x7b97"
```

容量とビルドも確認する。

```sh
wc -c assets/fonts/kosugi-maru/KosugiMaru-Title.woff2
npm test
npm run build
```

## タイトルを変更するとき

1. `fontslice --text` の文字列を新しいタイトルへ変更する。
2. 生成CSSの先頭ルールから、新しい指定文字用WOFF2を特定して差し替える。
3. `styles.css` の `unicode-range` を生成CSSと一致させる。
4. `tests/ui.test.js` の期待するUnicode rangeと容量上限を更新する。
5. このREADMEの文字一覧、サイズ、SHA-256を更新する。

