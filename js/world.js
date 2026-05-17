const WORLD_TILE = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  TREE: 3,
  FLOWER: 4,
  SAND: 5,
  DARK_GRASS: 6,
  CACTUS: 7,
  ROCK: 8,
  LAVA: 9,
};

const MAP_W = 20;
const MAP_H = 15;

function blankMap(fill) {
  const map = [];
  for (let y = 0; y < MAP_H; y++) {
    const row = [];
    for (let x = 0; x < MAP_W; x++) {
      const edge = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
      row.push(edge ? WORLD_TILE.TREE : fill);
    }
    map.push(row);
  }
  return map;
}

function buildMeadow() {
  const map = blankMap(WORLD_TILE.GRASS);
  for (let x = 2; x < 18; x++) {
    map[7][x] = WORLD_TILE.PATH;
    map[8][x] = WORLD_TILE.PATH;
  }
  for (let y = 3; y < 12; y++) map[y][10] = WORLD_TILE.PATH;
  map[4][4] = map[4][5] = map[5][4] = WORLD_TILE.FLOWER;
  map[10][14] = map[10][15] = map[11][14] = WORLD_TILE.FLOWER;
  map[3][14] = map[3][15] = map[4][15] = WORLD_TILE.WATER;
  map[11][3] = map[11][4] = map[12][3] = WORLD_TILE.WATER;
  map[2][8] = map[2][9] = WORLD_TILE.SAND;
  map[12][8] = WORLD_TILE.SAND;
  map[1][10] = WORLD_TILE.TREE;
  map[13][6] = WORLD_TILE.TREE;
  map[7][0] = map[8][0] = WORLD_TILE.PATH;
  map[7][19] = map[8][19] = WORLD_TILE.PATH;
  map[0][10] = map[1][10] = WORLD_TILE.PATH;
  map[14][10] = map[13][10] = WORLD_TILE.PATH;
  map[10][19] = WORLD_TILE.PATH;
  return map;
}

function buildDesert() {
  const map = blankMap(WORLD_TILE.SAND);
  for (let x = 1; x < 19; x++) {
    map[7][x] = WORLD_TILE.PATH;
    map[8][x] = WORLD_TILE.PATH;
  }
  map[7][19] = map[8][19] = WORLD_TILE.PATH;
  map[10][0] = WORLD_TILE.PATH;
  const cacti = [
    [3, 3], [5, 11], [14, 4], [16, 12], [8, 2], [12, 13], [4, 8], [15, 7],
  ];
  for (const [x, y] of cacti) map[y][x] = WORLD_TILE.CACTUS;
  map[5][5] = map[6][5] = map[5][6] = WORLD_TILE.FLOWER;
  map[11][10] = map[12][10] = WORLD_TILE.ROCK;
  return map;
}

function buildBeach() {
  const map = blankMap(WORLD_TILE.SAND);
  for (let y = 2; y < 13; y++) {
    for (let x = 0; x < 6; x++) map[y][x] = WORLD_TILE.WATER;
  }
  for (let x = 6; x < 19; x++) {
    map[7][x] = WORLD_TILE.PATH;
    map[8][x] = WORLD_TILE.PATH;
  }
  map[7][0] = map[8][0] = WORLD_TILE.PATH;
  map[10][14] = map[11][14] = WORLD_TILE.PATH;
  map[4][12] = map[4][13] = map[5][12] = WORLD_TILE.WATER;
  map[10][15] = map[11][16] = WORLD_TILE.WATER;
  map[9][9] = map[10][9] = WORLD_TILE.FLOWER;
  return map;
}

function buildForest() {
  const map = blankMap(WORLD_TILE.DARK_GRASS);
  for (let x = 3; x < 17; x++) {
    map[13][x] = WORLD_TILE.PATH;
    map[14][x] = WORLD_TILE.PATH;
  }
  for (let y = 4; y < 14; y++) map[y][10] = WORLD_TILE.PATH;
  map[13][10] = map[14][10] = WORLD_TILE.PATH;
  map[10][0] = WORLD_TILE.PATH;
  const trees = [
    [2, 2], [4, 2], [6, 3], [15, 2], [17, 4], [3, 8], [16, 9], [5, 12], [14, 11],
  ];
  for (const [x, y] of trees) map[y][x] = WORLD_TILE.TREE;
  map[6][6] = map[7][6] = map[6][7] = WORLD_TILE.FLOWER;
  map[12][5] = map[13][5] = WORLD_TILE.WATER;
  return map;
}

function buildVolcano() {
  const map = blankMap(WORLD_TILE.ROCK);
  for (let x = 4; x < 16; x++) {
    map[1][x] = WORLD_TILE.PATH;
    map[2][x] = WORLD_TILE.PATH;
  }
  for (let y = 3; y < 12; y++) map[y][10] = WORLD_TILE.PATH;
  map[0][10] = map[1][10] = WORLD_TILE.PATH;
  map[13][10] = map[14][10] = WORLD_TILE.PATH;
  const lava = [
    [8, 5], [9, 5], [10, 5], [7, 6], [11, 6], [8, 7], [9, 7], [10, 7],
  ];
  for (const [x, y] of lava) map[y][x] = WORLD_TILE.LAVA;
  map[5][8] = map[6][8] = WORLD_TILE.SAND;
  return map;
}

function buildCave() {
  const map = blankMap(WORLD_TILE.ROCK);
  for (let x = 2; x < 18; x++) {
    map[7][x] = WORLD_TILE.PATH;
    map[8][x] = WORLD_TILE.PATH;
  }
  for (let y = 3; y < 12; y++) map[y][10] = WORLD_TILE.PATH;
  map[7][19] = map[8][19] = map[10][19] = WORLD_TILE.PATH;
  map[4][5] = map[5][5] = map[6][4] = WORLD_TILE.DARK_GRASS;
  map[13][14] = map[14][13] = WORLD_TILE.WATER;
  return map;
}

function buildMarsh() {
  const map = blankMap(WORLD_TILE.DARK_GRASS);
  for (let x = 3; x < 17; x++) {
    map[1][x] = WORLD_TILE.PATH;
    map[2][x] = WORLD_TILE.PATH;
  }
  for (let y = 4; y < 13; y++) map[y][10] = WORLD_TILE.PATH;
  map[0][10] = map[1][10] = WORLD_TILE.PATH;
  map[10][0] = WORLD_TILE.PATH;
  const ponds = [
    [5, 6], [6, 6], [14, 8], [15, 8], [8, 11], [9, 11],
  ];
  for (const [x, y] of ponds) map[y][x] = WORLD_TILE.WATER;
  map[11][5] = map[12][5] = WORLD_TILE.FLOWER;
  return map;
}

function buildRuins() {
  const map = blankMap(WORLD_TILE.SAND);
  for (let x = 4; x < 16; x++) {
    map[13][x] = WORLD_TILE.PATH;
    map[14][x] = WORLD_TILE.PATH;
  }
  for (let y = 4; y < 14; y++) map[y][10] = WORLD_TILE.PATH;
  map[13][10] = map[14][10] = WORLD_TILE.PATH;
  const pillars = [
    [4, 4], [15, 4], [4, 10], [15, 10], [7, 7], [12, 7],
  ];
  for (const [x, y] of pillars) map[y][x] = WORLD_TILE.ROCK;
  map[8][6] = map[9][6] = map[10][6] = WORLD_TILE.FLOWER;
  return map;
}

const WORLD_AREAS = {
  meadow: {
    id: "meadow",
    name: "Capy Meadows",
    build: buildMeadow,
    encounterRate: 0.18,
    transitions: [
      { x: 0, y: 7, to: "desert", spawnX: 18, spawnY: 7 },
      { x: 0, y: 8, to: "desert", spawnX: 18, spawnY: 8 },
      { x: 19, y: 7, to: "beach", spawnX: 7, spawnY: 7 },
      { x: 19, y: 8, to: "beach", spawnX: 7, spawnY: 8 },
      { x: 10, y: 0, to: "forest", spawnX: 10, spawnY: 13 },
      { x: 10, y: 14, to: "volcano", spawnX: 10, spawnY: 2 },
      { x: 19, y: 10, to: "marsh", spawnX: 1, spawnY: 10 },
    ],
    items: [
      { id: "meadow-ball-1", x: 6, y: 4, type: "balls", amount: 3 },
      { id: "meadow-coin-1", x: 14, y: 9, type: "coins", amount: 25 },
    ],
    npcs: [
      { x: 11, y: 7, type: "shop", name: "Capy Mart" },
      { x: 9, y: 7, type: "heal", name: "Capy Care Center" },
      {
        id: "meadow-trainer-1",
        x: 6,
        y: 8,
        type: "trainer",
        name: "Scout Pip",
        team: [{ speciesId: "normal", level: 6 }],
        reward: { coins: 35 },
      },
      {
        id: "meadow-gym",
        x: 14,
        y: 7,
        type: "trainer",
        name: "Leader Flora",
        team: [
          { speciesId: "grass", level: 9 },
          { speciesId: "normal", level: 8 },
        ],
        reward: { coins: 80 },
        badge: "meadow",
      },
    ],
  },
  desert: {
    id: "desert",
    name: "Sunscorch Dunes",
    build: buildDesert,
    encounterRate: 0.22,
    encounterTypes: ["fire", "normal"],
    transitions: [
      { x: 19, y: 7, to: "meadow", spawnX: 1, spawnY: 7 },
      { x: 19, y: 8, to: "meadow", spawnX: 1, spawnY: 8 },
      { x: 10, y: 0, to: "ruins", spawnX: 10, spawnY: 13 },
    ],
    items: [
      { id: "desert-ball-1", x: 9, y: 4, type: "balls", amount: 5 },
      { id: "desert-coin-1", x: 15, y: 10, type: "coins", amount: 40 },
      { id: "desert-ball-2", x: 4, y: 12, type: "balls", amount: 3 },
    ],
    npcs: [
      {
        id: "desert-trainer-1",
        x: 12,
        y: 6,
        type: "trainer",
        name: "Ranger Sol",
        team: [{ speciesId: "fire", level: 10 }],
        reward: { coins: 50 },
      },
      {
        id: "desert-gym",
        x: 5,
        y: 9,
        type: "trainer",
        name: "Blaze King",
        team: [
          { speciesId: "fire", level: 12 },
          { speciesId: "normal", level: 11 },
        ],
        reward: { coins: 100 },
        badge: "desert",
      },
    ],
  },
  beach: {
    id: "beach",
    name: "Bubble Bay",
    build: buildBeach,
    encounterRate: 0.2,
    encounterTypes: ["water", "electric", "normal"],
    transitions: [
      { x: 0, y: 7, to: "meadow", spawnX: 18, spawnY: 7 },
      { x: 0, y: 8, to: "meadow", spawnX: 18, spawnY: 8 },
      { x: 10, y: 14, to: "marsh", spawnX: 10, spawnY: 2 },
    ],
    items: [
      { id: "beach-ball-1", x: 12, y: 5, type: "balls", amount: 4 },
      { id: "beach-coin-1", x: 8, y: 11, type: "coins", amount: 35 },
    ],
    npcs: [
      { x: 14, y: 8, type: "shop", name: "Beach Ball Hut" },
      { x: 12, y: 8, type: "heal", name: "Bay Healing Hut" },
      {
        id: "beach-trainer-1",
        x: 10,
        y: 6,
        type: "trainer",
        name: "Surfer Kai",
        team: [{ speciesId: "water", level: 10 }, { speciesId: "electric", level: 9 }],
        reward: { coins: 55 },
      },
      {
        id: "beach-gym",
        x: 16,
        y: 9,
        type: "trainer",
        name: "Captain Tide",
        team: [
          { speciesId: "water", level: 13 },
          { speciesId: "electric", level: 12 },
        ],
        reward: { coins: 95 },
        badge: "beach",
      },
    ],
  },
  forest: {
    id: "forest",
    name: "Mosswood Glade",
    build: buildForest,
    encounterRate: 0.25,
    encounterTypes: ["grass", "psychic", "normal"],
    transitions: [
      { x: 10, y: 14, to: "meadow", spawnX: 10, spawnY: 1 },
      { x: 0, y: 10, to: "cave", spawnX: 18, spawnY: 10 },
    ],
    items: [
      { id: "forest-ball-1", x: 8, y: 8, type: "balls", amount: 3 },
      { id: "forest-coin-1", x: 13, y: 7, type: "coins", amount: 30 },
      { id: "forest-ball-2", x: 5, y: 10, type: "balls", amount: 5 },
    ],
    npcs: [
      {
        id: "forest-trainer-1",
        x: 8,
        y: 9,
        type: "trainer",
        name: "Ranger Moss",
        team: [{ speciesId: "grass", level: 11 }],
        reward: { coins: 45 },
      },
      {
        id: "forest-gym",
        x: 12,
        y: 6,
        type: "trainer",
        name: "Druid Fern",
        team: [
          { speciesId: "grass", level: 13 },
          { speciesId: "psychic", level: 12 },
        ],
        reward: { coins: 90 },
        badge: "forest",
      },
    ],
  },
  volcano: {
    id: "volcano",
    name: "Ember Crater",
    build: buildVolcano,
    encounterRate: 0.24,
    encounterTypes: ["fire", "psychic", "electric"],
    transitions: [
      { x: 10, y: 0, to: "meadow", spawnX: 10, spawnY: 13 },
    ],
    items: [
      { id: "volcano-ball-1", x: 12, y: 9, type: "balls", amount: 5 },
      { id: "volcano-coin-1", x: 6, y: 5, type: "coins", amount: 50 },
    ],
    npcs: [
      {
        id: "volcano-trainer-1",
        x: 6,
        y: 10,
        type: "trainer",
        name: "Ash Walker",
        team: [{ speciesId: "fire", level: 12 }],
        reward: { coins: 60 },
      },
      {
        id: "volcano-gym",
        x: 14,
        y: 4,
        type: "trainer",
        name: "Magma Boss",
        team: [
          { speciesId: "fire", level: 15 },
          { speciesId: "electric", level: 14 },
        ],
        reward: { coins: 120 },
        badge: "volcano",
      },
    ],
  },
  cave: {
    id: "cave",
    name: "Crystal Caverns",
    build: buildCave,
    encounterRate: 0.2,
    encounterTypes: ["psychic", "water", "normal"],
    transitions: [
      { x: 19, y: 7, to: "forest", spawnX: 1, spawnY: 10 },
      { x: 19, y: 8, to: "forest", spawnX: 1, spawnY: 10 },
    ],
    items: [
      { id: "cave-ball-1", x: 11, y: 5, type: "balls", amount: 4 },
      { id: "cave-coin-1", x: 7, y: 11, type: "coins", amount: 45 },
    ],
    npcs: [
      {
        id: "cave-trainer-1",
        x: 15,
        y: 8,
        type: "trainer",
        name: "Miner Gem",
        team: [{ speciesId: "psychic", level: 13 }],
        reward: { coins: 65 },
      },
      {
        id: "cave-gym",
        x: 5,
        y: 7,
        type: "trainer",
        name: "Crystal Sage",
        team: [
          { speciesId: "psychic", level: 15 },
          { speciesId: "water", level: 14 },
        ],
        reward: { coins: 110 },
        badge: "cave",
      },
    ],
  },
  marsh: {
    id: "marsh",
    name: "Misty Marsh",
    build: buildMarsh,
    encounterRate: 0.23,
    encounterTypes: ["water", "grass", "normal"],
    transitions: [
      { x: 10, y: 0, to: "beach", spawnX: 10, spawnY: 13 },
      { x: 0, y: 10, to: "meadow", spawnX: 18, spawnY: 10 },
    ],
    items: [
      { id: "marsh-ball-1", x: 9, y: 8, type: "balls", amount: 5 },
      { id: "marsh-coin-1", x: 14, y: 6, type: "coins", amount: 40 },
    ],
    npcs: [
      {
        id: "marsh-trainer-1",
        x: 7,
        y: 9,
        type: "trainer",
        name: "Swamp Guide",
        team: [{ speciesId: "grass", level: 12 }, { speciesId: "water", level: 11 }],
        reward: { coins: 55 },
      },
      {
        id: "marsh-gym",
        x: 13,
        y: 9,
        type: "trainer",
        name: "Mist Witch",
        team: [
          { speciesId: "water", level: 14 },
          { speciesId: "grass", level: 14 },
        ],
        reward: { coins: 100 },
        badge: "marsh",
      },
    ],
  },
  ruins: {
    id: "ruins",
    name: "Ancient Ruins",
    build: buildRuins,
    encounterRate: 0.21,
    encounterTypes: ["psychic", "normal", "fire"],
    transitions: [
      { x: 10, y: 14, to: "desert", spawnX: 10, spawnY: 1 },
    ],
    items: [
      { id: "ruins-ball-1", x: 10, y: 8, type: "balls", amount: 5 },
      { id: "ruins-coin-1", x: 6, y: 5, type: "coins", amount: 55 },
    ],
    npcs: [
      {
        id: "ruins-trainer-1",
        x: 9,
        y: 10,
        type: "trainer",
        name: "Historian Relic",
        team: [{ speciesId: "psychic", level: 14 }],
        reward: { coins: 70 },
      },
      {
        id: "ruins-gym",
        x: 11,
        y: 5,
        type: "trainer",
        name: "Temple Keeper",
        team: [
          { speciesId: "psychic", level: 16 },
          { speciesId: "fire", level: 15 },
        ],
        reward: { coins: 130 },
        badge: "ruins",
      },
    ],
  },
};

function getArea(id) {
  return WORLD_AREAS[id] || WORLD_AREAS.meadow;
}

function findTransition(areaId, x, y) {
  const area = getArea(areaId);
  return area.transitions.find((t) => t.x === x && t.y === y);
}

const SHOP_ITEMS = [
  { id: "balls5", label: "5 Capy Balls", cost: 30, balls: 5 },
  { id: "balls10", label: "10 Capy Balls", cost: 55, balls: 10 },
  { id: "balls3cheap", label: "3 Capy Balls (sale)", cost: 15, balls: 3 },
];
