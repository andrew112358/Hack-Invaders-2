(function () {
  "use strict";

  const TILE = 32;
  const MAP_W = 20;
  const MAP_H = 15;
  const ENCOUNTER_RATE = 0.18;
  const SPRITE_COLS = 3;
  const SPRITE_ROWS = 2;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const battleUi = document.getElementById("battle-ui");
  const wildNameEl = document.getElementById("wild-name");
  const wildLevelEl = document.getElementById("wild-level");
  const wildHpEl = document.getElementById("wild-hp");
  const wildSpriteCanvas = document.getElementById("wild-sprite");
  const wildSpriteCtx = wildSpriteCanvas.getContext("2d");
  wildSpriteCtx.imageSmoothingEnabled = false;
  const battleMsg = document.getElementById("battle-message");
  const battleMenu = document.getElementById("battle-menu");
  const moveMenu = document.getElementById("move-menu");
  const dialogEl = document.getElementById("dialog");
  const dialogText = document.getElementById("dialog-text");
  const partyCountEl = document.getElementById("party-count");
  const ballsCountEl = document.getElementById("balls-count");
  const collectionEl = document.getElementById("collection");
  const collectionGrid = document.getElementById("collection-grid");

  const TILE_GRASS = 0;
  const TILE_PATH = 1;
  const TILE_WATER = 2;
  const TILE_TREE = 3;
  const TILE_FLOWER = 4;
  const TILE_SAND = 5;

  const PLAYER_HEIGHT = 46;

  const state = {
    mode: "overworld",
    spriteSheet: null,
    spriteW: 0,
    spriteH: 0,
    playerSprite: null,
    playerTrim: null,
    map: [],
    player: { x: 10, y: 8, dir: "down", frame: 0, moving: false },
    keys: {},
    party: [],
    balls: 10,
    wild: null,
    activeMon: null,
    battlePhase: "menu",
    dialogQueue: [],
    dialogCallback: null,
    stepsInGrass: 0,
    introDone: false,
    shakeTimer: 0,
    catchAnim: 0,
  };

  function buildMap() {
    const map = [];
    for (let y = 0; y < MAP_H; y++) {
      const row = [];
      for (let x = 0; x < MAP_W; x++) {
        const edge = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
        if (edge) row.push(TILE_TREE);
        else row.push(TILE_GRASS);
      }
      map.push(row);
    }
    for (let x = 3; x < 17; x++) {
      map[7][x] = TILE_PATH;
      map[8][x] = TILE_PATH;
    }
    for (let y = 3; y < 12; y++) {
      map[y][10] = TILE_PATH;
    }
    map[4][4] = map[4][5] = map[5][4] = TILE_FLOWER;
    map[10][14] = map[10][15] = map[11][14] = TILE_FLOWER;
    map[3][14] = map[3][15] = map[4][15] = TILE_WATER;
    map[11][3] = map[11][4] = map[12][3] = TILE_WATER;
    map[2][8] = map[2][9] = TILE_SAND;
    map[12][8] = TILE_SAND;
    map[1][10] = TILE_TREE;
    map[13][6] = TILE_TREE;
    return map;
  }

  function isWalkable(tile) {
    return tile !== TILE_TREE && tile !== TILE_WATER;
  }

  function isGrass(tile) {
    return tile === TILE_GRASS || tile === TILE_FLOWER;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function trimSpriteBounds(img) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0);
    const { data, width, height } = cx.getImageData(0, 0, c.width, c.height);
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        const isBackground =
          a < 12 ||
          (r > 185 && g > 185 && b > 185 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20);
        if (!isBackground) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    const pad = 6;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    return { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 };
  }

  async function loadSprites() {
    const [sheet, player] = await Promise.all([
      loadImage("assets/capybaras.png"),
      loadImage("assets/player.png"),
    ]);
    state.spriteSheet = sheet;
    state.spriteW = Math.floor(sheet.width / SPRITE_COLS);
    state.spriteH = Math.floor(sheet.height / SPRITE_ROWS);
    state.playerSprite = player;
    state.playerTrim = trimSpriteBounds(player);
  }

  function drawSprite(targetCtx, col, row, dx, dy, dw, dh) {
    if (!state.spriteSheet) return;
    const sx = col * state.spriteW;
    const sy = row * state.spriteH;
    targetCtx.drawImage(
      state.spriteSheet,
      sx, sy, state.spriteW, state.spriteH,
      dx, dy, dw, dh
    );
  }

  function drawTile(tile, px, py) {
    switch (tile) {
      case TILE_GRASS:
        ctx.fillStyle = "#4a7c23";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#5a9c2a";
        ctx.fillRect(px + 4, py + 4, 4, 4);
        ctx.fillRect(px + 20, py + 18, 3, 3);
        break;
      case TILE_PATH:
        ctx.fillStyle = "#c4a574";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#b8956a";
        ctx.fillRect(px + 2, py + 14, 28, 2);
        break;
      case TILE_WATER:
        ctx.fillStyle = "#3d85c6";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#6eb5e8";
        ctx.fillRect(px + 6, py + 8, 8, 4);
        ctx.fillRect(px + 18, py + 20, 6, 3);
        break;
      case TILE_TREE:
        ctx.fillStyle = "#2d5016";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#1a3d0a";
        ctx.fillRect(px + 8, py + 4, 16, 20);
        ctx.fillStyle = "#3d8b2e";
        ctx.beginPath();
        ctx.arc(px + 16, py + 10, 12, 0, Math.PI * 2);
        ctx.fill();
        break;
      case TILE_FLOWER:
        ctx.fillStyle = "#4a7c23";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#ff69b4";
        ctx.fillRect(px + 12, py + 10, 8, 8);
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(px + 14, py + 12, 4, 4);
        break;
      case TILE_SAND:
        ctx.fillStyle = "#e8d4a8";
        ctx.fillRect(px, py, TILE, TILE);
        break;
      default:
        ctx.fillStyle = "#4a7c23";
        ctx.fillRect(px, py, TILE, TILE);
    }
  }

  function drawPlayer(px, py) {
    const bob = state.player.moving ? Math.sin(state.player.frame * 0.5) * 2 : 0;

    if (!state.playerSprite || !state.playerTrim) {
      ctx.fillStyle = "#c4a574";
      ctx.fillRect(px + 8, py + 20, 16, 10);
      return;
    }

    const { sx, sy, sw, sh } = state.playerTrim;
    const drawH = PLAYER_HEIGHT;
    const drawW = (sw / sh) * drawH;
    const dx = px + (TILE - drawW) / 2;
    const dy = py + TILE - drawH + bob;
    const flip = state.player.dir === "left";

    ctx.save();
    if (flip) {
      ctx.translate(dx + drawW, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(state.playerSprite, sx, sy, sw, sh, 0, 0, drawW, drawH);
    } else {
      ctx.drawImage(state.playerSprite, sx, sy, sw, sh, dx, dy, drawW, drawH);
    }
    ctx.restore();
  }

  function renderOverworld() {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const camX = Math.max(0, Math.min(state.player.x * TILE - canvas.width / 2 + TILE / 2, MAP_W * TILE - canvas.width));
    const camY = Math.max(0, Math.min(state.player.y * TILE - canvas.height / 2 + TILE / 2, MAP_H * TILE - canvas.height));

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const px = x * TILE - camX;
        const py = y * TILE - camY;
        if (px + TILE < 0 || py + TILE < 0 || px > canvas.width || py > canvas.height) continue;
        drawTile(state.map[y][x], px, py);
      }
    }

    const px = state.player.x * TILE - camX;
    const py = state.player.y * TILE - camY;
    drawPlayer(px, py);

    if (state.shakeTimer > 0 && isGrass(state.map[state.player.y][state.player.x])) {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      state.shakeTimer--;
    }
  }

  function updateHud() {
    partyCountEl.textContent = `Party: ${state.party.length}`;
    ballsCountEl.textContent = `Capy Balls: ${state.balls}`;
  }

  function showDialog(lines, callback) {
    state.dialogQueue = Array.isArray(lines) ? [...lines] : [lines];
    state.dialogCallback = callback || null;
    state.mode = "dialog";
    dialogEl.classList.remove("hidden");
    dialogText.textContent = state.dialogQueue.shift();
  }

  function advanceDialog() {
    if (state.dialogQueue.length > 0) {
      dialogText.textContent = state.dialogQueue.shift();
      return;
    }
    dialogEl.classList.add("hidden");
    const cb = state.dialogCallback;
    state.dialogCallback = null;
    if (cb) cb();
    else if (state.mode === "dialog") state.mode = "overworld";
  }

  function pickWildEncounter() {
    state.wild = createWildCapybara();
    state.activeMon = state.party[0] || null;
    state.battlePhase = "menu";
    state.catchAnim = 0;
    startBattle();
  }

  function startBattle() {
    state.mode = "battle";
    battleUi.classList.remove("hidden");
    battleMenu.classList.remove("hidden");
    moveMenu.classList.add("hidden");
    updateBattleUi();
    setBattleMessage(`Wild ${state.wild.name} appeared!`);
  }

  function endBattle() {
    battleUi.classList.add("hidden");
    state.mode = "overworld";
    state.wild = null;
    state.battlePhase = "menu";
  }

  function updateBattleUi() {
    const w = state.wild;
    wildNameEl.textContent = w.name;
    wildLevelEl.textContent = `Lv.${w.level} · ${w.type.toUpperCase()}`;
    wildHpEl.style.width = `${(w.hp / w.maxHp) * 100}%`;
    wildHpEl.style.background =
      w.hp / w.maxHp > 0.5
        ? "linear-gradient(90deg, #4ade80, #22c55e)"
        : w.hp / w.maxHp > 0.2
          ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
          : "linear-gradient(90deg, #ef4444, #dc2626)";

    wildSpriteCtx.clearRect(0, 0, wildSpriteCanvas.width, wildSpriteCanvas.height);
    const pad = 10;
    drawSprite(
      wildSpriteCtx,
      w.spriteCol,
      w.spriteRow,
      pad,
      pad,
      wildSpriteCanvas.width - pad * 2,
      wildSpriteCanvas.height - pad * 2
    );

    const moveBtns = moveMenu.querySelectorAll("[data-move]");
    const moves = state.activeMon ? state.activeMon.moves : [];
    moveBtns.forEach((btn, i) => {
      if (moves[i]) {
        btn.textContent = moves[i].name;
        btn.disabled = state.battlePhase !== "fight";
        btn.classList.remove("hidden");
      } else {
        btn.textContent = "—";
        btn.disabled = true;
      }
    });
    updateHud();
  }

  function setBattleMessage(msg) {
    battleMsg.textContent = msg;
  }

  function calcDamage(attacker, defender, move) {
    if (move.power === 0) return 0;
    const effectiveness = getEffectiveness(move.type, defender.type);
    const stab = move.type === attacker.type ? 1.5 : 1;
    const base = ((2 * attacker.level) / 5 + 2) * move.power * (attacker.atk / defender.def);
    return Math.max(1, Math.floor((base / 50 + 2) * stab * effectiveness * (0.85 + Math.random() * 0.15)));
  }

  function tryCatch() {
    if (state.balls <= 0) {
      setBattleMessage("You're out of Capy Balls!");
      return;
    }
    state.balls--;
    updateHud();
    state.battlePhase = "catching";
    battleMenu.classList.add("hidden");

    const hpFactor = (state.wild.maxHp - state.wild.hp) / state.wild.maxHp;
    const catchChance = (state.wild.catchRate / 255) * (0.4 + hpFactor * 0.6) + 0.1;
    const shakes = Math.min(3, Math.floor(catchChance * 4) + (Math.random() < catchChance ? 1 : 0));

    let step = 0;
    const anim = () => {
      if (step < shakes) {
        setBattleMessage(`The ball shook... (${step + 1})`);
        wildSpriteCanvas.style.transform = `translateX(${step % 2 ? 4 : -4}px)`;
        step++;
        setTimeout(anim, 600);
      } else if (Math.random() < catchChance) {
        wildSpriteCanvas.style.transform = "";
        const caughtName = state.wild.name;
        setBattleMessage(`Gotcha! ${caughtName} was caught!`);
        state.party.push({ ...state.wild, hp: state.wild.maxHp });
        const count = state.party.length;
        setTimeout(() => {
          endBattle();
          showDialog([`${caughtName} was added to your party!`, `You now have ${count} capybara(s).`]);
        }, 1200);
      } else {
        wildSpriteCanvas.style.transform = "";
        setBattleMessage(`Oh no! ${state.wild.name} broke free!`);
        state.battlePhase = "menu";
        battleMenu.classList.remove("hidden");
      }
    };
    setBattleMessage("You threw a Capy Ball!");
    setTimeout(anim, 800);
  }

  function playerAttack(moveIndex) {
    if (!state.activeMon) return;
    const move = state.activeMon.moves[moveIndex];
    if (!move) return;
    const attacker = state.activeMon || {
      name: "You",
      level: 5,
      atk: 30,
      type: "normal",
    };
    const dmg = calcDamage(
      { ...attacker, atk: attacker.atk + 10 },
      state.wild,
      move
    );
    state.wild.hp = Math.max(0, state.wild.hp - dmg);
    const eff = getEffectiveness(move.type, state.wild.type);
    let msg = `${attacker.name} used ${move.name}! It dealt ${dmg} damage.`;
    if (eff > 1) msg += " Super effective!";
    if (eff < 1 && eff > 0) msg += " Not very effective...";
    if (eff === 0) msg = "It had no effect...";
    setBattleMessage(msg);
    updateBattleUi();
    moveMenu.classList.add("hidden");
    battleMenu.classList.remove("hidden");
    state.battlePhase = "menu";

    if (state.wild.hp <= 0) {
      setTimeout(() => {
        setBattleMessage(`${state.wild.name} fainted! You can't catch it now.`);
        setTimeout(endBattle, 1500);
      }, 1000);
      return;
    }

    setTimeout(() => {
      const wildMove = state.wild.moves[Math.floor(Math.random() * state.wild.moves.length)];
      if (wildMove.power > 0 && state.activeMon) {
        const wdmg = calcDamage(state.wild, state.activeMon, wildMove);
        state.activeMon.hp = Math.max(0, state.activeMon.hp - wdmg);
        setBattleMessage(`${state.wild.name} used ${wildMove.name}!`);
      } else {
        setBattleMessage(`${state.wild.name} is watching you carefully...`);
      }
    }, 1200);
  }

  function tryMove(dx, dy) {
    if (state.mode !== "overworld") return;
    const nx = state.player.x + dx;
    const ny = state.player.y + dy;
    if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) return;
    const tile = state.map[ny][nx];
    if (!isWalkable(tile)) return;

    state.player.x = nx;
    state.player.y = ny;
    state.player.moving = true;
    state.player.frame++;
    if (dx > 0) state.player.dir = "right";
    if (dx < 0) state.player.dir = "left";
    if (dy > 0) state.player.dir = "down";
    if (dy < 0) state.player.dir = "up";

    if (isGrass(tile) && Math.random() < ENCOUNTER_RATE) {
      state.shakeTimer = 12;
      setTimeout(() => {
        if (state.mode === "overworld") pickWildEncounter();
      }, 400);
    }
  }

  function renderCollection() {
    collectionGrid.innerHTML = "";
    const slots = Math.max(6, state.party.length);
    for (let i = 0; i < slots; i++) {
      const card = document.createElement("div");
      card.className = "collection-card" + (state.party[i] ? "" : " empty-slot");
      if (state.party[i]) {
        const mon = state.party[i];
        const c = document.createElement("canvas");
        c.width = 120;
        c.height = 100;
        const cctx = c.getContext("2d");
        cctx.imageSmoothingEnabled = false;
        drawSprite(cctx, mon.spriteCol, mon.spriteRow, 0, 0, 120, 100);
        card.appendChild(c);
        const name = document.createElement("div");
        name.className = "name";
        name.textContent = mon.name;
        const type = document.createElement("div");
        type.className = "type";
        type.textContent = `Lv.${mon.level} · ${mon.type}`;
        card.appendChild(name);
        card.appendChild(type);
      } else {
        card.textContent = "???";
      }
      collectionGrid.appendChild(card);
    }
  }

  function toggleCollection() {
    if (collectionEl.classList.contains("hidden")) {
      renderCollection();
      collectionEl.classList.remove("hidden");
      state.mode = "collection";
    } else {
      collectionEl.classList.add("hidden");
      state.mode = "overworld";
    }
  }

  document.addEventListener("keydown", (e) => {
    state.keys[e.code] = true;
    if (e.code === "KeyC" && state.mode !== "battle" && state.mode !== "dialog") {
      toggleCollection();
      e.preventDefault();
    }
    if ((e.code === "Space" || e.code === "Enter") && state.mode === "dialog") {
      advanceDialog();
      e.preventDefault();
    }
  });

  document.addEventListener("keyup", (e) => {
    state.keys[e.code] = false;
  });

  battleMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || state.battlePhase !== "menu") return;
    const action = btn.dataset.action;
    if (action === "fight") {
      if (!state.activeMon) {
        setBattleMessage("You have no capybara to fight with! Throw a ball!");
        return;
      }
      battleMenu.classList.add("hidden");
      moveMenu.classList.remove("hidden");
      state.battlePhase = "fight";
    } else if (action === "catch") {
      tryCatch();
    } else if (action === "bag") {
      setBattleMessage(`Capy Balls: ${state.balls}. Use Catch to throw one!`);
    } else if (action === "run") {
      if (Math.random() < 0.85) {
        setBattleMessage("Got away safely!");
        setTimeout(endBattle, 800);
      } else {
        setBattleMessage("Can't escape!");
      }
    }
  });

  moveMenu.addEventListener("click", (e) => {
    const back = e.target.closest('[data-action="back"]');
    if (back) {
      moveMenu.classList.add("hidden");
      battleMenu.classList.remove("hidden");
      state.battlePhase = "menu";
      return;
    }
    const moveBtn = e.target.closest("[data-move]");
    if (!moveBtn || state.battlePhase !== "fight") return;
    playerAttack(parseInt(moveBtn.dataset.move, 10));
  });

  document.getElementById("close-collection").addEventListener("click", toggleCollection);

  let moveCooldown = 0;
  function gameLoop() {
    if (state.mode === "overworld") {
      if (moveCooldown > 0) moveCooldown--;
      else {
        let dx = 0, dy = 0;
        if (state.keys["ArrowUp"] || state.keys["KeyW"]) dy = -1;
        else if (state.keys["ArrowDown"] || state.keys["KeyS"]) dy = 1;
        else if (state.keys["ArrowLeft"] || state.keys["KeyA"]) dx = -1;
        else if (state.keys["ArrowRight"] || state.keys["KeyD"]) dx = 1;
        if (dx || dy) {
          tryMove(dx, dy);
          moveCooldown = 12;
          state.player.moving = true;
        } else {
          state.player.moving = false;
        }
      }
      renderOverworld();
    }
    requestAnimationFrame(gameLoop);
  }

  async function init() {
    state.map = buildMap();
    try {
      await loadSprites();
    } catch (err) {
      console.error("Failed to load sprites", err);
    }
    updateHud();
    gameLoop();
    showDialog(
      [
        "Welcome to CapyCatch!",
        "Professor Capy gave you a Capybuddy!",
        "Walk through tall grass to find more. Press C for your collection.",
      ],
      () => {
        const starter = createOwnedCapybara("normal", 5);
        state.party.push(starter);
        state.activeMon = starter;
        updateHud();
        state.introDone = true;
      }
    );
  }

  init();
})();
