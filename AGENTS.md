# AWS Services Concept Map

Welcome as a contributor to the AWS Services Concept Map project! Here are some guidelines to help you get started.

## Communication Style

- Write concisely, omit articles (a/the) when clear
- Prioritize clarity over grammar perfection
- Get to point fast
- When communicating with user, use lots of emojis!

## Code Standards

### Modern Typescript/JavaScript

- Use ES7+ features
- Prefer `const` over `let`, avoid `var`
- Template literals over string concatenation

### Functions

- Prefer smaller functions, utilizing a functional style
- Arrow functions everywhere unless need `this` binding

### File Organization

- Split files when >250 lines or multiple concerns
- Group related features in folders

### Comments

- Explain WHY not WHAT
- Complex logic needs brief context
- Document non-obvious decisions
- Top-level comment for file purpose if unclear

### Constants & Configuration

- Keep config separate from logic
- Extract magic numbers to named constants
- Use UPPER_SNAKE_CASE for constants

## Data Handling

- Prefer immutable updates (spread operator)
- Use optional chaining: `user?.profile?.name`
- Nullish coalescing for defaults: `value ?? 'default'`
- Array methods over loops: `map`, `filter`, `reduce`
