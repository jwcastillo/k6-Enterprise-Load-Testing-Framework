# reports/

Esta carpeta contiene los reportes HTML generados por `bin/report.js`.

## Estructura

Los reportes se organizan por nombre de prueba:

```
reports/
├── test-helpers/
│   ├── test-helpers_2025-11-27_12-30-45.html
│   ├── test-helpers_2025-11-27_12-30-45_metadata.json
│   └── test-helpers_2025-11-27_14-15-30.html
├── api-test/
│   ├── api-test_2025-11-27_10-00-00.html
│   └── api-test_2025-11-27_10-00-00_metadata.json
└── redis-data-loader/
    ├── redis-data-loader_2025-11-27_11-20-15.html
    └── redis-data-loader_2025-11-27_11-20-15_metadata.json
```

## Formato de Archivos

### HTML Report
- **Nombre**: `<test-name>_YYYY-MM-DD_HH-mm-ss.html`
- **Contenido**: Reporte visual con métricas, checks y estadísticas

### Metadata JSON
- **Nombre**: `<test-name>_YYYY-MM-DD_HH-mm-ss_metadata.json`
- **Contenido**: Información del test en formato JSON
  ```json
  {
    "testName": "test-helpers",
    "timestamp": "2025-11-27T15:30:45.123Z",
    "reportFile": "test-helpers_2025-11-27_12-30-45.html",
    "inputFile": "output.json",
    "totalChecks": 34,
    "passedChecks": 34,
    "failedChecks": 0,
    "duration": 8990,
    "metricsCount": 15
  }
  ```

## Uso

```bash
# Generar reporte automáticamente
k6 run --out json=output.json test.js
node bin/report.js --input=output.json

# Especificar nombre de test
node bin/report.js --input=output.json --test=mi-test

# Especificar ubicación personalizada
node bin/report.js --input=output.json --output=custom/path/report.html
```

## Limpieza

Los reportes se acumulan en esta carpeta. Se recomienda limpiar reportes antiguos periódicamente:

```bash
# Eliminar reportes de más de 30 días
find reports -name "*.html" -mtime +30 -delete
find reports -name "*_metadata.json" -mtime +30 -delete
```
