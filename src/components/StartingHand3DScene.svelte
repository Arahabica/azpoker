<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import { OrbitControls } from "three/addons/controls/OrbitControls.js";

  import {
    PREFLOP_RANKS,
    PREFLOP_TIER_COLORS,
    type PreflopEquityCell,
  } from "../preflop-equity.ts";

  interface Props {
    cells: readonly PreflopEquityCell[];
    selectedHand: string | null;
    resetToken: number;
    descriptionId: string;
    onSelect: (cell: PreflopEquityCell | null) => void;
    onReady: () => void;
    onError: (message: string) => void;
  }

  let {
    cells,
    selectedHand,
    resetToken,
    descriptionId,
    onSelect,
    onReady,
    onError,
  }: Props = $props();

  let canvas: HTMLCanvasElement;
  let sceneHost: HTMLDivElement;
  let applySelection: ((hand: string | null) => void) | undefined;
  let resetCamera: (() => void) | undefined;

  const GRID_SIZE = PREFLOP_RANKS.length;
  const GRID_CENTER = (GRID_SIZE - 1) / 2;
  const BAR_WIDTH = 0.78;
  const FLOAT_HEIGHT = 0.75;
  const HEIGHT_SCALE = GRID_SIZE / 100;

  function xFor(cell: PreflopEquityCell): number {
    return cell.columnIndex - GRID_CENTER;
  }

  function zFor(cell: PreflopEquityCell): number {
    return GRID_CENTER - cell.rowIndex;
  }

  function heightFor(cell: PreflopEquityCell): number {
    return cell.equity * HEIGHT_SCALE;
  }

  $effect(() => {
    applySelection?.(selectedHand);
  });

  $effect(() => {
    if (resetToken > 0) resetCamera?.();
  });

  onMount(() => {
    let cancelled = false;
    let disposeScene: (() => void) | undefined;

    function setupScene(): () => void {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      scene.fog = new THREE.Fog(0xffffff, 28, 105);

      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 220);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        canvas,
        powerPreference: "high-performance",
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0xffffff, 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const geometries: THREE.BufferGeometry[] = [];
      const materials: THREE.Material[] = [];
      const textures: THREE.Texture[] = [];

      function rememberMaterial(
        material: THREE.Material | readonly THREE.Material[],
      ): void {
        if (material instanceof THREE.Material) {
          materials.push(material);
        } else {
          materials.push(...material);
        }
      }

      function createHandTexture(hand: string): THREE.CanvasTexture {
        const labelCanvas = document.createElement("canvas");
        labelCanvas.width = 128;
        labelCanvas.height = 128;
        const context = labelCanvas.getContext("2d");
        if (!context) throw new Error("ハンド名を描画できません");

        context.clearRect(0, 0, 128, 128);
        context.fillStyle = "#ffffff";
        context.strokeStyle = "#111719";
        context.lineJoin = "round";
        context.lineWidth = 8;
        context.font = `${hand.length === 3 ? 38 : 44}px "Arbutus Slab", serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.strokeText(hand, 64, 66);
        context.fillText(hand, 64, 66);

        const texture = new THREE.CanvasTexture(labelCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = Math.min(
          4,
          renderer.capabilities.getMaxAnisotropy(),
        );
        textures.push(texture);
        return texture;
      }

      scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e9e8, 2.1));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
      keyLight.position.set(16, 28, 18);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -17;
      keyLight.shadow.camera.right = 17;
      keyLight.shadow.camera.top = 17;
      keyLight.shadow.camera.bottom = -17;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 70;
      keyLight.shadow.bias = -0.00025;
      scene.add(keyLight);

      const groundGeometry = new THREE.PlaneGeometry(240, 240);
      geometries.push(groundGeometry);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 1,
      });
      materials.push(groundMaterial);
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.015;
      ground.receiveShadow = true;
      scene.add(ground);

      const grid = new THREE.GridHelper(240, 240, 0xc2c7c5, 0xe0e3e2);
      grid.position.y = 0.005;
      geometries.push(grid.geometry);
      rememberMaterial(grid.material);
      scene.add(grid);

      const barGeometry = new THREE.BoxGeometry(1, 1, 1);
      geometries.push(barGeometry);
      const barMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.02,
        roughness: 0.72,
      });
      materials.push(barMaterial);
      const bars = new THREE.InstancedMesh(
        barGeometry,
        barMaterial,
        cells.length,
      );
      const transform = new THREE.Object3D();
      const baseColors = cells.map(
        (cell) => new THREE.Color(PREFLOP_TIER_COLORS[cell.tier - 1]),
      );
      const selectedColor = new THREE.Color(0xf1c40f);
      for (const [index, cell] of cells.entries()) {
        const height = heightFor(cell);
        transform.position.set(
          xFor(cell),
          FLOAT_HEIGHT + height / 2,
          zFor(cell),
        );
        transform.scale.set(BAR_WIDTH, height, BAR_WIDTH);
        transform.updateMatrix();
        bars.setMatrixAt(index, transform.matrix);
        bars.setColorAt(index, baseColors[index]!);
      }
      bars.instanceMatrix.needsUpdate = true;
      if (bars.instanceColor) bars.instanceColor.needsUpdate = true;
      bars.castShadow = true;
      bars.receiveShadow = true;
      bars.computeBoundingSphere();
      scene.add(bars);

      const labelGeometry = new THREE.PlaneGeometry(
        BAR_WIDTH * 0.92,
        BAR_WIDTH * 0.92,
      );
      labelGeometry.rotateX(-Math.PI / 2);
      labelGeometry.rotateY(Math.PI / 2);
      geometries.push(labelGeometry);
      for (const cell of cells) {
        const labelMaterial = new THREE.MeshBasicMaterial({
          alphaTest: 0.08,
          depthTest: true,
          depthWrite: false,
          map: createHandTexture(cell.hand),
          side: THREE.DoubleSide,
          toneMapped: false,
          transparent: true,
        });
        materials.push(labelMaterial);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(
          xFor(cell),
          FLOAT_HEIGHT + heightFor(cell) + 0.008,
          zFor(cell),
        );
        label.renderOrder = 2;
        scene.add(label);
      }

      const frameBoxGeometry = new THREE.BoxGeometry(
        GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE,
      );
      geometries.push(frameBoxGeometry);
      const frameGeometry = new THREE.EdgesGeometry(frameBoxGeometry);
      geometries.push(frameGeometry);
      const frameMaterial = new THREE.LineBasicMaterial({
        color: 0x59635f,
        opacity: 0.78,
        transparent: true,
      });
      materials.push(frameMaterial);
      const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
      frame.position.y = FLOAT_HEIGHT + GRID_SIZE / 2;
      scene.add(frame);

      const controls = new OrbitControls(camera, canvas);
      controls.autoRotate = false;
      controls.enableDamping = false;
      controls.enablePan = false;
      controls.maxDistance = 115;
      controls.maxPolarAngle = Math.PI * 0.495;
      controls.minDistance = 12;
      controls.minPolarAngle = Math.PI * 0.08;
      controls.rotateSpeed = 0.72;
      controls.touches.ONE = THREE.TOUCH.ROTATE;
      controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
      controls.zoomSpeed = 0.85;
      controls.zoomToCursor = false;

      const cameraTarget = new THREE.Vector3(
        0,
        FLOAT_HEIGHT + GRID_SIZE / 2,
        0,
      );
      const defaultCameraDirection = new THREE.Vector3(1, 0.78, 0).normalize();

      function defaultCameraDistance(): number {
        const verticalFov = THREE.MathUtils.degToRad(camera.fov);
        const horizontalFov =
          2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
        const limitingFov = Math.min(verticalFov, horizontalFov);
        return Math.max(24, (GRID_SIZE * 0.72) / Math.tan(limitingFov / 2));
      }

      function setDefaultView(): void {
        controls.target.copy(cameraTarget);
        camera.position
          .copy(cameraTarget)
          .addScaledVector(defaultCameraDirection, defaultCameraDistance());
        controls.update();
      }

      function render(): void {
        renderer.render(scene, camera);
      }

      let initialViewSet = false;
      function resize(): void {
        const width = Math.max(1, sceneHost.clientWidth);
        const height = Math.max(1, sceneHost.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (!initialViewSet) {
          setDefaultView();
          initialViewSet = true;
        }
        render();
      }

      let selectedIndex: number | null = null;
      function selectHand(hand: string | null): void {
        const nextIndex =
          hand === null
            ? null
            : cells.findIndex((candidate) => candidate.hand === hand);
        const normalizedIndex = nextIndex === -1 ? null : nextIndex;
        if (selectedIndex !== null) {
          bars.setColorAt(selectedIndex, baseColors[selectedIndex]!);
        }
        selectedIndex = normalizedIndex;
        if (selectedIndex !== null) {
          bars.setColorAt(selectedIndex, selectedColor);
        }
        if (bars.instanceColor) bars.instanceColor.needsUpdate = true;
        render();
      }

      applySelection = selectHand;
      resetCamera = () => {
        setDefaultView();
        render();
      };
      selectHand(selectedHand);

      controls.addEventListener("change", render);
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(sceneHost);
      window.addEventListener("resize", resize);

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const pointerStarts: { pointerId: number; x: number; y: number }[] = [];
      let gestureUsedMultiplePointers = false;

      function handlePointerDown(event: PointerEvent): void {
        pointerStarts.push({
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        });
        if (pointerStarts.length > 1) gestureUsedMultiplePointers = true;
      }

      function handlePointerUp(event: PointerEvent): void {
        const startIndex = pointerStarts.findIndex(
          (pointerStart) => pointerStart.pointerId === event.pointerId,
        );
        const start = pointerStarts[startIndex];
        const shouldSelect =
          start !== undefined &&
          !gestureUsedMultiplePointers &&
          pointerStarts.length === 1 &&
          Math.hypot(event.clientX - start.x, event.clientY - start.y) < 7;
        if (startIndex >= 0) pointerStarts.splice(startIndex, 1);
        if (pointerStarts.length === 0) gestureUsedMultiplePointers = false;
        if (!shouldSelect) return;

        const bounds = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(bars, false)[0];
        const cell =
          hit?.instanceId === undefined
            ? null
            : (cells[hit.instanceId] ?? null);
        selectHand(cell?.hand ?? null);
        onSelect(cell);
      }

      function handlePointerCancel(event: PointerEvent): void {
        const startIndex = pointerStarts.findIndex(
          (pointerStart) => pointerStart.pointerId === event.pointerId,
        );
        if (startIndex >= 0) pointerStarts.splice(startIndex, 1);
        if (pointerStarts.length === 0) gestureUsedMultiplePointers = false;
      }

      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointerup", handlePointerUp);
      canvas.addEventListener("pointercancel", handlePointerCancel);
      resize();
      onReady();

      return () => {
        if (applySelection === selectHand) applySelection = undefined;
        resetCamera = undefined;
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointerup", handlePointerUp);
        canvas.removeEventListener("pointercancel", handlePointerCancel);
        window.removeEventListener("resize", resize);
        resizeObserver.disconnect();
        controls.removeEventListener("change", render);
        controls.dispose();
        for (const texture of textures) texture.dispose();
        for (const material of materials) material.dispose();
        for (const geometry of geometries) geometry.dispose();
        scene.clear();
        renderer.dispose();
        renderer.forceContextLoss();
      };
    }

    async function initialize(): Promise<void> {
      if (document.fonts) {
        await Promise.allSettled([
          document.fonts.load('400 1rem "Arbutus Slab"'),
        ]);
      }
      if (cancelled) return;
      try {
        disposeScene = setupScene();
      } catch {
        onError("この端末では3D表示を開始できませんでした。");
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      disposeScene?.();
    };
  });
</script>

<div
  class="scene-host"
  bind:this={sceneHost}
  role="img"
  aria-label="6人卓のスターティングハンド勝率を高さで表した3D柱グラフ"
  aria-describedby={descriptionId}
  data-bar-count={cells.length}
  data-selected-hand={selectedHand ?? ""}
>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
  .scene-host,
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  .scene-host {
    min-width: 0;
    overflow: hidden;
    background: #fff;
  }

  canvas {
    cursor: grab;
    touch-action: none;
  }

  canvas:active {
    cursor: grabbing;
  }
</style>
