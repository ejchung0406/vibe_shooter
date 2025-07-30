# Volvox Arena

A fast-paced web-based roguelike action game built with Phaser.js and TypeScript. Fight waves of enemies, level up, and evolve your attacks with powerful upgrades!

## 🎮 Game Features

### Core Mechanics
- **WASD Movement** - Smooth character control with diagonal normalization.
- **Right-Click Combat** - Manual shooting system with attack pause mechanics.
- **Progressive Leveling** - Gain XP from defeating enemies and choose powerful upgrades.
- **Item System** - Collect items that provide passive stat boosts and unique effects.
- **Enemy Variety** - Face different enemy types with unique behaviors:
  - **Basic Enemies** - Standard melee attackers.
  - **Tank Enemies** - High HP, slow-moving bruisers.
  - **Ranged Enemies** - Long-range projectile attackers.
  - **Boss Enemies** - Powerful enemies that spawn at the end of waves and drop rare items.

### Skills & Abilities
- **Q Skill (Level 2+)** - Kai'Sa-inspired homing projectiles that curve toward enemies.
- **E Skill (Level 3+)** - Temporary shield that blocks all damage for 2 seconds.
- **Dash Skill (Level 5+)** - A quick dash in the direction of the mouse cursor.
- **R Skill (Level 9+)** - A powerful burst of explosive projectiles.
- **F Skill (Level 7+)** - Summons a pet that fights alongside you for a limited time.
- **Cooldown System** - Visual indicators show skill availability.

### Upgrade System
- **Attack Modifications**:
  - Double/Triple/Quadruple Shot - Fire multiple projectiles.
  - Piercing Shot - Projectiles pass through enemies.
  - Combo Master - Every 3rd shot becomes an explosive projectile.
- **Stat Improvements** - Increase damage, attack speed, movement speed, armor, and more.
- **Skill Upgrades** - Enhance the effects of your Q, E, R, and F skills.
- **Stackable Effects** - Combine multiple upgrades for powerful synergies.

### Dynamic Gameplay
- **Scaling Difficulty** - Enemy HP and spawn rates increase with player level.
- **Wave System** - Survive waves of enemies to progress and spawn a boss.
- **Physics-Based Combat** - Knockback effects for both player and enemies.
- **Visual Feedback** - Damage numbers, health bars, and impact effects.
- **Character Stats Panel** - View your character's stats in real-time.

## 🎯 Controls

| Action | Control |
|--------|---------|
| Move | WASD Keys |
| Attack | Right Mouse Button |
| Q Skill | Q Key |
| E Skill | E Key |
| Dash | Shift Key |
| R Skill | R Key |
| F Skill | F Key |
| Select Upgrade | Left Mouse Button |
| Unequip Item | Right-click on item |

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd kyu
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The game will automatically reload when you make changes

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🛠️ Technical Stack

- **Game Engine**: Phaser.js v3.80
- **Language**: TypeScript
- **Build Tool**: Vite
- **Physics**: Phaser Arcade Physics
- **Deployment**: Vercel/Static hosting

## 🎨 Game Architecture

### Scene Structure
- **StartScene** - The initial screen where the game begins.
- **GameScene** - Main gameplay, entity management, UI.
- **UIScene** - Level-up upgrade selection interface.

### Entity System
- **Player** - Character with health, skills, items, and upgrade effects.
- **BaseEnemy** - Abstract enemy class with shared behaviors.
- **TankEnemy/RangedEnemy/BossEnemy** - Specialized enemy types.
- **Projectile System** - Various projectile types (basic, explosive, homing).
- **Pet** - A temporary ally that assists the player in combat.
- **Item** - Collectible objects that provide passive bonuses.

### Systems
- **UpgradeManager** - Handles upgrade selection and effects.
- **EnemySpawner** - Manages wave-based enemy spawning.
- **ItemManager** - Manages the pool of available items.
- **SkillManager** - Manages skill data and descriptions.
- **Physics** - Collision detection and knockback effects.

## 🎯 Gameplay Tips

1. **Positioning is Key** - Use the camera follow system to stay aware of threats.
2. **Upgrade Synergy** - Combine upgrades for maximum firepower and survivability.
3. **Skill Management** - Use your skills strategically to control the battlefield.
4. **Enemy Prioritization** - Take out ranged enemies first, and be prepared for bosses.
5. **Itemization** - Collect items that complement your build and playstyle.

## 🐛 Known Issues

- No known issues at this time.

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Enjoy the game!** 🎮
 