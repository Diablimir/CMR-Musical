# ARCHITECTURE - FLAMO CRM v2.0

## Visión General de la Arquitectura

FLAMO CRM es una aplicación monolítica de single-page (SPA) construida con React y TypeScript. Sigue una arquitectura por capas con separación clara entre presentación, lógica de negocio y datos.

```
┌─────────────────────────────────────────────────┐
│           UI Layer (React Components)            │
│  (App, GlobalFilters, VenueDrawer, etc.)        │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│          Hooks Layer (Business Logic)            │
│  (useAppState, useCRUD, useEventFiltering)      │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│        Services Layer (External APIs)            │
│  (GeminiService, validators, localStorage)      │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│        Data Layer (Types & Mock Data)            │
│  (types.ts, mockData.ts, localStorage)          │
└─────────────────────────────────────────────────┘
```

---

## Estructura de Directorios

```
src/
├── index.css              # Estilos globales
├── main.tsx              # Entry point
├── App.tsx               # Componente raíz principal
├── types.ts              # Definiciones de tipos TypeScript
│
├── hooks/                # Lógica reutilizable
│   ├── useAppData.ts     # Hooks de CRUD y filtering
│   └── useAppState.ts    # Hook de estado global
│
├── utils/
│   └── validators.ts     # Funciones de validación
│
├── services/
│   └── gemini.service.ts # Integración con Gemini API
│
├── data/
│   └── mockData.ts       # Datos iniciales de prueba
│
└── components/           # Componentes React
    ├── GlobalFilters.tsx
    ├── HomeDashboard.tsx
    ├── VenueDrawer.tsx
    ├── ArtistProfile.tsx
    ├── FinancialSuite.tsx
    ├── LegalSuite.tsx
    ├── ProvidersSuite.tsx
    ├── ProductionSuite.tsx
    ├── LoginScreen.tsx
    ├── UserManagement.tsx
    └── SchemaVisualizer.tsx
```

---

## Capas de la Arquitectura

### 1. Presentación (UI Layer)

**Ubicación**: `src/components/`, `src/App.tsx`

**Responsabilidades**:
- Renderizar la interfaz
- Capturar interacciones del usuario
- Mostrar datos formateados
- Llamar funciones de negocio desde hooks

**Patrones**:
- Componentes funcionales con hooks
- Props con tipos explícitos
- Estado local para UI (e.g., `isDrawerOpen`)
- Validación antes de enviar datos

**Ejemplo**:
```typescript
// components/VenueList.tsx
function VenueList({ venues, onUpdate, onDelete }) {
  const filteredVenues = useSearch(venues, searchFn);
  
  return (
    <div>
      {filteredVenues.results.map(venue => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
```

### 2. Lógica de Negocio (Hooks Layer)

**Ubicación**: `src/hooks/`

**Responsabilidades**:
- Gestionar estado de aplicación
- Implementar operaciones CRUD
- Filtrado y búsqueda
- Cálculos de KPIs
- Persistencia en localStorage

**Hooks Principales**:

#### `useLocalStorage<T>(key: string, initialValue: T)`
Persistencia automática en localStorage.

```typescript
const [venues, setVenues] = useLocalStorage('flamo_venues', initialVenues);
```

#### `useCRUD<T>(initialData: T[], key: string)`
Operaciones CRUD reutilizables.

```typescript
const { data, add, update, softDelete, hardDelete } = useCRUD(venues, 'venues');
```

#### `useEventFiltering(events, venues, filters)`
Filtrado multidimensional de eventos.

#### `useEventKPIs(events)`
Cálculo de métricas: total, revenue, expenses, avgAttendance.

#### `useSearch<T>(items, searchFn, debounceMs)`
Búsqueda con debounce automático.

### 3. Servicios (Services Layer)

**Ubicación**: `src/services/`, `src/utils/`

**Responsabilidades**:
- Integración con APIs externas
- Validación de datos
- Lógica transversal

#### `GeminiService`
```typescript
// Interfaz
interface ContentAnalysisResult {
  success: boolean;
  content?: string;
  error?: string;
}

// Métodos
GeminiService.isAvailable(): boolean
GeminiService.generateArtistBio(...): Promise<ContentAnalysisResult>
GeminiService.analyzeEventFeedback(...): Promise<ContentAnalysisResult>
GeminiService.generateMarketingStrategy(...): Promise<ContentAnalysisResult>
```

#### `validators`
```typescript
validateRange(value, min, max, fieldName): boolean
validateISODate(dateString): boolean
validateEmail(email): boolean
validatePhone(phone): boolean
validateURL(url): boolean

// Validadores específicos
validateVenue(venue): string[]
validateArtist(artist): string[]
validateEvent(event): string[]
// ...
```

### 4. Datos (Data Layer)

**Ubicación**: `src/types.ts`, `src/data/mockData.ts`

**Responsabilidades**:
- Definir modelos de datos
- Proporcionar datos iniciales
- Persistencia en localStorage

**Fuentes de Datos**:
1. **localStorage**: Persistencia primaria
2. **mockData.ts**: Datos iniciales
3. **APIs**: Gemini (lectura), Google Places (búsqueda)

---

## Flujo de Datos

### Creación de Artista

```
User Input (Formulario)
       ↓
   ArtistProfile Component
       ↓
   validateArtist() [Validadores]
       ↓
   handleAddArtist() [App.tsx]
       ↓
   setArtists() [useState + localStorage]
       ↓
   Re-render de componentes dependientes
       ↓
   Data persisted en localStorage
```

### Filtrado de Eventos

```
User selects filters (GlobalFilters)
       ↓
   setFilters() actualiza FilterState
       ↓
   useEventFiltering(events, venues, filters) [Hook]
       ↓
   Retorna array filtrado
       ↓
   HomeDashboard usa eventos filtrados
       ↓
   KPIs recalculados automáticamente
```

### Generación de Biografía con IA

```
User hace clic en "Generar Bio"
       ↓
   ArtistProfile calls GeminiService.generateArtistBio()
       ↓
   GeminiService verifica GEMINI_API_KEY
       ↓
   Si disponible: Llama Gemini API
   Si no: Retorna error
       ↓
   Retorna ContentAnalysisResult
       ↓
   Muestra respuesta en UI
```

---

## Modelos de Datos Clave

### Artist (Artista)
```
Artist
├── Identificación
│   ├── id (PK)
│   ├── artisticName
│   └── legalName
├── Carrera
│   ├── genre
│   ├── subgenres
│   ├── stage (Desarrollo → Internacional)
│   └── startDate
├── Ubicación
│   ├── city
│   ├── state
│   └── country
├── Equipo
│   ├── members[]
│   ├── manager
│   ├── bookingAgent
│   ├── label
│   ├── publisher
│   └── distributor
├── Gestión
│   ├── isrc (Recording code)
│   ├── iswc (Work code)
│   ├── pro (Sociedad gestora)
│   └── rfc (Impuestos MX)
├── Redes Sociales
│   └── socialMedia{}
├── Pipeline
│   └── pipeline[] (18 hitos)
├── Historial
│   └── history[]
└── Auditoría
    ├── created_at
    ├── updated_at
    └── deleted_at (soft delete)
```

### Venue (Recinto)
```
Venue
├── Información Básica
│   ├── id (PK)
│   ├── name
│   ├── establishmentType
│   └── hours[]
├── Ubicación
│   ├── address
│   ├── city
│   ├── state
│   ├── country
│   ├── postalCode
│   ├── lat
│   └── lng
├── Datos de Google Places
│   ├── googlePlaces
│   │   ├── placeId
│   │   ├── rating (0-5)
│   │   ├── userRatingsCount
│   │   ├── website
│   │   └── phone
├── Scores Locales
│   ├── scores (VenueScores)
│   │   ├── rentabilidad (0-100)
│   │   ├── responseTime (0-100)
│   │   ├── puntualidadPago (0-100)
│   │   ├── negociacion (0-100)
│   │   ├── produccion (0-100)
│   │   └── hospitalidad (0-100)
├── Redes Sociales
│   ├── instagram
│   ├── facebook
│   ├── email
│   └── ...
├── Relaciones
│   ├── contactoPrincipalId (FK)
│   ├── providerIds[] (FK)
│   └── localBands[] (FK)
└── Auditoría
    ├── created_at
    ├── updated_at
    └── deleted_at
```

### Event (Evento)
```
Event
├── Información
│   ├── id (PK)
│   ├── name
│   ├── date (ISO 8601)
│   └── status (Draft|Confirmed|Completed|Cancelled)
├── Referencias
│   ├── artistId (FK)
│   ├── venueId (FK)
│   ├── tourId (FK)
│   └── guestBands[]
├── Operacional
│   ├── capacity
│   ├── attendance
│   ├── setlist[]
│   └── feedback
├── Financiero
│   ├── ticketPrice
│   ├── totalIncome
│   ├── expenses
│   └── profit
└── Auditoría
    ├── created_at
    ├── updated_at
    └── deleted_at
```

---

## Patrones de Diseño

### 1. Custom Hooks
Reutilización de lógica entre componentes.

```typescript
// useEventFiltering
const filteredEvents = useEventFiltering(events, venues, filters);
```

### 2. Lifting State Up
Estado en App.tsx, pasado a componentes.

```typescript
// App.tsx
const [venues, setVenues] = useLocalStorage(...);
return <VenueDrawer venue={currentVenue} onUpdate={setVenue} />;
```

### 3. Separation of Concerns
Validación, servicio, y UI separados.

```typescript
// validators.ts
validateVenue(venue): string[]

// GeminiService
GeminiService.generateArtistBio()

// Component
<ArtistProfile artist={artist} />.
```

### 4. Soft Delete
Mantener integridad sin borrar datos.

```typescript
// No se elimina, se marca
deleted_at: new Date().toISOString()

// Se filtra en UI
activeVenues = venues.filter(v => !v.deleted_at)
```

---

## Consideraciones de Performance

### 1. Memoización
```typescript
const filteredVenues = useMemo(() => {
  return venues.filter(searchFn);
}, [venues, searchFn]);
```

### 2. Debounce en Búsqueda
```typescript
const { query, setQuery, results } = useSearch(venues, searchFn, 300);
```

### 3. Lazy Loading de Componentes
```typescript
const FinancialSuite = lazy(() => import('./FinancialSuite'));
```

### 4. Code Splitting
Vite automáticamente divide chunks por ruta.

---

## Seguridad

### 1. Variables de Entorno
- GEMINI_API_KEY nunca en código fuente
- GOOGLE_MAPS_PLATFORM_KEY en .env.local

### 2. Validación de Entrada
Todos los datos validados antes de persistir.

### 3. Soft Delete
Datos nunca completamente eliminados.

### 4. localStorage Encryption
Considerar para datos sensibles en futuro.

---

## Roadmap de Arquitectura

### Phase 1 (Actual)
- [x] Tipos fuertemente tipados
- [x] Validación centralizada
- [x] Hooks reutilizables
- [x] localStorage persistencia

### Phase 2 (Próximo)
- [ ] Backend con Express/PostgreSQL
- [ ] API REST definida
- [ ] Autenticación JWT
- [ ] Sincronización multi-dispositivo

### Phase 3 (Futuro)
- [ ] GraphQL API
- [ ] Real-time updates (WebSockets)
- [ ] Reactive database (Firebase/Supabase)
- [ ] Mobile app (React Native)

---

## Referencias

- [React Hooks](https://react.dev/reference/react/hooks)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/)
