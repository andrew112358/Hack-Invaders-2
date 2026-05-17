const CAPY_SPECIES = [
  {
    id: "normal",
    name: "Capybuddy",
    type: "normal",
    spriteCol: 0,
    spriteRow: 0,
    baseHp: 45,
    baseAtk: 49,
    baseDef: 45,
    catchRate: 45,
    rarity: 0.25,
    moves: [
      { name: "Tackle", power: 40, type: "normal" },
      { name: "Growl", power: 0, type: "normal", status: "atkDown" },
      { name: "Quick Attack", power: 35, type: "normal", priority: true },
      { name: "Body Slam", power: 55, type: "normal" },
    ],
  },
  {
    id: "grass",
    name: "Mossbara",
    type: "grass",
    spriteCol: 1,
    spriteRow: 0,
    baseHp: 50,
    baseAtk: 52,
    baseDef: 48,
    catchRate: 40,
    rarity: 0.18,
    moves: [
      { name: "Vine Whip", power: 45, type: "grass" },
      { name: "Leafage", power: 40, type: "grass" },
      { name: "Absorb", power: 35, type: "grass", heal: true },
      { name: "Petal Dance", power: 70, type: "grass" },
    ],
  },
  {
    id: "fire",
    name: "Emberbara",
    type: "fire",
    spriteCol: 2,
    spriteRow: 0,
    baseHp: 42,
    baseAtk: 58,
    baseDef: 40,
    catchRate: 38,
    rarity: 0.15,
    moves: [
      { name: "Ember", power: 40, type: "fire" },
      { name: "Flame Burst", power: 50, type: "fire" },
      { name: "Smokescreen", power: 0, type: "fire", status: "accDown" },
      { name: "Fire Fang", power: 55, type: "fire" },
    ],
  },
  {
    id: "electric",
    name: "Voltbara",
    type: "electric",
    spriteCol: 0,
    spriteRow: 1,
    baseHp: 40,
    baseAtk: 55,
    baseDef: 42,
    catchRate: 35,
    rarity: 0.14,
    moves: [
      { name: "Thunder Shock", power: 40, type: "electric" },
      { name: "Spark", power: 45, type: "electric" },
      { name: "Charge", power: 0, type: "electric", status: "atkUp" },
      { name: "Wild Charge", power: 60, type: "electric" },
    ],
  },
  {
    id: "water",
    name: "Aquabara",
    type: "water",
    spriteCol: 1,
    spriteRow: 1,
    baseHp: 52,
    baseAtk: 48,
    baseDef: 50,
    catchRate: 40,
    rarity: 0.16,
    moves: [
      { name: "Water Gun", power: 40, type: "water" },
      { name: "Bubble Beam", power: 45, type: "water" },
      { name: "Aqua Jet", power: 35, type: "water", priority: true },
      { name: "Hydro Pump", power: 70, type: "water" },
    ],
  },
  {
    id: "psychic",
    name: "Zenbara",
    type: "psychic",
    spriteCol: 2,
    spriteRow: 1,
    baseHp: 48,
    baseAtk: 50,
    baseDef: 55,
    catchRate: 25,
    rarity: 0.12,
    moves: [
      { name: "Confusion", power: 40, type: "psychic" },
      { name: "Psybeam", power: 50, type: "psychic" },
      { name: "Meditate", power: 0, type: "psychic", status: "atkUp" },
      { name: "Psychic", power: 65, type: "psychic" },
    ],
  },
];

const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0 },
  grass: { water: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, rock: 2, ground: 0.5, dragon: 0.5 },
  fire: { grass: 2, fire: 0.5, water: 0.5, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
};

function getEffectiveness(moveType, defenderType) {
  const chart = TYPE_CHART[moveType];
  if (!chart) return 1;
  return chart[defenderType] ?? 1;
}

const MAX_LEVEL = 50;

function calcStat(base, level) {
  return Math.floor(base * (0.4 + level * 0.06));
}

function expNeededForLevel(level) {
  return Math.floor(45 + level * level * 14);
}

function getSpecies(speciesId) {
  return CAPY_SPECIES.find((s) => s.id === speciesId) || CAPY_SPECIES[0];
}

function refreshMonStats(mon, preserveHpRatio) {
  const species = getSpecies(mon.speciesId);
  const oldMax = mon.maxHp || 1;
  const ratio = mon.hp / oldMax;
  mon.maxHp = calcStat(species.baseHp, mon.level) + 10;
  mon.atk = calcStat(species.baseAtk, mon.level);
  mon.def = calcStat(species.baseDef, mon.level);
  mon.name = species.name;
  mon.type = species.type;
  mon.moves = species.moves;
  mon.spriteCol = species.spriteCol;
  mon.spriteRow = species.spriteRow;
  if (preserveHpRatio) {
    mon.hp = Math.max(1, Math.min(mon.maxHp, Math.ceil(ratio * mon.maxHp)));
  }
}

function grantExp(mon, amount) {
  const messages = [];
  if (mon.level >= MAX_LEVEL) return messages;
  mon.exp = (mon.exp || 0) + amount;
  while (mon.level < MAX_LEVEL && mon.exp >= expNeededForLevel(mon.level)) {
    mon.exp -= expNeededForLevel(mon.level);
    mon.level++;
    refreshMonStats(mon, false);
    mon.hp = mon.maxHp;
    messages.push(`${mon.name} grew to Lv.${mon.level}!`);
  }
  return messages;
}

function grantExpToParty(party, amount) {
  const messages = [];
  for (const mon of party) {
    messages.push(...grantExp(mon, amount));
  }
  return messages;
}

const BADGES = {
  meadow: { id: "meadow", name: "Meadow Badge", color: "#22c55e", icon: "🌿" },
  desert: { id: "desert", name: "Dune Badge", color: "#f59e0b", icon: "☀️" },
  beach: { id: "beach", name: "Tide Badge", color: "#3b82f6", icon: "🌊" },
  forest: { id: "forest", name: "Moss Badge", color: "#15803d", icon: "🍃" },
  volcano: { id: "volcano", name: "Ember Badge", color: "#ef4444", icon: "🔥" },
  cave: { id: "cave", name: "Crystal Badge", color: "#a855f7", icon: "💎" },
  ruins: { id: "ruins", name: "Ruin Badge", color: "#78716c", icon: "🏛️" },
  marsh: { id: "marsh", name: "Mist Badge", color: "#06b6d4", icon: "🌫️" },
};

function createWildCapybara(levelOverride, typeBias) {
  let pool = CAPY_SPECIES;
  if (typeBias && typeBias.length > 0) {
    const biased = CAPY_SPECIES.filter((s) => typeBias.includes(s.type) || typeBias.includes(s.id));
    if (biased.length > 0) pool = biased;
  }
  const totalRarity = pool.reduce((sum, s) => sum + s.rarity, 0);
  const roll = Math.random() * totalRarity;
  let cumulative = 0;
  let species = pool[0];
  for (const s of pool) {
    cumulative += s.rarity;
    if (roll <= cumulative) {
      species = s;
      break;
    }
  }
  const level = levelOverride ?? 3 + Math.floor(Math.random() * 6);
  const mon = {
    speciesId: species.id,
    name: species.name,
    type: species.type,
    level,
    exp: 0,
    hp: 0,
    maxHp: 0,
    atk: 0,
    def: 0,
    moves: species.moves,
    spriteCol: species.spriteCol,
    spriteRow: species.spriteRow,
    catchRate: species.catchRate,
  };
  refreshMonStats(mon, false);
  mon.hp = mon.maxHp;
  return mon;
}

function createTrainerMon(speciesId, level) {
  return createWildCapybara(level, [speciesId]);
}

const BERRIES = [
  {
    id: "razz",
    name: "Razz Berry",
    desc: "Makes capybaras easier to catch.",
    catchBonus: 0.12,
    color: "#e11d48",
    emoji: "🍓",
  },
  {
    id: "nanab",
    name: "Nanab Berry",
    desc: "Calms wild capybaras for better catches.",
    catchBonus: 0.15,
    color: "#f59e0b",
    emoji: "🍌",
  },
  {
    id: "pinap",
    name: "Pinap Berry",
    desc: "Strong catch boost when thrown.",
    catchBonus: 0.22,
    color: "#ea580c",
    emoji: "🍍",
  },
  {
    id: "oran",
    name: "Oran Berry",
    desc: "A reliable catch helper.",
    catchBonus: 0.1,
    color: "#2563eb",
    emoji: "🔵",
  },
  {
    id: "pecha",
    name: "Pecha Berry",
    desc: "Sweet berry — great for catching.",
    catchBonus: 0.18,
    color: "#ec4899",
    emoji: "🌸",
  },
  {
    id: "sitrus",
    name: "Sitrus Berry",
    desc: "Powerful catch aid.",
    catchBonus: 0.28,
    color: "#ca8a04",
    emoji: "🍊",
  },
  {
    id: "lum",
    name: "Lum Berry",
    desc: "Extra effective on weakened foes.",
    catchBonus: 0.1,
    lowHpBonus: 0.25,
    lowHpThreshold: 0.5,
    color: "#84cc16",
    emoji: "💚",
  },
  {
    id: "leppa",
    name: "Leppa Berry",
    desc: "Best when the foe is nearly fainted.",
    catchBonus: 0.08,
    lowHpBonus: 0.32,
    lowHpThreshold: 0.35,
    color: "#a855f7",
    emoji: "🫐",
  },
];

function defaultBerryStock() {
  const stock = {};
  for (const b of BERRIES) stock[b.id] = 4;
  return stock;
}

function getBerryCatchBonus(berryId, wildHp, wildMaxHp) {
  const berry = BERRIES.find((b) => b.id === berryId);
  if (!berry) return 0;
  let bonus = berry.catchBonus;
  if (berry.lowHpBonus && wildMaxHp > 0) {
    const hpRatio = wildHp / wildMaxHp;
    if (hpRatio <= berry.lowHpThreshold) bonus += berry.lowHpBonus;
  }
  return bonus;
}

function createOwnedCapybara(speciesId, level = 5) {
  const mon = {
    speciesId,
    level,
    exp: 0,
    hp: 0,
    maxHp: 0,
    atk: 0,
    def: 0,
    catchRate: getSpecies(speciesId).catchRate,
  };
  refreshMonStats(mon, false);
  mon.hp = mon.maxHp;
  return mon;
}

function getExpProgress(mon) {
  if (mon.level >= MAX_LEVEL) return { current: 0, needed: 1, maxed: true };
  return {
    current: mon.exp || 0,
    needed: expNeededForLevel(mon.level),
    maxed: false,
  };
}
