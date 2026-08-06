# UIフォントサブセットの再生成

カードランク用Arbutus Slabを含め、アプリが使うフォントはすべて`assets/fonts/`から自己配信する。UI用フォントは初期転送量を抑えるため、次の4ファイルに分けている。

| ファイル                                    | 用途                               | 収録内容                                 |       サイズ |
| ------------------------------------------- | ---------------------------------- | ---------------------------------------- | -----------: |
| `kosugi-maru/KosugiMaru-Landing.woff2`      | ヒーロー                           | タイトル、開始操作、最近の履歴           |  8,892 bytes |
| `kosugi-maru/KosugiMaru-LandingBody.woff2`  | LP本文                             | LP本文とフッターで使う日本語、UI用句読点 | 24,956 bytes |
| `kosugi-maru/KosugiMaru-Game.woff2`         | 開始準備・問題・回答・結果・エラー | `src/`と問題JSONで使う日本語、UI用句読点 | 54,332 bytes |
| `m-plus-rounded-1c/MPLUSRounded1c-UI.woff2` | LP・ゲームの英数字                 | `A-Z`、`a-z`、`0-9`、`.`                 |  4,624 bytes |

ヒーローは`Kosugi Maru Landing`、その下のLP本文は`Kosugi Maru Landing Body`を指定し、HTMLから先読みするのはヒーロー用だけとする。英数字は共通の`M PLUS Rounded 1c UI`、開始準備以降の日本語は`Kosugi Maru Game`を使う。`%`はM PLUSへ収録せず、各画面のKosugi Maruで表示する。

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

LP本文用の文字は、`scripts/build_font_subsets.mjs`の`landingBodySourcePaths`に列挙したコンポーネントから自動収集する。問題画面用の文字は、LP、履歴、利用規約、素材・開発者の画面と部品を除く`src/**/*.ts`、`src/**/*.svelte`、`public/questions/**/*.json`から、日本語とUI用句読点を自動収集する。ヒーロー文言か英数字の対象を変える場合は、同スクリプト冒頭の`landingHeroText`または`mplusText`を更新する。

生成後は、スクリプトが表示する文字数、Unicode range、容量、SHA-256を確認し、次を実行する。

```sh
pnpm test
pnpm build
```

## 現在のSHA-256

```text
07517882c553b247fc17ef2520ebc1ee427e85768faec8993bd0ceb6336101d7  KosugiMaru-Landing.woff2
8a9ca135db3829173e66205138b9a806756e5729e9f007cb8f3981dba09f4410  KosugiMaru-LandingBody.woff2
2745393b1de8e8dcb95354d3552e85ab58952d09d98fe7236e5f6a98215687cf  KosugiMaru-Game.woff2
3c143b9b496af6c579ea01a6cd4509f8b94d18b61364b1415cdf79e70a4823e2  MPLUSRounded1c-UI.woff2
```
