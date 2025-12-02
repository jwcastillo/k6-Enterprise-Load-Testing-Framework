# Project: k6 Enterprise Framework

## General Instructions

When generating new TypeScript code for this project, please adhere to the following guidelines to maintain consistency and quality.

1.  **Follow Existing Style**: Match the coding style of existing files.
2.  **Documentation**: Ensure all new functions, classes, and public methods have JSDoc comments explaining their purpose, parameters, and return values.
3.  **Compatibility**: All code must be compatible with **TypeScript 5.0+**, **Node.js 18+** (for CLI/Scripts), and the **k6 runtime** (for test scenarios).
4.  **Module System**: Use **ES Modules** (`import`/`export`) exclusively, as the project is configured with `"type": "module"`.

## Documentation

*   **Language**: All documentation, including comments, READMEs, and guides, must be written in **English**.
*   **Maintenance**: Documentation must be kept **up-to-date** with code changes. If you modify functionality, update the corresponding documentation immediately.
*   **JSDoc**: Ensure all new functions, classes, and public methods have JSDoc comments explaining their purpose, parameters, and return values.

## Coding Style

*   **Indentation**: Use **2 spaces** for indentation.
*   **Naming Conventions**:
    *   **Classes**: PascalCase (e.g., `ConfigValidator`, `AuthService`).
    *   **Interfaces**: PascalCase, **without** an `I` prefix (e.g., `Config`, `User`), matching the existing codebase.
    *   **Variables/Functions**: camelCase.
    *   **Private Members**: camelCase, **without** an underscore prefix (e.g., `private client`, not `private _client`).
*   **Equality**: Always use strict equality (`===` and `!==`).
*   **Quotes**: Use single quotes `'` for strings, except when template literals are needed.

## Specific Components

### `clients/` (Client Scenarios)
This directory contains client-specific test code.
*   **Service Object Model (SOM)**: Implement the **Service Object Model** pattern. Encapsulate API logic within Service classes (e.g., `AuthService`, `ProductService`) rather than making direct HTTP calls in scenarios.
*   **Configuration**: Services must accept configuration parameters (like `baseUrl`) via their constructor. Do not hardcode URLs or credentials.
*   **Scenarios**: Located in `clients/<client>/scenarios/`. Must export an `options` object and a default function.
*   **Services**: Located in `clients/<client>/lib/`. Should extend `BaseService` or similar base classes.
*   **Config**: Located in `clients/<client>/config/`. JSON/YAML configuration files.

### `core/` & `shared/`
Core framework logic and shared utilities.
*   **Validators**: Use `Ajv` for schema validation.
*   **Helpers**: Static helper classes (e.g., `ValidationHelper`) are preferred for shared logic.

## TypeScript Best Practices

*   **Strict Typing**: Avoid using `any`. Define proper interfaces or types for all data structures, especially API responses and configuration objects.
*   **Type Safety**: Use TypeScript's type system to prevent runtime errors. Use optional chaining (`?.`) and nullish coalescing (`??`) where appropriate.
*   **Interfaces**: Define interfaces for complex objects. Use `readonly` properties for immutable data.
*   **Enums/Union Types**: Use Enums or String Union Types for fixed sets of values (e.g., environment names, status codes).

## Dependencies

*   **External Dependencies**: Avoid introducing new external dependencies unless absolutely necessary.
*   **k6 Modules**: Use built-in k6 modules (`k6/http`, `k6/check`, `k6/sleep`) for test logic.
*   **Node.js Built-ins**: For CLI tools (in `bin/`), prefer using Node.js built-ins (`fs`, `path`) or existing dependencies (`glob`, `minimist`).

## Error Handling

*   **Robustness**: Include `try-catch` blocks where file I/O or network requests are involved.
*   **Logging**: Use descriptive error messages. For CLI tools, exit with a non-zero code on failure.
