# Test Types Quick Reference

## Overview

El framework soporta 4 tipos de pruebas de carga:

## 1. 🎯 Tests Unitarios (API Endpoints)

**Propósito**: Probar endpoints individuales de API de forma aislada.

**Archivo**: `clients/client-a/scenarios/example.ts`

**Características**:
- Test de un solo endpoint
- Validaciones simples (status code, response time)
- Ideal para smoke tests y health checks

**Ejemplo de ejecución**:
```bash
node dist/core/cli.js --client=client-a --env=default --test=example.ts
```

**Métricas clave**:
- `http_req_duration`
- `http_req_failed`
- `checks`

---

## 2. 🔄 Tests de Flujo (Multi-Step Scenarios)

**Propósito**: Probar flujos completos de usuario con múltiples pasos secuenciales.

**Archivo**: `clients/client-a/scenarios/auth-flow.ts`

**Características**:
- Múltiples pasos: Register → Login → Logout
- Manejo de estado entre pasos
- Ejecución condicional basada en resultados previos
- Validación de flujos end-to-end

**Ejemplo de ejecución**:
```bash
node dist/core/cli.js --client=client-a --env=default --test=auth-flow.ts
```

**Patrón típico**:
```typescript
// Step 1: Setup
const user = createTestUser();

// Step 2: Action
const loginRes = authService.login(user);
if (loginRes.status === 200) {
  // Step 3: Continuation
  const token = extractToken(loginRes);
  // ... more steps
}
```

---

## 3. 🌐 Tests de Navegador (UI Testing)

**Propósito**: Probar interacciones del navegador y validar UI.

**Archivo**: `clients/client-a/scenarios/browser-test.ts`

**Características**:
- Navegación de páginas
- Interacción con elementos (click, type, etc.)
- Captura de screenshots
- Métricas de Web Vitals (FCP, LCP)
- Validación de elementos visibles

**Ejemplo de ejecución**:
```bash
K6_BROWSER_ENABLED=true node dist/core/cli.js --client=client-a --env=default --test=browser-test.ts
```

**Métricas clave**:
- `browser_web_vital_fcp` (First Contentful Paint)
- `browser_web_vital_lcp` (Largest Contentful Paint)
- `browser_web_vital_ttfb` (Time to First Byte)

**Nota**: Requiere k6 con soporte de browser (k6 v0.43.0+)

---

## 4. 🔀 Tests Mixtos (API + Browser)

**Propósito**: Combinar pruebas de API y navegador en un solo escenario.

**Archivo**: `clients/client-a/scenarios/mixed-test.ts`

**Características**:
- Crear datos vía API
- Verificar vía UI del navegador
- Cleanup vía API
- Validación end-to-end completa

**Ejemplo de ejecución**:
```bash
K6_BROWSER_ENABLED=true node dist/core/cli.js --client=client-a --env=default --test=mixed-test.ts
```

**Flujo típico**:
```
1. API: Crear usuario/datos
2. Browser: Login vía UI
3. Browser: Verificar datos en UI
4. API: Cleanup/logout
```

**Ventajas**:
- Validación realista del flujo completo
- Combina velocidad de API con validación de UI
- Ideal para tests de regresión críticos

---

## Comparación de Test Types

| Característica | Unitario | Flujo | Navegador | Mixto |
|----------------|----------|-------|-----------|-------|
| **Velocidad** | ⚡⚡⚡ | ⚡⚡ | ⚡ | ⚡ |
| **Cobertura** | Baja | Media | Alta | Muy Alta |
| **Complejidad** | Baja | Media | Alta | Muy Alta |
| **Recursos** | Bajo | Medio | Alto | Muy Alto |
| **Uso típico** | Smoke tests | User journeys | UI validation | E2E critical paths |

---

## Configuración por Tipo de Test

### Unit Tests
```json
{
  "scenarios": {
    "smoke": {
      "executor": "constant-vus",
      "vus": 10,
      "duration": "30s"
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<500"],
    "http_req_failed": ["rate<0.01"]
  }
}
```

### Flow Tests
```json
{
  "scenarios": {
    "user_journey": {
      "executor": "ramping-vus",
      "stages": [
        { "duration": "1m", "target": 5 },
        { "duration": "3m", "target": 5 },
        { "duration": "1m", "target": 0 }
      ]
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<2000"],
    "checks": ["rate>0.95"]
  }
}
```

### Browser Tests
```json
{
  "scenarios": {
    "ui_test": {
      "executor": "constant-vus",
      "vus": 1,
      "duration": "5m",
      "options": {
        "browser": {
          "type": "chromium"
        }
      }
    }
  },
  "thresholds": {
    "browser_web_vital_lcp": ["p(95)<4000"],
    "checks": ["rate>0.9"]
  }
}
```

---

## Mejores Prácticas

### Para Tests Unitarios
- ✅ Mantener tests simples y enfocados
- ✅ Usar thresholds estrictos
- ✅ Ejecutar frecuentemente (CI/CD)

### Para Tests de Flujo
- ✅ Validar cada paso antes de continuar
- ✅ Manejar errores gracefully
- ✅ Usar sleep() apropiadamente entre pasos

### Para Tests de Navegador
- ✅ Usar selectores estables (data-testid)
- ✅ Capturar screenshots en puntos clave
- ✅ Limitar VUs (browser tests son costosos)

### Para Tests Mixtos
- ✅ Usar API para setup/cleanup
- ✅ Usar Browser solo para validación crítica
- ✅ Optimizar para reducir tiempo de ejecución

---

## Cuándo Usar Cada Tipo

### Unitarios
- ✅ Smoke tests diarios
- ✅ Health checks
- ✅ Validación rápida de endpoints

### Flujo
- ✅ User journeys críticos
- ✅ Tests de regresión
- ✅ Validación de procesos de negocio

### Navegador
- ✅ Validación de UI crítica
- ✅ Tests de accesibilidad
- ✅ Verificación de Web Vitals

### Mixtos
- ✅ Tests E2E de features críticas
- ✅ Validación pre-release
- ✅ Smoke tests comprehensivos

---

## 5. 🛠️ Uso de Helpers

El framework incluye helpers potentes para simplificar la escritura de tests.

### DataHelper (Generación de Datos)
```typescript
import { DataHelper } from '../../../shared/helpers/DataHelper.js';

// Generar usuario completo
const user = DataHelper.randomUser();
console.log(user.email, user.name.full);

// Generar datos específicos
const product = {
  name: DataHelper.randomProduct(),
  price: DataHelper.randomPrice(10, 100),
  sku: DataHelper.randomString(8).toUpperCase()
};

// Generar tarjeta de crédito válida (Luhn)
const creditCard = DataHelper.randomCreditCard();
```

### ValidationHelper (Validaciones Robustas)
```typescript
import { ValidationHelper } from '../../../shared/helpers/ValidationHelper.js';
import { check } from 'k6';

const res = http.get(url);

check(res, {
  // Validar status
  'status is 200': (r) => ValidationHelper.hasStatus(r, 200),
  
  // Validar estructura JSON
  'has user id': (r) => ValidationHelper.hasJsonStructure(r, ['id', 'email']),
  
  // Validar tiempo de respuesta
  'fast response': (r) => ValidationHelper.isResponseTimeLessThan(r, 500),
  
  // Validar contenido
  'valid email': (r) => ValidationHelper.isValidEmail(r.json('email')),
  'valid uuid': (r) => ValidationHelper.isValidUUID(r.json('id'))
});
```

### RequestHelper (Construcción de Requests)
```typescript
import { RequestHelper } from '../../../shared/helpers/RequestHelper.js';

// Headers de autenticación
const headers = RequestHelper.buildAuthHeaders(token, 'Bearer');

// Construir query string
const query = RequestHelper.buildQueryString({
  page: 1,
  limit: 10,
  sort: 'desc'
});

// Extraer valor seguro de JSON
const userId = RequestHelper.extractValue(res, 'data.users[0].id');
```

### DateHelper (Manejo de Fechas)
```typescript
import { DateHelper } from '../../../shared/helpers/DateHelper.js';

// Fecha futura para expiración
const expiryDate = DateHelper.addDays(new Date(), 30);

// Formato ISO
const isoString = DateHelper.toISOString(expiryDate);

// Verificar si una fecha es pasada
const isExpired = DateHelper.isPast(expiryDate);
```
