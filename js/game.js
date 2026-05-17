(function () {
  "use strict";

  const TILE = 32;
  const ENCOUNTER_RATE_BASE = 0.18;
  const SPRITE_COLS = 3;
  const SPRITE_ROWS = 2;
  const PLAYER_HEIGHT = 46;

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
  const allySpriteCanvas = document.getElementById("ally-sprite");
  const allySpriteCtx = allySpriteCanvas.getContext("2d");
  allySpriteCtx.imageSmoothingEnabled = false;
  const allyNameEl = document.getElementById("ally-name");
  const allyLevelEl = document.getElementById("ally-level");
  const allyHpEl = document.getElementById("ally-hp");
  const allyHpTextEl = document.getElementById("ally-hp-text");
  const wildHpTextEl = document.getElementById("wild-hp-text");
  const berryStatusEl = document.getElementById("berry-status");
  const battleMsg = document.getElementById("battle-message");
  const battleMenu = document.getElementById("battle-menu");
  const moveMenu = document.getElementById("move-menu");
  const bagUi = document.getElementById("bag-ui");
  const bagBallsEl = document.getElementById("bag-balls");
  const bagBerriesEl = document.getElementById("bag-berries");
  const dialogEl = document.getElementById("dialog");
  const dialogText = document.getElementById("dialog-text");
  const locationNameEl = document.getElementById("location-name");
  const partyCountEl = document.getElementById("party-count");
  const ballsCountEl = document.getElementById("balls-count");
  const coinsCountEl = document.getElementById("coins-count");
  const collectionEl = document.getElementById("collection");
  const collectionGrid = document.getElementById("collection-grid");
  const shopUi = document.getElementById("shop-ui");
  const shopTitle = document.getElementById("shop-title");
  const shopCoinCount = document.getElementById("shop-coin-count");
  const shopItemsEl = document.getElementById("shop-items");
  const switchMenu = document.getElementById("switch-menu");
  const switchList = document.getElementById("switch-list");
  const badgesCountEl = document.getElementById("badges-count");
  const badgesPanel = document.getElementById("badges-panel");
  const badgesGrid = document.getElementById("badges-grid");
  const catchBtn = document.querySelector('[data-action="catch"]');

  const state = {
    mode: "overworld",
    areaId: "meadow",
    spriteSheet: null,
    spriteW: 0,
    spriteH: 0,
    playerSprite: null,
    playerTrim: null,
    map: [],
    player: { x: 10, y: 8, dir: "down", frame: 0, moving: false },
    keys: {},
    party: [],
    leadIndex: 0,
    balls: 10,
    berries: defaultBerryStock(),
    activeBerryBonus: 0,
    activeBerryName: null,
    spriteCache: {},
    coins: 50,
    collectedItems: new Set(),
    wild: null,
    activeMon: null,
    battlePhase: "menu",
    dialogQueue: [],
    dialogCallback: null,
    introDone: false,
    shakeTimer: 0,
    animTick: 0,
    battleType: "wild",
    trainer: null,
    trainerTeam: [],
    trainerMonIndex: 0,
    defeatedTrainers: new Set(),
    badges: [],
  };

  function isWalkable(tile) {
    return (
      tile !== WORLD_TILE.TREE &&
      tile !== WORLD_TILE.WATER &&
      tile !== WORLD_TILE.CACTUS &&
      tile !== WORLD_TILE.LAVA
    );
  }

  function isGrass(tile) {
    return (
      tile === WORLD_TILE.GRASS ||
      tile === WORLD_TILE.FLOWER ||
      tile === WORLD_TILE.DARK_GRASS
    );
  }

  function loadArea(areaId, spawnX, spawnY) {
    const area = getArea(areaId);
    state.areaId = areaId;
    state.map = area.build();
    state.player.x = spawnX;
    state.player.y = spawnY;
    locationNameEl.textContent = area.name;
  }

  function changeArea(toId, spawnX, spawnY) {
    loadArea(toId, spawnX, spawnY);
    const area = getArea(toId);
    showDialog(`Entered ${area.name}!`);
  }

  function getActiveItems() {
    const area = getArea(state.areaId);
    return area.items.filter((item) => !state.collectedItems.has(item.id));
  }

  function getItemAt(x, y) {
    return getActiveItems().find((item) => item.x === x && item.y === y);
  }

  function getNpcAdjacent() {
    const area = getArea(state.areaId);
    const { x, y } = state.player;
    return area.npcs.find((npc) => Math.abs(npc.x - x) + Math.abs(npc.y - y) === 1);
  }

  function getLeadBattler() {
    if (state.party.length === 0) return null;
    const lead = state.party[state.leadIndex];
    if (lead && lead.hp > 0) return lead;
    return state.party.find((m) => m.hp > 0) || lead || null;
  }

  function setLeadPartyIndex(index) {
    if (index < 0 || index >= state.party.length) return false;
    state.leadIndex = index;
    state.activeMon = state.party[index];
    return true;
  }

  function healParty() {
    for (const mon of state.party) {
      mon.hp = mon.maxHp;
      if (mon.statStages) mon.statStages = { atk: 0, def: 0 };
    }
    if (state.activeMon) {
      const idx = state.party.indexOf(state.activeMon);
      if (idx >= 0) state.leadIndex = idx;
    }
  }

  function partyNeedsHeal() {
    return state.party.some((m) => m.hp < m.maxHp);
  }

  function hpBarClass(hp, maxHp) {
    const ratio = hp / maxHp;
    if (ratio <= 0.25) return "critical";
    if (ratio <= 0.5) return "low";
    return "";
  }

  function collectItem(item) {
    state.collectedItems.add(item.id);
    if (item.type === "balls") {
      state.balls += item.amount;
      showDialog(`Found ${item.amount} Capy Balls!`);
    } else if (item.type === "coins") {
      state.coins += item.amount;
      showDialog(`Found ${item.amount} coins!`);
    }
    updateHud();
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
    try {
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
      const step = 4;
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
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
      if (minX > maxX) {
        return { sx: 0, sy: 0, sw: img.width, sh: img.height };
      }
      const pad = 8;
      return {
        sx: Math.max(0, minX - pad),
        sy: Math.max(0, minY - pad),
        sw: Math.min(width, maxX + pad) - Math.max(0, minX - pad),
        sh: Math.min(height, maxY + pad) - Math.max(0, minY - pad),
      };
    } catch (err) {
      console.warn("Sprite trim failed, using full image", err);
      return { sx: 0, sy: 0, sw: img.width, sh: img.height };
    }
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
    for (let row = 0; row < SPRITE_ROWS; row++) {
      for (let col = 0; col < SPRITE_COLS; col++) {
        getProcessedSprite(col, row);
      }
    }
  }

  function isBackgroundPixel(r, g, b, a) {
    if (a < 12) return true;
    const light = r > 175 && g > 175 && b > 175;
    const neutral = Math.abs(r - g) < 28 && Math.abs(g - b) < 28;
    return light && neutral;
  }

  function getProcessedSprite(col, row) {
    const key = `${col},${row}`;
    if (state.spriteCache[key]) return state.spriteCache[key];
    if (!state.spriteSheet) return null;

    const off = document.createElement("canvas");
    off.width = state.spriteW;
    off.height = state.spriteH;
    const offCtx = off.getContext("2d");
    offCtx.imageSmoothingEnabled = false;
    offCtx.drawImage(
      state.spriteSheet,
      col * state.spriteW,
      row * state.spriteH,
      state.spriteW,
      state.spriteH,
      0,
      0,
      state.spriteW,
      state.spriteH
    );

    const imgData = offCtx.getImageData(0, 0, off.width, off.height);
    const { data, width, height } = imgData;
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
        if (isBackgroundPixel(r, g, b, a)) {
          data[i + 3] = 0;
        } else {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    offCtx.putImageData(imgData, 0, 0);

    const pad = 4;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const sw = maxX - minX + 1;
    const sh = maxY - minY + 1;

    const trimmed = document.createElement("canvas");
    trimmed.width = sw;
    trimmed.height = sh;
    const tctx = trimmed.getContext("2d");
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(off, minX, minY, sw, sh, 0, 0, sw, sh);

    const entry = { canvas: trimmed, w: sw, h: sh };
    state.spriteCache[key] = entry;
    return entry;
  }

  function drawCenteredCapySprite(targetCtx, col, row, canvasW, canvasH, flip) {
    const sprite = getProcessedSprite(col, row);
    targetCtx.clearRect(0, 0, canvasW, canvasH);
    if (!sprite) return;

    const maxH = canvasH * 0.92;
    const maxW = canvasW * 0.92;
    const scale = Math.min(maxW / sprite.w, maxH / sprite.h);
    const dw = sprite.w * scale;
    const dh = sprite.h * scale;
    const dx = (canvasW - dw) / 2;
    const dy = (canvasH - dh) / 2;

    targetCtx.save();
    if (flip) {
      targetCtx.translate(dx + dw, dy);
      targetCtx.scale(-1, 1);
      targetCtx.drawImage(sprite.canvas, 0, 0, dw, dh);
    } else {
      targetCtx.drawImage(sprite.canvas, dx, dy, dw, dh);
    }
    targetCtx.restore();
  }

  function drawSprite(targetCtx, col, row, canvasW, canvasH) {
    drawCenteredCapySprite(targetCtx, col, row, canvasW, canvasH, false);
  }

  function setHpBar(barEl, hp, maxHp) {
    const ratio = maxHp > 0 ? hp / maxHp : 0;
    barEl.style.width = `${ratio * 100}%`;
    barEl.style.background =
      ratio > 0.5
        ? "linear-gradient(90deg, #4ade80, #22c55e)"
        : ratio > 0.2
          ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
          : "linear-gradient(90deg, #ef4444, #dc2626)";
  }

  function updateBerryStatus() {
    if (state.activeBerryName) {
      berryStatusEl.textContent = `${state.activeBerryName} active — next catch boosted!`;
      berryStatusEl.classList.remove("hidden");
    } else {
      berryStatusEl.classList.add("hidden");
    }
  }

  function drawTile(tile, px, py) {
    switch (tile) {
      case WORLD_TILE.GRASS:
        ctx.fillStyle = "#4a7c23";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#5a9c2a";
        ctx.fillRect(px + 4, py + 4, 4, 4);
        ctx.fillRect(px + 20, py + 18, 3, 3);
        break;
      case WORLD_TILE.DARK_GRASS:
        ctx.fillStyle = "#2d5a18";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#3d7a28";
        ctx.fillRect(px + 6, py + 8, 4, 4);
        ctx.fillRect(px + 18, py + 20, 3, 3);
        break;
      case WORLD_TILE.PATH:
        ctx.fillStyle = "#c4a574";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#b8956a";
        ctx.fillRect(px + 2, py + 14, 28, 2);
        break;
      case WORLD_TILE.WATER:
        ctx.fillStyle = "#3d85c6";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#6eb5e8";
        ctx.fillRect(px + 6, py + 8, 8, 4);
        ctx.fillRect(px + 18, py + 20, 6, 3);
        break;
      case WORLD_TILE.TREE:
        ctx.fillStyle = "#2d5016";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#1a3d0a";
        ctx.fillRect(px + 8, py + 4, 16, 20);
        ctx.fillStyle = "#3d8b2e";
        ctx.beginPath();
        ctx.arc(px + 16, py + 10, 12, 0, Math.PI * 2);
        ctx.fill();
        break;
      case WORLD_TILE.FLOWER:
        ctx.fillStyle = "#4a7c23";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#ff69b4";
        ctx.fillRect(px + 12, py + 10, 8, 8);
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(px + 14, py + 12, 4, 4);
        break;
      case WORLD_TILE.SAND:
        ctx.fillStyle = "#e8d4a8";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#dcc898";
        ctx.fillRect(px + 8, py + 12, 6, 2);
        break;
      case WORLD_TILE.CACTUS:
        ctx.fillStyle = "#e8d4a8";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#3d8b4a";
        ctx.fillRect(px + 14, py + 6, 4, 20);
        ctx.fillRect(px + 8, py + 10, 16, 4);
        ctx.fillRect(px + 10, py + 4, 8, 4);
        break;
      case WORLD_TILE.ROCK:
        ctx.fillStyle = "#5a5a5a";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#7a7a7a";
        ctx.fillRect(px + 6, py + 8, 20, 14);
        ctx.fillStyle = "#4a4a4a";
        ctx.fillRect(px + 10, py + 12, 12, 8);
        break;
      case WORLD_TILE.LAVA:
        ctx.fillStyle = "#5a5a5a";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#ff6b35";
        ctx.fillRect(px + 4, py + 4, 24, 24);
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(px + 10, py + 10, 12, 8);
        break;
      default:
        ctx.fillStyle = "#4a7c23";
        ctx.fillRect(px, py, TILE, TILE);
    }
  }

  function drawGroundItem(px, py, item) {
    const bob = Math.sin(state.animTick * 0.08 + item.x) * 3;
    const cy = py + TILE / 2 + bob;

    if (item.type === "balls") {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px + TILE / 2, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath();
      ctx.arc(px + TILE / 2, cy, 8, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + TILE / 2, cy, 8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (item.type === "coins") {
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(px + TILE / 2, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#daa520";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("$", px + TILE / 2, cy + 3);
    }
  }

  function isTrainerDefeated(npc) {
    return npc.id && state.defeatedTrainers.has(npc.id);
  }

  function drawNpc(px, py, npc) {
    if (npc.type === "trainer") {
      const defeated = isTrainerDefeated(npc);
      ctx.fillStyle = defeated ? "#6b7280" : "#dc2626";
      ctx.fillRect(px + 8, py + 10, 16, 18);
      ctx.fillStyle = "#f5c6a5";
      ctx.fillRect(px + 10, py + 4, 12, 10);
      ctx.fillStyle = "#fff";
      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      if (defeated) {
        ctx.fillStyle = "#4ade80";
        ctx.fillText("✓", px + TILE / 2, py - 2);
      } else {
        ctx.fillStyle = "#fef08a";
        ctx.fillText("!", px + TILE / 2, py - 4);
        ctx.fillStyle = "#fff";
        ctx.font = "5px 'Press Start 2P', monospace";
        ctx.fillText(npc.badge ? "GYM" : "PKR", px + TILE / 2, py + 6);
      }
      return;
    }
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(px + 8, py + 10, 16, 18);
    ctx.fillStyle = "#f5c6a5";
    ctx.fillRect(px + 10, py + 4, 12, 10);
    if (npc.type === "heal") {
      ctx.fillStyle = "#ff69b4";
      ctx.fillRect(px + 6, py + 22, 20, 6);
      ctx.fillStyle = "#fff";
      ctx.fillRect(px + 14, py + 2, 4, 12);
      ctx.fillRect(px + 10, py + 6, 12, 4);
      ctx.fillStyle = "#fff";
      ctx.font = "6px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText("HEAL", px + TILE / 2, py - 2);
    } else {
      ctx.fillStyle = "#2ecc71";
      ctx.fillRect(px + 6, py + 22, 20, 6);
      ctx.fillStyle = "#fff";
      ctx.font = "6px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText("SHOP", px + TILE / 2, py - 2);
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
    if (!sw || !sh) return;
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

  function drawTransitionHints(camX, camY) {
    const area = getArea(state.areaId);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "8px 'Press Start 2P', monospace";
    for (const t of area.transitions) {
      const px = t.x * TILE - camX + TILE / 2;
      const py = t.y * TILE - camY - 4;
      if (t.x === 0) ctx.fillText("→", px - 4, py);
      else if (t.x === MAP_W - 1) ctx.fillText("←", px - 4, py);
      else if (t.y === 0) ctx.fillText("↓", px - 4, py);
      else if (t.y === MAP_H - 1) ctx.fillText("↑", px - 4, py);
    }
  }

  function renderOverworld() {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const camX = Math.max(
      0,
      Math.min(state.player.x * TILE - canvas.width / 2 + TILE / 2, MAP_W * TILE - canvas.width)
    );
    const camY = Math.max(
      0,
      Math.min(state.player.y * TILE - canvas.height / 2 + TILE / 2, MAP_H * TILE - canvas.height)
    );

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const px = x * TILE - camX;
        const py = y * TILE - camY;
        if (px + TILE < 0 || py + TILE < 0 || px > canvas.width || py > canvas.height) continue;
        drawTile(state.map[y][x], px, py);
      }
    }

    for (const item of getActiveItems()) {
      const px = item.x * TILE - camX;
      const py = item.y * TILE - camY;
      if (px > -TILE && py > -TILE && px < canvas.width && py < canvas.height) {
        drawGroundItem(px, py, item);
      }
    }

    const area = getArea(state.areaId);
    for (const npc of area.npcs) {
      const px = npc.x * TILE - camX;
      const py = npc.y * TILE - camY;
      if (px > -TILE && py > -TILE && px < canvas.width && py < canvas.height) {
        drawNpc(px, py, npc);
      }
    }

    const px = state.player.x * TILE - camX;
    const py = state.player.y * TILE - camY;
    drawPlayer(px, py);
    drawTransitionHints(camX, camY);

    const nearNpc = getNpcAdjacent();
    if (nearNpc) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
      ctx.fillStyle = "#7fdbca";
      ctx.font = "8px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      let verb = "visit";
      if (nearNpc.type === "heal") verb = "heal at";
      else if (nearNpc.type === "trainer") {
        verb = isTrainerDefeated(nearNpc) ? "talk to" : "battle";
      }
      ctx.fillText(`Space — ${verb} ${nearNpc.name}`, canvas.width / 2, canvas.height - 10);
    }

    if (state.shakeTimer > 0 && isGrass(state.map[state.player.y][state.player.x])) {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      state.shakeTimer--;
    }
  }

  function updateHud() {
    if (partyCountEl) partyCountEl.textContent = `Party: ${state.party.length}`;
    if (ballsCountEl) ballsCountEl.textContent = `Capy Balls: ${state.balls}`;
    if (coinsCountEl) coinsCountEl.textContent = `Coins: ${state.coins}`;
    if (shopCoinCount) shopCoinCount.textContent = state.coins;
    if (badgesCountEl) {
      badgesCountEl.textContent = `Badges: ${state.badges.length}/${Object.keys(BADGES).length}`;
    }
    updateCatchButton();
  }

  function updateCatchButton() {
    if (!catchBtn) return;
    const trainerBattle = state.battleType === "trainer";
    catchBtn.disabled = trainerBattle;
    catchBtn.style.opacity = trainerBattle ? "0.4" : "1";
  }

  function isTrainerBattle() {
    return state.battleType === "trainer";
  }

  function focusGame() {
    if (canvas && typeof canvas.focus === "function") canvas.focus();
  }

  function clearKeys() {
    state.keys = {};
  }

  const MOVEMENT_KEYS = new Set([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "KeyW", "KeyA", "KeyS", "KeyD",
  ]);

  function isMovementKey(code) {
    return MOVEMENT_KEYS.has(code);
  }

  function showDialog(lines, callback) {
    clearKeys();
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
    state.mode = "overworld";
    clearKeys();
    if (cb) cb();
    focusGame();
  }

  function getEncounterRate() {
    const area = getArea(state.areaId);
    return area.encounterRate ?? ENCOUNTER_RATE_BASE;
  }

  function pickWildEncounter() {
    const area = getArea(state.areaId);
    state.battleType = "wild";
    state.trainer = null;
    state.trainerTeam = [];
    state.wild = createWildCapybara(null, area.encounterTypes);
    state.activeMon = getLeadBattler();
    state.battlePhase = "menu";
    state.catchAnim = 0;
    state.activeBerryBonus = 0;
    state.activeBerryName = null;
    startBattle();
  }

  function startTrainerBattle(npc) {
    if (isTrainerDefeated(npc)) {
      showDialog([`${npc.name} was already defeated.`, "You're the champion here now!"]);
      return;
    }
    if (!state.party.some((m) => m.hp > 0)) {
      showDialog(["Your party can't fight!", "Heal up at a Capy Care Center first."]);
      return;
    }
    state.battleType = "trainer";
    state.trainer = npc;
    state.trainerTeam = npc.team.map((t) => createTrainerMon(t.speciesId, t.level));
    state.trainerMonIndex = 0;
    state.wild = state.trainerTeam[0];
    state.activeMon = getLeadBattler();
    state.battlePhase = "menu";
    state.activeBerryBonus = 0;
    state.activeBerryName = null;
    startBattle();
    setBattleMessage(`${npc.name} wants to battle!`);
  }

  function startBattle() {
    state.mode = "battle";
    resetBattler(state.wild);
    if (state.activeMon) resetBattler(state.activeMon);
    battleUi.classList.remove("hidden");
    battleMenu.classList.remove("hidden");
    moveMenu.classList.add("hidden");
    closeBag();
    updateBattleUi();
    if (state.battleType === "wild") {
      setBattleMessage(`Wild ${state.wild.name} appeared!`);
    }
  }

  function endBattle() {
    battleUi.classList.add("hidden");
    closeBag();
    closeSwitchMenu();
    state.mode = "overworld";
    state.wild = null;
    state.battlePhase = "menu";
    state.battleType = "wild";
    state.trainer = null;
    state.trainerTeam = [];
    state.trainerMonIndex = 0;
    state.activeBerryBonus = 0;
    state.activeBerryName = null;
    wildSpriteCanvas.style.transform = "";
    updateCatchButton();
  }

  function updateBattleUi() {
    const w = state.wild;
    wildNameEl.textContent = w.name;
    wildLevelEl.textContent = `Lv.${w.level} · ${w.type.toUpperCase()}`;
    setHpBar(wildHpEl, w.hp, w.maxHp);
    wildHpTextEl.textContent = `${w.hp} / ${w.maxHp}`;

    drawCenteredCapySprite(
      wildSpriteCtx,
      w.spriteCol,
      w.spriteRow,
      wildSpriteCanvas.width,
      wildSpriteCanvas.height,
      false
    );

    const ally = state.activeMon;
    if (ally) {
      allyNameEl.textContent = ally.name;
      const expP = getExpProgress(ally);
      const expLabel = expP.maxed ? "MAX" : ` · ${expP.current}/${expP.needed} EXP`;
      allyLevelEl.textContent = `Lv.${ally.level} · ${ally.type.toUpperCase()}${expLabel}`;
      setHpBar(allyHpEl, ally.hp, ally.maxHp);
      allyHpTextEl.textContent = `${ally.hp} / ${ally.maxHp}`;
      drawCenteredCapySprite(
        allySpriteCtx,
        ally.spriteCol,
        ally.spriteRow,
        allySpriteCanvas.width,
        allySpriteCanvas.height,
        true
      );
    } else {
      allyNameEl.textContent = "—";
      allyLevelEl.textContent = "No ally";
      setHpBar(allyHpEl, 0, 1);
      allyHpTextEl.textContent = "";
      allySpriteCtx.clearRect(0, 0, allySpriteCanvas.width, allySpriteCanvas.height);
    }

    const moveBtns = moveMenu.querySelectorAll("[data-move]");
    const moves = state.activeMon ? state.activeMon.moves : [];
    const canPickMove =
      state.battlePhase === "fight" &&
      state.activeMon &&
      state.activeMon.hp > 0;
    moveBtns.forEach((btn, i) => {
      const move = moves[i];
      if (move) {
        const powerLabel = move.power > 0 ? ` · ${move.power}` : "";
        btn.textContent = `${move.name}${powerLabel}`;
        btn.className = `move-btn type-${move.type}`;
        btn.disabled = !canPickMove;
      } else {
        btn.textContent = "—";
        btn.className = "move-btn";
        btn.disabled = true;
      }
    });
    updateBerryStatus();
    updateHud();
    updateCatchButton();
    if (isTrainerBattle() && state.trainer) {
      wildNameEl.textContent = state.trainer.name + "'s " + w.name;
    }
  }

  function openBag() {
    if (state.battlePhase === "catching" || state.battlePhase === "animating") return;
    state.battlePhase = "bag";
    bagUi.classList.remove("hidden");
    battleMenu.classList.add("hidden");
    moveMenu.classList.add("hidden");
    renderBag();
    setBattleMessage("Choose an item from your bag.");
  }

  function closeBag() {
    bagUi.classList.add("hidden");
    if (state.mode === "battle" && state.battlePhase === "bag") {
      state.battlePhase = "menu";
      battleMenu.classList.remove("hidden");
    }
  }

  function renderBag() {
    bagBallsEl.innerHTML = "";
    const ballBtn = document.createElement("button");
    ballBtn.type = "button";
    ballBtn.className = "bag-item";
    ballBtn.disabled = state.balls <= 0 || state.battlePhase === "catching";
    ballBtn.innerHTML = `
      <div class="bag-item-top">
        <span class="bag-item-icon" style="background:#dbeafe">⚾</span>
        <span class="bag-item-name">Capy Ball</span>
        <span class="bag-item-count">×${state.balls}</span>
      </div>
      <span class="bag-item-desc">Throw to catch wild capybaras.</span>
    `;
    ballBtn.addEventListener("click", () => {
      closeBag();
      tryCatch();
    });
    bagBallsEl.appendChild(ballBtn);

    bagBerriesEl.innerHTML = "";
    for (const berry of BERRIES) {
      const count = state.berries[berry.id] || 0;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bag-item" + (state.activeBerryName === berry.name ? " active-berry" : "");
      btn.disabled = count <= 0 || state.battlePhase === "catching";
      btn.innerHTML = `
        <div class="bag-item-top">
          <span class="bag-item-icon" style="background:${berry.color}22">${berry.emoji}</span>
          <span class="bag-item-name">${berry.name}</span>
          <span class="bag-item-count">×${count}</span>
        </div>
        <span class="bag-item-desc">${berry.desc}</span>
      `;
      btn.addEventListener("click", () => useBerry(berry));
      bagBerriesEl.appendChild(btn);
    }
  }

  function useBerry(berry) {
    if ((state.berries[berry.id] || 0) <= 0) return;
    state.berries[berry.id]--;
    state.activeBerryBonus = getBerryCatchBonus(
      berry.id,
      state.wild.hp,
      state.wild.maxHp
    );
    state.activeBerryName = berry.name;
    closeBag();
    state.battlePhase = "menu";
    battleMenu.classList.remove("hidden");
    updateBerryStatus();
    renderBag();
    setBattleMessage(
      `You fed the wild ${state.wild.name} a ${berry.name}! Catch rate boosted.`
    );
  }

  function setBattleMessage(msg) {
    battleMsg.textContent = msg;
  }

  const BATTLE_DELAY = 950;

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function resetBattler(mon) {
    mon.statStages = { atk: 0, def: 0 };
  }

  function ensureStages(mon) {
    if (!mon.statStages) mon.statStages = { atk: 0, def: 0 };
    return mon.statStages;
  }

  function stageMultiplier(stage) {
    const table = [2 / 8, 2 / 7, 2 / 6, 2 / 5, 2 / 4, 2 / 3, 1, 2, 3, 4, 5, 6, 7, 8];
    const idx = Math.max(0, Math.min(13, stage + 6));
    return table[idx];
  }

  function effectiveStat(mon, stat) {
    const stages = ensureStages(mon);
    return Math.max(1, Math.floor(mon[stat] * stageMultiplier(stages[stat])));
  }

  function effectivenessText(eff) {
    if (eff > 1) return " It's super effective!";
    if (eff > 0 && eff < 1) return " It's not very effective...";
    if (eff === 0) return " It had no effect!";
    return "";
  }

  function calcDamage(attacker, defender, move) {
    if (!move.power) return { damage: 0, effectiveness: 1 };
    const effectiveness = getEffectiveness(move.type, defender.type);
    if (effectiveness === 0) return { damage: 0, effectiveness: 0 };
    const stab = move.type === attacker.type ? 1.5 : 1;
    const atk = effectiveStat(attacker, "atk");
    const def = Math.max(1, effectiveStat(defender, "def"));
    const base = ((2 * attacker.level) / 5 + 2) * move.power * (atk / def);
    const damage = Math.max(
      1,
      Math.floor((base / 50 + 2) * stab * effectiveness * (0.85 + Math.random() * 0.15))
    );
    return { damage, effectiveness };
  }

  function applyStatusMove(user, target, move) {
    const userStages = ensureStages(user);
    const targetStages = ensureStages(target);
    switch (move.status) {
      case "atkDown":
        targetStages.atk = Math.max(-6, targetStages.atk - 1);
        return `${user.name} used ${move.name}! ${target.name}'s Attack fell!`;
      case "atkUp":
        userStages.atk = Math.min(6, userStages.atk + 1);
        return `${user.name} used ${move.name}! ${user.name}'s Attack rose!`;
      case "defUp":
        userStages.def = Math.min(6, userStages.def + 1);
        return `${user.name} used ${move.name}! ${user.name}'s Defense rose!`;
      case "accDown":
        targetStages.def = Math.max(-6, targetStages.def - 1);
        return `${user.name} used ${move.name}! ${target.name} was distracted!`;
      default:
        return `${user.name} used ${move.name}!`;
    }
  }

  function flashSprite(canvasEl) {
    canvasEl.classList.add("hit-flash");
    setTimeout(() => canvasEl.classList.remove("hit-flash"), 220);
  }

  function lockBattleInput() {
    state.battlePhase = "animating";
    battleMenu.classList.add("hidden");
    moveMenu.classList.add("hidden");
    closeSwitchMenu();
    closeBag();
  }

  function unlockBattleMenu() {
    if (state.mode !== "battle") return;
    state.battlePhase = "menu";
    battleMenu.classList.remove("hidden");
    moveMenu.classList.add("hidden");
    closeSwitchMenu();
    updateBattleUi();
  }

  function closeSwitchMenu() {
    if (switchMenu) switchMenu.classList.add("hidden");
  }

  function openSwitchMenu() {
    if (state.party.length <= 1) {
      setBattleMessage("You only have one capybara!");
      return;
    }
    const healthy = state.party.filter((m) => m.hp > 0);
    if (healthy.length === 0) {
      setBattleMessage("No capybaras can battle!");
      return;
    }
    state.battlePhase = "switch";
    battleMenu.classList.add("hidden");
    moveMenu.classList.add("hidden");
    closeBag();
    switchMenu.classList.remove("hidden");
    renderSwitchMenu();
    setBattleMessage("Choose a capybara to send out.");
  }

  function renderSwitchMenu() {
    if (!switchList) return;
    switchList.innerHTML = "";
    state.party.forEach((mon, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "switch-option";
      if (mon === state.activeMon) btn.classList.add("active");
      if (mon.hp <= 0) btn.disabled = true;

      const sprite = document.createElement("canvas");
      sprite.width = 48;
      sprite.height = 42;
      const sctx = sprite.getContext("2d");
      sctx.imageSmoothingEnabled = false;
      drawCenteredCapySprite(sctx, mon.spriteCol, mon.spriteRow, 48, 42, false);

      const info = document.createElement("div");
      info.className = "switch-option-info";
      const name = document.createElement("span");
      name.className = "switch-option-name";
      name.textContent = mon.name + (mon === state.activeMon ? " (out)" : "");
      const meta = document.createElement("span");
      meta.className = "switch-option-meta";
      meta.textContent =
        mon.hp <= 0
          ? "Fainted"
          : `Lv.${mon.level} · HP ${mon.hp}/${mon.maxHp}`;
      info.appendChild(name);
      info.appendChild(meta);

      btn.appendChild(sprite);
      btn.appendChild(info);
      btn.addEventListener("click", () => switchBattlerInBattle(index));
      switchList.appendChild(btn);
    });
  }

  async function switchBattlerInBattle(partyIndex) {
    const mon = state.party[partyIndex];
    if (!mon || mon.hp <= 0) return;
    if (mon === state.activeMon) {
      setBattleMessage(`${mon.name} is already battling!`);
      return;
    }
    if (state.battlePhase !== "switch") return;

    closeSwitchMenu();
    lockBattleInput();
    setLeadPartyIndex(partyIndex);
    resetBattler(state.activeMon);
    setBattleMessage(`Come back! Go, ${mon.name}!`);
    updateBattleUi();
    await delay(BATTLE_DELAY);

    const wildMove = pickWildMove();
    await executeMove(state.wild, state.activeMon, wildMove, false);
    await delay(BATTLE_DELAY);

    if (state.activeMon.hp <= 0) {
      await handleAllyFainted();
      return;
    }

    unlockBattleMenu();
    setBattleMessage("What will you do?");
  }

  function pickWildMove() {
    const moves = state.wild.moves;
    const damaging = moves.filter((m) => m.power > 0);
    const status = moves.filter((m) => !m.power);
    if (status.length && Math.random() < 0.28) {
      return status[Math.floor(Math.random() * status.length)];
    }
    if (damaging.length) {
      return damaging[Math.floor(Math.random() * damaging.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  async function executeMove(attacker, defender, move, attackerIsPlayer) {
    const targetCanvas = attackerIsPlayer ? wildSpriteCanvas : allySpriteCanvas;

    if (!move.power) {
      setBattleMessage(applyStatusMove(attacker, defender, move));
      updateBattleUi();
      return;
    }

    const { damage, effectiveness } = calcDamage(attacker, defender, move);
    defender.hp = Math.max(0, defender.hp - damage);

    let msg = `${attacker.name} used ${move.name}!`;
    if (damage > 0) {
      msg += ` ${damage} damage!`;
      msg += effectivenessText(effectiveness);
      flashSprite(targetCanvas);
    } else {
      msg += effectivenessText(effectiveness);
    }

    if (move.heal && damage > 0) {
      const healed = Math.floor(damage / 2);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healed);
      msg += ` ${attacker.name} recovered HP!`;
    }

    setBattleMessage(msg);
    updateBattleUi();
  }

  async function handleFoeFainted() {
    if (isTrainerBattle()) {
      await handleTrainerFoeFainted();
      return;
    }
    const name = state.wild.name;
    const exp = Math.floor(state.wild.level * 15 + 8);
    setBattleMessage(`${name} fainted!`);
    updateBattleUi();
    await delay(900);
    const levelUps = grantExpToParty(state.party, exp);
    endBattle();
    const lines = [`You defeated wild ${name}!`, `The party gained ${exp} EXP!`];
    lines.push(...levelUps.slice(0, 4));
    if (levelUps.length > 4) lines.push("...");
    showDialog(lines);
  }

  async function handleTrainerFoeFainted() {
    const name = state.wild.name;
    const exp = Math.floor(state.wild.level * 22 + 20);
    setBattleMessage(`${name} fainted!`);
    updateBattleUi();
    await delay(900);
    const levelUps = grantExpToParty(state.party, exp);

    state.trainerMonIndex++;
    if (state.trainerMonIndex < state.trainerTeam.length) {
      state.wild = state.trainerTeam[state.trainerMonIndex];
      resetBattler(state.wild);
      setBattleMessage(`${state.trainer.name} sent out ${state.wild.name}!`);
      updateBattleUi();
      await delay(BATTLE_DELAY);
      unlockBattleMenu();
      setBattleMessage("What will you do?");
      return;
    }

    const t = state.trainer;
    state.defeatedTrainers.add(t.id);
    const coins = t.reward?.coins || 40;
    state.coins += coins;
    updateHud();

    let badgeLine = null;
    if (t.badge && !state.badges.includes(t.badge) && BADGES[t.badge]) {
      state.badges.push(t.badge);
      badgeLine = `You earned the ${BADGES[t.badge].icon} ${BADGES[t.badge].name}!`;
    }

    endBattle();
    const lines = [
      `You defeated ${t.name}!`,
      `Won ${coins} coins!`,
      `The party gained ${exp} EXP!`,
    ];
    lines.push(...levelUps.slice(0, 3));
    if (badgeLine) lines.push(badgeLine);
    showDialog(lines);
  }

  async function handleAllyFainted() {
    const fainted = state.activeMon.name;
    setBattleMessage(`${fainted} fainted!`);
    updateBattleUi();
    await delay(1000);

    const next = state.party.find((m) => m.hp > 0);
    if (next && next !== state.activeMon) {
      const idx = state.party.indexOf(next);
      setLeadPartyIndex(idx);
      setBattleMessage(`Go, ${next.name}!`);
      updateBattleUi();
      await delay(900);
      unlockBattleMenu();
      setBattleMessage("What will you do?");
      return;
    }

    const wasTrainer = isTrainerBattle();
    const trainerName = state.trainer?.name;
    endBattle();
    const lines = [
      "All your capybaras fainted!",
      "Visit a Capy Care Center (pink HEAL sign) to recover.",
    ];
    if (wasTrainer && trainerName) {
      lines.unshift(`You lost to ${trainerName}...`);
    }
    showDialog(lines);
  }

  function switchToHealthyMon() {
    if (state.activeMon && state.activeMon.hp > 0) return true;
    const next = state.party.find((m) => m.hp > 0);
    if (next) {
      setLeadPartyIndex(state.party.indexOf(next));
      updateBattleUi();
      return true;
    }
    return false;
  }

  function tryCatch() {
    if (state.battlePhase === "animating") return;
    if (isTrainerBattle()) {
      setBattleMessage("You can't catch another trainer's capybara!");
      return;
    }
    if (state.balls <= 0) {
      setBattleMessage("You're out of Capy Balls! Visit a shop or find pickups.");
      return;
    }
    if (state.wild.hp <= 0) {
      setBattleMessage("You can't catch a fainted capybara!");
      return;
    }
    state.balls--;
    updateHud();
    state.battlePhase = "catching";
    battleMenu.classList.add("hidden");
    moveMenu.classList.add("hidden");
    closeBag();

    const berryBonus = state.activeBerryBonus;
    const berryUsed = state.activeBerryName;
    state.activeBerryBonus = 0;
    state.activeBerryName = null;
    updateBerryStatus();

    const hpFactor = (state.wild.maxHp - state.wild.hp) / state.wild.maxHp;
    let catchChance =
      (state.wild.catchRate / 255) * (0.4 + hpFactor * 0.6) + 0.1 + berryBonus;
    catchChance = Math.min(0.95, catchChance);
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
        const caught = { ...state.wild, hp: state.wild.maxHp, exp: 0 };
        refreshMonStats(caught, false);
        state.party.push(caught);
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
    const throwMsg = berryUsed
      ? `You threw a Capy Ball! (boosted by ${berryUsed})`
      : "You threw a Capy Ball!";
    setBattleMessage(throwMsg);
    setTimeout(anim, 800);
  }

  async function playerAttack(moveIndex) {
    if (!state.activeMon || state.battlePhase !== "fight") return;
    const move = state.activeMon.moves[moveIndex];
    if (!move) return;
    if (state.activeMon.hp <= 0) {
      if (!switchToHealthyMon()) {
        setBattleMessage("Your party can't fight!");
        return;
      }
    }

    lockBattleInput();

    await executeMove(state.activeMon, state.wild, move, true);
    await delay(BATTLE_DELAY);

    if (state.wild.hp <= 0) {
      await handleFoeFainted();
      return;
    }

    if (state.activeMon.hp <= 0) {
      await handleAllyFainted();
      return;
    }

    const wildMove = pickWildMove();
    await executeMove(state.wild, state.activeMon, wildMove, false);
    await delay(BATTLE_DELAY);

    if (state.activeMon.hp <= 0) {
      await handleAllyFainted();
      return;
    }

    unlockBattleMenu();
    setBattleMessage("What will you do?");
  }

  function tryMove(dx, dy) {
    if (state.mode !== "overworld") return;

    const nx = state.player.x + dx;
    const ny = state.player.y + dy;

    if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) {
      const edgeX = nx < 0 ? 0 : nx >= MAP_W ? MAP_W - 1 : state.player.x;
      const edgeY = ny < 0 ? 0 : ny >= MAP_H ? MAP_H - 1 : state.player.y;
      const trans = findTransition(state.areaId, edgeX, edgeY);
      if (trans) {
        if (dx > 0) state.player.dir = "right";
        if (dx < 0) state.player.dir = "left";
        if (dy > 0) state.player.dir = "down";
        if (dy < 0) state.player.dir = "up";
        changeArea(trans.to, trans.spawnX, trans.spawnY);
      }
      return;
    }

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

    const item = getItemAt(nx, ny);
    if (item) collectItem(item);

    if (isGrass(tile) && Math.random() < getEncounterRate()) {
      state.shakeTimer = 12;
      setTimeout(() => {
        if (state.mode === "overworld") pickWildEncounter();
      }, 400);
    }
  }

  function tryInteract() {
    if (state.mode !== "overworld") return;

    const npc = getNpcAdjacent();
    if (npc) {
      if (npc.type === "shop") openShop(npc);
      else if (npc.type === "heal") openHealCenter(npc);
      else if (npc.type === "trainer") startTrainerBattle(npc);
      return;
    }

    const item = getItemAt(state.player.x, state.player.y);
    if (item) collectItem(item);
  }

  function openHealCenter(npc) {
    if (state.party.length === 0) {
      showDialog(["You don't have any capybaras yet!"]);
      return;
    }
    if (!partyNeedsHeal()) {
      showDialog([
        `Welcome to ${npc.name}!`,
        "Your capybaras are already in perfect health!",
      ]);
      return;
    }
    const fainted = state.party.filter((m) => m.hp <= 0).length;
    healParty();
    updateHud();
    const lines = [
      `Welcome to ${npc.name}!`,
      "Your capybaras have been fully restored!",
    ];
    if (fainted > 0) {
      lines.push(`Revived ${fainted} fainted capybara(s).`);
    }
    lines.push("Take care out there!");
    showDialog(lines);
  }

  function openShop(npc) {
    state.mode = "shop";
    shopTitle.textContent = npc.name;
    shopUi.classList.remove("hidden");
    renderShop();
  }

  function closeShop() {
    shopUi.classList.add("hidden");
    state.mode = "overworld";
    clearKeys();
    focusGame();
  }

  function renderShop() {
    shopItemsEl.innerHTML = "";
    shopCoinCount.textContent = state.coins;
    for (const product of SHOP_ITEMS) {
      const btn = document.createElement("button");
      btn.textContent = `${product.label} — ${product.cost} coins`;
      btn.disabled = state.coins < product.cost;
      btn.addEventListener("click", () => buyProduct(product));
      shopItemsEl.appendChild(btn);
    }
  }

  function buyProduct(product) {
    if (state.coins < product.cost) return;
    state.coins -= product.cost;
    state.balls += product.balls;
    updateHud();
    closeShop();
    showDialog(`Bought ${product.label}!`);
  }

  function renderCollection() {
    collectionGrid.innerHTML = "";
    const slots = Math.max(6, state.party.length);
    for (let i = 0; i < slots; i++) {
      const card = document.createElement("div");
      const mon = state.party[i];
      card.className = "collection-card" + (mon ? "" : " empty-slot");
      if (mon) {
        if (i === state.leadIndex) card.classList.add("active-lead");
        if (mon.hp <= 0) card.classList.add("fainted");
        if (i === state.leadIndex) {
          const badge = document.createElement("span");
          badge.className = "lead-badge";
          badge.textContent = "LEAD";
          card.appendChild(badge);
        }
        const wrap = document.createElement("div");
        wrap.className = "collection-sprite-wrap";
        const c = document.createElement("canvas");
        c.width = 110;
        c.height = 96;
        const cctx = c.getContext("2d");
        cctx.imageSmoothingEnabled = false;
        drawCenteredCapySprite(cctx, mon.spriteCol, mon.spriteRow, 110, 96, false);
        wrap.appendChild(c);
        card.appendChild(wrap);
        const name = document.createElement("div");
        name.className = "name";
        name.textContent = mon.name;
        const type = document.createElement("div");
        type.className = "type";
        type.textContent = `Lv.${mon.level} · ${mon.type}`;
        card.appendChild(name);
        card.appendChild(type);

        const hpText = document.createElement("div");
        hpText.className = "collection-hp";
        hpText.textContent = mon.hp <= 0 ? "FAINTED" : `HP ${mon.hp} / ${mon.maxHp}`;
        card.appendChild(hpText);

        const hpWrap = document.createElement("div");
        hpWrap.className = "collection-hp-bar-wrap";
        const hpBar = document.createElement("div");
        hpBar.className = "collection-hp-bar " + hpBarClass(mon.hp, mon.maxHp);
        hpBar.style.width = `${Math.max(0, (mon.hp / mon.maxHp) * 100)}%`;
        hpWrap.appendChild(hpBar);
        card.appendChild(hpWrap);

        const expProg = getExpProgress(mon);
        const expText = document.createElement("div");
        expText.className = "collection-exp";
        expText.textContent = expProg.maxed
          ? "MAX LEVEL"
          : `EXP ${expProg.current}/${expProg.needed}`;
        card.appendChild(expText);
        if (!expProg.maxed) {
          const expWrap = document.createElement("div");
          expWrap.className = "collection-exp-bar-wrap";
          const expBar = document.createElement("div");
          expBar.className = "collection-exp-bar";
          expBar.style.width = `${(expProg.current / expProg.needed) * 100}%`;
          expWrap.appendChild(expBar);
          card.appendChild(expWrap);
        }

        card.addEventListener("click", () => {
          if (mon.hp <= 0) {
            showDialog([`${mon.name} has fainted!`, "Visit a Capy Care Center to heal."]);
            return;
          }
          setLeadPartyIndex(i);
          renderCollection();
          showDialog(`${mon.name} is now your lead capybara!`);
        });
      } else {
        card.textContent = "???";
      }
      collectionGrid.appendChild(card);
    }
  }

  function toggleCollection() {
    if (badgesPanel && !badgesPanel.classList.contains("hidden")) {
      badgesPanel.classList.add("hidden");
    }
    if (collectionEl.classList.contains("hidden")) {
      renderCollection();
      collectionEl.classList.remove("hidden");
      state.mode = "collection";
      clearKeys();
    } else {
      collectionEl.classList.add("hidden");
      state.mode = "overworld";
      clearKeys();
      focusGame();
    }
  }

  function renderBadges() {
    if (!badgesGrid) return;
    badgesGrid.innerHTML = "";
    for (const key of Object.keys(BADGES)) {
      const badge = BADGES[key];
      const earned = state.badges.includes(key);
      const card = document.createElement("div");
      card.className = "badge-card" + (earned ? " earned" : "");
      card.innerHTML = `
        <span class="badge-card-icon">${badge.icon}</span>
        <span class="badge-card-name">${badge.name}</span>
        <span class="badge-card-area">${earned ? "Earned!" : "Not yet earned"}</span>
      `;
      if (earned) card.style.borderColor = badge.color;
      badgesGrid.appendChild(card);
    }
  }

  function toggleBadges() {
    if (collectionEl && !collectionEl.classList.contains("hidden")) {
      collectionEl.classList.add("hidden");
    }
    if (badgesPanel.classList.contains("hidden")) {
      renderBadges();
      badgesPanel.classList.remove("hidden");
      state.mode = "badges";
      clearKeys();
    } else {
      badgesPanel.classList.add("hidden");
      state.mode = "overworld";
      clearKeys();
      focusGame();
    }
  }

  function handleKeyDown(e) {
    if (e.repeat) return;

    if (state.mode === "dialog") {
      if (e.code === "Space" || e.code === "Enter" || isMovementKey(e.code)) {
        advanceDialog();
        e.preventDefault();
      }
      return;
    }

    if (isMovementKey(e.code) && state.mode !== "battle") {
      e.preventDefault();
    }

    state.keys[e.code] = true;

    if ((e.code === "KeyC" || e.code === "KeyP") && state.mode !== "battle" && state.mode !== "shop") {
      toggleCollection();
      e.preventDefault();
    }
    if (e.code === "KeyB" && state.mode !== "battle" && state.mode !== "shop") {
      toggleBadges();
      e.preventDefault();
    }
    if (e.code === "Escape") {
      if (state.mode === "shop") {
        closeShop();
        e.preventDefault();
      } else if (state.mode === "collection") {
        toggleCollection();
        e.preventDefault();
      } else if (state.mode === "badges") {
        toggleBadges();
        e.preventDefault();
      }
    }
    if ((e.code === "Space" || e.code === "Enter") && state.mode === "overworld") {
      tryInteract();
      e.preventDefault();
    }
  }

  function handleKeyUp(e) {
    state.keys[e.code] = false;
  }

  window.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("blur", clearKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearKeys();
  });
  canvas.addEventListener("click", focusGame);

  battleMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || state.battlePhase !== "menu") return;
    const action = btn.dataset.action;
    if (action === "fight") {
      if (!state.activeMon) {
        setBattleMessage("You have no capybara to fight with! Throw a ball!");
        return;
      }
      if (!switchToHealthyMon()) {
        setBattleMessage("Your party can't fight!");
        return;
      }
      battleMenu.classList.add("hidden");
      moveMenu.classList.remove("hidden");
      state.battlePhase = "fight";
      updateBattleUi();
      setBattleMessage(`Choose a move for ${state.activeMon.name}.`);
    } else if (action === "catch") {
      tryCatch();
    } else if (action === "bag") {
      openBag();
      setBattleMessage(`Capy Balls: ${state.balls} · Coins: ${state.coins}`);
    } else if (action === "switch") {
      openSwitchMenu();
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
  document.getElementById("close-badges")?.addEventListener("click", toggleBadges);
  document.getElementById("bag-close").addEventListener("click", () => {
    closeBag();
    setBattleMessage("What will you do?");
  });
  document.getElementById("close-shop").addEventListener("click", closeShop);
  document.querySelector("[data-action='switch-back']")?.addEventListener("click", () => {
    closeSwitchMenu();
    state.battlePhase = "menu";
    battleMenu.classList.remove("hidden");
    setBattleMessage("What will you do?");
  });

  let moveCooldown = 0;
  function gameLoop() {
    state.animTick++;

    if (state.mode === "overworld") {
      if (moveCooldown > 0) moveCooldown--;
      else {
        let dx = 0;
        let dy = 0;
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
    }

    if (state.mode !== "battle") {
      renderOverworld();
    }

    requestAnimationFrame(gameLoop);
  }

  async function init() {
    loadArea("meadow", 10, 8);
    try {
      await loadSprites();
    } catch (err) {
      console.error("Failed to load sprites", err);
    }
    updateHud();
    focusGame();
    gameLoop();
    showDialog(
      [
        "Welcome to CapyCatch!",
        "8 regions to explore! Battle trainers (red !) for coins & badges.",
        "Press C for party, B for badges. Pink HEAL restores your team. Good luck!",
      ],
      () => {
        const starter = createOwnedCapybara("normal", 5);
        state.party.push(starter);
        state.leadIndex = 0;
        state.activeMon = starter;
        updateHud();
        state.introDone = true;
      }
    );
  }

  init();
})();
