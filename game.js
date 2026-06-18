(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const boardFrame = document.querySelector(".board-frame");

  const VIEW_W = 1000;
  const VIEW_H = 1292;
  const BOARD = { x: 84, y: 126, w: 832, h: 1040 };
  const OUTER_GUTTER = 28;
  const DROP_BOUNDS = {
    x: BOARD.x - OUTER_GUTTER,
    y: BOARD.y - OUTER_GUTTER,
    w: BOARD.w + OUTER_GUTTER * 2,
    h: BOARD.h + OUTER_GUTTER * 2,
  };
  const GRID_COLS = 8;
  const GRID_ROWS = 10;
  const MAX_DRAG = 178;
  const LAUNCH_POWER = 0.77;
  const STOP_SPEED = 18;
  const LINEAR_DAMPING = 1.35;
  const RESTITUTION = 0.88;
  const BUMPER_RESTITUTION = 0.94;
  const SETTLE_DELAY = 0.25;
  const STRIKER_ALONG_DAMPING = 0.5;
  const SMALL_SPEED_MULTIPLIER = 0.9;
  const POWER_DRAG_MULTIPLIER = 1.5;
  const POWER_LAUNCH_MULTIPLIER = 1.25;
  const CPU_POWER_USE_CHANCE = 0.58;
  const CPU_POWER_USE_CHANCE_BANKED = 0.82;
  const CPU_POWER_USE_CHANCE_MAXED = 1;
  const CPU_POWER_RESERVE_CHANCE = 0.18;
  const CPU_ATTACK_POWER_MIN = 0.84;
  const CPU_ATTACK_POWER_MAX = 1;
  const CPU_RISKY_ATTACK_POWER_MIN = 0.55;
  const CPU_RISKY_ATTACK_POWER_MAX = 0.72;
  const CPU_POWERED_MIN_POWER = 0.95;
  const CPU_CENTER_POWER_MIN = 0.9;
  const CPU_CENTER_POWER_MAX = 1;
  const CPU_RESCUE_POWER_MIN = 0.72;
  const CPU_RESCUE_POWER_MAX = 0.86;
  const CPU_MIN_POWER = 0.5;
  const CPU_ATTACK_MIN_ANGLE_ERROR = 1.1;
  const CPU_ATTACK_MAX_ANGLE_ERROR = 3.0;
  const CPU_CENTER_ANGLE_ERROR = 4.0;
  const CPU_RESCUE_ANGLE_ERROR = 2.0;
  const CPU_PREVIEW_DELAY_MS = 500;
  const CPU_POWER_ANNOUNCE_DELAY_MS = 1800;
  const CPU_POWER_PREVIEW_GAP_MS = 120;
  const CPU_TARGET_RANDOMNESS = 0.72;
  const CPU_EDGE_TARGET_MAX_DIST = 520;
  const CPU_GROW_EDGE_THRESHOLD = 0.54;
  const CPU_RESCUE_EDGE_THRESHOLD = 0.58;
  const CPU_RESCUE_CHANCE = 0.62;
  const STRONG_CPU_BASE_LIMIT = 14;
  const STRONG_CPU_POWER_BASE_LIMIT = 6;
  const STRONG_CPU_SIM_TIME = 2.25;
  const STRONG_CPU_SIM_DT = 1 / 75;
  const STRONG_CPU_SIM_SETTLE = 0.26;
  const RESULT_DELAY_MS = 1000;

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
    medium: { r: 27.5, mass: 1.95 },
    large: { r: 44.5, mass: 4.15 },
    huge: { r: 53.5, mass: 5.35 },
  };

  const SKILLS = {
    power: { label: "Power", cost: 8 },
    rest: { label: "Skip", cost: 13 },
    grow: { label: "Grow", cost: 17 },
    steal: { label: "Steal", cost: 23 },
  };

  const DROP_SKILL_POINTS = {
    small: 2,
    medium: 4,
    large: 6,
    huge: 6,
  };

  const NEXT_SIZE = {
    small: "medium",
    medium: "large",
    large: "huge",
    huge: "huge",
  };

  const BUMPERS = [
    { x: 170, y: BOARD.y + BOARD.h / 2 - 13, w: 190, h: 26 },
    { x: 640, y: BOARD.y + BOARD.h / 2 - 13, w: 190, h: 26 },
  ];

  const el = {
    titleScreen: document.getElementById("titleScreen"),
    tutorialScreen: document.getElementById("tutorialScreen"),
    pauseScreen: document.getElementById("pauseScreen"),
    resultScreen: document.getElementById("resultScreen"),
    singleStartButton: document.getElementById("singleStartButton"),
    strongCpuStartButton: document.getElementById("strongCpuStartButton"),
    twoPlayerStartButton: document.getElementById("twoPlayerStartButton"),
    tutorialButton: document.getElementById("tutorialButton"),
    pauseButton: document.getElementById("pauseButton"),
    helpButton: document.getElementById("helpButton"),
    resumeButton: document.getElementById("resumeButton"),
    pauseRestartButton: document.getElementById("pauseRestartButton"),
    backToTitleButton: document.getElementById("backToTitleButton"),
    rematchButton: document.getElementById("rematchButton"),
    resultTitleButton: document.getElementById("resultTitleButton"),
    soundToggle: document.getElementById("soundToggle"),
    skillButtons: Array.from(document.querySelectorAll(".skill-button")),
    skillAnnouncement: document.getElementById("skillAnnouncement"),
    skillAnnouncementIcon: document.getElementById("skillAnnouncementIcon"),
    skillAnnouncementTeam: document.getElementById("skillAnnouncementTeam"),
    skillAnnouncementText: document.getElementById("skillAnnouncementText"),
    redPanel: document.querySelector(".player-panel--red"),
    greenPanel: document.querySelector(".player-panel--green"),
    redTurnLabel: document.getElementById("redTurnLabel"),
    greenTurnLabel: document.getElementById("greenTurnLabel"),
    redStatusLabel: document.getElementById("redStatusLabel"),
    greenStatusLabel: document.getElementById("greenStatusLabel"),
    redCount: document.getElementById("redCount"),
    greenCount: document.getElementById("greenCount"),
    tutorialArt: document.getElementById("tutorialArt"),
    tutorialStep: document.getElementById("tutorialStep"),
    tutorialTitle: document.getElementById("tutorialTitle"),
    tutorialText: document.getElementById("tutorialText"),
    tutorialBackButton: document.getElementById("tutorialBackButton"),
    tutorialNextButton: document.getElementById("tutorialNextButton"),
    winnerTitle: document.getElementById("winnerTitle"),
  };

  const tutorialSlides = [
    {
      title: "引いて弾く",
      text: "自分の色のコマを選び、引いた方向と反対へ発射します。",
      art: `
        <div class="tutorial-board tutorial-board--pull">
          <span class="mini-pull-ring mini-pull-ring--one" style="left: 92px; top: 28px;"></span>
          <span class="mini-pull-ring mini-pull-ring--two" style="left: 78px; top: 14px;"></span>
          <span class="mini-pull-ring mini-pull-ring--three" style="left: 64px; top: 0;"></span>
          <span class="mini-piece mini-piece--large red" style="left: 108px; top: 44px;"></span>
          <span class="mini-pull" style="left: 34px; top: 76px;"></span>
          <span class="mini-arrow" style="left: 172px; top: 76px;"></span>
        </div>
      `,
    },
    {
      title: "盤外に出ると除去",
      text: "上下左右どこから出ても落下です。自分のコマを落とさないようにしましょう。",
      art: `
        <div class="tutorial-board tutorial-board--drop">
          <span class="mini-piece red mini-piece--falling" style="right: -20px; bottom: 38px;"></span>
          <span class="mini-drop-zone" style="right: -30px; bottom: 20px;"></span>
          <span class="mini-fall-line"></span>
        </div>
      `,
    },
    {
      title: "反射板",
      text: "盤の中央にある水平の蝶番はコマが跳ね返ります。",
      art: `
        <div class="tutorial-board tutorial-board--bounce">
          <span class="mini-bumper" style="left: 28px; top: 76px;"></span>
          <span class="mini-piece red" style="left: 60px; top: 26px;"></span>
          <svg class="mini-v-arrow" viewBox="0 0 250 130" aria-hidden="true">
            <path d="M80 50 L112 88 L176 42"></path>
            <polyline class="mini-v-head" points="176,42 160,43 168,56"></polyline>
          </svg>
        </div>
      `,
    },
    {
      title: "特殊能力",
      text: "ゲームが進むと特殊能力を使えます。Power・Skip・Grow・Stealで手番を有利に進めましょう。",
      art: `
        <div class="tutorial-board tutorial-board--skills">
          <span class="mini-skill"><strong>Power</strong><small>1ターンだけはじくパワー上昇</small></span>
          <span class="mini-skill"><strong>Skip</strong><small>相手のターンを飛ばす</small></span>
          <span class="mini-skill"><strong>Grow</strong><small>自分の駒1個のサイズアップ</small></span>
          <span class="mini-skill"><strong>Steal</strong><small>相手の駒1個を自分のものに</small></span>
        </div>
      `,
    },
    {
      title: "勝利条件",
      text: "相手チームのコマをすべて盤外に落としたら勝利です。",
      art: `
        <div class="tutorial-board tutorial-board--win">
          <span class="mini-piece red" style="left: 78px; bottom: 32px;"></span>
          <span class="mini-piece red" style="left: 130px; bottom: 52px;"></span>
          <span class="mini-piece red" style="left: 184px; bottom: 30px;"></span>
          <span class="mini-victory-line"></span>
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
    tutorialReturnOverlay: "title",
    overlay: "title",
    mode: "twoPlayer",
    cpuTeam: "green",
    cpuDifficulty: "weak",
    cpuThinking: false,
    cpuTimer: null,
    cpuPreview: null,
    resultTimer: null,
    sound: true,
    skillPoints: {
      red: 0,
      green: 0,
    },
    powerBoostTeam: null,
    powerStacks: {
      red: 0,
      green: 0,
    },
    skipCredits: {
      red: 0,
      green: 0,
    },
    pendingSkill: null,
    announcementTimer: null,
    audioContext: null,
    lastCollisionSound: 0,
  };

  let woodPattern = null;
  let boardResizeObserver = null;

  function syncViewportHeight() {
    const height = window.visualViewport?.height || window.innerHeight;
    if (height > 0) {
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    }
  }

  function fitCanvasToFrame() {
    if (!boardFrame) return;
    const rect = boardFrame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const maxWidth = Math.min(rect.width, 540);
    const scale = Math.min(maxWidth / VIEW_W, rect.height / VIEW_H);
    const displayWidth = Math.floor(VIEW_W * scale);
    const displayHeight = Math.floor(VIEW_H * scale);

    if (displayWidth > 0 && displayHeight > 0) {
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    }
  }

  function resizeCanvas() {
    syncViewportHeight();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = VIEW_W * dpr;
    canvas.height = VIEW_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    requestAnimationFrame(fitCanvasToFrame);
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
    const gridX = (column) => BOARD.x + (BOARD.w / GRID_COLS) * column;
    const gridY = (row) => BOARD.y + (BOARD.h / GRID_ROWS) * row;
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

  function resetGame(mode = state.mode, cpuDifficulty = state.cpuDifficulty) {
    window.clearTimeout(state.cpuTimer);
    window.clearTimeout(state.resultTimer);
    state.pieces = [];
    state.effects = [];
    state.turn = "red";
    state.phase = "ready";
    state.mode = mode;
    state.cpuDifficulty = mode === "singlePlayer" ? cpuDifficulty : "weak";
    state.cpuThinking = false;
    state.cpuTimer = null;
    state.cpuPreview = null;
    state.resultTimer = null;
    state.selected = null;
    state.pointer = null;
    state.settleTime = 0;
    state.skillPoints.red = 0;
    state.skillPoints.green = 0;
    state.powerBoostTeam = null;
    state.powerStacks.red = 0;
    state.powerStacks.green = 0;
    state.skipCredits.red = 0;
    state.skipCredits.green = 0;
    state.pendingSkill = null;
    hideSkillAnnouncement();
    addTeam("green", true);
    addTeam("red", false);
    updateHud();
  }

  function livePieces(team) {
    return state.pieces.filter((piece) => piece.active && piece.team === team);
  }

  function isCpuTurn() {
    return (
      state.mode === "singlePlayer" &&
      state.turn === state.cpuTeam &&
      state.phase === "ready" &&
      !state.overlay
    );
  }

  function currentStatusText() {
    if (isCpuTurn() || state.cpuThinking) return "CPU思考中";
    if (state.phase === "ready") {
      return getPowerStacks(state.turn) > 0 ? "Power強化中" : "コマを選択";
    }
    if (state.phase === "aiming") return "狙いを決める";
    if (state.phase === "moving") return "移動中";
    if (state.phase === "selectGrow") return "育てるコマを選択";
    if (state.phase === "selectSteal") return "奪うコマを選択";
    return "待機中";
  }

  function setStatusText(text) {
    if (state.turn === "red") {
      el.redStatusLabel.textContent = text;
    } else {
      el.greenStatusLabel.textContent = text;
    }
  }

  function updateHud() {
    const red = livePieces("red").length;
    const green = livePieces("green").length;
    el.redCount.textContent = String(red);
    el.greenCount.textContent = String(green);
    const turnLabel = `${COLORS[state.turn].name}の手番`;
    el.redTurnLabel.textContent = turnLabel;
    el.greenTurnLabel.textContent = turnLabel;
    el.redPanel.classList.toggle("is-active", state.turn === "red");
    el.greenPanel.classList.toggle("is-active", state.turn === "green");

    const status = currentStatusText();
    el.redStatusLabel.textContent = state.turn === "red" ? status : "待機中";
    el.greenStatusLabel.textContent = state.turn === "green" ? status : "待機中";

    updateSkillMeters();
    maybeStartCpuTurn();
  }

  function updateSkillMeters() {
    el.skillButtons.forEach((button) => {
      const team = button.dataset.team;
      const skill = SKILLS[button.dataset.skill];
      if (!team || !skill) return;
      const points = state.skillPoints[team] || 0;
      const ratio = Math.min(points / skill.cost, 1);
      const fill = button.querySelector(".skill-fill");
      const isReady = points >= skill.cost;
      const isPowering = button.dataset.skill === "power" && getPowerStacks(team) > 0;

      if (fill) fill.style.setProperty("--fill", `${Math.round(ratio * 100)}%`);
      button.classList.toggle("is-ready", isReady);
      button.classList.toggle("is-powering", isPowering);
      const readyText = isReady ? "使用可能" : "準備中";
      const activeText = isPowering ? " 効果中" : "";
      button.title = `${COLORS[team].name}: ${skill.label} ${readyText}${activeText}`;
      button.setAttribute("aria-label", `${COLORS[team].name} ${skill.label} ${readyText}${activeText}`);
    });
  }

  function addSkillPoints(team, points) {
    state.skillPoints[team] = Math.max(0, state.skillPoints[team] + points);
    updateHud();
  }

  function consumeSkillPoints(team, cost) {
    state.skillPoints[team] = Math.max(0, state.skillPoints[team] - cost);
    updateHud();
  }

  function getPowerStacks(team) {
    return state.powerStacks?.[team] || 0;
  }

  function addPowerBoost(team) {
    state.powerStacks[team] = getPowerStacks(team) + 1;
    state.powerBoostTeam = team;
  }

  function clearPowerBoost(team) {
    state.powerStacks[team] = 0;
    if (!getPowerStacks("red") && !getPowerStacks("green")) {
      state.powerBoostTeam = null;
    } else if (state.powerBoostTeam === team) {
      state.powerBoostTeam = getPowerStacks("red") ? "red" : "green";
    }
  }

  function showSkillAnnouncement(team, icon, text, duration = 1800) {
    window.clearTimeout(state.announcementTimer);
    if (!el.skillAnnouncement) return;
    const facesGreenPlayer = state.mode === "twoPlayer" && team === "green";
    el.skillAnnouncement.dataset.team = team;
    el.skillAnnouncement.classList.toggle("is-facing-green", facesGreenPlayer);
    el.skillAnnouncementIcon.textContent = icon;
    el.skillAnnouncementTeam.textContent = `${COLORS[team].name}が「${icon}」を発動`;
    el.skillAnnouncementText.textContent = text;
    el.skillAnnouncement.classList.remove("hidden");
    state.announcementTimer = window.setTimeout(hideSkillAnnouncement, duration);
  }

  function hideSkillAnnouncement() {
    window.clearTimeout(state.announcementTimer);
    if (el.skillAnnouncement) {
      el.skillAnnouncement.classList.add("hidden");
    }
  }

  function getMaxDrag(piece = state.selected) {
    const stacks = piece ? getPowerStacks(piece.team) : 0;
    return stacks > 0 ? MAX_DRAG * Math.pow(POWER_DRAG_MULTIPLIER, stacks) : MAX_DRAG;
  }

  function tryUseSkill(team, skillKey) {
    const skill = SKILLS[skillKey];
    const points = state.skillPoints[team] || 0;
    if (state.overlay || state.phase !== "ready") {
      setStatusText("今は使えません");
      return;
    }
    if (team !== state.turn) {
      setStatusText("相手の手番です");
      return;
    }
    if (team === state.cpuTeam && state.mode === "singlePlayer") {
      setStatusText("CPUは技を使いません");
      return;
    }
    if (points < skill.cost) {
      setStatusText(`${skill.label}は準備中`);
      return;
    }
    if (skillKey === "grow" && !livePieces(team).some((piece) => piece.size !== "huge")) {
      setStatusText("Growできるコマがありません");
      return;
    }

    consumeSkillPoints(team, skill.cost);

    if (skillKey === "power") {
      addPowerBoost(team);
      showSkillAnnouncement(team, skill.label, "この手番だけ威力アップ");
      updateHud();
      setStatusText("Power発動: 威力アップ");
    } else if (skillKey === "rest") {
      state.skipCredits[team] += 1;
      showSkillAnnouncement(team, skill.label, "相手の手番をスキップ");
      updateHud();
      setStatusText("Skip発動: 次も自分の番");
    } else if (skillKey === "grow") {
      state.pendingSkill = { team, skillKey };
      state.phase = "selectGrow";
      showSkillAnnouncement(team, skill.label, "自分のコマを1個選んで大きくする", 2200);
      updateHud();
      setStatusText("Grow発動: 自分のコマを選択");
    } else if (skillKey === "steal") {
      state.pendingSkill = { team, skillKey };
      state.phase = "selectSteal";
      showSkillAnnouncement(team, skill.label, "相手のコマを1個選んで自分の色にする", 2200);
      updateHud();
      setStatusText("Steal発動: 相手のコマを選択");
    }
  }

  function resizePiece(piece, nextSize) {
    const data = SIZE_DATA[nextSize];
    piece.size = nextSize;
    piece.r = data.r;
    piece.mass = data.mass;
  }

  function growPiece(piece) {
    if (piece.size === "huge") {
      state.effects.push({
        kind: "grow",
        x: piece.x,
        y: piece.y,
        team: piece.team,
        age: 0,
        life: 0.32,
        r: piece.r,
      });
      playTone("select", 0.7);
      updateHud();
      setStatusText("このコマは最大です");
      return false;
    }

    const nextSize = NEXT_SIZE[piece.size];
    resizePiece(piece, nextSize);
    state.effects.push({
      kind: "grow",
      x: piece.x,
      y: piece.y,
      team: piece.team,
      age: 0,
      life: 0.45,
      r: piece.r,
    });
    state.pendingSkill = null;
    state.phase = "ready";
    playTone("select", 1);
    updateHud();
    return true;
  }

  function stealPiece(piece, team) {
    piece.team = team;
    state.effects.push({
      kind: "grow",
      x: piece.x,
      y: piece.y,
      team,
      age: 0,
      life: 0.45,
      r: piece.r,
    });
    state.pendingSkill = null;
    state.phase = "ready";
    playTone("select", 1);
    updateHud();
    checkVictory();
  }

  function setOverlay(name) {
    state.overlay = name;
    el.titleScreen.classList.toggle("hidden", name !== "title");
    el.tutorialScreen.classList.toggle("hidden", name !== "tutorial");
    el.pauseScreen.classList.toggle("hidden", name !== "pause");
    el.resultScreen.classList.toggle("hidden", name !== "result");
  }

  function startMatch(mode = state.mode, cpuDifficulty = state.cpuDifficulty) {
    resetGame(mode, cpuDifficulty);
    setOverlay(null);
  }

  function showTitle() {
    window.clearTimeout(state.resultTimer);
    state.resultTimer = null;
    state.phase = "ready";
    state.selected = null;
    state.pointer = null;
    setOverlay("title");
  }

  function openTutorial() {
    state.tutorialReturnOverlay = state.overlay;
    state.tutorialIndex = 0;
    renderTutorial();
    setOverlay("tutorial");
  }

  function closeTutorial() {
    try {
      localStorage.setItem("chinese-checkers-tutorial-seen", "1");
    } catch {
      // localStorage can be unavailable in private contexts.
    }
    const returnOverlay = state.tutorialReturnOverlay;
    state.tutorialReturnOverlay = "title";
    if (returnOverlay === null) {
      setOverlay(null);
      updateHud();
      return;
    }
    if (returnOverlay === "title") {
      showTitle();
      return;
    }
    setOverlay(returnOverlay);
  }

  function renderTutorial() {
    const slide = tutorialSlides[state.tutorialIndex];
    el.tutorialStep.textContent = `${state.tutorialIndex + 1} / ${tutorialSlides.length}`;
    el.tutorialTitle.textContent = slide.title;
    el.tutorialText.textContent = slide.text;
    el.tutorialArt.innerHTML = slide.art;
    el.tutorialBackButton.textContent = state.tutorialIndex === 0 ? "閉じる" : "戻る";
    const exitText = state.tutorialReturnOverlay === null ? "ゲームへ" : "タイトルへ";
    el.tutorialNextButton.textContent =
      state.tutorialIndex === tutorialSlides.length - 1 ? exitText : "次へ";
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

  function maybeStartCpuTurn() {
    if (!isCpuTurn() || state.cpuThinking) return;
    state.cpuThinking = true;
    updateHudForCpuThinking();
    state.cpuTimer = window.setTimeout(() => {
      state.cpuTimer = null;
      if (isCpuTurn()) runCpuTurn();
      else state.cpuThinking = false;
    }, 720);
  }

  function updateHudForCpuThinking() {
    if (state.turn === "green") {
      el.greenStatusLabel.textContent = "CPU思考中";
    } else {
      el.redStatusLabel.textContent = "CPU思考中";
    }
  }

  function distancePointToSegment(point, start, end) {
    const vx = end.x - start.x;
    const vy = end.y - start.y;
    const wx = point.x - start.x;
    const wy = point.y - start.y;
    const lenSq = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq));
    const px = start.x + vx * t;
    const py = start.y + vy * t;
    return Math.hypot(point.x - px, point.y - py);
  }

  function segmentNearRect(start, end, rect, padding) {
    const samples = 12;
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      if (
        x >= rect.x - padding &&
        x <= rect.x + rect.w + padding &&
        y >= rect.y - padding &&
        y <= rect.y + rect.h + padding
      ) {
        return true;
      }
    }
    return false;
  }

  function isCpuLineClear(piece, target) {
    const start = { x: piece.x, y: piece.y };
    const end = { x: target.x, y: target.y };
    const ownPieces = livePieces(piece.team).filter((item) => item !== piece);
    const friendInWay = ownPieces.some((item) => {
      const dist = distancePointToSegment({ x: item.x, y: item.y }, start, end);
      return dist < item.r + piece.r + 12;
    });
    if (friendInWay) return false;

    return !BUMPERS.some((bumper) => segmentNearRect(start, end, bumper, piece.r + 8));
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function cpuAngleErrorRadians(shot) {
    if (shot.kind === "rescue") {
      return (randomRange(-CPU_RESCUE_ANGLE_ERROR, CPU_RESCUE_ANGLE_ERROR) * Math.PI) / 180;
    }
    if (shot.kind !== "attack") {
      return (randomRange(-CPU_CENTER_ANGLE_ERROR, CPU_CENTER_ANGLE_ERROR) * Math.PI) / 180;
    }
    const farRatio = clampNumber(shot.dist / 820, 0, 1);
    const errorDegrees =
      CPU_ATTACK_MAX_ANGLE_ERROR -
      (CPU_ATTACK_MAX_ANGLE_ERROR - CPU_ATTACK_MIN_ANGLE_ERROR) * farRatio;
    return (randomRange(-errorDegrees, errorDegrees) * Math.PI) / 180;
  }

  function edgePressure(piece) {
    const left = piece.x - DROP_BOUNDS.x;
    const right = DROP_BOUNDS.x + DROP_BOUNDS.w - piece.x;
    const top = piece.y - DROP_BOUNDS.y;
    const bottom = DROP_BOUNDS.y + DROP_BOUNDS.h - piece.y;
    const nearestEdge = Math.min(left, right, top, bottom);
    return 1 - clampNumber(nearestEdge / 260, 0, 1);
  }

  function cpuAttackScore(candidate) {
    const closeScore = 1 - clampNumber(candidate.dist / 950, 0, 1);
    const sizePriority = { huge: 4.2, large: 3.2, medium: 1.55, small: 0 };
    const edgeRange = clampNumber(1 - candidate.dist / CPU_EDGE_TARGET_MAX_DIST, 0, 1);
    const edgeBonus = candidate.edge * edgeRange * 1.8;
    const farEdgePenalty =
      candidate.edge > 0.45 && candidate.dist > CPU_EDGE_TARGET_MAX_DIST
        ? candidate.edge * 1.25
        : 0;
    return (
      (sizePriority[candidate.target.size] ?? 0) +
      closeScore * 1.15 +
      edgeBonus -
      farEdgePenalty +
      Math.random() * CPU_TARGET_RANDOMNESS
    );
  }

  function isStrongCpu() {
    return state.mode === "singlePlayer" && state.cpuDifficulty === "strong";
  }

  function pieceValue(piece) {
    const values = { small: 150, medium: 320, large: 760, huge: 980 };
    return values[piece?.size] ?? 260;
  }

  function centerControlScore(piece) {
    const centerX = BOARD.x + BOARD.w / 2;
    const centerY = BOARD.y + BOARD.h / 2;
    return 1 - clampNumber(Math.hypot(piece.x - centerX, piece.y - centerY) / 650, 0, 1);
  }

  function outwardVector(piece) {
    const edgeRange = 260;
    const left = piece.x - DROP_BOUNDS.x;
    const right = DROP_BOUNDS.x + DROP_BOUNDS.w - piece.x;
    const top = piece.y - DROP_BOUNDS.y;
    const bottom = DROP_BOUNDS.y + DROP_BOUNDS.h - piece.y;
    let x = 0;
    let y = 0;

    if (left < edgeRange) x -= (edgeRange - left) / edgeRange;
    if (right < edgeRange) x += (edgeRange - right) / edgeRange;
    if (top < edgeRange) y -= (edgeRange - top) / edgeRange;
    if (bottom < edgeRange) y += (edgeRange - bottom) / edgeRange;

    const len = Math.hypot(x, y);
    if (len > 0.001) return { x: x / len, y: y / len };

    const centerX = DROP_BOUNDS.x + DROP_BOUNDS.w / 2;
    const centerY = DROP_BOUNDS.y + DROP_BOUNDS.h / 2;
    const fallbackX = piece.x - centerX;
    const fallbackY = piece.y - centerY;
    const fallbackLen = Math.hypot(fallbackX, fallbackY) || 1;
    return { x: fallbackX / fallbackLen, y: fallbackY / fallbackLen };
  }

  function clampToDropBounds(point, margin = 6) {
    return {
      x: clampNumber(point.x, DROP_BOUNDS.x + margin, DROP_BOUNDS.x + DROP_BOUNDS.w - margin),
      y: clampNumber(point.y, DROP_BOUNDS.y + margin, DROP_BOUNDS.y + DROP_BOUNDS.h - margin),
    };
  }

  function approachAlignment(piece, target) {
    const dx = target.x - piece.x;
    const dy = target.y - piece.y;
    const dist = Math.hypot(dx, dy) || 1;
    const outward = outwardVector(target);
    return (dx / dist) * outward.x + (dy / dist) * outward.y;
  }

  function strongAttackBaseScore(piece, target, aimTarget, variant) {
    const dist = Math.hypot(aimTarget.x - piece.x, aimTarget.y - piece.y);
    const targetEdge = edgePressure(target);
    const alignment = approachAlignment(piece, target);
    const sizeBonus = pieceValue(target) / 280;
    const largeEdgeBonus = (target.size === "large" || target.size === "huge") ? targetEdge * 3.2 : 0;
    const pushBonus = targetEdge > 0.32 ? alignment * 3.4 : alignment * 0.7;
    const badSidePenalty = targetEdge > 0.48 && alignment < 0.08 ? 2.1 : 0;
    const variantBonus = variant === "edgePush" ? 1.15 : 0;

    return (
      sizeBonus +
      targetEdge * 1.55 +
      largeEdgeBonus +
      pushBonus +
      variantBonus -
      badSidePenalty -
      dist / 900 +
      Math.random() * 0.1
    );
  }

  function makeStrongAttackShot(piece, target, aimTarget, variant) {
    const dist = Math.hypot(aimTarget.x - piece.x, aimTarget.y - piece.y);
    return {
      piece,
      target,
      aimTarget,
      dist,
      edge: edgePressure(target),
      pushAlignment: approachAlignment(piece, target),
      kind: "attack",
      variant,
      baseScore: strongAttackBaseScore(piece, target, aimTarget, variant),
    };
  }

  function strongAttackAimTargets(target) {
    const aimTargets = [{ point: { x: target.x, y: target.y }, variant: "direct" }];
    const targetEdge = edgePressure(target);
    if (targetEdge > 0.28 || target.size === "large" || target.size === "huge") {
      const outward = outwardVector(target);
      aimTargets.push({
        point: clampToDropBounds({
          x: target.x + outward.x * target.r * 1.15,
          y: target.y + outward.y * target.r * 1.15,
        }),
        variant: "edgePush",
      });
    }
    return aimTargets;
  }

  function strongMoveBaseScore(piece, target, kind) {
    const dist = Math.hypot(target.x - piece.x, target.y - piece.y);
    const safetyGain = edgePressure(piece) * ((piece.size === "large" || piece.size === "huge") ? 3.7 : 1.4);
    const centerScore = centerControlScore(target) * 1.2;
    const kindBonus = kind === "rescue" ? 2.4 : 0.3;
    return safetyGain + centerScore + kindBonus - dist / 1500 + Math.random() * 0.08;
  }

  function buildStrongCpuBaseShots() {
    const own = livePieces(state.cpuTeam);
    const opponentTeam = state.cpuTeam === "red" ? "green" : "red";
    const enemies = livePieces(opponentTeam);
    const attacks = [];
    const support = [];

    const rescue = chooseCpuRescueShot();
    if (rescue) {
      rescue.aimTarget = rescue.target;
      rescue.baseScore = strongMoveBaseScore(rescue.piece, rescue.target, "rescue") + 4.4;
      support.push(rescue);
    }

    own.forEach((piece) => {
      enemies.forEach((target) => {
        if (!isCpuLineClear(piece, target)) return;
        strongAttackAimTargets(target).forEach(({ point, variant }) => {
          if (!isCpuLineClear(piece, point)) return;
          const dist = Math.hypot(point.x - piece.x, point.y - piece.y);
          if (dist < 45 || dist > 1040) return;
          attacks.push(makeStrongAttackShot(piece, target, point, variant));
        });
      });

      if ((piece.size === "large" || piece.size === "huge") && edgePressure(piece) > 0.38) {
        cpuSafeAnchors(piece).forEach((target) => {
          const dist = Math.hypot(target.x - piece.x, target.y - piece.y);
          if (dist <= 70 || !isCpuLineClear(piece, target)) return;
          support.push({
            piece,
            target,
            aimTarget: target,
            dist,
            kind: "rescue",
            baseScore: strongMoveBaseScore(piece, target, "rescue"),
          });
        });
      }
    });

    const center = { x: BOARD.x + BOARD.w / 2, y: BOARD.y + BOARD.h / 2 };
    own
      .filter((piece) => isCpuLineClear(piece, center))
      .map((piece) => ({
        piece,
        target: center,
        aimTarget: center,
        dist: Math.hypot(center.x - piece.x, center.y - piece.y),
        kind: "center",
        baseScore: strongMoveBaseScore(piece, center, "center"),
      }))
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, 4)
      .forEach((shot) => support.push(shot));

    attacks.sort((a, b) => b.baseScore - a.baseScore);
    support.sort((a, b) => b.baseScore - a.baseScore);
    return [...support.slice(0, 5), ...attacks.slice(0, STRONG_CPU_BASE_LIMIT)];
  }

  function clonePiecesForSimulation() {
    const pieces = state.pieces.map((piece) => ({
      source: piece,
      id: piece.id,
      team: piece.team,
      size: piece.size,
      symbol: piece.symbol,
      x: piece.x,
      y: piece.y,
      vx: 0,
      vy: 0,
      r: piece.r,
      mass: piece.mass,
      active: piece.active,
      angle: piece.angle,
    }));
    const bySource = new Map(pieces.map((piece) => [piece.source, piece]));
    return { pieces, bySource };
  }

  function applySimPieceSpeedTuning(piece) {
    if (piece.size !== "small") return;
    piece.vx *= SMALL_SPEED_MULTIPLIER;
    piece.vy *= SMALL_SPEED_MULTIPLIER;
  }

  function applySimDamping(piece, dt) {
    const decay = Math.exp(-LINEAR_DAMPING * dt);
    piece.vx *= decay;
    piece.vy *= decay;
    if (Math.hypot(piece.vx, piece.vy) < STOP_SPEED) {
      piece.vx = 0;
      piece.vy = 0;
    }
  }

  function softenSimStrikerBounce(piece, beforeVx, beforeVy) {
    const speed = Math.hypot(beforeVx, beforeVy);
    if (speed < STOP_SPEED) return;
    const ux = beforeVx / speed;
    const uy = beforeVy / speed;
    const px = -uy;
    const py = ux;
    const along = piece.vx * ux + piece.vy * uy;
    const side = piece.vx * px + piece.vy * py;
    piece.vx = ux * (along * STRIKER_ALONG_DAMPING) + px * side;
    piece.vy = uy * (along * STRIKER_ALONG_DAMPING) + py * side;
  }

  function collideSimPieces(a, b) {
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

    const beforeA = { vx: a.vx, vy: a.vy };
    const beforeB = { vx: b.vx, vy: b.vy };
    const impulse = (-(1 + RESTITUTION) * velAlongNormal) / invSum;
    const ix = impulse * nx;
    const iy = impulse * ny;
    a.vx -= ix * invA;
    a.vy -= iy * invA;
    b.vx += ix * invB;
    b.vy += iy * invB;
    softenSimStrikerBounce(a, beforeA.vx, beforeA.vy);
    softenSimStrikerBounce(b, beforeB.vx, beforeB.vy);
    applySimPieceSpeedTuning(a);
    applySimPieceSpeedTuning(b);
  }

  function collideSimBumper(piece, bumper) {
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
    }
  }

  function launchSimPiece(piece, target, powerRatio, angleOffset, usedPower) {
    const dx = target.x - piece.x;
    const dy = target.y - piece.y;
    const dist = Math.hypot(dx, dy) || 1;
    const baseUx = dx / dist;
    const baseUy = dy / dist;
    const cos = Math.cos(angleOffset);
    const sin = Math.sin(angleOffset);
    const ux = baseUx * cos - baseUy * sin;
    const uy = baseUx * sin + baseUy * cos;
    const massSpeedOffset = 0.84 + piece.mass * 0.07;
    const currentStacks = getPowerStacks(piece.team);
    const simStacks = currentStacks + (usedPower ? 1 : 0);
    const virtualDrag = MAX_DRAG * Math.pow(POWER_DRAG_MULTIPLIER, simStacks) * clampNumber(powerRatio, CPU_MIN_POWER, 1);
    const boost = Math.pow(POWER_LAUNCH_MULTIPLIER, simStacks);
    const launchScale = (8.35 * LAUNCH_POWER * boost) / massSpeedOffset;
    piece.vx = ux * virtualDrag * launchScale;
    piece.vy = uy * virtualDrag * launchScale;
    applySimPieceSpeedTuning(piece);
  }

  function simulateStrongCpuShot(shot, powerRatio, angleOffset, usedPower) {
    const sim = clonePiecesForSimulation();
    const actor = sim.bySource.get(shot.piece);
    if (!actor) return null;
    launchSimPiece(actor, shot.aimTarget || shot.target, powerRatio, angleOffset, usedPower);

    let settle = 0;
    for (let t = 0; t < STRONG_CPU_SIM_TIME; t += STRONG_CPU_SIM_DT) {
      const active = sim.pieces.filter((piece) => piece.active);
      active.forEach((piece) => {
        piece.x += piece.vx * STRONG_CPU_SIM_DT;
        piece.y += piece.vy * STRONG_CPU_SIM_DT;
        applySimDamping(piece, STRONG_CPU_SIM_DT);
      });

      for (let iteration = 0; iteration < 2; iteration += 1) {
        for (let i = 0; i < active.length; i += 1) {
          for (let j = i + 1; j < active.length; j += 1) {
            if (active[i].active && active[j].active) collideSimPieces(active[i], active[j]);
          }
        }
        active.forEach((piece) => {
          if (!piece.active) return;
          BUMPERS.forEach((bumper) => collideSimBumper(piece, bumper));
        });
      }

      active.forEach((piece) => {
        if (piece.active && isOutside(piece)) {
          piece.active = false;
          piece.vx = 0;
          piece.vy = 0;
        }
      });

      const moving = sim.pieces
        .filter((piece) => piece.active)
        .some((piece) => Math.hypot(piece.vx, piece.vy) >= STOP_SPEED);
      settle = moving ? 0 : settle + STRONG_CPU_SIM_DT;
      if (settle > STRONG_CPU_SIM_SETTLE) break;
    }

    const friendlyDropped = sim.pieces.filter(
      (piece) => piece.source.active && !piece.active && piece.team === state.cpuTeam,
    );
    const enemyDropped = sim.pieces.filter(
      (piece) => piece.source.active && !piece.active && piece.team !== state.cpuTeam,
    );

    return {
      pieces: sim.pieces,
      bySource: sim.bySource,
      actor: sim.bySource.get(shot.piece),
      target: shot.target ? sim.bySource.get(shot.target) : null,
      friendlyDropped,
      enemyDropped,
    };
  }

  function scoreStrongCpuSimulation(shot, result, usedPower) {
    if (!result) return -Infinity;
    let score = (shot.baseScore || 0) * 95;
    const targetSource = shot.kind === "attack" ? shot.target : null;

    result.enemyDropped.forEach((piece) => {
      score += 980 + pieceValue(piece.source) * 1.55;
      if (piece.size === "large" || piece.size === "huge") score += 820;
      if (piece.source === targetSource) score += 360;
    });

    result.friendlyDropped.forEach((piece) => {
      score -= 2800 + pieceValue(piece.source) * 2.25;
      if (piece.source === shot.piece) score -= 950;
      if (piece.size === "large" || piece.size === "huge") score -= 1350;
    });

    state.pieces.forEach((source) => {
      if (!source.active) return;
      const finalPiece = result.bySource.get(source);
      if (!finalPiece || !finalPiece.active) return;
      const initialEdge = edgePressure(source);
      const finalEdge = edgePressure(finalPiece);
      const edgeDelta = finalEdge - initialEdge;
      const value = pieceValue(source);

      if (source.team === state.cpuTeam) {
        score -= Math.max(0, edgeDelta) * (230 + value * 0.45);
        score += Math.max(0, -edgeDelta) * ((source.size === "large" || source.size === "huge") ? 520 : 150);
        if (finalEdge > 0.7) score -= 260 + value * 0.55;
        score += centerControlScore(finalPiece) * ((source.size === "large" || source.size === "huge") ? 48 : 18);
      } else {
        const sizeMultiplier = (source.size === "large" || source.size === "huge") ? 1.85 : 1;
        score += Math.max(0, edgeDelta) * (250 + value * 0.75) * sizeMultiplier;
        score -= Math.max(0, -edgeDelta) * 80;
        if (finalEdge > 0.68) score += (source.size === "large" || source.size === "huge") ? 340 : 95;
      }
    });

    if (shot.kind === "attack" && shot.target) {
      const finalTarget = result.bySource.get(shot.target);
      const initialTargetEdge = edgePressure(shot.target);
      if (finalTarget && finalTarget.active) {
        const finalTargetEdge = edgePressure(finalTarget);
        score += Math.max(0, finalTargetEdge - initialTargetEdge) * 620;
        if (shot.target.size === "large" || shot.target.size === "huge") {
          score += Math.max(0, finalTargetEdge - initialTargetEdge) * 760;
        }
      }
      if (initialTargetEdge > 0.36) {
        score += Math.max(0, shot.pushAlignment || 0) * 290;
        if ((shot.pushAlignment || 0) < 0.05) score -= 230;
      }
    }

    if (shot.kind === "rescue" && result.actor?.active) {
      score += Math.max(0, edgePressure(shot.piece) - edgePressure(result.actor)) * 760;
    }

    if (usedPower) score -= 95;
    return score + Math.random() * 12;
  }

  function strongCpuPowerSamples(shot) {
    if (shot.kind === "rescue") return [0.56, 0.7, 0.84];
    if (shot.kind === "center") return [0.55, 0.72, 0.88];
    if (shot.edge > 0.48 || shot.target?.size === "large" || shot.target?.size === "huge") {
      return [0.68, 0.86, 1];
    }
    return [0.62, 0.78, 0.94];
  }

  function strongCpuAngleSamples(shot) {
    const degrees = shot.kind === "attack" ? [-5, -2.5, 0, 2.5, 5] : [-4, 0, 4];
    return degrees.map((degree) => (degree * Math.PI) / 180);
  }

  function evaluateStrongCpuTrial(shot, powerRatio, angleOffset, usedPower) {
    const result = simulateStrongCpuShot(shot, powerRatio, angleOffset, usedPower);
    return {
      shot,
      powerRatio,
      angleOffset,
      usedPower,
      result,
      score: scoreStrongCpuSimulation(shot, result, usedPower),
    };
  }

  function chooseStrongCpuShot() {
    const bases = buildStrongCpuBaseShots();
    if (!bases.length) return null;

    const canPower = (state.skillPoints[state.cpuTeam] || 0) >= SKILLS.power.cost;
    const trials = [];
    bases.forEach((shot, index) => {
      strongCpuPowerSamples(shot).forEach((powerRatio) => {
        strongCpuAngleSamples(shot).forEach((angleOffset) => {
          trials.push(evaluateStrongCpuTrial(shot, powerRatio, angleOffset, false));
          if (
            canPower &&
            shot.kind === "attack" &&
            index < STRONG_CPU_POWER_BASE_LIMIT &&
            powerRatio >= 0.78
          ) {
            trials.push(evaluateStrongCpuTrial(shot, Math.max(powerRatio, 0.9), angleOffset, true));
          }
        });
      });
    });

    trials.sort((a, b) => b.score - a.score);
    const best = trials[0];
    if (!best || !Number.isFinite(best.score)) return null;

    return {
      ...best.shot,
      powerRatio: best.powerRatio,
      angleOffset: best.angleOffset,
      wantsPower: best.usedPower,
      strongScore: best.score,
      selfDestructRisk: best.result?.friendlyDropped.length || 0,
    };
  }

  function cpuSafeAnchors(piece) {
    const midY = BOARD.y + BOARD.h / 2;
    const centerX = BOARD.x + BOARD.w / 2;
    const side = piece.team === "green" ? -1 : 1;
    const safeY = midY + side * 116;
    const innerY = midY + side * 72;
    return [
      { x: centerX, y: safeY, cover: 1.15 },
      { x: BUMPERS[0].x + BUMPERS[0].w / 2, y: safeY, cover: 1 },
      { x: BUMPERS[1].x + BUMPERS[1].w / 2, y: safeY, cover: 1 },
      { x: centerX, y: innerY, cover: 0.55 },
      { x: centerX, y: midY, cover: 0.25 },
    ];
  }

  function cpuRescueScore(piece, target, dist) {
    const midY = BOARD.y + BOARD.h / 2;
    const centerX = BOARD.x + BOARD.w / 2;
    const centerDist = Math.hypot(target.x - centerX, target.y - midY);
    const centerScore = 1 - clampNumber(centerDist / 520, 0, 1);
    const edgeSafety = 1 - edgePressure(target);
    const moveEnough = clampNumber(dist / 420, 0, 1);
    return (
      edgeSafety * 2.25 +
      centerScore * 1.15 +
      (target.cover || 0) +
      moveEnough * 0.35 -
      dist / 1600 +
      Math.random() * 0.12
    );
  }

  function chooseCpuRescueShot() {
    if (Math.random() >= CPU_RESCUE_CHANCE) return null;
    const endangered = livePieces(state.cpuTeam)
      .filter((piece) => (piece.size === "large" || piece.size === "huge") && edgePressure(piece) >= CPU_RESCUE_EDGE_THRESHOLD)
      .sort((a, b) => edgePressure(b) - edgePressure(a));

    for (const piece of endangered) {
      const anchors = cpuSafeAnchors(piece)
        .map((target) => ({
          piece,
          target,
          dist: Math.hypot(target.x - piece.x, target.y - piece.y),
          kind: "rescue",
        }))
        .filter((shot) => shot.dist > 80 && isCpuLineClear(piece, shot.target))
        .map((shot) => ({ ...shot, score: cpuRescueScore(piece, shot.target, shot.dist) }))
        .sort((a, b) => b.score - a.score);
      if (anchors.length) return anchors[0];
    }

    return null;
  }

  function hasFriendlyBeyondTarget(shot) {
    if (shot.kind !== "attack") return false;
    const { piece, target, dist } = shot;
    if (!target) return false;
    const ux = (target.x - piece.x) / (dist || 1);
    const uy = (target.y - piece.y) / (dist || 1);
    return livePieces(piece.team).some((friend) => {
      if (friend === piece) return false;
      const relX = friend.x - piece.x;
      const relY = friend.y - piece.y;
      const along = relX * ux + relY * uy;
      if (along <= dist + target.r * 0.7 || along > dist + 320) return false;
      const side = Math.abs(relX * -uy + relY * ux);
      return side < friend.r + target.r + 36;
    });
  }

  function shotMayBounceBack(shot) {
    if (shot.kind !== "attack") return false;
    const start = { x: shot.piece.x, y: shot.piece.y };
    const end = { x: shot.target.x, y: shot.target.y };
    return BUMPERS.some((bumper) => segmentNearRect(start, end, bumper, shot.piece.r + 18));
  }

  function cpuPowerRatio(shot, usedPower) {
    if (typeof shot?.powerRatio === "number") {
      return clampNumber(shot.powerRatio, CPU_MIN_POWER, 1);
    }
    const risky = hasFriendlyBeyondTarget(shot) || shotMayBounceBack(shot);
    let ratio;

    if (shot.kind === "rescue") {
      ratio = randomRange(CPU_RESCUE_POWER_MIN, CPU_RESCUE_POWER_MAX);
    } else if (shot.kind !== "attack") {
      ratio = randomRange(CPU_CENTER_POWER_MIN, CPU_CENTER_POWER_MAX);
    } else if (risky) {
      ratio = randomRange(CPU_RISKY_ATTACK_POWER_MIN, CPU_RISKY_ATTACK_POWER_MAX);
    } else {
      ratio = randomRange(CPU_ATTACK_POWER_MIN, CPU_ATTACK_POWER_MAX);
    }

    if (usedPower) {
      ratio = shot.kind === "attack" && !hasFriendlyBeyondTarget(shot)
        ? 1
        : Math.max(ratio, CPU_POWERED_MIN_POWER);
    }

    return clampNumber(ratio, CPU_MIN_POWER, 1);
  }

  function chooseStrongCpuGrowTarget() {
    const growable = livePieces(state.cpuTeam).filter((piece) => piece.size !== "huge");
    if (!growable.length) return null;

    const opponentTeam = state.cpuTeam === "red" ? "green" : "red";
    const enemies = livePieces(opponentTeam);
    return growable
      .map((piece) => {
        const edge = edgePressure(piece);
        const nextValue = pieceValue({ size: NEXT_SIZE[piece.size] });
        const sizePlan = piece.size === "medium" ? 3.4 : piece.size === "large" ? 2.2 : 1.25;
        const safety = (1 - edge) * 3.2;
        const center = centerControlScore(piece) * 1.35;
        const attackLane = enemies.reduce((best, enemy) => {
          if (!isCpuLineClear(piece, enemy)) return best;
          const dist = Math.hypot(enemy.x - piece.x, enemy.y - piece.y);
          const enemyValue = pieceValue(enemy) / 520;
          const edgeBonus = edgePressure(enemy) * 1.3;
          return Math.max(best, enemyValue + edgeBonus + (1 - clampNumber(dist / 850, 0, 1)));
        }, 0);
        const dangerPenalty = edge > CPU_GROW_EDGE_THRESHOLD ? edge * 4.6 : edge * 1.1;
        const valueGain = nextValue / 520;

        return {
          piece,
          score: sizePlan + safety + center + attackLane + valueGain - dangerPenalty + Math.random() * 0.12,
        };
      })
      .sort((a, b) => b.score - a.score)[0].piece;
  }

  function chooseCpuGrowTarget() {
    if (isStrongCpu()) return chooseStrongCpuGrowTarget();
    const growable = livePieces(state.cpuTeam).filter((piece) => piece.size !== "huge");
    if (!growable.length) return null;
    const priority = { medium: 0, large: 1, small: 1 };
    return growable
      .map((piece) => ({
        piece,
        score: priority[piece.size] ?? 2,
        edge: edgePressure(piece),
        noise: Math.random(),
      }))
      .sort(
        (a, b) =>
          a.score - b.score ||
          Number(a.edge >= CPU_GROW_EDGE_THRESHOLD) - Number(b.edge >= CPU_GROW_EDGE_THRESHOLD) ||
          a.edge - b.edge ||
          a.noise - b.noise,
      )[0].piece;
  }

  function maybeUseCpuGrow() {
    const skill = SKILLS.grow;
    if (
      state.mode !== "singlePlayer" ||
      state.turn !== state.cpuTeam
    ) {
      return false;
    }

    let usedGrow = false;
    while ((state.skillPoints[state.cpuTeam] || 0) >= skill.cost) {
      const target = chooseCpuGrowTarget();
      if (!target) break;
      state.skillPoints[state.cpuTeam] = Math.max(
        0,
        (state.skillPoints[state.cpuTeam] || 0) - skill.cost,
      );
      growPiece(target);
      usedGrow = true;
    }

    if (!usedGrow) return false;
    showSkillAnnouncement(state.cpuTeam, skill.label, "自分のコマを1個サイズアップ", 1400);
    setStatusText("CPUがGrow発動");
    updateSkillMeters();
    return true;
  }

  function shouldReserveCpuPower(shot, points) {
    const growCost = SKILLS.grow.cost;
    if (chooseCpuGrowTarget() && points < growCost && growCost - points <= 4) {
      return true;
    }
    return shot?.kind === "attack" && shot.dist < 260 && points < growCost;
  }

  function maybeUseCpuPower(shot) {
    const skill = SKILLS.power;
    const points = state.skillPoints[state.cpuTeam] || 0;
    const canUsePower =
      state.mode === "singlePlayer" &&
      state.turn === state.cpuTeam &&
      points >= skill.cost;
    if (shot?.kind === "rescue") {
      return false;
    }
    if (isStrongCpu()) {
      if (!canUsePower || !shot?.wantsPower) return false;
      state.skillPoints[state.cpuTeam] = Math.max(0, state.skillPoints[state.cpuTeam] - skill.cost);
      addPowerBoost(state.cpuTeam);
      showSkillAnnouncement(state.cpuTeam, skill.label, "この手番だけ威力アップ", CPU_POWER_ANNOUNCE_DELAY_MS);
      setStatusText("CPUがPower発動");
      updateSkillMeters();
      return true;
    }
    const reservePower = shouldReserveCpuPower(shot, points);
    let useChance = reservePower ? CPU_POWER_RESERVE_CHANCE : CPU_POWER_USE_CHANCE;
    if (points >= SKILLS.steal.cost && !chooseCpuGrowTarget()) {
      useChance = CPU_POWER_USE_CHANCE_MAXED;
    } else if (!reservePower && points >= skill.cost * 2) {
      useChance = CPU_POWER_USE_CHANCE_BANKED;
    }
    if (!canUsePower || !shot || Math.random() >= useChance) {
      return false;
    }

    state.skillPoints[state.cpuTeam] = Math.max(0, state.skillPoints[state.cpuTeam] - skill.cost);
    addPowerBoost(state.cpuTeam);
    showSkillAnnouncement(state.cpuTeam, skill.label, "この手番だけ威力アップ", CPU_POWER_ANNOUNCE_DELAY_MS);
    setStatusText("CPUがPower発動");
    updateSkillMeters();
    return true;
  }

  function chooseCpuShot() {
    if (isStrongCpu()) {
      const strongShot = chooseStrongCpuShot();
      if (strongShot) return strongShot;
    }

    const own = livePieces(state.cpuTeam);
    const opponentTeam = state.cpuTeam === "red" ? "green" : "red";
    const enemies = livePieces(opponentTeam);
    const candidates = [];
    const rescue = chooseCpuRescueShot();
    if (rescue) return rescue;

    own.forEach((piece) => {
      enemies.forEach((target) => {
        const dist = Math.hypot(target.x - piece.x, target.y - piece.y);
        if (isCpuLineClear(piece, target)) {
          const candidate = { piece, target, dist, edge: edgePressure(target), kind: "attack" };
          candidate.score = cpuAttackScore(candidate);
          candidates.push(candidate);
        }
      });
    });

    candidates.sort((a, b) => b.score - a.score);
    if (candidates.length) return candidates[0];

    const center = { x: BOARD.x + BOARD.w / 2, y: BOARD.y + BOARD.h / 2 };
    const safeCenterMoves = own
      .filter((piece) => isCpuLineClear(piece, center))
      .map((piece) => ({
        piece,
        target: center,
        dist: Math.hypot(center.x - piece.x, center.y - piece.y),
        kind: "center",
      }))
      .sort((a, b) => b.dist - a.dist);

    if (safeCenterMoves.length) return safeCenterMoves[0];
    if (!own.length) return null;

    return {
      piece: own[0],
      target: center,
      dist: Math.hypot(center.x - own[0].x, center.y - own[0].y),
      kind: "center",
    };
  }

  function launchPieceToward(piece, target, powerRatio, angleOffset = 0) {
    const dx = target.x - piece.x;
    const dy = target.y - piece.y;
    const dist = Math.hypot(dx, dy) || 1;
    const baseUx = dx / dist;
    const baseUy = dy / dist;
    const cos = Math.cos(angleOffset);
    const sin = Math.sin(angleOffset);
    const ux = baseUx * cos - baseUy * sin;
    const uy = baseUx * sin + baseUy * cos;
    const massSpeedOffset = 0.84 + piece.mass * 0.07;
    const clampedPower = clampNumber(powerRatio, CPU_MIN_POWER, 1);
    const virtualDrag = getMaxDrag(piece) * clampedPower;
    const boost = Math.pow(POWER_LAUNCH_MULTIPLIER, getPowerStacks(piece.team));
    const launchScale = (8.35 * LAUNCH_POWER * boost) / massSpeedOffset;
    piece.vx = ux * virtualDrag * launchScale;
    piece.vy = uy * virtualDrag * launchScale;
    applyPieceSpeedTuning(piece);
    state.phase = "moving";
    state.settleTime = 0;
    playTone("launch", Math.min(1.25, 0.55 + clampedPower));
    updateHud();
  }

  function runCpuTurn() {
    maybeUseCpuGrow();
    const shot = chooseCpuShot();
    if (!shot) {
      state.cpuThinking = false;
      state.cpuPreview = null;
      finishTurn();
      return;
    }
    const usedPower = maybeUseCpuPower(shot);
    const ratio = cpuPowerRatio(shot, usedPower);
    const angleOffset = typeof shot.angleOffset === "number" ? shot.angleOffset : cpuAngleErrorRadians(shot);
    const aimTarget = shot.aimTarget || shot.target;

    const beginPreview = () => {
      state.cpuTimer = null;
      if (state.overlay || state.turn !== state.cpuTeam || state.phase !== "ready") {
        state.cpuThinking = false;
        updateHud();
        return;
      }
      state.cpuPreview = {
        piece: shot.piece,
        target: aimTarget,
        power: ratio,
        angleOffset,
        powered: usedPower,
      };
      updateHudForCpuThinking();
      state.cpuTimer = window.setTimeout(() => {
        const preview = state.cpuPreview;
        state.cpuTimer = null;
        state.cpuPreview = null;
        if (!preview || state.overlay || state.turn !== state.cpuTeam || state.phase !== "ready") {
          state.cpuThinking = false;
          updateHud();
          return;
        }
        state.cpuThinking = false;
        launchPieceToward(preview.piece, preview.target, preview.power, preview.angleOffset);
      }, CPU_PREVIEW_DELAY_MS);
    };

    updateHudForCpuThinking();
    if (usedPower) {
      state.cpuTimer = window.setTimeout(
        beginPreview,
        CPU_POWER_ANNOUNCE_DELAY_MS + CPU_POWER_PREVIEW_GAP_MS,
      );
      return;
    }
    beginPreview();
  }

  function findPieceAt(point, teamFilter = state.turn) {
    for (let i = state.pieces.length - 1; i >= 0; i -= 1) {
      const piece = state.pieces[i];
      if (!piece.active) continue;
      if (teamFilter && piece.team !== teamFilter) continue;
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
    const maxDrag = getMaxDrag(piece);
    if (dist <= maxDrag) return { x: dx, y: dy, dist };
    const scale = maxDrag / Math.max(dist, 0.001);
    return { x: dx * scale, y: dy * scale, dist: maxDrag };
  }

  function onPointerDown(event) {
    if (state.overlay) return;
    if (isCpuTurn() || state.cpuThinking) return;
    const point = worldPoint(event);

    if (state.phase === "selectGrow") {
      const piece = findPieceAt(point, state.turn);
      if (piece) growPiece(piece);
      return;
    }

    if (state.phase === "selectSteal") {
      const opponent = state.turn === "red" ? "green" : "red";
      const piece = findPieceAt(point, opponent);
      if (piece) stealPiece(piece, state.turn);
      return;
    }

    if (!canAim()) return;
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
    const boost = Math.pow(POWER_LAUNCH_MULTIPLIER, getPowerStacks(piece.team));
    const launchScale = (8.35 * LAUNCH_POWER * boost) / massSpeedOffset;
    piece.vx = -drag.x * launchScale;
    piece.vy = -drag.y * launchScale;
    applyPieceSpeedTuning(piece);
    state.selected = null;
    state.pointer = null;
    state.phase = "moving";
    state.settleTime = 0;
    playTone("launch", Math.min(1.25, 0.55 + drag.dist / getMaxDrag(piece)));
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

  function applyPieceSpeedTuning(piece) {
    if (piece.size !== "small") return;
    piece.vx *= SMALL_SPEED_MULTIPLIER;
    piece.vy *= SMALL_SPEED_MULTIPLIER;
  }

  function softenStrikerBounce(piece, beforeVx, beforeVy) {
    const speed = Math.hypot(beforeVx, beforeVy);
    if (speed < STOP_SPEED) return;

    const ux = beforeVx / speed;
    const uy = beforeVy / speed;
    const px = -uy;
    const py = ux;
    const along = piece.vx * ux + piece.vy * uy;
    const side = piece.vx * px + piece.vy * py;
    const softenedAlong = along * STRIKER_ALONG_DAMPING;
    const softenedSide = side;

    piece.vx = ux * softenedAlong + px * softenedSide;
    piece.vy = uy * softenedAlong + py * softenedSide;
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

    const beforeA = { vx: a.vx, vy: a.vy };
    const beforeB = { vx: b.vx, vy: b.vy };
    const impulse = (-(1 + RESTITUTION) * velAlongNormal) / invSum;
    const ix = impulse * nx;
    const iy = impulse * ny;
    a.vx -= ix * invA;
    a.vy -= iy * invA;
    b.vx += ix * invB;
    b.vy += iy * invB;
    softenStrikerBounce(a, beforeA.vx, beforeA.vy);
    softenStrikerBounce(b, beforeB.vx, beforeB.vy);
    applyPieceSpeedTuning(a);
    applyPieceSpeedTuning(b);

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
      piece.x < DROP_BOUNDS.x ||
      piece.x > DROP_BOUNDS.x + DROP_BOUNDS.w ||
      piece.y < DROP_BOUNDS.y ||
      piece.y > DROP_BOUNDS.y + DROP_BOUNDS.h
    );
  }

  function dropPiece(piece) {
    piece.active = false;
    piece.vx = 0;
    piece.vy = 0;
    addSkillPoints(piece.team, DROP_SKILL_POINTS[piece.size]);
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

  function checkVictory() {
    const red = livePieces("red").length;
    const green = livePieces("green").length;

    if (red === 0 || green === 0) {
      const winner = red > green ? "red" : "green";
      el.winnerTitle.textContent = `${COLORS[winner].name}の勝利`;
      state.phase = "result";
      playTone("win", 0.85);
      window.clearTimeout(state.resultTimer);
      state.resultTimer = window.setTimeout(() => {
        state.resultTimer = null;
        setOverlay("result");
      }, RESULT_DELAY_MS);
      return true;
    }

    return false;
  }

  function finishTurn() {
    const actingTeam = state.turn;
    addSkillPoints(actingTeam, 1);
    if (checkVictory()) return;

    clearPowerBoost(actingTeam);

    if (state.skipCredits[actingTeam] > 0) {
      state.skipCredits[actingTeam] -= 1;
      state.turn = actingTeam;
    } else {
      state.turn = state.turn === "red" ? "green" : "red";
    }
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

    ctx.save();
    roundedRect(ctx, 24, 24, VIEW_W - 48, VIEW_H - 48, 26);
    ctx.clip();
    ctx.fillStyle = "rgba(24, 27, 25, 0.58)";
    const outerBands = [
      { x: 24, y: 24, w: VIEW_W - 48, h: DROP_BOUNDS.y - 24 },
      {
        x: 24,
        y: DROP_BOUNDS.y + DROP_BOUNDS.h,
        w: VIEW_W - 48,
        h: VIEW_H - 24 - (DROP_BOUNDS.y + DROP_BOUNDS.h),
      },
      { x: 24, y: DROP_BOUNDS.y, w: DROP_BOUNDS.x - 24, h: DROP_BOUNDS.h },
      {
        x: DROP_BOUNDS.x + DROP_BOUNDS.w,
        y: DROP_BOUNDS.y,
        w: VIEW_W - 24 - (DROP_BOUNDS.x + DROP_BOUNDS.w),
        h: DROP_BOUNDS.h,
      },
    ];
    outerBands.forEach((band) => ctx.fillRect(band.x, band.y, band.w, band.h));
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    for (let y = 42; y < VIEW_H - 42; y += 34) {
      ctx.beginPath();
      ctx.moveTo(26, y);
      ctx.lineTo(DROP_BOUNDS.x - 2, y + 10);
      ctx.moveTo(DROP_BOUNDS.x + DROP_BOUNDS.w + 2, y + 8);
      ctx.lineTo(VIEW_W - 26, y - 4);
      ctx.stroke();
    }
    ctx.restore();

    roundedRect(ctx, DROP_BOUNDS.x, DROP_BOUNDS.y, DROP_BOUNDS.w, DROP_BOUNDS.h, 12);
    ctx.fillStyle = "rgba(72, 42, 18, 0.14)";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(36, 22, 12, 0.92)";
    ctx.stroke();

    roundedRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 8);
    ctx.fillStyle = "rgba(255, 223, 155, 0.18)";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(48, 28, 13, 0.78)";
    ctx.stroke();

    drawGrid();
    drawBumpers();
  }

  function drawGrid() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(54, 32, 15, 0.72)";
    ctx.lineWidth = 4;
    const cellW = BOARD.w / GRID_COLS;
    const cellH = BOARD.h / GRID_ROWS;

    for (let c = 1; c < GRID_COLS; c += 1) {
      const x = BOARD.x + c * cellW;
      ctx.beginPath();
      ctx.moveTo(x, BOARD.y + 6);
      ctx.lineTo(x, BOARD.y + BOARD.h - 6);
      ctx.stroke();
    }

    for (let r = 1; r < GRID_ROWS; r += 1) {
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
    ctx.moveTo(DROP_BOUNDS.x, midY);
    ctx.lineTo(DROP_BOUNDS.x + DROP_BOUNDS.w, midY);
    ctx.stroke();
    ctx.restore();
  }

  function drawBumpers() {
    BUMPERS.forEach((bumper) => {
      ctx.save();
      ctx.globalAlpha = 0.86;
      ctx.shadowColor = "rgba(0, 0, 0, 0.24)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 5;
      roundedRect(ctx, bumper.x, bumper.y, bumper.w, bumper.h, bumper.h / 2);
      const gradient = ctx.createLinearGradient(bumper.x, bumper.y, bumper.x, bumper.y + bumper.h);
      gradient.addColorStop(0, "#f7f8f2");
      gradient.addColorStop(0.42, "#aeb6b6");
      gradient.addColorStop(0.58, "#707b7d");
      gradient.addColorStop(1, "#d4d9d6");
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(53, 58, 58, 0.82)";
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bumper.x + 16, bumper.y + bumper.h / 2);
      ctx.lineTo(bumper.x + bumper.w - 16, bumper.y + bumper.h / 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(44, 49, 50, 0.62)";
      for (let i = 0; i < 4; i += 1) {
        const x = bumper.x + 28 + i * ((bumper.w - 56) / 3);
        ctx.beginPath();
        ctx.arc(x, bumper.y + bumper.h / 2, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.44)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
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

    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-piece.r * 0.52, -piece.r * 0.43);
    ctx.quadraticCurveTo(-piece.r * 0.24, -piece.r * 0.58, piece.r * 0.1, -piece.r * 0.46);
    ctx.lineWidth = Math.max(1.8, piece.r * 0.065);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.54)";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-piece.r * 0.44, -piece.r * 0.27);
    ctx.quadraticCurveTo(-piece.r * 0.22, -piece.r * 0.35, -piece.r * 0.02, -piece.r * 0.31);
    ctx.lineWidth = Math.max(1.2, piece.r * 0.04);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
    ctx.stroke();

    drawSymbol(piece);
    ctx.restore();
  }

  function drawFrostSprig(scale) {
    const s = scale;
    ctx.beginPath();
    ctx.moveTo(-0.72 * s, 0.52 * s);
    ctx.lineTo(0.58 * s, -0.58 * s);
    ctx.moveTo(-0.45 * s, 0.29 * s);
    ctx.lineTo(-0.79 * s, 0.12 * s);
    ctx.moveTo(-0.45 * s, 0.29 * s);
    ctx.lineTo(-0.47 * s, 0.66 * s);
    ctx.moveTo(-0.08 * s, -0.02 * s);
    ctx.lineTo(-0.44 * s, -0.27 * s);
    ctx.moveTo(-0.08 * s, -0.02 * s);
    ctx.lineTo(0.08 * s, 0.36 * s);
    ctx.moveTo(0.28 * s, -0.33 * s);
    ctx.lineTo(0.08 * s, -0.68 * s);
    ctx.moveTo(0.28 * s, -0.33 * s);
    ctx.lineTo(0.66 * s, -0.22 * s);
    ctx.stroke();
  }

  function drawLeafSigil(scale) {
    const s = scale;
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.moveTo(-0.62 * s, 0.46 * s);
    ctx.bezierCurveTo(-0.48 * s, -0.2 * s, 0.29 * s, -0.72 * s, 0.73 * s, -0.36 * s);
    ctx.bezierCurveTo(0.53 * s, 0.2 * s, -0.06 * s, 0.58 * s, -0.62 * s, 0.46 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-0.56 * s, 0.42 * s);
    ctx.bezierCurveTo(-0.18 * s, 0.08 * s, 0.24 * s, -0.22 * s, 0.62 * s, -0.34 * s);
    ctx.moveTo(-0.09 * s, 0.02 * s);
    ctx.lineTo(-0.02 * s, 0.32 * s);
    ctx.moveTo(0.16 * s, -0.14 * s);
    ctx.lineTo(0.37 * s, 0.08 * s);
    ctx.stroke();
  }

  function drawFlameShard(scale) {
    const s = scale;
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(-0.58 * s, 0.44 * s);
    ctx.bezierCurveTo(-0.34 * s, 0.1 * s, -0.18 * s, -0.35 * s, 0.49 * s, -0.62 * s);
    ctx.bezierCurveTo(0.32 * s, -0.22 * s, 0.78 * s, 0.02 * s, 0.38 * s, 0.48 * s);
    ctx.bezierCurveTo(0.04 * s, 0.74 * s, -0.38 * s, 0.66 * s, -0.58 * s, 0.44 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-0.13 * s, 0.34 * s);
    ctx.bezierCurveTo(0.05 * s, 0.02 * s, 0.18 * s, -0.18 * s, 0.45 * s, -0.38 * s);
    ctx.stroke();
  }

  function drawMountainPine(scale) {
    const s = scale;
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.beginPath();
    ctx.moveTo(-0.72 * s, 0.46 * s);
    ctx.lineTo(-0.36 * s, -0.08 * s);
    ctx.lineTo(-0.16 * s, 0.1 * s);
    ctx.lineTo(0.06 * s, -0.5 * s);
    ctx.lineTo(0.72 * s, 0.46 * s);
    ctx.lineTo(0.22 * s, 0.34 * s);
    ctx.lineTo(0.02 * s, 0.62 * s);
    ctx.lineTo(-0.18 * s, 0.36 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-0.45 * s, 0.5 * s);
    ctx.lineTo(-0.34 * s, 0.12 * s);
    ctx.moveTo(-0.55 * s, 0.24 * s);
    ctx.lineTo(-0.18 * s, 0.24 * s);
    ctx.moveTo(-0.48 * s, 0.04 * s);
    ctx.lineTo(-0.24 * s, 0.04 * s);
    ctx.stroke();
  }

  function drawCometMark(scale) {
    const s = scale;
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.moveTo(-0.72 * s, 0.18 * s);
    ctx.bezierCurveTo(-0.35 * s, -0.18 * s, 0.1 * s, -0.5 * s, 0.62 * s, -0.52 * s);
    ctx.lineTo(0.46 * s, -0.2 * s);
    ctx.bezierCurveTo(0.05 * s, -0.18 * s, -0.3 * s, 0.06 * s, -0.58 * s, 0.42 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-0.67 * s, 0.5 * s);
    ctx.bezierCurveTo(-0.3 * s, 0.3 * s, 0.08 * s, 0.22 * s, 0.48 * s, 0.12 * s);
    ctx.stroke();
  }

  function drawDeerCrest(scale) {
    const s = scale;
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(-0.68 * s, 0.18 * s);
    ctx.bezierCurveTo(-0.55 * s, -0.22 * s, -0.18 * s, -0.35 * s, 0.16 * s, -0.22 * s);
    ctx.lineTo(0.38 * s, -0.5 * s);
    ctx.lineTo(0.48 * s, -0.16 * s);
    ctx.bezierCurveTo(0.72 * s, -0.08 * s, 0.76 * s, 0.18 * s, 0.48 * s, 0.3 * s);
    ctx.lineTo(0.12 * s, 0.44 * s);
    ctx.bezierCurveTo(-0.3 * s, 0.58 * s, -0.6 * s, 0.46 * s, -0.68 * s, 0.18 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0.1 * s, -0.26 * s);
    ctx.lineTo(-0.02 * s, -0.66 * s);
    ctx.lineTo(-0.22 * s, -0.82 * s);
    ctx.moveTo(-0.06 * s, -0.56 * s);
    ctx.lineTo(0.18 * s, -0.78 * s);
    ctx.moveTo(0.06 * s, -0.42 * s);
    ctx.lineTo(0.32 * s, -0.58 * s);
    ctx.moveTo(0.44 * s, 0.01 * s);
    ctx.lineTo(0.56 * s, -0.05 * s);
    ctx.stroke();
  }

  function drawSymbol(piece) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.lineWidth = Math.max(2, piece.r * 0.105);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(33, 15, 10, 0.26)";
    ctx.shadowBlur = Math.max(1, piece.r * 0.055);
    ctx.shadowOffsetY = Math.max(0.5, piece.r * 0.025);

    const r = piece.r * 0.58;
    if (piece.symbol === 0) {
      drawFrostSprig(r);
    } else if (piece.symbol === 1) {
      drawLeafSigil(r);
    } else if (piece.symbol === 2) {
      drawFlameShard(r);
    } else if (piece.symbol === 3) {
      drawMountainPine(r);
    } else if (piece.symbol === 4) {
      drawCometMark(r);
    } else {
      drawDeerCrest(piece.r * 0.62);
    }
    ctx.restore();
  }

  function drawAim() {
    if (state.phase !== "aiming" || !state.selected || !state.pointer) return;
    const piece = state.selected;
    const drag = clampDrag(piece, state.pointer);
    const maxDrag = getMaxDrag(piece);
    const power = drag.dist / maxDrag;
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
    if (getPowerStacks(piece.team) > 0) {
      ctx.beginPath();
      ctx.arc(piece.x, piece.y, maxDrag, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 224, 109, 0.28)";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCpuPreview() {
    const preview = state.cpuPreview;
    if (!preview || !preview.piece || !preview.piece.active) return;

    const piece = preview.piece;
    const dx = preview.target.x - piece.x;
    const dy = preview.target.y - piece.y;
    const dist = Math.hypot(dx, dy) || 1;
    const baseUx = dx / dist;
    const baseUy = dy / dist;
    const cos = Math.cos(preview.angleOffset);
    const sin = Math.sin(preview.angleOffset);
    const ux = baseUx * cos - baseUy * sin;
    const uy = baseUx * sin + baseUy * cos;
    const power = clampNumber(preview.power, 0.2, 1);
    const startX = piece.x + ux * (piece.r + 12);
    const startY = piece.y + uy * (piece.r + 12);
    const endX = piece.x + ux * (piece.r + 32 + power * 150);
    const endY = piece.y + uy * (piece.r + 32 + power * 150);

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = preview.powered ? "rgba(255, 224, 109, 0.95)" : "#80f0bc";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.shadowColor = preview.powered ? "rgba(255, 224, 109, 0.5)" : "rgba(128, 240, 188, 0.42)";
    ctx.shadowBlur = 12;
    ctx.lineWidth = preview.powered ? 10 : 8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - ux * 30 + -uy * 13, endY - uy * 30 + ux * 13);
    ctx.lineTo(endX - ux * 30 - -uy * 13, endY - uy * 30 - ux * 13);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
    ctx.lineWidth = 3;
    for (let i = 1; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.arc(piece.x, piece.y, piece.r + i * 15 + power * 4, 0, Math.PI * 2);
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
      } else if (effect.kind === "grow") {
        const color = COLORS[effect.team];
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = color.main;
        ctx.lineWidth = 7 * (1 - t);
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.r * (0.82 + t * 0.8), 0, Math.PI * 2);
        ctx.stroke();
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
    drawCpuPreview();
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

    el.singleStartButton.addEventListener("click", () => startMatch("singlePlayer", "weak"));
    el.strongCpuStartButton.addEventListener("click", () => startMatch("singlePlayer", "strong"));
    el.twoPlayerStartButton.addEventListener("click", () => startMatch("twoPlayer"));
    el.tutorialButton.addEventListener("click", openTutorial);
    el.helpButton.addEventListener("click", openTutorial);
    el.pauseButton.addEventListener("click", () => {
      if (state.overlay === "title" || state.overlay === "tutorial" || state.overlay === "result") return;
      setOverlay("pause");
    });
    el.resumeButton.addEventListener("click", () => setOverlay(null));
    el.pauseRestartButton.addEventListener("click", () => startMatch(state.mode, state.cpuDifficulty));
    el.backToTitleButton.addEventListener("click", showTitle);
    el.rematchButton.addEventListener("click", () => startMatch(state.mode, state.cpuDifficulty));
    el.resultTitleButton.addEventListener("click", showTitle);
    el.soundToggle.addEventListener("change", () => {
      state.sound = el.soundToggle.checked;
    });
    el.skillButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (!button.dataset.team || !button.dataset.skill) return;
        tryUseSkill(button.dataset.team, button.dataset.skill);
      });
    });

    el.tutorialBackButton.addEventListener("click", () => {
      if (state.tutorialIndex === 0) {
        closeTutorial();
        return;
      }
      state.tutorialIndex -= 1;
      renderTutorial();
    });

    el.tutorialNextButton.addEventListener("click", () => {
      if (state.tutorialIndex === tutorialSlides.length - 1) {
        closeTutorial();
        return;
      }
      state.tutorialIndex += 1;
      renderTutorial();
    });

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resizeCanvas);
    }
    if ("ResizeObserver" in window && boardFrame) {
      boardResizeObserver = new ResizeObserver(fitCanvasToFrame);
      boardResizeObserver.observe(boardFrame);
    }
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
