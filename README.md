# Kyu Roguelike

A fast-paced web-based roguelike action game built with Phaser.js and TypeScript. Fight waves of enemies, level up, and evolve your attacks with powerful upgrades!

## 🎮 Game Features

### Core Mechanics
- **WASD Movement** - Smooth character control with diagonal normalization
- **Right-Click Combat** - Manual shooting system with attack pause mechanics
- **Progressive Leveling** - Gain XP from defeating enemies and choose powerful upgrades
- **Enemy Variety** - Face different enemy types with unique behaviors:
  - **Basic Enemies** - Standard melee attackers
  - **Tank Enemies** - High HP, slow-moving bruisers
  - **Ranged Enemies** - Long-range projectile attackers

### Skills & Abilities
- **Q Skill (Level 2+)** - Kai'Sa-inspired homing projectiles that curve toward enemies
- **E Skill (Level 2+)** - Temporary shield that blocks all damage for 2 seconds
- **Cooldown System** - Visual indicators show skill availability

### Upgrade System
- **Attack Modifications**:
  - Double/Triple Shot - Fire multiple projectiles
  - Spread Attack - Wide-angle projectile spread
  - Burst Attack - Rapid-fire projectiles in sequence
  - Combo Master - Every 3rd shot becomes an explosive projectile
- **Stat Improvements** - Increase damage, speed, and other attributes
- **Stackable Effects** - Combine multiple upgrades for powerful synergies

### Dynamic Gameplay
- **Scaling Difficulty** - Enemy HP and spawn rates increase with player level
- **Boss Encounters** - Special high-HP enemies appear periodically
- **Physics-Based Combat** - Knockback effects for both player and enemies
- **Visual Feedback** - Damage numbers, health bars, and impact effects

## 🎯 Controls

| Action | Control |
|--------|---------|
| Move | WASD Keys |
| Attack | Right Mouse Button |
| Q Skill | Q Key |
| E Skill | E Key |
| Select Upgrade | Left Mouse Button |

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd kyu-roguelike
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

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up with GitHub
3. Click "New Project" and import your repository
4. Vercel will automatically detect it's a Vite project and deploy it
5. Your game will be live at `https://your-project-name.vercel.app`

### Other Platforms

The game is a static site and can be deployed to:
- GitHub Pages
- Netlify
- Any static hosting service

Simply upload the contents of the `dist/` folder after running `npm run build`.

## 🛠️ Technical Stack

- **Game Engine**: Phaser.js v3.70
- **Language**: TypeScript
- **Build Tool**: Vite
- **Physics**: Phaser Arcade Physics
- **Deployment**: Vercel/Static hosting

## 🎨 Game Architecture

### Scene Structure
- **GameScene** - Main gameplay, entity management, UI
- **UIScene** - Level-up upgrade selection interface

### Entity System
- **Player** - Character with health, skills, and upgrade effects
- **BaseEnemy** - Abstract enemy class with shared behaviors
- **TankEnemy/RangedEnemy** - Specialized enemy types
- **Projectile System** - Various projectile types (basic, explosive, homing)

### Systems
- **UpgradeManager** - Handles upgrade selection and effects
- **EnemySpawner** - Manages wave-based enemy spawning
- **Physics** - Collision detection and knockback effects

## 🎯 Gameplay Tips

1. **Positioning is Key** - Use the camera follow system to stay aware of threats
2. **Upgrade Synergy** - Combine Spread Attack + Burst Attack for maximum firepower
3. **Skill Management** - Use Q skill for crowd control, E skill for emergency defense
4. **Enemy Prioritization** - Take out ranged enemies first, use tanks as shields
5. **Combo Master** - Every 3rd shot explodes - time it for maximum impact

## 🐛 Known Issues

- Large initial repository size (resolved with .gitignore)
- Occasional GitHub push timeouts (usually succeeds despite error message)

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Enjoy the game!** 🎮
