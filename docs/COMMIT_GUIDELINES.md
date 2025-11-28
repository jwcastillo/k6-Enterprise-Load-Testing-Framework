# Commit Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope (optional)
The scope should be the name of the affected component:
- `core`
- `runner`
- `helpers`
- `redis`
- `ci`
- `docs`
- etc.

### Subject
- Use imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize first letter
- No period (.) at the end
- Maximum 100 characters

### Body (optional)
- Use imperative, present tense
- Include motivation for the change and contrast with previous behavior

### Footer (optional)
- Reference GitHub/GitLab issues: `Closes #123`
- Note breaking changes: `BREAKING CHANGE: <description>`

## Examples

### Feature
```
feat(helpers): add randomUser generator

Add comprehensive user object generator with all common fields
including name, email, address, and phone number.
```

### Bug Fix
```
fix(redis): correct hgetall return type handling

k6 Redis client returns object directly, not array.
Updated helper to handle this correctly.

Closes #42
```

### Breaking Change
```
feat(runner)!: change config file format to YAML

BREAKING CHANGE: Configuration files must now use YAML format
instead of JSON. Migration guide available in docs/MIGRATION.md
```

### Documentation
```
docs(readme): update installation instructions

Add prerequisites section and troubleshooting guide.
```

## Using Commitizen (Recommended)

Instead of writing commit messages manually, use the interactive CLI:

```bash
# Stage your changes
git add .

# Use commitizen to create commit
npm run commit
```

This will guide you through creating a properly formatted commit message.

## Automated Versioning

This project uses semantic versioning based on commit messages:

- `fix:` → patch version (1.0.0 → 1.0.1)
- `feat:` → minor version (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` or `!` → major version (1.0.0 → 2.0.0)

Version bumps are automated via:
```bash
npm run version:bump
```

Or manually specify:
```bash
./bin/version.sh [major|minor|patch]
```
