(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const VIEW_W = 1000;
  const VIEW_H = 1500;
  const BOARD = { x: 84, y: 126, w: 832, h: 1248 };
  const MAX_DRAG = 178;
  const LAUNCH_POWER = 0.7;
  const STOP_SPEED = 18;
  const LINEAR_DAMPING = 1.35;
  const RESTITUTION = 0.88;
  const BUMPER_RESTITUTION = 0.94;
  const SETTLE_DELAY = 0.25;

  const COLORS = {
    red: {
      name: "赤",
      main: "#e6485b",
      dark: "#9f182b",
      glow: "rgba(230, 72, 91, 0.38)",
    },
    green: {
      name: "緑",
      main: "#35c47a",
      dark: "#0d7f49",
      glow: "rgba(53, 196, 122, 0.38)",
    },
  };

  const SIZE_DATA = {
    small: { r: 19, mass: 1.0 },
    medium: { r: 25, mass: 1.75 },
    large: { r: 37, mass: 3.25 },
  };

  const BUMPERS = [
    { x: 170, y: 734, w: 190, h: 26 },
    { x: 640, y: 734, w: 190, h: 26 },
  ];

  const el = {
    titleScreen: document.getElementById("titleScreen"),
    tutorialScreen: document.getElementById("tutorialScreen"),
    pauseScreen: document.getElementById("pauseScreen"),
    resultScreen: document.getElementById("resultScreen"),
    startButton: document.getElementById("startButton"),
    tutorialButton: document.getElementById("tutorialButton"),
    pauseButton: document.getElementById("pauseButton"),
    helpButton: document.getElementById("helpButton"),
    restartButton: document.getElementById("restartButton"),
    resumeButton: document.getElementById("resumeButton"),
    pauseRestartButton: document.getElementById("pauseRestartButton"),
    backToTitleButton: document.getElementById("backToTitleButton"),
    rematchButton: document.getElementById("rematchButton"),
    resultTitleButton: document.getElementById("resultTitleButton"),
    soundToggle: document.getElementById("soundToggle"),
    turnStrip: document.getElementById("turnStrip"),
    turnLabel: document.getElementById("turnLabel"),
    statusLabel: document.getElementById("statusLabel"),
    redCount: document.getElementById("redCount"),
    greenCount: document.getElementById("greenCount"),
    tutorialArt: document.getElementById("tutorialArt"),
    tutorialStep: document.getElementById("tutorialStep"),
    tutorialTitle: document.getElementById("tutorialTitle"),
    tutorialText: document.getElementById("tutorialText"),
    tutorialBackButton: document.getElementById("tutorialBackButton"),
    tutorialNextButton: document.getElementById("tutorialNextButton"),
    winnerTitle: document.getElementById("winnerTitle"),
    winnerText: document.getElementById("winnerText"),
  };

  const tutorialSlides = [
    {
      title: "引いて弾く",
      text: "自分の色のコマを選び、引いた方向と反対へ発射します。引ける距離には上限があります。",
      art: `
        <div class="tutorial-board">
          <span class="mini-piece red" style="left: 136px; top: 52px;"></span>
          <span class="mini-pull" style="left: 67px; top: 68px;"></span>
          <span class="mini-arrow" style="left: 176px; top: 68px;"></span>
        </div>
      `,
    },
    {
      title: "盤外は除去",
      text: "上下左右どこから出ても落下です。自分のコマを落としてしまった場合も、そのまま取り除かれます。",
      art: `
        <div class="tutorial-board">
          <span class="mini-piece green" style="left: 88px; top: 42px;"></span>
          <span class="mini-piece red" style="right: -10px; bottom: 32px;"></span>
          <span class="mini-drop" style="right: 10px; bottom: 22px;"></span>
        </div>
      `,
    },
    {
      title: "反射板",
      text: "盤の中央付近にある水平の反射板だけが跳ね返します。盤の外枠は壁ではありません。",
      art: `
        <div class="tutorial-board">
          <span class="mini-bumper" style="left: 38px; top: 64px;"></span>
          <span class="mini-bumper" style="right: 38px; top: 64px;"></span>
          <span class="mini-piece red" style="left: 198px; top: 36px;"></span>
        </div>
      `,
    },
    {
      title: "勝利条件",
      text: "相手チームのコマをすべて盤外に落としたら勝利です。落とせなくてもターンは交代します。",
      art: `
        <div class="tutorial-board">
          <span class="mini-piece red" style="left: 94px; bottom: 34px;"></span>
          <span class="mini-piece red" style="left: 146px; bottom: 34px;"></span>
          <span class="mini-piece green" style="right: 42px; top: 38px;"></span>
          <span class="mini-drop" style="right: 32px; top: 28px;"></span>
        </div>
      `,
    },
  ];

  const state = {
    pieces: [],
    effects: [],
    turn: "red",
    phase: "ready",
    selected: null,
    pointer: null,
    settleTime: 0,
    lastTime: performance.now(),
    tutorialIndex: 0,
    overlay: "title",
    sound: true,
    audioContext: null,
    lastCollisionSound: 0,
  };

  let woodPattern = null;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = VIEW_W * dpr;
    canvas.height = VIEW_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeWoodPattern() {
    const offscreen = document.createElement("canvas");
    offscreen.width = 360;
    offscreen.height = 360;
    const g = offscreen.getContext("2d");
    const gradient = g.createLinearGradient(0, 0, 360, 0);
    gradient.addColorStop(0, "#b97731");
    gradient.addColorStop(0.35, "#dda85a");
    gradient.addColorStop(0.72, "#c4863d");
    gradient.addColorStop(1, "#f0c878");
    g.fillStyle = gradient;
    g.fillRect(0, 0, 360, 360);

    for (let x = -20; x < 390; x += 18) {
      const alpha = 0.12 + ((x * 13) % 9) / 100;
      g.strokeStyle = `rgba(70, 38, 15, ${alpha})`;
      g.lineWidth = 2 + ((x * 7) % 4);
      g.beginPath();
      g.moveTo(x, 0);
      for (let y = 0; y <= 360; y += 36) {
        g.lineTo(x + Math.sin(y * 0.035 + x) * 8, y);
      }
      g.stroke();
    }

    for (let i = 0; i < 36; i += 1) {
      const x = (i * 71) % 360;
      const y = (i * 47) % 360;
      g.strokeStyle = "rgba(85, 49, 22, 0.14)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.ellipse(x, y, 26, 8, (i % 5) * 0.7, 0, Math.PI * 2);
      g.stroke();
    }

    woodPattern = ctx.createPattern(offscreen, "repeat");
  }

  function roundedRect(context, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();
  }

  function createPiece(team, size, x, y, symbol) {
    const data = SIZE_DATA[size];
    return {
      id: `${team}-${size}-${state.pieces.length}`,
      team,
      size,
      symbol,
      x,
      y,
      vx: 0,
      vy: 0,
      r: data.r,
      mass: data.mass,
      active: true,
      angle: (x + y) * 0.01,
    };
  }

  function addTeam(team, topSide) {
    const mirror = (y) => (topSide ? y : VIEW_H - y);
    const cols = 8;
    const rows = 12;
    const gridX = (column) => BOARD.x + (BOARD.w / cols) * column;
    const gridY = (row) => BOARD.y + (BOARD.h / rows) * row;
    const mediumColumns = [0, 1, 2, 3, 5, 6, 7, 8];
    const smallWideColumns = [0, 2, 4, 6, 8];
    const smallSideColumns = [1, 7];

    mediumColumns.forEach((column, index) => {
      state.pieces.push(createPiece(team, "medium", gridX(column), mirror(gridY(0)), index % 5));
    });

    state.pieces.push(createPiece(team, "large", gridX(4), mirror(gridY(1)), 5));

    smallSideColumns.forEach((column, index) => {
      state.pieces.push(createPiece(team, "small", gridX(column), mirror(gridY(2)), index % 5));
    });

    smallWideColumns.forEach((column, index) => {
      state.pieces.push(createPiece(team, "small", gridX(column), mirror(gridY(3)), (index + 2) % 5));
    });
  }

  function resetGame() {
    state.pieces = [];
    state.effects = [];
    state.turn = "red";
    state.phase = "ready";
    state.selected = null;
    state.pointer = null;
    state.settleTime = 0;
    addTeam("green", true);
    addTeam("red", false);
    updateHud();
  }

  function livePieces(team) {
    return state.pieces.filter((piece) => piece.active && piece.team === team);
  }

  function updateHud() {
    const red = livePieces("red").length;
    const green = livePieces("green").length;
    el.redCount.textContent = String(red);
    el.greenCount.textContent = String(green);
    el.turnLabel.textContent = `${COLORS[state.turn].name}の手番`;
    el.turnStrip.style.borderColor =
      state.turn === "red" ? "rgba(230, 72, 91, 0.5)" : "rgba(53, 196, 122, 0.5)";

    if (state.phase === "ready") {
      el.statusLabel.textContent = "コマを選択";
    } else if (state.phase === "aiming") {
      el.statusLabel.textContent = "狙いを決める";
    } else if (state.phase === "moving") {
      el.statusLabel.textContent = "移動中";
    }
  }

  function setOverlay(name) {
    state.overlay = name;
    el.titleScreen.classList.toggle("hidden", name !== "title");
    el.tutorialScreen.classList.toggle("hidden", name !== "tutorial");
    el.pauseScreen.classList.toggle("hidden", name !== "pause");
    el.resultScreen.classList.toggle("hidden", name !== "result");
  }

  function startMatch() {
    resetGame();
    setOverlay(null);
  }

  function showTitle() {
    state.phase = "ready";
    state.selected = null;
    state.pointer = null;
    setOverlay("title");
  }

  function openTutorial() {
    state.tutorialIndex = 0;
    renderTutorial();
    setOverlay("tutorial");
  }

  function closeTutorialToTitle() {
    try {
      localStorage.setItem("chinese-checkers-tutorial-seen", "1");
    } catch {
      // localStorage can be unavailable in private contexts.
    }
    showTitle();
  }

  function renderTutorial() {
    const slide = tutorialSlides[state.tutorialIndex];
    el.tutorialStep.textContent = `${state.tutorialIndex + 1} / ${tutorialSlides.length}`;
    el.tutorialTitle.textContent = slide.title;
    el.tutorialText.textContent = slide.text;
    el.tutorialArt.innerHTML = slide.art;
    el.tutorialBackButton.textContent = state.tutorialIndex === 0 ? "閉じる" : "戻る";
    el.tutorialNextButton.textContent =
      state.tutorialIndex === tutorialSlides.length - 1 ? "タイトルへ" : "次へ";
  }

  function playTone(type, intensity = 1) {
    if (!state.sound || !el.soundToggle.checked) return;
    try {
      state.audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const audio = state.audioContext;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const now = audio.currentTime;
      const settings = {
        select: [620, 0.035, "sine"],
        launch: [210, 0.08, "triangle"],
        hit: [150 + intensity * 80, 0.045, "square"],
        drop: [96, 0.16, "sawtooth"],
        win: [520, 0.22, "triangle"],
      }[type];

      osc.type = settings[2];
      osc.frequency.setValueAtTime(settings[0], now);
      if (type === "win") osc.frequency.exponentialRampToValueAtTime(840, now + settings[1]);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08 * intensity, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + settings[1]);
      osc.connect(gain).connect(audio.destination);
      osc.start(now);
      osc.stop(now + settings[1] + 0.02);
    } catch {
      state.sound = false;
    }
  }

  function worldPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  function canAim() {
    return !state.overlay && state.phase === "ready";
  }

  function findPieceAt(point) {
    for (let i = state.pieces.length - 1; i >= 0; i -= 1) {
      const piece = state.pieces[i];
      if (!piece.active || piece.team !== state.turn) continue;
      const dx = point.x - piece.x;
      const dy = point.y - piece.y;
      if (Math.hypot(dx, dy) <= piece.r + 14) return piece;
    }
    return null;
  }

  function clampDrag(piece, point) {
    const dx = point.x - piece.x;
    const dy = point.y - piece.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= MAX_DRAG) return { x: dx, y: dy, dist };
    const scale = MAX_DRAG / Math.max(dist, 0.001);
    return { x: dx * scale, y: dy * scale, dist: MAX_DRAG };
  }

  function onPointerDown(event) {
    if (!canAim()) return;
    const point = worldPoint(event);
    const piece = findPieceAt(point);
    if (!piece) return;
    canvas.setPointerCapture(event.pointerId);
    state.selected = piece;
    state.pointer = point;
    state.phase = "aiming";
    playTone("select", 0.75);
    updateHud();
  }

  function onPointerMove(event) {
    if (state.phase !== "aiming" || !state.selected) return;
    state.pointer = worldPoint(event);
  }

  function onPointerUp(event) {
    if (state.phase !== "aiming" || !state.selected) return;
    const point = worldPoint(event);
    const drag = clampDrag(state.selected, point);
    if (drag.dist < 18) {
      state.selected = null;
      state.pointer = null;
      state.phase = "ready";
      updateHud();
      return;
    }

    const piece = state.selected;
    const massSpeedOffset = 0.84 + piece.mass * 0.07;
    const launchScale = (8.35 * LAUNCH_POWER) / massSpeedOffset;
    piece.vx = -drag.x * launchScale;
    piece.vy = -drag.y * launchScale;
    state.selected = null;
    state.pointer = null;
    state.phase = "moving";
    state.settleTime = 0;
    playTone("launch", Math.min(1.25, 0.55 + drag.dist / MAX_DRAG));
    updateHud();
  }

  function applyDamping(piece, dt) {
    const decay = Math.exp(-LINEAR_DAMPING * dt);
    piece.vx *= decay;
    piece.vy *= decay;
    if (Math.hypot(piece.vx, piece.vy) < STOP_SPEED) {
      piece.vx = 0;
      piece.vy = 0;
    }
  }

  function collidePieces(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const minDist = a.r + b.r;
    const distSq = dx * dx + dy * dy;
    if (distSq >= minDist * minDist) return;

    const dist = Math.sqrt(distSq) || 0.0001;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;
    const invA = 1 / a.mass;
    const invB = 1 / b.mass;
    const invSum = invA + invB;

    a.x -= nx * overlap * (invA / invSum);
    a.y -= ny * overlap * (invA / invSum);
    b.x += nx * overlap * (invB / invSum);
    b.y += ny * overlap * (invB / invSum);

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const velAlongNormal = rvx * nx + rvy * ny;
    if (velAlongNormal > 0) return;

    const impulse = (-(1 + RESTITUTION) * velAlongNormal) / invSum;
    const ix = impulse * nx;
    const iy = impulse * ny;
    a.vx -= ix * invA;
    a.vy -= iy * invA;
    b.vx += ix * invB;
    b.vy += iy * invB;

    const impact = Math.abs(impulse);
    const now = performance.now();
    if (impact > 130 && now - state.lastCollisionSound > 80) {
      state.lastCollisionSound = now;
      playTone("hit", Math.min(1.15, impact / 520));
      addSpark((a.x + b.x) / 2, (a.y + b.y) / 2, impact / 720);
    }
  }

  function collideBumper(piece, bumper) {
    const nearestX = Math.max(bumper.x, Math.min(piece.x, bumper.x + bumper.w));
    const nearestY = Math.max(bumper.y, Math.min(piece.y, bumper.y + bumper.h));
    let dx = piece.x - nearestX;
    let dy = piece.y - nearestY;
    let dist = Math.hypot(dx, dy);
    let nx = dx / (dist || 1);
    let ny = dy / (dist || 1);

    if (dist === 0) {
      const left = Math.abs(piece.x - bumper.x);
      const right = Math.abs(piece.x - (bumper.x + bumper.w));
      const top = Math.abs(piece.y - bumper.y);
      const bottom = Math.abs(piece.y - (bumper.y + bumper.h));
      const min = Math.min(left, right, top, bottom);
      if (min === left) [nx, ny] = [-1, 0];
      else if (min === right) [nx, ny] = [1, 0];
      else if (min === top) [nx, ny] = [0, -1];
      else [nx, ny] = [0, 1];
      dist = 0;
    }

    if (dist > piece.r) return;
    const penetration = piece.r - dist + 0.2;
    piece.x += nx * penetration;
    piece.y += ny * penetration;

    const velNormal = piece.vx * nx + piece.vy * ny;
    if (velNormal < 0) {
      piece.vx -= (1 + BUMPER_RESTITUTION) * velNormal * nx;
      piece.vy -= (1 + BUMPER_RESTITUTION) * velNormal * ny;
      const now = performance.now();
      if (now - state.lastCollisionSound > 70) {
        state.lastCollisionSound = now;
        playTone("hit", 0.95);
      }
      addSpark(piece.x - nx * piece.r, piece.y - ny * piece.r, 0.8);
    }
  }

  function isOutside(piece) {
    return (
      piece.x < BOARD.x ||
      piece.x > BOARD.x + BOARD.w ||
      piece.y < BOARD.y ||
      piece.y > BOARD.y + BOARD.h
    );
  }

  function dropPiece(piece) {
    piece.active = false;
    piece.vx = 0;
    piece.vy = 0;
    state.effects.push({
      kind: "drop",
      x: piece.x,
      y: piece.y,
      team: piece.team,
      age: 0,
      life: 0.45,
      r: piece.r,
    });
    playTone("drop", 0.9);
    updateHud();
  }

  function addSpark(x, y, strength) {
    state.effects.push({
      kind: "spark",
      x,
      y,
      age: 0,
      life: 0.28,
      strength,
    });
  }

  function allStopped() {
    return state.pieces
      .filter((piece) => piece.active)
      .every((piece) => Math.hypot(piece.vx, piece.vy) < STOP_SPEED);
  }

  function finishTurn() {
    const red = livePieces("red").length;
    const green = livePieces("green").length;

    if (red === 0 || green === 0) {
      const winner = red > green ? "red" : "green";
      el.winnerTitle.textContent = `${COLORS[winner].name}の勝利`;
      el.winnerText.textContent = `赤 ${red}個 / 緑 ${green}個`;
      state.phase = "result";
      playTone("win", 0.85);
      setOverlay("result");
      return;
    }

    state.turn = state.turn === "red" ? "green" : "red";
    state.phase = "ready";
    state.settleTime = 0;
    updateHud();
  }

  function updatePhysics(dt) {
    const active = state.pieces.filter((piece) => piece.active);
    active.forEach((piece) => {
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.angle += (piece.vx * 0.002 + piece.vy * 0.0015) * dt;
      applyDamping(piece, dt);
    });

    for (let iteration = 0; iteration < 2; iteration += 1) {
      for (let i = 0; i < active.length; i += 1) {
        for (let j = i + 1; j < active.length; j += 1) {
          collidePieces(active[i], active[j]);
        }
      }

      active.forEach((piece) => {
        BUMPERS.forEach((bumper) => collideBumper(piece, bumper));
      });
    }

    active.forEach((piece) => {
      if (piece.active && isOutside(piece)) dropPiece(piece);
    });

    state.effects.forEach((effect) => {
      effect.age += dt;
    });
    state.effects = state.effects.filter((effect) => effect.age < effect.life);

    if (state.phase === "moving") {
      if (allStopped()) {
        state.settleTime += dt;
        if (state.settleTime > SETTLE_DELAY) finishTurn();
      } else {
        state.settleTime = 0;
      }
    }
  }

  function drawBoard() {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#171511";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;
    roundedRect(ctx, 24, 24, VIEW_W - 48, VIEW_H - 48, 26);
    ctx.fillStyle = woodPattern || "#c28943";
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundedRect(ctx, 24, 24, VIEW_W - 48, VIEW_H - 48, 26);
    ctx.clip();
    const edgeGradient = ctx.createLinearGradient(24, 0, VIEW_W - 24, 0);
    edgeGradient.addColorStop(0, "rgba(255, 239, 180, 0.22)");
    edgeGradient.addColorStop(0.5, "rgba(65, 34, 13, 0.1)");
    edgeGradient.addColorStop(1, "rgba(255, 239, 180, 0.2)");
    ctx.fillStyle = edgeGradient;
    ctx.fillRect(24, 24, VIEW_W - 48, VIEW_H - 48);
    ctx.restore();

    roundedRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 10);
    ctx.fillStyle = "rgba(255, 223, 155, 0.18)";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(48, 28, 13, 0.9)";
    ctx.stroke();

    drawGrid();
    drawBumpers();
  }

  function drawGrid() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(54, 32, 15, 0.72)";
    ctx.lineWidth = 4;
    const cols = 8;
    const rows = 12;
    const cellW = BOARD.w / cols;
    const cellH = BOARD.h / rows;

    for (let c = 1; c < cols; c += 1) {
      const x = BOARD.x + c * cellW;
      ctx.beginPath();
      ctx.moveTo(x, BOARD.y + 6);
      ctx.lineTo(x, BOARD.y + BOARD.h - 6);
      ctx.stroke();
    }

    for (let r = 1; r < rows; r += 1) {
      const y = BOARD.y + r * cellH;
      ctx.beginPath();
      ctx.moveTo(BOARD.x + 6, y);
      ctx.lineTo(BOARD.x + BOARD.w - 6, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(34, 23, 16, 0.9)";
    ctx.lineWidth = 6;
    const midY = BOARD.y + BOARD.h / 2;
    ctx.beginPath();
    ctx.moveTo(BOARD.x - 18, midY);
    ctx.lineTo(BOARD.x + BOARD.w + 18, midY);
    ctx.stroke();
    ctx.restore();
  }

  function drawBumpers() {
    BUMPERS.forEach((bumper) => {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.32)";
      ctx.shadowBlur = 9;
      ctx.shadowOffsetY = 6;
      roundedRect(ctx, bumper.x, bumper.y, bumper.w, bumper.h, bumper.h / 2);
      const gradient = ctx.createLinearGradient(bumper.x, bumper.y, bumper.x, bumper.y + bumper.h);
      gradient.addColorStop(0, "#f7db9a");
      gradient.addColorStop(0.5, "#b87836");
      gradient.addColorStop(1, "#6f3d1c");
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(61, 35, 17, 0.96)";
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      roundedRect(ctx, bumper.x + 12, bumper.y + 4, bumper.w - 24, 5, 3);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawPiece(piece) {
    const color = COLORS[piece.team];
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.angle);

    ctx.shadowColor = color.glow;
    ctx.shadowBlur = piece.team === state.turn && state.phase === "ready" ? 14 : 8;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.arc(0, 0, piece.r, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(-piece.r * 0.35, -piece.r * 0.45, 2, 0, 0, piece.r);
    gradient.addColorStop(0, "#fff8e2");
    gradient.addColorStop(0.23, color.main);
    gradient.addColorStop(0.72, color.dark);
    gradient.addColorStop(1, "#26100e");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.lineWidth = Math.max(2, piece.r * 0.12);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.58)";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-piece.r * 0.28, -piece.r * 0.38, piece.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
    ctx.fill();

    drawSymbol(piece);
    ctx.restore();
  }

  function drawSymbol(piece) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.lineWidth = Math.max(2.5, piece.r * 0.12);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const r = piece.r * 0.45;
    if (piece.size === "large") {
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 1.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, r * 0.05);
      ctx.lineTo(r * 0.68, -r * 0.36);
      ctx.lineTo(r * 0.16, r * 0.72);
      ctx.stroke();
    } else if (piece.symbol === 0) {
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();
    } else if (piece.symbol === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
      ctx.stroke();
    } else if (piece.symbol === 2) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.55);
      ctx.lineTo(r * 0.72, r * 0.52);
      ctx.moveTo(r * 0.72, -r * 0.55);
      ctx.lineTo(-r * 0.7, r * 0.52);
      ctx.stroke();
    } else if (piece.symbol === 3) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.84, r * 0.45);
      ctx.quadraticCurveTo(0, -r * 0.9, r * 0.84, r * 0.45);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAim() {
    if (state.phase !== "aiming" || !state.selected || !state.pointer) return;
    const piece = state.selected;
    const drag = clampDrag(piece, state.pointer);
    const power = drag.dist / MAX_DRAG;
    const ax = -drag.x;
    const ay = -drag.y;
    const len = Math.hypot(ax, ay) || 1;
    const ux = ax / len;
    const uy = ay / len;
    const startX = piece.x + ux * (piece.r + 12);
    const startY = piece.y + uy * (piece.r + 12);
    const endX = piece.x + ux * (piece.r + 32 + power * 145);
    const endY = piece.y + uy * (piece.r + 32 + power * 145);

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(piece.x, piece.y);
    ctx.lineTo(piece.x + drag.x, piece.y + drag.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = piece.team === "red" ? "#ffdd6a" : "#80f0bc";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - ux * 28 + -uy * 12, endY - uy * 28 + ux * 12);
    ctx.lineTo(endX - ux * 28 - -uy * 12, endY - uy * 28 - ux * 12);
    ctx.closePath();
    ctx.fill();

    for (let i = 1; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.arc(piece.x, piece.y, piece.r + i * 16 + power * 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.26 - i * 0.045})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEffects() {
    state.effects.forEach((effect) => {
      const t = effect.age / effect.life;
      ctx.save();
      if (effect.kind === "drop") {
        const color = COLORS[effect.team];
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = color.main;
        ctx.lineWidth = 6 * (1 - t);
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.r + t * 46, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.beginPath();
        ctx.arc(effect.x, effect.y + t * 28, effect.r * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = "#ffe48b";
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i += 1) {
          const angle = (i / 8) * Math.PI * 2;
          const inner = 8 + t * 16;
          const outer = 22 + t * 52 * effect.strength;
          ctx.beginPath();
          ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
          ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
          ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  function draw() {
    drawBoard();

    const activePieces = state.pieces.filter((piece) => piece.active);
    activePieces.sort((a, b) => a.y - b.y);

    activePieces.forEach((piece) => {
      if (piece === state.selected) return;
      drawPiece(piece);
    });

    if (state.selected) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(state.selected.x, state.selected.y, state.selected.r + 11, 0, Math.PI * 2);
      ctx.strokeStyle = state.selected.team === "red" ? "#ffdc62" : "#8df7bf";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
      drawPiece(state.selected);
    }

    drawAim();
    drawEffects();
  }

  function tick(now) {
    const rawDt = Math.min(0.04, (now - state.lastTime) / 1000);
    state.lastTime = now;
    if (!state.overlay || state.overlay === "result") {
      const steps = Math.max(1, Math.ceil(rawDt / (1 / 120)));
      const dt = rawDt / steps;
      for (let i = 0; i < steps; i += 1) {
        updatePhysics(dt);
      }
    }
    draw();
    requestAnimationFrame(tick);
  }

  function bindEvents() {
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    el.startButton.addEventListener("click", startMatch);
    el.tutorialButton.addEventListener("click", openTutorial);
    el.helpButton.addEventListener("click", openTutorial);
    el.pauseButton.addEventListener("click", () => {
      if (state.overlay === "title" || state.overlay === "tutorial" || state.overlay === "result") return;
      setOverlay("pause");
    });
    el.restartButton.addEventListener("click", startMatch);
    el.resumeButton.addEventListener("click", () => setOverlay(null));
    el.pauseRestartButton.addEventListener("click", startMatch);
    el.backToTitleButton.addEventListener("click", showTitle);
    el.rematchButton.addEventListener("click", startMatch);
    el.resultTitleButton.addEventListener("click", showTitle);
    el.soundToggle.addEventListener("change", () => {
      state.sound = el.soundToggle.checked;
    });

    el.tutorialBackButton.addEventListener("click", () => {
      if (state.tutorialIndex === 0) {
        closeTutorialToTitle();
        return;
      }
      state.tutorialIndex -= 1;
      renderTutorial();
    });

    el.tutorialNextButton.addEventListener("click", () => {
      if (state.tutorialIndex === tutorialSlides.length - 1) {
        closeTutorialToTitle();
        return;
      }
      state.tutorialIndex += 1;
      renderTutorial();
    });

    window.addEventListener("resize", resizeCanvas);
  }

  function init() {
    resizeCanvas();
    makeWoodPattern();
    resetGame();
    bindEvents();
    let seenTutorial = false;
    try {
      seenTutorial = localStorage.getItem("chinese-checkers-tutorial-seen") === "1";
    } catch {
      seenTutorial = true;
    }
    if (!seenTutorial) {
      openTutorial();
    } else {
      showTitle();
    }
    requestAnimationFrame(tick);
  }

  init();
})();
