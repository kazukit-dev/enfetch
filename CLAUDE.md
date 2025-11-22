# Development Guide

## Available Commands

- `npm run fix:lint` - Lint files and apply safe fixes
- `npm run fix:format` - Format code
- `npm run test` - Run tests
- `npm run build` - Build the project
- `npm run typecheck` - Run type checking

## Code Style

### General

- Use ES modules (`import`/`export`) syntax, not CommonJS (`require`)
- Do not use TypeScript `any`
- Write in TypeScript, not JavaScript
- Destructure imports when possible (e.g., `import { foo } from 'bar'`)

### Testing

- Use Vitest API
- Always use `toBeTruthy()` instead of `toBe(true)`
- Always use `toBeFalsy()` instead of `toBe(false)`
- Always use `expect.assertions()` in async tests

## Workflow

- Run `typecheck`, `fix:lint`, and `fix:format` when you're done making a series of code changes
- Prefer running single tests rather than the whole test suite for performance