# CapyCatch

A Pokémon-style browser game — explore multiple regions, battle wild capybaras and trainers, earn badges, and level up your team!

## Play

```bash
cd Hack-Invaders-2
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow keys | Walk |
| Space / Enter | Talk, battle trainers, heal, pick up items |
| C or P | Party — switch lead capybara, view HP/EXP |
| B | Badge case |
| Esc | Close menus |

## World map (8 regions)

| From | Direction | Area |
|------|-----------|------|
| Meadow | Left | Sunscorch Dunes |
| Meadow | Right | Bubble Bay → Misty Marsh |
| Meadow | Up | Mosswood Glade → Crystal Caverns |
| Meadow | Down | Ember Crater |
| Desert | Up | Ancient Ruins |

Follow paths to map edges (arrow hints).

## Trainers & badges

- **Red trainers** with **!** want to battle — press **Space** when adjacent.
- **GYM** trainers (also marked) award a **badge** plus extra coins when defeated.
- **Catch is disabled** in trainer battles; use Fight, Switch, Bag, or Run.
- Press **B** to view your badge collection (8 gym badges total).
- Defeated trainers show a green **✓** and won't rematch.

## Leveling

- All party members gain **EXP** after winning battles (wild or trainer).
- Trainer battles give bonus EXP and coins.
- Leveling up **fully restores** that capybara's HP and boosts stats.
- Max level: **50**. View EXP progress in the party screen (C).

## Party & healing

- **Party (C or P)** — Click a capybara to set your lead.
- **Switch in battle** — Uses your turn; the foe attacks after.
- **Healing centers** — Pink **HEAL** signs; free full party restore.

## Shops & items

- Ground pickups: Capy Balls and coins.
- Shops sell ball bundles for coins.
- Berries in battle (Bag) boost catch rate on wild capybaras.

## Gameplay

- Walk through grass for wild encounters.
- Catch all six species: Capybuddy, Mossbara, Emberbara, Voltbara, Aquabara, Zenbara.
