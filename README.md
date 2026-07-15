<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# FLAMO CRM v2.0 Enterprise

**Sistema Integral de Gestión para Artistas, Booking y Administración de Giras**

> Una plataforma empresarial diseñada específicamente para la industria musical, combinando inteligencia artificial con herramientas de gestión profesional.

## 📋 Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tipos de Datos](#tipos-de-datos)
- [API de Validación](#api-de-validación)
- [Servicios de IA](#servicios-de-ia)
- [Desarrollo](#desarrollo)

---

## 🎯 Descripción General

FLAMO CRM es una solución empresarial completa para la gestión de carreras musicales. Facilita:

- **Gestión de Artistas**: Perfiles 360°, pipelines de desarrollo, histórico de carreras
- **Administración de Recintos**: Base de datos georreferenciada con scoring de desempeño
- **Gestión de Eventos**: Planificación, financieros y feedback en tiempo real
- **Administración de Giras**: Coordinación multivenida con seguimiento integrado
- **Suite Legal**: Gestión de contratos y documentos
- **Control Financiero**: Taquilla, gastos y análisis de rentabilidad
- **Gestión de Proveedores**: Directorio de servicios con ratings
- **Producción Musical**: Seguimiento de proyectos de grabación

---

## ✨ Características Principales

### 🎤 Gestión de Artistas
- Perfiles completos con datos legales y artísticos
- Pipeline de desarrollo con 18 hitos predefinidos
- Integración de redes sociales
- Histórico de eventos y logros
- Información ISRC, ISWC, RFC
- Afiliaciones a sociedades gestoras (SACM, ASCAP, BMI)

### 🏢 Directorio de Recintos
- Integración con Google Places API
- Geolocalización GPS
- Sistema de scoring multinivel (0-100):
  - Rentabilidad
  - Tiempo de respuesta
  - Puntualidad de pago
  - Capacidad de negociación
  - Calidad de producción
  - Hospitalidad

### 🎪 Gestión de Eventos
- Estados: Draft, Confirmed, Completed, Cancelled
- Seguimiento de capacidad vs. asistencia
- Cálculo automático de ingresos, gastos y utilidades
- Setlist integrado
- Feedback de artista y público

### 🗺️ Administración de Giras
- Vinculación de eventos múltiples
- Seguimiento por estados: Planning, Active, Completed, Cancelled
- Reportes de ingresos consolidados

### 💰 Suite Financiera
- KPIs globales: Shows completados, taquilla, gastos, utilidad neta
- Filtrado por período, artista, venue, ciudad
- Análisis de rentabilidad

### ⚖️ Módulo Legal
- Tipos de contratos: Management, Booking, Performance, Co-production, NDA, Otros
- Estados: Draft, Pending, Signed, Rejected, Active
- Almacenamiento de documentos

### 🎸 Gestión de Proveedores
- Categorías: Sonido, Iluminación, Catering, Backline, Escenografía, Seguridad
- Rating 1-5 estrellas
- Costo por show
- Vinculación a múltiples venues

### 🎙️ Proyectos de Grabación
- Estados de grabación por canción
- Etapas de producción: Pre-producción, Grabación, Mezcla, Masterización
- Seguimiento de costos y pagos
- Instrumentos y músicos de sesión

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.0.1**: UI moderna con hooks
- **TypeScript ~5.8.2**: Type safety
- **Vite 6.2.3**: Build tool rápido
- **Tailwind CSS 4.1.14**: Estilos utilitarios
- **Motion 12.23.24**: Animaciones fluidas
- **Lucide React 0.546.0**: Iconografía
- **Leaflet 1.9.4**: Mapas (geolocalización)
- **Google Maps React 1.9.0**: Integración de mapas

### IA y APIs
- **Google Genai 2.4.0**: Integración con Gemini API
- **Google Maps Platform API**: Autocomplete y geolocalización

### Backend y DevOps
- **Express 4.21.2**: Servidor web (opcional)
- **Dotenv 17.2.3**: Variables de entorno

### Desarrollo
- **ESBuild 0.25.0**: Bundler de JavaScript
- **TSX 4.21.0**: Ejecución de TypeScript
- **Autoprefixer 10.4.21**: Prefijos CSS

---

## 📦 Requisitos Previos

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x o **yarn** ≥ 3.x
- **Gemini API Key** (opcional, para features de IA)
- **Google Maps API Key** (opcional, para autocomplete de lugares)

---

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/Diablimir/CMR-Musical.git
cd CMR-Musical
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.local.example .env.local
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## ⚙️ Configuración

### Variables de Entorno (.env.local)

```env
# Gemini AI API Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps API Key
VITE_GOOGLE_MAPS_PLATFORM_KEY=your_google_maps_key_here

# Configuración de la aplicación
VITE_APP_NAME=FLAMO CRM
VITE_APP_VERSION=2.0
VITE_ENVIRONMENT=development

# Variables de desarrollo
DISABLE_HMR=false
```

### Obtener API Keys

#### Gemini API
1. Visita [ai.google.dev](https://ai.google.dev)
2. Crea un nuevo API Key
3. Agrega a `.env.local`

#### Google Maps API
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Habilita Google Places API
4. Crea una API Key con restricciones
5. Agrega a `.env.local`

---

## 💻 Uso

### Scripts NPM

```bash
# Desarrollo
npm run dev          # Inicia Vite dev server en puerto 3000

# Producción
npm run build        # Compila para producción
npm run preview      # Previsualiza build de producción

# Limpieza
npm run clean        # Elimina dist/ y server.js

# Linting
npm run lint         # Verifica tipos con TypeScript
```

### Acceso a la Aplicación

**Credenciales por defecto:**
- **Usuario**: `admin` / **Contraseña**: `flamo2026`
- **Usuario**: `vlad` / **Contraseña**: `vlad2026`

### Módulos Principales

1. **Inicio**: Dashboard con KPIs globales
2. **Venues**: Directorio de recintos con Google Places API
3. **Artistas**: Gestión de perfiles y pipelines
4. **Proveedores**: Directorio de servicios
5. **Producción**: Seguimiento de grabaciones
6. **Finanzas**: Análisis financiero y reportes
7. **Legal**: Gestión de contratos
8. **Usuarios**: Control de acceso
9. **Esquema & DB**: Visualización de estructura (modo dev)

---

## 📁 Estructura del Proyecto

```
src/
├── types.ts              # Definiciones de tipos TypeScript
├── main.tsx             # Punto de entrada
├── App.tsx              # Componente raíz
├── index.css            # Estilos globales
├── hooks/
│   ├── useAppData.ts    # Hooks de gestión de datos
│   └── useAppState.ts   # Hook de estado global
├── utils/
│   └── validators.ts    # Funciones de validación
├── services/
│   └── gemini.service.ts # Integración con Gemini API
├── data/
│   └── mockData.ts      # Datos iniciales
└── components/          # Componentes React
    ├── GlobalFilters.tsx
    ├── VenueDrawer.tsx
    ├── ArtistProfile.tsx
    ├── FinancialSuite.tsx
    ├── LegalSuite.tsx
    ├── ProvidersSuite.tsx
    ├── ProductionSuite.tsx
    ├── HomeDashboard.tsx
    ├── LoginScreen.tsx
    ├── UserManagement.tsx
    └── SchemaVisualizer.tsx
```

---

## 📊 Tipos de Datos

### Artist
```typescript
interface Artist {
  id: string;
  artisticName: string;
  legalName: string;
  genre: string;
  subgenres: string[];
  stage: ArtistStage; // Desarrollo, Emergente, Consolidado, etc.
  pipeline: PipelineItem[];
  socialMedia: SocialMedia;
  isrc?: string; // International Standard Recording Code
  iswc?: string; // International Standard Musical Work Code
  pro?: string; // Sociedad gestora (SACM, ASCAP, BMI)
  // ...
}
```

### Venue
```typescript
interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  googlePlaces: GooglePlacesData; // De Google Places API
  scores: VenueScores; // Métricas 0-100
  // ...
}

interface VenueScores {
  rentabilidad: number; // 0-100
  responseTime: number; // 0-100
  puntualidadPago: number; // 0-100
  negociacion: number; // 0-100
  produccion: number; // 0-100
  hospitalidad: number; // 0-100
}
```

### Event
```typescript
interface Event {
  id: string;
  name: string;
  artistId: string;
  venueId: string;
  date: string; // ISO 8601
  capacity: number;
  attendance: number;
  ticketPrice: number;
  totalIncome: number;
  expenses: number;
  profit: number;
  status: 'Draft' | 'Confirmed' | 'Completed' | 'Cancelled';
  feedback?: EventFeedback;
  // ...
}
```

Para más tipos, ver `src/types.ts`

---

## ✅ API de Validación

Todos los validadores están en `src/utils/validators.ts`:

```typescript
// Validación de rango
validateRange(value: number, min: number, max: number, fieldName: string): boolean

// Validación de fecha ISO 8601
validateISODate(dateString: string): boolean

// Validación de email
validateEmail(email: string): boolean

// Validación de teléfono
validatePhone(phone: string): boolean

// Validación de URL
validateURL(url: string): boolean

// Validadores de entidades
validateVenue(venue: Partial<Venue>): string[]
validateArtist(artist: Partial<Artist>): string[]
validateEvent(event: Partial<Event>): string[]
validateProvider(provider: Partial<Provider>): string[]
validateRecordingProject(project: Partial<RecordingProject>): string[]
validateContact(contact: Partial<Contact>): string[]

// Validación genérica
validate<T>(data: T, validatorFn: (data: Partial<T>) => string[]): { isValid: boolean; errors: string[] }
```

**Ejemplo de uso:**
```typescript
import { validateVenue } from '@/utils/validators';

const errors = validateVenue(myVenue);
if (errors.length > 0) {
  console.error('Errores de validación:', errors);
}
```

---

## 🤖 Servicios de IA

La integración con Gemini API está en `src/services/gemini.service.ts`:

```typescript
// Genera biografía de artista
await GeminiService.generateArtistBio(artistName, genre, highlights)

// Analiza feedback de eventos
await GeminiService.analyzeEventFeedback(feedback)

// Genera estrategia de marketing
await GeminiService.generateMarketingStrategy(artistName, targetAudience)

// Verifica si el servicio está disponible
GeminiService.isAvailable(): boolean
```

**Ejemplo:**
```typescript
import { GeminiService } from '@/services/gemini.service';

const result = await GeminiService.generateArtistBio(
  'Vladimir Belmont',
  'Neo-Classical Electronic',
  ['IDM', 'Ambient', 'Modular Synthesis']
);

if (result.success) {
  console.log(result.content);
} else {
  console.error(result.error);
}
```

---

## 🧑‍💻 Desarrollo

### Formato de Código
- Usar **Prettier** (configurado automáticamente)
- ESLint para linting
- TypeScript `strict: true`

### Estándares
- Componentes funcionales con hooks
- Props con tipos explícitos
- Comentarios JSDoc para funciones públicas
- Nombres descriptivos en español e inglés

### Agregar Nuevas Validaciones

1. Crear función en `src/utils/validators.ts`
2. Exportar la función
3. Usar en componentes o servicios

### Agregar Nuevos Servicios de IA

1. Agregar método a `GeminiService` en `src/services/gemini.service.ts`
2. Implementar manejo de errores
3. Retornar interfaz `ContentAnalysisResult`

---

## 📝 Licencia

SPDX-License-Identifier: Apache-2.0

---

## 👤 Autor

**Vladimir Belmont Guerrero**
- GitHub: [@Diablimir](https://github.com/Diablimir)
- Email: A010164643@my.uvm.edu.mx

---

## 🚀 Roadmap Futuro

- [ ] Autenticación con OAuth2
- [ ] Base de datos PostgreSQL
- [ ] API GraphQL
- [ ] Integración con Stripe para pagos
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Dashboard analítico avanzado
- [ ] Exportación a PDF/Excel
- [ ] Sincronización con Spotify API
- [ ] App móvil con React Native

---

**FLAMO CRM v2.0 Enterprise** — Propiedad intelectual exclusiva de gestión de talento musical.
