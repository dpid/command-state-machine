# Tech Stack

## Language & Runtime

- **TypeScript** 5.x with strict mode
- **Target**: ES2020
- **Module**: ESNext (native ES modules)

## Build Tools

| Tool | Purpose | Command |
|------|---------|---------|
| tsup | Build/bundle | `npm run build` |
| tsc | Type checking | `npm run typecheck` |
| Vitest | Testing | `npm test` or `npm run test:watch` |

## Package Output

Dual module support:
- CommonJS (`.cjs`) for Node.js require()
- ES Modules (`.js`) for modern bundlers
- Type declarations (`.d.ts`)

## Key Commands

```bash
# Build the project
npm run build

# Type check without emitting
npm run typecheck

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Dependencies

**Dev only** (no runtime dependencies):
- `tsup` - Fast TypeScript bundler
- `tsx` - TypeScript executor for development
- `typescript` - Language compiler
- `vitest` - Test framework

## Git Workflow

- Branch naming: `feature/<short-kebab-description>`
- Example: `feature/add-powerups`, `feature/fix-state-transition`
- PRs target `master` branch
