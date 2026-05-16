# CapyCatch

A Pokémon-style browser game — explore multiple regions, battle wild capybaras, and catch all six elemental types!

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
| Space / Enter | Talk to shop / pick up items |
| C | Open collection |
| Esc | Leave shop |

## World map

From **Capy Meadows** (start):

| Direction | Area | Notes |
|-----------|------|--------|
| **Left** | Sunscorch Dunes | Desert — more fire types |
| **Right** | Bubble Bay | Beach — water & electric types |
| **Up** | Mosswood Glade | Forest — grass & psychic types |
| **Down** | Ember Crater | Volcano — fire & rare spawns |

Follow the paths to the map edges (arrows mark exits).

## Capy Balls & coins

- **Ground pickups** — Walk over red/white balls (+3–5 balls) or gold coins.
- **Shops** — Press Space next to a shop NPC in the Meadows or Bubble Bay.
  - 3 balls — 15 coins
  - 5 balls — 30 coins
  - 10 balls — 55 coins
- You start with **50 coins** and **10 Capy Balls**.

## Gameplay

- Walk through grass for random encounters (rates vary by region).
- In battle: Fight, Catch, Bag, or Run.
- Catch all six: Capybuddy, Mossbara, Emberbara, Voltbara, Aquabara, Zenbara.
