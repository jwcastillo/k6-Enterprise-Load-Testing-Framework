# Client Code Management - Separate Repositories

This guide explains how to maintain client-specific code in separate repositories while using the main framework.

## Overview

The k6 Enterprise Framework supports two approaches for managing client code:

1. **Monorepo Approach** - All clients in the main repository (default)
2. **Separate Repositories** - Each client in its own repository (recommended for production)

## Why Separate Repositories?

### Advantages
- ✅ **Security**: Client code and data stay private
- ✅ **Access Control**: Different teams can have different permissions
- ✅ **Independence**: Clients can version and deploy independently
- ✅ **Scalability**: Framework updates don't require client code changes
- ✅ **Compliance**: Easier to meet data residency and privacy requirements

### Disadvantages
- ❌ **Complexity**: Requires managing multiple repositories
- ❌ **Coordination**: Framework updates need to be tested across clients
- ❌ **Setup**: Initial setup is more involved

## Architecture

```
Main Framework Repo (Public/Internal)
├── core/
├── shared/
├── bin/
├── docs/
└── clients/
    └── .gitignore  # Ignore all client directories

Client Repo 1 (Private)
└── my-company/
    ├── config/
    ├── data/
    ├── lib/
    └── scenarios/

Client Repo 2 (Private)
└── another-client/
    ├── config/
    ├── data/
    ├── lib/
    └── scenarios/
```

## Setup Guide

### Step 1: Configure Main Framework Repository

1. **Update `.gitignore` in the main repository**:

```bash
# Add to .gitignore
clients/*/
!clients/.gitkeep
!clients/local/  # Keep example client
```

2. **Create `.gitkeep` file**:

```bash
touch clients/.gitkeep
```

3. **Commit changes**:

```bash
git add .gitignore clients/.gitkeep
git commit -m "chore: configure for separate client repositories"
git push
```

### Step 2: Create Client Repository

1. **Create a new repository** for your client (e.g., `k6-tests-mycompany`)

2. **Initialize the repository**:

```bash
# Create new repo
mkdir k6-tests-mycompany
cd k6-tests-mycompany
git init

# Create client structure using the framework script
# (Run this from the main framework directory)
cd /path/to/main-framework
./bin/create-client.sh mycompany

# Move client directory to its own repo
mv clients/mycompany/* /path/to/k6-tests-mycompany/
cd /path/to/k6-tests-mycompany

# Create .gitignore
cat > .gitignore << 'EOF'
# Node modules
node_modules/

# Environment files
.env
*.key
*.pem

# Reports (generated locally)
reports/
*.html
*.json
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF

# Initial commit
git add .
git commit -m "feat: initial client structure"
git remote add origin https://github.com/your-org/k6-tests-mycompany.git
git push -u origin main
```

### Step 3: Link Client to Framework

There are three approaches to link the client repository to the framework:

#### Option A: Git Submodules (Recommended)

**In the main framework repository**:

```bash
# Add client as submodule
git submodule add https://github.com/your-org/k6-tests-mycompany.git clients/mycompany

# Commit
git add .gitmodules clients/mycompany
git commit -m "chore: add mycompany client as submodule"
git push
```

**To clone framework with clients**:

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/your-org/k6-framework.git

# Or if already cloned
git submodule update --init --recursive
```

**To update client code**:

```bash
# Update specific client
cd clients/mycompany
git pull origin main
cd ../..
git add clients/mycompany
git commit -m "chore: update mycompany client"
git push
```

#### Option B: Symbolic Links

**In the main framework repository**:

```bash
# Clone client repo separately
cd /path/to/workspace
git clone https://github.com/your-org/k6-tests-mycompany.git

# Create symbolic link in framework
cd /path/to/k6-framework
ln -s /path/to/workspace/k6-tests-mycompany clients/mycompany
```

**Advantages**:
- Easy to work with multiple clients
- Changes are immediately reflected
- No git submodule complexity

**Disadvantages**:
- Links are local only (not in git)
- Each developer needs to set up links
- Doesn't work well in CI/CD

#### Option C: CI/CD Clone (Production)

**Don't commit client code to framework**. Instead, clone it during CI/CD:

**GitHub Actions** (`.github/workflows/run-tests.yml`):

```yaml
jobs:
  run-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Framework
        uses: actions/checkout@v3
      
      - name: Checkout Client Code
        uses: actions/checkout@v3
        with:
          repository: your-org/k6-tests-mycompany
          token: ${{ secrets.CLIENT_REPO_TOKEN }}
          path: clients/mycompany
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run Tests
        run: |
          node dist/core/cli.js \
            --client=mycompany \
            --test=${{ github.event.inputs.test }}
```

**GitLab CI** (`.gitlab-ci.yml`):

```yaml
before_script:
  - |
    # Clone client repository
    git clone https://oauth2:${CLIENT_REPO_TOKEN}@gitlab.com/your-org/k6-tests-mycompany.git clients/mycompany
  - npm ci
  - npm run build

run:test:
  script:
    - |
      node dist/core/cli.js \
        --client=mycompany \
        --test=${TEST}
```

## Workflow Examples

### Development Workflow (Submodules)

```bash
# 1. Clone framework with clients
git clone --recurse-submodules https://github.com/your-org/k6-framework.git
cd k6-framework

# 2. Install dependencies
npm install
npm run build

# 3. Work on client code
cd clients/mycompany
git checkout -b feature/new-test

# 4. Make changes
# ... edit files ...

# 5. Commit and push client changes
git add .
git commit -m "feat: add new load test"
git push origin feature/new-test

# 6. Update framework to use new client version
cd ../..
git add clients/mycompany
git commit -m "chore: update mycompany client"
git push
```

### Development Workflow (Symbolic Links)

```bash
# 1. Clone framework
git clone https://github.com/your-org/k6-framework.git
cd k6-framework

# 2. Clone client separately
cd ..
git clone https://github.com/your-org/k6-tests-mycompany.git

# 3. Create symbolic link
cd k6-framework
ln -s ../k6-tests-mycompany clients/mycompany

# 4. Install and build
npm install
npm run build

# 5. Work on client code
cd ../k6-tests-mycompany
git checkout -b feature/new-test

# 6. Make changes and commit
# ... edit files ...
git add .
git commit -m "feat: add new load test"
git push origin feature/new-test
```

## Best Practices

### 1. Use Consistent Naming
- Framework repo: `k6-framework` or `load-testing-framework`
- Client repos: `k6-tests-{client-name}` or `{client-name}-load-tests`

### 2. Version Control
- Tag framework releases: `v1.0.0`, `v1.1.0`
- Tag client releases: `mycompany-v1.0.0`
- Document compatibility in README

### 3. Access Control
- Framework: Internal or public
- Clients: Private repositories
- Use deploy keys or tokens for CI/CD access

### 4. Documentation
Each client repository should have:
- `README.md` - Setup and usage instructions
- `CHANGELOG.md` - Version history
- `.env.example` - Required environment variables

### 5. CI/CD Secrets
Store sensitive data in CI/CD secrets:
- `CLIENT_REPO_TOKEN` - Token to access client repository
- `API_TOKENS` - API keys for testing
- `SLACK_WEBHOOK` - Notification webhooks

## Security Considerations

### Sensitive Data
Never commit to any repository:
- API keys
- Passwords
- Tokens
- Private keys
- Customer data

### Access Tokens
- Use fine-grained personal access tokens
- Set minimum required scopes
- Rotate tokens regularly
- Use different tokens for different clients

### Data Isolation
- Each client should have its own test data
- Don't share credentials between clients
- Use separate environments (staging, prod) per client

## Troubleshooting

### Submodule Not Updating
```bash
# Update all submodules
git submodule update --remote --merge

# Update specific submodule
cd clients/mycompany
git pull origin main
cd ../..
git add clients/mycompany
git commit -m "chore: update client"
```

### Symbolic Link Not Working
```bash
# Recreate link
rm clients/mycompany
ln -s /absolute/path/to/k6-tests-mycompany clients/mycompany
```

### CI/CD Can't Access Client Repo
1. Verify token has correct permissions
2. Check token is not expired
3. Ensure repository name is correct
4. Verify token is added to CI/CD secrets

## Migration Guide

### From Monorepo to Separate Repos

1. **Backup current client code**:
```bash
cp -r clients/mycompany /tmp/mycompany-backup
```

2. **Create new client repository** (see Step 2 above)

3. **Move code to new repository**:
```bash
mv /tmp/mycompany-backup/* /path/to/k6-tests-mycompany/
```

4. **Update main framework**:
```bash
# Add to .gitignore
echo "clients/mycompany/" >> .gitignore

# Remove from git (keep local copy)
git rm -r --cached clients/mycompany
git commit -m "chore: move mycompany to separate repository"

# Add as submodule
git submodule add https://github.com/your-org/k6-tests-mycompany.git clients/mycompany
git commit -m "chore: add mycompany as submodule"
git push
```

## Example: Complete Setup

```bash
# 1. Setup main framework
git clone https://github.com/your-org/k6-framework.git
cd k6-framework

# 2. Create client structure
./bin/create-client.sh acme-corp

# 3. Move to separate repo
cd ..
mkdir k6-tests-acme-corp
mv k6-framework/clients/acme-corp/* k6-tests-acme-corp/
cd k6-tests-acme-corp

# 4. Initialize git
git init
git add .
git commit -m "feat: initial ACME Corp test structure"
git remote add origin https://github.com/acme/k6-tests-acme-corp.git
git push -u origin main

# 5. Add as submodule to framework
cd ../k6-framework
git submodule add https://github.com/acme/k6-tests-acme-corp.git clients/acme-corp
git commit -m "chore: add ACME Corp client"
git push

# 6. Test
npm install
npm run build
node dist/core/cli.js --client=acme-corp --test=example.ts
```

## Next Steps

- [Running Tests Guide](RUNNING_TESTS.md) - Execute tests via CI/CD
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Security Policy](../SECURITY.md) - Security best practices
