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

function calcStat(base, level) {
  return Math.floor(base * (0.4 + level * 0.06));
}

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
  const maxHp = calcStat(species.baseHp, level) + 10;
  return {
    speciesId: species.id,
    name: species.name,
    type: species.type,
    level,
    hp: maxHp,
    maxHp,
    atk: calcStat(species.baseAtk, level),
    def: calcStat(species.baseDef, level),
    moves: species.moves,
    spriteCol: species.spriteCol,
    spriteRow: species.spriteRow,
    catchRate: species.catchRate,
  };
}

function createOwnedCapybara(speciesId, level = 5) {
  const species = CAPY_SPECIES.find((s) => s.id === speciesId) || CAPY_SPECIES[0];
  const maxHp = calcStat(species.baseHp, level) + 10;
  return {
    speciesId: species.id,
    name: species.name,
    type: species.type,
    level,
    hp: maxHp,
    maxHp,
    atk: calcStat(species.baseAtk, level),
    def: calcStat(species.baseDef, level),
    moves: species.moves,
    spriteCol: species.spriteCol,
    spriteRow: species.spriteRow,
    catchRate: species.catchRate,
  };
}
