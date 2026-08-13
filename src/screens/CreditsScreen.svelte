<script lang="ts">
  import type { AppPath } from "../app-route.ts";
  import PublicPageShell from "../components/PublicPageShell.svelte";

  interface Props {
    onNavigate: (path: AppPath) => void;
  }

  let { onNavigate }: Props = $props();
</script>

<PublicPageShell
  title="素材・開発者"
  lead="暗算ポーカーを支えている素材と、開発者について紹介します。"
  {onNavigate}
>
  <section id="developer">
    <h2>開発者</h2>
    <p>
      暗算ポーカーは
      <a
        href="https://x.com/Arahabica1"
        rel="me external noopener"
        target="_blank">@Arahabica1</a
      >
      が開発・運営しています。お問い合わせも同じアカウントへお願いします。
    </p>
  </section>

  <section id="materials">
    <h2>フォント</h2>
    <h3>Arbutus Slab</h3>
    <p>
      カードの数字と文字に使用しています。Sorkin Type Coによるフォントで、SIL
      Open Font License 1.1のもとで
      <a
        href="https://fonts.google.com/specimen/Arbutus+Slab"
        rel="external noopener"
        target="_blank">Google Fonts</a
      >
      から提供されています。
    </p>

    <h3>Kosugi Maru</h3>
    <p>
      タイトル、ボタン、ゲーム画面の日本語に、収録文字を限定した自己配信版を使用しています。Apache
      License 2.0のもとで
      <a
        href="https://github.com/google/fonts/tree/main/apache/kosugimaru"
        rel="external noopener"
        target="_blank">提供されています</a
      >。
    </p>

    <h3>M PLUS Rounded 1c</h3>
    <p>
      ゲーム画面の英数字に、収録文字を限定した自己配信版を使用しています。SIL
      Open Font License 1.1のもとで
      <a
        href="https://github.com/google/fonts/tree/main/ofl/mplusrounded1c"
        rel="external noopener"
        target="_blank">提供されています</a
      >。
    </p>
  </section>

  <section>
    <h2>カードとアイコン</h2>
    <h3>Bootstrap Icons</h3>
    <p>
      ハート、スペード、クラブは、Bootstrap
      Iconsのスートを元に形を調整しています。
      <a
        href="https://icons.getbootstrap.com/"
        rel="external noopener"
        target="_blank">Bootstrap Icons</a
      >
      はMIT Licenseのもとで提供されています。
    </p>

    <h3>Modiano diamond</h3>
    <p>
      ダイヤは、Wikimedia Commonsでパブリックドメインとして公開されている
      <a
        href="https://commons.wikimedia.org/wiki/File:SuitDiamonds.svg"
        rel="external noopener"
        target="_blank">SuitDiamonds.svg</a
      >
      を元にしています。
    </p>

    <h3>Lucide Icons</h3>
    <p>
      音声、退出のアイコンにLucide Iconsを使用しています。LucideはISC
      Licenseのもとで
      <a href="https://lucide.dev/" rel="external noopener" target="_blank"
        >提供されています</a
      >。
    </p>
  </section>

  <section>
    <h2>スターティングハンド勝率表</h2>
    <p>
      トップページの6人卓・9人卓の勝率は、100万回のシミュレーション結果を掲載する
      <a
        href="https://lapoker.info/ranking/"
        rel="external noopener"
        target="_blank">LA Poker.info</a
      >
      を参照しています。6人卓の値は
      <a
        href="https://bright777.com/texasholdem-handrank"
        rel="external noopener"
        target="_blank">株式会社ブライトの人数別勝率表</a
      >
      および
      <a
        href="https://mpj-portal.jp/forbeginners/technique-pokertable/"
        rel="external noopener"
        target="_blank">MPJ Portalの6人プレー表</a
      >
      とも照合しています。
    </p>
  </section>

  <section id="sounds">
    <h2>効果音</h2>
    <h3>Audiostock</h3>
    <p>
      正解音に、アートグローブ制作のAudiostock
      <a
        href="https://audiostock.jp/audio/106548"
        rel="external noopener"
        target="_blank">No.106548「ポカン、とコミカルで明るい音」</a
      >
      を購入して使用しています。
    </p>

    <h3>効果音ラボ</h3>
    <p>
      開始音と不正解・時間切れ音に、
      <a
        href="https://soundeffect-lab.info/sound/button/"
        rel="external noopener"
        target="_blank">効果音ラボ</a
      >
      の「決定ボタンを押す33」「決定ボタンを押す2」を使用しています。
    </p>

    <h3>OtoLogic</h3>
    <p>
      通常結果、全問正解、時間警告に、
      <a href="https://otologic.jp/" rel="external noopener" target="_blank"
        >OtoLogic</a
      >
      の「マルチアクセント04」「マルチアクセント03」「警告音 サイレン05」を使用しています。ライセンスは
      <a
        href="https://creativecommons.org/licenses/by/4.0/deed.ja"
        rel="external noopener"
        target="_blank">CC BY 4.0</a
      >
      です。
    </p>
  </section>

  <section>
    <h2>ライセンスの詳細</h2>
    <p>
      著作権表示、変更内容、ライセンス全文への参照は、プロジェクト内のTHIRD_PARTY_NOTICES.mdにまとめています。各素材の権利は、それぞれの制作者と権利者に帰属します。
    </p>
    <p>
      購入した効果音を含め、素材ファイルそのものをダウンロード素材として再配布することはありません。
    </p>
  </section>
</PublicPageShell>
