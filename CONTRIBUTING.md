# Contributing to k6 Enterprise Framework

Thank you for your interest in contributing! This document outlines the guidelines for contributing to this project.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/k6-enterprise-framework.git
   cd k6-enterprise-framework
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Verify installation**:
   ```bash
   npm run build
   node dist/core/cli.js --help
   ```

## 🛠️ Development Workflow

1. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feat/my-new-feature
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**. Please follow the coding standards below.

3. **Run tests** to ensure no regressions:
   ```bash
   # Run helper unit tests
   node dist/core/cli.js --client=client-a --test=test-helpers.ts
   ```

4. **Commit your changes** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add new helper method for date validation"
   ```

5. **Push to your fork** and submit a Pull Request.

## 📝 Coding Standards

### TypeScript
- Use strong typing whenever possible. Avoid `any`.
- Use `async/await` for asynchronous operations.
- Follow the existing project structure.

### k6 Best Practices
- **Helpers**: Use `ValidationHelper` for checks instead of manual logic.
- **Config**: Always use `ConfigLoader` to access environment variables.
- **Thresholds**: Define thresholds in configuration files, not hardcoded in scripts.
- **Tags**: Use tags for better observability in metrics.

### Project Structure
- `core/`: Framework engine (CLI, Runner, Config).
- `shared/`: Reusable utilities (Helpers, Profiles).
- `clients/`: Client-specific implementations.

## 🧪 Testing

- Add unit tests for new helpers in `clients/client-a/scenarios/test-helpers.ts`.
- Verify your changes by running relevant scenarios.

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's [ISC License](LICENSE).
