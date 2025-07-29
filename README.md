# 🕹️ Kyu Roguelike

A web-based roguelike action game built with Phaser.js where your auto-attack evolves as you level up!

## ✨ Features

### Core Gameplay
- **Auto-Attack System**: Continuous projectile firing without manual input
- **Progressive Evolution**: Attacks become stronger and more complex as you level up
- **Combo System**: Every 3rd hit triggers powerful combo attacks
- **Mouse/Touch Movement**: Smooth player movement following cursor

### Upgrade System
- **Level-Up Choices**: Choose from 3 random upgrades when you level up
- **Build Diversity**: Attack speed, damage, projectile count, piercing, homing, and more
- **Rarity System**: Common, Rare, Epic, and Legendary upgrades
- **Synergistic Builds**: Combine upgrades for powerful combinations

### Enemy System
- **Wave-Based Spawning**: Enemies spawn in waves with increasing difficulty
- **Enemy Types**: Basic, Fast, Tank, and Boss enemies with unique properties
- **Boss Battles**: Special boss encounters every 10 waves
- **Health Bars**: Visual health indicators for all enemies

### Visual Effects
- **Death Effects**: Explosion particles when enemies die
- **Boss Announcements**: Dramatic boss spawn notifications
- **Upgrade UI**: Beautiful card-based upgrade selection interface

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kyu-roguelike
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎮 How to Play

### Controls
- **Mouse/Touch**: Move your character by clicking or dragging
- **Auto-Attack**: Your character automatically fires projectiles
- **Level Up**: Gain XP by defeating enemies to unlock upgrades

### Gameplay Tips
1. **Movement**: Stay mobile to avoid enemy swarms
2. **Upgrade Strategy**: Focus on synergizing upgrades (e.g., attack speed + projectile count)
3. **Boss Battles**: Bosses appear every 10 waves - be prepared!
4. **Combo System**: Every 3rd shot triggers a powerful combo attack

### Upgrade Types

#### Attack Speed
- **Rapid Fire**: +20% attack speed
- **Lightning Strike**: +40% attack speed

#### Damage
- **Power Shot**: +5 damage
- **Mega Blast**: +15 damage

#### Projectile Count
- **Double Shot**: Fire 2 projectiles
- **Triple Shot**: Fire 3 projectiles

#### Special Abilities
- **Piercing Shot**: Projectiles pass through enemies
- **Homing Missiles**: Projectiles seek nearest enemy

#### Legendary Upgrades
- **Combo Master**: Enhanced combo attacks
- **Rapid Burst**: 8-direction burst attack

## 🛠️ Technical Details

### Tech Stack
- **Phaser.js 3.70**: Game engine
- **TypeScript**: Type safety and better development experience
- **Vite**: Fast development and building
- **HTML5 Canvas**: Rendering

### Project Structure
```
src/
├── main.ts              # Game entry point
├── scenes/
│   ├── GameScene.ts     # Main game scene
│   └── UIScene.ts      # Level-up UI scene
├── entities/
│   ├── Player.ts        # Player character
│   ├── Enemy.ts         # Enemy types
│   └── Projectile.ts    # Projectile system
└── systems/
    ├── UpgradeManager.ts # Upgrade system
    └── EnemySpawner.ts  # Enemy spawning
```

### Key Systems

#### Auto-Attack System
- Continuous projectile firing at fixed intervals
- Configurable attack speed, damage, and projectile count
- Combo system for every 3rd attack

#### Upgrade System
- Random upgrade selection on level-up
- Rarity-based upgrade categories
- Synergistic upgrade combinations

#### Enemy Spawning
- Wave-based spawning with difficulty scaling
- Multiple enemy types with unique behaviors
- Boss encounters every 10 waves

## 🎯 Future Features

### Planned Enhancements
- [ ] **Item System**: Equippable items with passive effects
- [ ] **Skill Trees**: Branching upgrade paths
- [ ] **Save System**: Progress persistence
- [ ] **Sound Effects**: Audio feedback
- [ ] **Particle Effects**: Enhanced visual effects
- [ ] **Multiple Characters**: Different playable characters
- [ ] **Achievements**: Unlockable achievements
- [ ] **Leaderboards**: High score tracking

### Technical Improvements
- [ ] **Performance Optimization**: Better frame rates
- [ ] **Mobile Support**: Touch controls optimization
- [ ] **Accessibility**: Screen reader support
- [ ] **Localization**: Multiple language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vampire Survivors**: Inspiration for auto-attack mechanics
- **HoloCure**: Inspiration for upgrade system
- **League of Legends (Kai'Sa)**: Inspiration for projectile behavior
- **Phaser.js Community**: Excellent game engine and documentation

---

**Enjoy the game!** 🎮✨
