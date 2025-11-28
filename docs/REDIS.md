# Redis Data Support

## Overview

El framework incluye soporte completo para Redis, permitiendo compartir datos entre VUs (Virtual Users) y coordinar la ejecución de tests.

## Casos de Uso

### 1. 🔄 Compartir Datos entre VUs
- Tokens de autenticación
- IDs de recursos creados
- Contadores compartidos

### 2. 📦 Cachear Datos de Setup
- Usuarios de prueba pre-creados
- Datos de configuración
- Catálogos de productos

### 3. 📊 Coordinar Ejecución
- Sincronización entre VUs
- Rate limiting distribuido
- Estadísticas en tiempo real

## Instalación

### Local
```bash
# Instalar Redis
brew install redis  # macOS
# o
apt-get install redis  # Ubuntu

# Iniciar Redis
redis-server
```

### Docker
Redis ya está incluido en `docker-compose.yml`:
```bash
docker-compose up redis
```

## RedisHelper API

### Conexión
```typescript
import { RedisHelper } from '../../../shared/redis-helper.js';

const redis = new RedisHelper(); // Usa REDIS_URL del env
// o
const redis = new RedisHelper('redis://localhost:6379');
```

### Operaciones Básicas

#### Set/Get
```typescript
// Set con TTL opcional (en segundos)
await redis.set('key', 'value', 60);

// Get
const value = await redis.get('key');
```

#### Delete/Exists
```typescript
await redis.del('key');
const exists = await redis.exists('key');
```

### Operaciones Múltiples

#### MSet/MGet
```typescript
// Set múltiple
await redis.mset({
  'user:1:name': 'John',
  'user:1:email': 'john@test.com'
});

// Get múltiple
const values = await redis.mget(['user:1:name', 'user:1:email']);
```

### Contadores

```typescript
// Incrementar
const count = await redis.incr('login_count');
```

### Listas

```typescript
// Agregar a lista
await redis.lpush('errors', 'Error message');

// Obtener tamaño
const length = await redis.llen('errors');

// Obtener todos los items
const errors = await redis.lrange('errors', 0, -1);
```

### Hashes

```typescript
// Set campo de hash
await redis.hset('user:1', 'name', 'John');
await redis.hset('user:1', 'email', 'john@test.com');

// Get campo
const name = await redis.hget('user:1', 'name');

// Get todos los campos
const user = await redis.hgetall('user:1');
// { name: 'John', email: 'john@test.com' }
```

## Ejemplo Completo

Ver `clients/client-a/scenarios/redis-test.ts`:

```typescript
import { RedisHelper } from '../../../shared/redis-helper.js';

const redis = new RedisHelper();

export async function setupData() {
  // Crear usuarios y guardar en Redis
  for (let i = 0; i < 10; i++) {
    const user = createUser();
    await redis.hset(`user:${i}`, 'username', user.username);
    await redis.hset(`user:${i}`, 'password', user.password);
  }
  await redis.set('user:count', '10', 300);
}

export async function loadTest() {
  // Usar usuarios de Redis
  const userIndex = Math.floor(Math.random() * 10);
  const userData = await redis.hgetall(`user:${userIndex}`);
  
  // Login con usuario de Redis
  const loginRes = authService.login(
    userData.username, 
    userData.password
  );
  
  // Incrementar contador
  await redis.incr('stats:successful_logins');
}

export async function teardown() {
  // Limpiar datos
  for (let i = 0; i < 10; i++) {
    await redis.del(`user:${i}`);
  }
  await redis.disconnect();
}
```

## Cargar Datos desde CSV y JSON

### Archivos de Ejemplo

**users.csv:**
```csv
username,email,password,role
john_doe,john@example.com,Pass123!,user
jane_smith,jane@example.com,Pass456!,admin
```

**products.json:**
```json
{
  "products": [
    {
      "id": "prod_001",
      "name": "Laptop Pro",
      "price": 1299.99,
      "category": "electronics",
      "stock": 50
    }
  ],
  "config": {
    "tax_rate": 0.08,
    "shipping_cost": 9.99
  }
}
```

### Cargar en Redis con SharedArray

```typescript
import { SharedArray } from 'k6/data';
import { RedisHelper } from '../../../shared/redis-helper.js';

const redis = new RedisHelper();

// Cargar CSV (parsing manual)
const csvData = new SharedArray('users', function () {
  const csvContent = open('../data/users.csv');
  const lines = csvContent.split('\n');
  
  const users = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const values = lines[i].split(',');
    users.push({
      username: values[0],
      email: values[1],
      password: values[2],
      role: values[3]
    });
  }
  return users;
});

// Cargar JSON
const jsonData = new SharedArray('products', function () {
  const jsonFile = open('../data/products.json');
  const data = JSON.parse(jsonFile);
  return [data]; // Wrap in array for SharedArray
});

export async function setupData() {
  // Cargar usuarios desde CSV a Redis
  for (let i = 0; i < csvData.length; i++) {
    const user = csvData[i];
    await redis.hset(`user:${i}`, 'username', user.username);
    await redis.hset(`user:${i}`, 'email', user.email);
    await redis.hset(`user:${i}`, 'password', user.password);
    await redis.hset(`user:${i}`, 'role', user.role);
  }
  await redis.set('user:count', csvData.length.toString(), 600);

  // Cargar productos desde JSON a Redis
  const data = jsonData[0];
  const products = data.products;
  
  for (const product of products) {
    await redis.hset(`product:${product.id}`, 'name', product.name);
    await redis.hset(`product:${product.id}`, 'price', product.price.toString());
    await redis.lpush('product:ids', product.id);
  }

  // Cargar configuración
  await redis.hset('config:store', 'tax_rate', data.config.tax_rate.toString());
  await redis.hset('config:store', 'shipping_cost', data.config.shipping_cost.toString());
}
```

### Ejemplo Completo

Ver `clients/client-a/scenarios/redis-data-loader.ts` para un ejemplo completo que incluye:
- ✅ Carga de usuarios desde CSV
- ✅ Carga de productos desde JSON
- ✅ Almacenamiento en Redis con hashes y listas
- ✅ Uso de datos en load test
- ✅ Estadísticas por categoría
- ✅ Cleanup en teardown

**Ejecutar:**
```bash
node dist/core/cli.js --client=client-a --test=redis-data-loader.ts
```

## Scripts de Utilidad (Standalone)

El framework incluye scripts independientes de Node.js para gestionar datos de Redis sin ejecutar k6.

### Cargar Datos (`scripts/load-redis-data.js`)
Carga datos masivos desde archivos CSV/JSON a Redis.

```bash
# Uso básico (usa REDIS_URL del .env)
node scripts/load-redis-data.js

# Opciones personalizadas
node scripts/load-redis-data.js --users=./data/users.csv --products=./data/products.json --clear
```

**Opciones:**
- `--users`: Ruta al archivo CSV de usuarios
- `--products`: Ruta al archivo JSON de productos
- `--clear`: Limpiar datos existentes antes de cargar
- `--redis`: URL de conexión a Redis (opcional)

### Limpiar Datos (`scripts/clean-redis-data.js`)
Elimina todas las keys creadas por el framework (prefijos `user:`, `product:`, `config:`, `stats:`).

```bash
# Limpiar todo
node scripts/clean-redis-data.js

# Limpiar patrón específico
node scripts/clean-redis-data.js --pattern="user:*"
```

**Workflow Recomendado:**
1. Generar datos: `node bin/generate-data.js`
2. Cargar en Redis: `node scripts/load-redis-data.js`
3. Ejecutar Test k6: `node dist/core/cli.js ...`
4. Limpiar (opcional): `node scripts/clean-redis-data.js`

## Ejecutar Tests con Redis

### Local
```bash
# Asegurar que Redis está corriendo
redis-cli ping  # Debe retornar "PONG"

# Ejecutar test
node dist/core/cli.js --client=client-a --test=redis-test.ts
```

### Docker
```bash
# Iniciar Redis y ejecutar test
docker-compose up

# O específicamente
CLIENT=client-a TEST=redis-test.ts docker-compose up
```

## Patrones Comunes

### 1. Setup/Load/Teardown
```typescript
export async function setupData() {
  // Crear datos de prueba en Redis
}

export default async function() {
  // Usar datos de Redis
}

export async function teardown() {
  // Limpiar Redis
}
```

### 2. Pool de Usuarios
```typescript
// Setup: Crear pool
for (let i = 0; i < 100; i++) {
  await redis.hset(`user:${i}`, 'token', generateToken());
}

// Test: Usar del pool
const userId = __VU % 100;
const token = await redis.hget(`user:${userId}`, 'token');
```

### 3. Rate Limiting Distribuido
```typescript
const key = `rate:${endpoint}:${minute}`;
const count = await redis.incr(key);
await redis.expire(key, 60);

if (count > MAX_REQUESTS_PER_MINUTE) {
  console.log('Rate limit exceeded, skipping request');
  return;
}
```

### 4. Estadísticas en Tiempo Real
```typescript
// Incrementar contadores
await redis.incr('stats:requests');
await redis.incr('stats:errors');

// Leer en teardown
const requests = await redis.get('stats:requests');
const errors = await redis.get('stats:errors');
console.log(`Error rate: ${(errors/requests)*100}%`);
```

## Mejores Prácticas

### ✅ Usar TTL
Siempre establecer TTL para evitar datos huérfanos:
```typescript
await redis.set('temp:data', value, 300); // 5 minutos
```

### ✅ Namespacing
Usar prefijos para organizar keys:
```typescript
await redis.set('user:123:token', token);
await redis.set('session:abc:data', data);
```

### ✅ Cleanup en Teardown
Siempre limpiar datos en teardown:
```typescript
export async function teardown() {
  await redis.del('user:count');
  await redis.disconnect();
}
```

### ✅ Manejo de Errores
```typescript
try {
  await redis.set('key', 'value');
} catch (error) {
  console.error('Redis error:', error);
}
```

### ❌ Evitar
- No usar Redis para datos grandes (>1MB)
- No hacer operaciones síncronas en el default function
- No olvidar disconnect() en teardown

## Troubleshooting

### Redis no conecta
```bash
# Verificar que Redis está corriendo
redis-cli ping

# Verificar puerto
netstat -an | grep 6379

# Verificar URL
echo $REDIS_URL
```

### Datos no persisten
- Verificar TTL
- Verificar que no se está llamando a `del()` prematuramente

### Performance
- Usar `mget`/`mset` para operaciones múltiples
- Considerar usar pipelines para operaciones batch
- Monitorear latencia con `redis.info()`

## Variables de Entorno

```bash
# .env
REDIS_URL=redis://localhost:6379

# Docker
REDIS_URL=redis://redis:6379

# Redis con auth
REDIS_URL=redis://:password@localhost:6379
```
