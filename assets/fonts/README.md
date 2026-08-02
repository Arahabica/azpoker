# UIフォントサブセットの再生成

カードランク用Arbutus Slabを含め、アプリが使うフォントはすべて`assets/fonts/`から自己配信する。UI用フォントは初期転送量を抑えるため、次の3ファイルに分けている。

| ファイル | 用途 | 収録内容 | サイズ |
| --- | --- | --- | ---: |
| `kosugi-maru/KosugiMaru-Landing.woff2` | 初期トップ | `暗算ポーカー`と`はじめる`の固有9文字 | 2,176 bytes |
| `kosugi-maru/KosugiMaru-Game.woff2` | 問題・回答・結果・エラー | `src/`と問題JSONで使う日本語、UI用句読点 | 48,324 bytes |
| `m-plus-rounded-1c/MPLUSRounded1c-UI.woff2` | UIの英数字 | `A-Z`、`a-z`、`0-9`、`.`、`%` | 4,712 bytes |

トップ画面はCSSで`Kosugi Maru Landing`だけを指定する。問題・結果画面になって初めて`Kosugi Maru Game`と`M PLUS Rounded 1c UI`を指定するため、`@font-face`がCSSに存在していても後者2ファイルは初期画面では読み込まれない。

## 生成

`fontslice`が`PATH`にある環境で、リポジトリルートから実行する。

```sh
pnpm fonts:build
```

スクリプトはGoogle Fontsリポジトリから次の原本を一時ディレクトリへ取得し、`fontslice --text`で指定文字用の先頭WOFF2だけを取り出す。

- Kosugi Maru Regular: https://raw.githubusercontent.com/google/fonts/main/apache/kosugimaru/KosugiMaru-Regular.ttf
- M PLUS Rounded 1c Regular: https://raw.githubusercontent.com/google/fonts/main/ofl/mplusrounded1c/MPLUSRounded1c-Regular.ttf

今回使った原本のSHA-256は次のとおり。

```text
4b8d0022c8dadd090ef67cd1f71f130714767af7806cba2eb4ebe4b0271c1d68  KosugiMaru-Regular.ttf
b75708b53e45b06d17d470aeeca5b766e3d1b3999f03f13ec4eb863ca846c14c  MPLUSRounded1c-Regular.ttf
```

ネットワークを使わず、取得済み原本から作る場合は、下記2ファイルを同じディレクトリに置いて指定する。

```text
KosugiMaru-Regular.ttf
MPLUSRounded1c-Regular.ttf
```

```sh
pnpm fonts:build -- --source-dir /path/to/font-sources
```

問題画面用の文字は、`LandingScreen.svelte`を除く`src/**/*.js`、`src/**/*.svelte`、`public/questions/**/*.json`から日本語とUI用句読点を自動収集する。トップ文言か英数字の対象を変える場合は、`scripts/build_font_subsets.mjs`冒頭の`landingText`または`mplusText`を更新する。

生成後は、スクリプトが表示する文字数、Unicode range、容量、SHA-256を確認し、次を実行する。

```sh
pnpm test
pnpm build
```

## 現在のSHA-256

```text
10df416b9d33d7739b4e08441a18fa2690ee763e6d0e782e64bbff67a7314afd  KosugiMaru-Landing.woff2
3ff8153743a92f61396306b18bb227fb156ec2764968c660b84b1f300a9bb789  KosugiMaru-Game.woff2
e797fe3ac0bf30e4431d9feb4e5ce75564f59b0721842e524c5f339a24c260e3  MPLUSRounded1c-UI.woff2
```
