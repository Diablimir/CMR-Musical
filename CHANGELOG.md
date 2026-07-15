# CHANGELOG

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-07-15 (Refactorización Mayor)

### ✨ Agregado
- **Tipos Mejorados**: Separación clara entre datos de Google Places y datos locales en Venue
- **Sistema de Validación**: Módulo `validators.ts` con funciones de validación reutilizables
- **Servicios de IA**: Integración con Gemini API para generación de biografías, análisis de feedback y estrategias de marketing
- **Hooks Personalizados**: 
  - `useLocalStorage`: Persistencia automática en localStorage
  - `useCRUD`: Operaciones CRUD reutilizables
  - `useEventFiltering`: Filtrado avanzado de eventos
  - `useEventKPIs`: Cálculo de métricas clave
  - `useSearch`: Búsqueda con debounce
  - `useAppState`: Estado global de la aplicación
- **Variables de Entorno**: Archivo `.env.local` con configuración segura
- **Documentación Completa**: README exhaustivo con guías de instalación y uso
- **ARCHITECTURE.md**: Documento de arquitectura del sistema
- **Contactos Normalizados**: Estructura mejorada de Contact con relación N:M

### 🔧 Corregido
- **vite.config.ts**: Carácter corrupto en comentario (UTF-8 `â`)
- **tsconfig.json y vite.config.ts**: Alineación de path alias `@` apuntando a `./src`
- **tipos.ts**: Campos opcionales mal definidos (e.g., correos, teléfonos)
- **Venue**: Separación de responsabilidades entre Google Places Data y Venue Scores

### 📊 Mejorado
- **Tipos**: Agregados comentarios JSDoc y ejemplos en tipos principales
- **Validación**: Rango explícito en scores (0-100), rating (0-5)
- **Timestamps**: Estandarización en ISO 8601 para todos los dates
- **Provider**: Agregados `updated_at` y `deleted_at` para soft delete
- **SocialMedia**: Estructura mejorada con `connectedPlatforms` y `connectedUsers`
- **RecordingProject**: Separación entre `status` y `stages` para evitar inconsistencias

### 🗑️ Eliminado
- Redundancia en Contact (antes solo soportaba Venue)
- Campos duplicados en tipos (e.g., status + stages en Recording)

### 🚀 Performance
- Hooks optimizados con `useCallback` para prevenir re-renders innecesarios
- Debounce en búsqueda para reducir computaciones
- Lazy loading de componentes mediante code splitting

---

## [1.0.0] - 2026-07-13 (Lanzamiento Inicial)

### ✨ Agregado
- Aplicación base generada desde Google AI Studio template
- 8 módulos principales:
  1. Dashboard (Inicio)
  2. Venues
  3. Artists
  4. Finances
  5. Legal
  6. Users
  7. Providers
  8. Production
- Autenticación básica con credentials hardcoded
- Persistencia en localStorage
- Integración con Tailwind CSS
- Componentes base con Lucide React
- Google Maps integración (visual)
- Giros de animación con Motion

### 📝 Notas de Versión
- Stack: React 19, TypeScript, Vite, Tailwind CSS
- Datos de prueba: Vladimir Belmont (artista), Foro Novedoso (venue)
- Gemini API no implementada (solo instalada)

---

## Próximas Versiones Planeadas

### [2.1.0] - TBD
- [ ] Implementación de autenticación real (JWT/OAuth2)
- [ ] Base de datos PostgreSQL
- [ ] Sincronización multi-dispositivo
- [ ] Notificaciones en tiempo real

### [3.0.0] - TBD
- [ ] API GraphQL
- [ ] App móvil con React Native
- [ ] Integración con Stripe
- [ ] Analytics avanzado
- [ ] Exportación a PDF/Excel

---

## Conveción de Commits

```
<tipo>(<alcance>): <descripción>

<cuerpo>

<pie de página>
```

### Tipos
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan funcionalidad)
- `refactor`: Refactorización de código
- `perf`: Mejoras de performance
- `test`: Agregación o actualización de tests
- `chore`: Cambios en build, dependencies, etc.

### Ejemplo
```
feat(validators): agregar validación de rango numérico

Implementa validateRange() para validar campos con restricciones 0-100.
Utilizado en Venue.scores y Event.feedback.pacingRating.

Closes #123
```
