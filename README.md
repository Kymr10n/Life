# 🧬 Life Simulation - TypeScript Edition

A sophisticated artificial life simulation featuring genetic algorithms, agent-based modeling, and evolutionary dynamics.

## 🚀 Quick Start

### Development
```bash
npm install        # Install dependencies
npm run dev        # Start development server (http://localhost:3000)
```

### Production
```bash
npm run build      # Build for production
npm run preview    # Preview production build
```

## 🎮 Usage

1. **Open the simulation**: Navigate to `http://localhost:3000/index-ts.html`
2. **Add organisms**: Click anywhere on the canvas
3. **Add plants**: Right-click on the canvas
4. **Watch evolution**: Organisms evolve their traits over generations

## 🛠 Development Setup

### VS Code Debugging

The project includes multiple debug configurations:

- **Debug TypeScript (Vite Dev Server)**: Debug the TypeScript version during development
- **Debug TypeScript (Production Build)**: Debug the production build
- **Debug JavaScript (Original)**: Debug the original vanilla JS version
- **Debug JavaScript (Live Server)**: Debug with Live Server extension

Use `F5` or go to Run & Debug panel to select a configuration.

### Recommended Extensions

Install the recommended extensions for the best development experience:
- TypeScript support
- Prettier formatting
- Live Server
- Path IntelliSense
- And more...

## 📁 Project Structure

```
├── src/
│   ├── engine/          # Core simulation classes
│   │   ├── World.ts     # Main simulation engine with event system
│   │   ├── Organism.ts  # Complex agent with AI behaviors
│   │   └── Plant.ts     # Food entities
│   ├── utils/           # Utility functions
│   │   ├── math.ts      # Mathematical operations
│   │   └── genetics.ts  # Genetic algorithms
│   ├── types/           # TypeScript definitions
│   │   └── index.ts     # Comprehensive type system
│   └── main.ts          # Application entry point
├── classes/             # Original JavaScript version (legacy)
├── index-ts.html        # Modern TypeScript interface
├── index.html           # Original JavaScript interface
└── .vscode/             # VS Code configuration
```

## ⚡ Features

### Core Simulation
- **Genetic Evolution**: Speed, vision, and randomness traits evolve
- **Survival Instincts**: Hunger-based behavior prioritization
- **Anti-Clustering**: Advanced dispersal mechanisms
- **Trail System**: Optimized pheromone trails
- **Dynamic Environment**: Adaptive plant spawning

### Technical Features
- **TypeScript**: Full type safety and IntelliSense
- **Vite**: Fast HMR and optimized builds
- **Event System**: Clean architecture with event-driven design
- **Performance**: Frame limiting and efficient collision detection
- **Debugging**: Comprehensive VS Code debug configurations

### Performance Optimizations
- Trail grid optimization (95% performance improvement)
- Frame rate limiting (60 FPS target)
- Efficient spatial partitioning
- Optimized rendering pipeline

## 🧪 Simulation Parameters

### Organism Behavior
- **Energy < 50**: Prioritizes food seeking over reproduction
- **Vision Range**: Genetic trait affecting food detection
- **Speed**: Genetic trait affecting movement speed
- **Randomness**: Genetic trait affecting exploration behavior

### Environmental Factors
- **Plant Spawning**: Dynamic based on current population
- **Boundary Reflection**: Physics-based wall bouncing
- **Crowd Dispersal**: Anti-clustering mechanisms
- **Trail Decay**: Pheromone trails fade over time

## 🎯 Development Commands

```bash
# Development
npm run dev          # Start dev server with HMR
npm run build        # Build for production
npm run preview      # Preview production build

# Type checking
npx tsc --noEmit     # Check TypeScript without emitting files

# Debugging
# Use F5 in VS Code with configured launch profiles
```

## 🔧 Configuration Files

- `tsconfig.json`: TypeScript compiler configuration
- `vite.config.ts`: Vite build tool configuration
- `.vscode/launch.json`: VS Code debug configurations
- `.vscode/tasks.json`: VS Code task definitions
- `.vscode/settings.json`: Workspace settings
- `.gitignore`: Git ignore patterns following best practices

## 📈 Performance Metrics

The simulation includes real-time performance monitoring:
- Frame rate tracking
- Population statistics
- Genetic trait averages
- Age distribution
- Energy levels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

**Built with modern TypeScript, Vite, and VS Code tooling for the best development experience! 🚀**
