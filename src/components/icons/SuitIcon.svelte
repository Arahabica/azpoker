<script lang="ts">
  interface Props {
    path: string;
    viewBox: string;
    placement: "corner" | "center";
  }

  let { path, viewBox, placement }: Props = $props();
</script>

<svg
  class="suit-icon"
  class:is-corner={placement === "corner"}
  class:is-center={placement === "center"}
  {viewBox}
  aria-hidden="true"
>
  <path d={path}></path>
</svg>

<style>
  .suit-icon {
    fill: currentcolor;
  }

  .suit-icon.is-corner {
    width: 0.78rem;
    width: 19cqi;
    margin-top: 4cqi;
  }

  .suit-icon.is-center {
    position: absolute;
    top: 62%;
    left: 50%;
    width: 52%;
    transform: translate(-50%, -50%);
  }
</style>
