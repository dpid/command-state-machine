# Code Conventions

## File Naming

- **Kebab-case** for all source files: `abstract-command.ts`, `command-player.class.ts`
- Interfaces: `*.interface.ts`
- Classes with `.class.ts` suffix when disambiguating from interfaces

## Naming Conventions

- **Classes**: PascalCase, descriptive names
  - Abstract bases prefixed: `AbstractCommand`, `AbstractState`
  - Implementations: `SerialCommandEnumerator`, `StateMachineImpl`
- **Interfaces**: PascalCase, no `I` prefix: `Command`, `State`, `CommandEnumerator`
- **Variables/methods**: camelCase

## Patterns

### Factory Pattern
Use static `.create()` methods instead of exposing constructors:
```typescript
// Good
const state = SimpleState.create('idle');
const wait = WaitForTime.create(1000);

// Avoid
const state = new SimpleState('idle');
```

### Template Method Pattern
Lifecycle hooks for subclass customization:
```typescript
abstract class AbstractCommand {
  start() { this.onStart(); }
  protected onStart() {}  // Override in subclasses

  update(dt: number) { this.onUpdate(dt); }
  protected onUpdate(dt: number) {}
}
```

### Exports
- Interfaces exported as `type`
- Classes/utilities exported as values
- Barrel exports via `index.ts` files

## Testing

- Use descriptive test names that explain the scenario
- Test both happy path and edge cases
- Use `vi.fn()` for mocking callbacks
- Delta time tests should use realistic values (16ms for 60fps frame)

## Comments

Comments explain *why*, not *what*. Only add comments for:
- Non-obvious logic or edge cases
- Complex algorithms
- External constraints
