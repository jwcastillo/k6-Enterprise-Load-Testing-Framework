# Gestión de Código de Clientes - Repositorios Separados

Esta guía explica cómo mantener el código específico de cada cliente en repositorios separados mientras se usa el framework principal.

## Descripción General

El k6 Enterprise Framework soporta dos enfoques para gestionar el código de clientes:

1. **Enfoque Monorepo** - Todos los clientes en el repositorio principal (por defecto)
2. **Repositorios Separados** - Cada cliente en su propio repositorio (recomendado para producción)

## ¿Por Qué Repositorios Separados?

### Ventajas
- ✅ **Seguridad**: El código y datos del cliente permanecen privados
- ✅ **Control de Acceso**: Diferentes equipos pueden tener diferentes permisos
- ✅ **Independencia**: Los clientes pueden versionar y desplegar independientemente
- ✅ **Escalabilidad**: Las actualizaciones del framework no requieren cambios en el código del cliente
- ✅ **Cumplimiento**: Más fácil cumplir con requisitos de residencia de datos y privacidad

### Desventajas
- ❌ **Complejidad**: Requiere gestionar múltiples repositorios
- ❌ **Coordinación**: Las actualizaciones del framework necesitan ser probadas en todos los clientes
- ❌ **Configuración**: La configuración inicial es más compleja

## Arquitectura

```
Repositorio Framework Principal (Público/Interno)
├── core/
├── shared/
├── bin/
├── docs/
└── clients/
    └── .gitignore  # Ignorar todos los directorios de clientes

Repositorio Cliente 1 (Privado)
└── mi-empresa/
    ├── config/
    ├── data/
    ├── lib/
    └── scenarios/

Repositorio Cliente 2 (Privado)
└── otro-cliente/
    ├── config/
    ├── data/
    ├── lib/
    └── scenarios/
```

## Guía de Configuración

### Paso 1: Configurar el Repositorio del Framework Principal

1. **Actualizar `.gitignore` en el repositorio principal**:

```bash
# Agregar a .gitignore
clients/*/
!clients/.gitkeep
!clients/local/  # Mantener cliente de ejemplo
```

2. **Crear archivo `.gitkeep`**:

```bash
touch clients/.gitkeep
```

3. **Hacer commit de los cambios**:

```bash
git add .gitignore clients/.gitkeep
git commit -m "chore: configurar para repositorios de clientes separados"
git push
```

### Paso 2: Crear Repositorio del Cliente

1. **Crear un nuevo repositorio** para tu cliente (ej., `k6-tests-miempresa`)

2. **Inicializar el repositorio**:

```bash
# Crear nuevo repo
mkdir k6-tests-miempresa
cd k6-tests-miempresa
git init

# Crear estructura del cliente usando el script del framework
# (Ejecutar esto desde el directorio del framework principal)
cd /ruta/al/framework-principal
./bin/create-client.sh miempresa

# Mover directorio del cliente a su propio repo
mv clients/miempresa/* /ruta/a/k6-tests-miempresa/
cd /ruta/a/k6-tests-miempresa

# Crear .gitignore
cat > .gitignore << 'EOF'
# Node modules
node_modules/

# Archivos de entorno
.env
*.key
*.pem

# Reportes (generados localmente)
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

# Commit inicial
git add .
git commit -m "feat: estructura inicial del cliente"
git remote add origin https://github.com/tu-org/k6-tests-miempresa.git
git push -u origin main
```

### Paso 3: Vincular Cliente al Framework

Hay tres enfoques para vincular el repositorio del cliente al framework:

#### Opción A: Git Submodules (Recomendado)

**En el repositorio del framework principal**:

```bash
# Agregar cliente como submódulo
git submodule add https://github.com/tu-org/k6-tests-miempresa.git clients/miempresa

# Hacer commit
git add .gitmodules clients/miempresa
git commit -m "chore: agregar cliente miempresa como submódulo"
git push
```

**Para clonar framework con clientes**:

```bash
# Clonar con submódulos
git clone --recurse-submodules https://github.com/tu-org/k6-framework.git

# O si ya está clonado
git submodule update --init --recursive
```

**Para actualizar código del cliente**:

```bash
# Actualizar cliente específico
cd clients/miempresa
git pull origin main
cd ../..
git add clients/miempresa
git commit -m "chore: actualizar cliente miempresa"
git push
```

#### Opción B: Enlaces Simbólicos

**En el repositorio del framework principal**:

```bash
# Clonar repo del cliente por separado
cd /ruta/al/workspace
git clone https://github.com/tu-org/k6-tests-miempresa.git

# Crear enlace simbólico en el framework
cd /ruta/al/k6-framework
ln -s /ruta/al/workspace/k6-tests-miempresa clients/miempresa
```

**Ventajas**:
- Fácil trabajar con múltiples clientes
- Los cambios se reflejan inmediatamente
- Sin complejidad de submódulos git

**Desventajas**:
- Los enlaces son solo locales (no en git)
- Cada desarrollador necesita configurar los enlaces
- No funciona bien en CI/CD

#### Opción C: Clonación en CI/CD (Producción)

**No hacer commit del código del cliente al framework**. En su lugar, clonarlo durante CI/CD:

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
          repository: tu-org/k6-tests-miempresa
          token: ${{ secrets.CLIENT_REPO_TOKEN }}
          path: clients/miempresa
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run Tests
        run: |
          node dist/core/cli.js \
            --client=miempresa \
            --test=${{ github.event.inputs.test }}
```

**GitLab CI** (`.gitlab-ci.yml`):

```yaml
before_script:
  - |
    # Clonar repositorio del cliente
    git clone https://oauth2:${CLIENT_REPO_TOKEN}@gitlab.com/tu-org/k6-tests-miempresa.git clients/miempresa
  - npm ci
  - npm run build

run:test:
  script:
    - |
      node dist/core/cli.js \
        --client=miempresa \
        --test=${TEST}
```

## Ejemplos de Flujo de Trabajo

### Flujo de Desarrollo (Submódulos)

```bash
# 1. Clonar framework con clientes
git clone --recurse-submodules https://github.com/tu-org/k6-framework.git
cd k6-framework

# 2. Instalar dependencias
npm install
npm run build

# 3. Trabajar en código del cliente
cd clients/miempresa
git checkout -b feature/nuevo-test

# 4. Hacer cambios
# ... editar archivos ...

# 5. Hacer commit y push de cambios del cliente
git add .
git commit -m "feat: agregar nueva prueba de carga"
git push origin feature/nuevo-test

# 6. Actualizar framework para usar nueva versión del cliente
cd ../..
git add clients/miempresa
git commit -m "chore: actualizar cliente miempresa"
git push
```

### Flujo de Desarrollo (Enlaces Simbólicos)

```bash
# 1. Clonar framework
git clone https://github.com/tu-org/k6-framework.git
cd k6-framework

# 2. Clonar cliente por separado
cd ..
git clone https://github.com/tu-org/k6-tests-miempresa.git

# 3. Crear enlace simbólico
cd k6-framework
ln -s ../k6-tests-miempresa clients/miempresa

# 4. Instalar y compilar
npm install
npm run build

# 5. Trabajar en código del cliente
cd ../k6-tests-miempresa
git checkout -b feature/nuevo-test

# 6. Hacer cambios y commit
# ... editar archivos ...
git add .
git commit -m "feat: agregar nueva prueba de carga"
git push origin feature/nuevo-test
```

## Mejores Prácticas

### 1. Usar Nomenclatura Consistente
- Repo del framework: `k6-framework` o `load-testing-framework`
- Repos de clientes: `k6-tests-{nombre-cliente}` o `{nombre-cliente}-load-tests`

### 2. Control de Versiones
- Etiquetar releases del framework: `v1.0.0`, `v1.1.0`
- Etiquetar releases de clientes: `miempresa-v1.0.0`
- Documentar compatibilidad en README

### 3. Control de Acceso
- Framework: Interno o público
- Clientes: Repositorios privados
- Usar deploy keys o tokens para acceso CI/CD

### 4. Documentación
Cada repositorio de cliente debe tener:
- `README.md` - Instrucciones de configuración y uso
- `CHANGELOG.md` - Historial de versiones
- `.env.example` - Variables de entorno requeridas

### 5. Secretos de CI/CD
Almacenar datos sensibles en secretos de CI/CD:
- `CLIENT_REPO_TOKEN` - Token para acceder al repositorio del cliente
- `API_TOKENS` - API keys para testing
- `SLACK_WEBHOOK` - Webhooks de notificación

## Consideraciones de Seguridad

### Datos Sensibles
Nunca hacer commit en ningún repositorio:
- API keys
- Contraseñas
- Tokens
- Claves privadas
- Datos de clientes

### Tokens de Acceso
- Usar tokens de acceso personal de grano fino
- Establecer los scopes mínimos requeridos
- Rotar tokens regularmente
- Usar diferentes tokens para diferentes clientes

### Aislamiento de Datos
- Cada cliente debe tener sus propios datos de prueba
- No compartir credenciales entre clientes
- Usar entornos separados (staging, prod) por cliente

## Solución de Problemas

### Submódulo No Se Actualiza
```bash
# Actualizar todos los submódulos
git submodule update --remote --merge

# Actualizar submódulo específico
cd clients/miempresa
git pull origin main
cd ../..
git add clients/miempresa
git commit -m "chore: actualizar cliente"
```

### Enlace Simbólico No Funciona
```bash
# Recrear enlace
rm clients/miempresa
ln -s /ruta/absoluta/a/k6-tests-miempresa clients/miempresa
```

### CI/CD No Puede Acceder al Repo del Cliente
1. Verificar que el token tiene los permisos correctos
2. Verificar que el token no ha expirado
3. Asegurar que el nombre del repositorio es correcto
4. Verificar que el token está agregado a los secretos de CI/CD

## Guía de Migración

### De Monorepo a Repos Separados

1. **Hacer backup del código actual del cliente**:
```bash
cp -r clients/miempresa /tmp/miempresa-backup
```

2. **Crear nuevo repositorio del cliente** (ver Paso 2 arriba)

3. **Mover código al nuevo repositorio**:
```bash
mv /tmp/miempresa-backup/* /ruta/a/k6-tests-miempresa/
```

4. **Actualizar framework principal**:
```bash
# Agregar a .gitignore
echo "clients/miempresa/" >> .gitignore

# Remover de git (mantener copia local)
git rm -r --cached clients/miempresa
git commit -m "chore: mover miempresa a repositorio separado"

# Agregar como submódulo
git submodule add https://github.com/tu-org/k6-tests-miempresa.git clients/miempresa
git commit -m "chore: agregar miempresa como submódulo"
git push
```

## Ejemplo: Configuración Completa

```bash
# 1. Configurar framework principal
git clone https://github.com/tu-org/k6-framework.git
cd k6-framework

# 2. Crear estructura del cliente
./bin/create-client.sh acme-corp

# 3. Mover a repo separado
cd ..
mkdir k6-tests-acme-corp
mv k6-framework/clients/acme-corp/* k6-tests-acme-corp/
cd k6-tests-acme-corp

# 4. Inicializar git
git init
git add .
git commit -m "feat: estructura inicial de pruebas ACME Corp"
git remote add origin https://github.com/acme/k6-tests-acme-corp.git
git push -u origin main

# 5. Agregar como submódulo al framework
cd ../k6-framework
git submodule add https://github.com/acme/k6-tests-acme-corp.git clients/acme-corp
git commit -m "chore: agregar cliente ACME Corp"
git push

# 6. Probar
npm install
npm run build
node dist/core/cli.js --client=acme-corp --test=example.ts
```

## Próximos Pasos

- [Guía de Ejecución de Pruebas](RUNNING_TESTS.md) - Ejecutar pruebas vía CI/CD
- [Guía de Contribución](../CONTRIBUTING.md) - Cómo contribuir
- [Política de Seguridad](../SECURITY.md) - Mejores prácticas de seguridad
