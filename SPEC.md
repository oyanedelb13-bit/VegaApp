# SPEC.md - WebApp Gestión de Carga y Ventas (Hortalizas)

## 1. Concepto & Visión

**"La Feria en el Bolsillo"** — Una herramienta de trabajo ultra visual para la dueña de un puesto de hortalizas y su equipo. Se siente como una extensión natural del WhatsApp (donde ya gestionan pedidos) pero con la estructura y poder de un sistema profesional. La interfaz transmite frescura, orden y eficiencia: colores terrosos vibrantes, tipografía bold que se lee de un vistazo en la madrugada, y animations sutiles que guían sin retrasar.

El sistema es **tolerante a errores** — si el texto dice "zanaoria" en lugar de "zanahoria", lo corrige. Si no hay precios, igual funciona. Mobile-first porque se usa con una mano mientras la otra挑选imenta el producto.

---

## 2. Design Language

### Aesthetic Direction
**"Estética Mercado Natural"** — Inspirada en mercados de agricultores orgánicos. Colores tierra vibrantes, texturas orgánicas sutiles, cards con sombras suaves que parecen cajas de madera clara. Professional pero con calidez.

### Color Palette
```css
--color-primary: #2D5016;        /* Verde oliva profundo */
--color-primary-light: #4A7C23; /* Verde hoja */
--color-secondary: #8B4513;     /* Marrón tierra */
--color-accent: #E67E22;        /* Naranja zanahoria */
--color-accent-warm: #F39C12;   /* Ámbar cosecha */
--color-background: #FDFBF7;    /* Crema papel craft */
--color-surface: #FFFFFF;
--color-surface-alt: #F5F0E8;    /* Beige lino */
--color-text: #1A1A1A;
--color-text-secondary: #5D5D5D;
--color-success: #27AE60;
--color-warning: #F1C40F;
--color-danger: #E74C3C;
--color-reserved: #9B59B6;      /* Púrpura para reservado */
--color-available: #2ECC71;      /* Verde disponible */
```

### Typography
- **Display/Headers:** `Clamp grotesque` (Google Fonts) - Bold,紧凑, excelente legibilidad
- **Body:** `DM Sans` - Limpia, moderna, buen peso en mobile
- **Monospace (precios/cantidades):** `JetBrains Mono`

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Border radius: 8px (cards), 12px (buttons), 16px (modals), 24px (large containers)
- Shadows: `0 2px 8px rgba(0,0,0,0.08)`, `0 4px 16px rgba(0,0,0,0.12)` (elevated)

### Motion Philosophy
- **Micro-interactions:** 150-200ms ease-out para hover/active states
- **Page transitions:** 300ms ease-in-out con stagger de 50ms entre elementos
- **Modals:** Scale 0.95→1 + fade, 250ms cubic-bezier(0.34, 1.56, 0.64, 1)
- **List items:** Entrance con slide-up + fade, 300ms, stagger 40ms
- **数值变化:** Contador animado para números que cambian

### Visual Assets
- **Icon library:** Lucide React (outline, stroke-width: 2)
- **Product images:** Placeholder con gradientes de colores representando cada producto
- **Decorative:** Subtle grain texture overlay, geometric leaf patterns como accents

---

## 3. Layout & Structure

### App Shell (Mobile-First)
```
┌─────────────────────────────────────┐
│  HEADER: Logo + Camión Selector    │
│  (Sticky, 64px)                     │
├─────────────────────────────────────┤
│                                     │
│  MAIN CONTENT AREA                  │
│  (Scrollable, padding-bottom: 80px) │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  BOTTOM NAV: 4 tabs                 │
│  (Fixed, 72px, safe-area-aware)     │
└─────────────────────────────────────┘
```

### Page Structure

**1. Dashboard (Home)**
- Banner del camión activo con estado y acciones rápidas
- Cards de métricas principales (Stock Total, Reservado, Disponible)
- Consolidado de carga del día
- Accesos rápidos a funciones frecuentes

**2. Pedidos**
- Filtros: Estado (Todos/Pendiente/Pagado/Entregado)
- Lista de pedidos con preview visual
- FAB para nuevo pedido (Parser o Manual)

**3. Inventario**
- Grid de productos con stock visual (barras de progreso)
- Búsqueda y filtros
- Quick-edit inline
- Botón agregar producto

**4. Analytics**
- Métricas del camión actual
- Top clientes
- Productos más vendidos
- Ganancias estimadas

### Responsive Strategy
- **Mobile (< 640px):** Single column, bottom nav, full-width cards
- **Tablet (640-1024px):** 2-column grid, sidebar nav option
- **Desktop (> 1024px):** 3-column grid, expanded sidebar, keyboard shortcuts

---

## 4. Features & Interactions

### A. Sistema de Camiones/Jornadas

**Selector de Camión Activo**
- Banner sticky en header muestra: "Camión Miércoles 29/Jul" + estado (Abierto/Cerrado)
- Tap → Dropdown con historial de camiones
- Acciones: "Cerrar Jornada" / "Abrir Nuevo Camión"

**Crear Nuevo Camión**
- Modal con fecha (default: manaña), nombre opcional
- Copia automática de lista de productos base desde último camión
- Al crear: Stock inicial en 0, listo para cargar

**Cerrar Jornada**
- Confirmación con resumen final
- Archiva camión y sus pedidos
- Genera reporte consolidado

### B. Parser Inteligente (WhatsApp Parser)

**Flujo:**
1. User pega texto del chat + selecciona/escribe cliente
2. Click "Procesar Pedido"
3. Modal de Preview muestra:
   - Nombre cliente + timestamp
   - Grid de productos detectados (imagen + nombre + cantidad)
   - Validaciones: productos no reconocidos marcados en amarillo
   - Precio total (si hay precios) o "Precios no definidos"
   - Datos bancarios para copiar
4. Click "Confirmar y Guardar"

**Fuzzy Matching Rules:**
```
zanaoria/zanaoria/znahoria → Zanahoria
tomate cherri/tomate chery/tomate cherry → Tomate Cherry
betaraga/beteraga/beterraga → Beterraga
lechuga lisa/lesuga/lehuga → Lechuga
cebolla morada/cebolla morda → Cebolla Morada
```

**Unidades aceptadas:**
- "2 mallas" / "2m" / "2 m" → 2 unidades
- "5 kilos" / "5kg" / "5 kl" → 5 kg
- "10 un" / "10 unidades" / "10p" → 10 unidades

### C. Módulo de Pedidos Manuales

**Form:**
1. Cliente (autocomplete con búsqueda)
2. Producto (dropdown con thumbnail + nombre)
3. Cantidad (stepper + input numérico)
4. Precio unitario (opcional, usa último precio si existe)
5. Botón "+ Agregar otro" (expandir lista)
6. Botón "Guardar Pedido" → Same Preview Modal

### D. Gestión de Productos

**Card de Producto:**
```
┌────────────────────────────────────┐
│ [IMG]  Nombre Producto             │
│        ████████░░ 80/100          │
│        $XX.XX/kg    [Edit] [On/Off]│
└────────────────────────────────────┘
```

**Inline Edit:**
- Tap stock/precio → Input inline con keyboard numérico
- Enter → Guardar + toast confirmación
- Escape → Cancelar

**Agregar Nuevo Producto (Modal):**
- Foto (file upload o cámara)
- Nombre
- Stock inicial
- Precio por defecto (opcional)
- Unidad (kg/unidad/malla)

### E. Estados de Pedido

- **Pendiente de Pago:** Badge amarillo, editable
- **Pagado:** Badge verde, no editable
- **Entregado:** Badge azul, no editable
- Cambio de estado con tap rápido en badge

### F. Edge Cases

- **Producto no reconocido:** Se marca en preview con "?" y se ofrece crear nuevo
- **Cliente no existe:** Se ofrece crearlo inline
- **Stock insuficiente:** Warning visual pero permite continuar (overselling permitido)
- **Sin precios:** Sistema funciona 100%, solo oculta cálculos de dinero

---

## 5. Component Inventory

### Header
- **Default:** Logo left, Camión Selector center, Settings right
- **Scrolled:** Slight shadow, logo shrinks

### CamionSelector (Dropdown)
- **Closed:** Shows current truck name + chevron
- **Open:** Dropdown with truck list, search, "New Truck" option
- **States:** Default, hover (bg-surface-alt), selected (check icon)

### BottomNav
- 4 tabs: Dashboard, Pedidos, Inventario, Analytics
- **States:** Default (muted), active (primary color + indicator bar)
- Safe area padding for notched phones

### MetricCard
- Icon + Label + Value (large, bold)
- Optional trend indicator (↑/↓ with color)
- Tap → Navigate to detail

### ProductCard (Grid)
- Image thumbnail (48x48, rounded)
- Name + unit
- Stock bar (reserved vs available colors)
- Price
- Quick-edit affordances

### OrderCard
- Client name + avatar initial
- Product preview (icons)
- Total + status badge
- Timestamp
- Tap → Full order detail

### Modal (Preview/Confirmation)
- Backdrop blur + dim
- Centered card with close X
- Staggered content entrance
- Action buttons fixed at bottom

### TextArea (Parser)
- Large, comfortable touch target
- Placeholder with example text
- Character count (optional)

### Input / Stepper
- Clear labels, large touch targets (min 44px)
- Error state with red border + message
- Success state with green check

### Button
- **Primary:** Filled, primary color, white text
- **Secondary:** Outlined, primary border
- **Ghost:** Text only
- **Danger:** Red variant for destructive actions
- **Loading:** Spinner replaces text
- **Disabled:** 50% opacity, no pointer events

### Toast
- Bottom positioned, auto-dismiss 3s
- Success (green), Error (red), Info (blue)
- Slide-up entrance, fade-out exit

### Badge
- Small, rounded-full, uppercase text
- Colors match status semantics

### EmptyState
- Illustration (simple SVG)
- Headline + description
- CTA button

---

## 6. Technical Approach

### Stack
- **Framework:** React 18 with Vite
- **Styling:** CSS Modules + CSS Variables (no Tailwind)
- **State:** React Context + useReducer for global state
- **Storage:** localStorage (with JSON serialization)
- **Icons:** Lucide React
- **Animations:** CSS transitions + Framer Motion for complex sequences

### Data Model

```typescript
interface Camion {
  id: string;
  nombre: string;           // "Camión Miércoles 29/Jul"
  fecha: Date;
  estado: 'abierto' | 'cerrado';
  productos: CamionProducto[];
  createdAt: Date;
  closedAt?: Date;
}

interface Producto {
  id: string;
  nombre: string;
  nombreVariantes: string[]; // Para fuzzy matching
  imagen: string;            // URL o color placeholder
  unidad: 'kg' | 'unidad' | 'malla';
  precioDefault?: number;
  activo: boolean;
}

interface CamionProducto {
  productoId: string;
  stockTotal: number;
  reservado: number;
}

interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
}

interface Pedido {
  id: string;
  camionId: string;
  clienteId: string;
  items: PedidoItem[];
  estado: 'pendiente' | 'pagado' | 'entregado';
  createdAt: Date;
  updatedAt: Date;
}

interface PedidoItem {
  productoId: string;
  cantidad: number;
  precioUnitario?: number;
}
```

### Fuzzy Matching Algorithm

```javascript
// Simulated Annealing-style fuzzy match
function fuzzyMatch(input, options, threshold = 0.6) {
  const normalized = normalize(input);
  return options
    .map(opt => ({
      option: opt,
      score: levenshteinSimilarity(normalized, normalize(opt))
    }))
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)[0]?.option;
}
```

### localStorage Schema

```
hortalizas_camiones: Camion[]
hortalizas_productos: Producto[]
hortalizas_clientes: Cliente[]
hortalizas_pedidos: Pedido[]
hortalizas_activeCamionId: string
```

### File Structure

```
src/
├── main.jsx
├── App.jsx
├── App.css
├── index.css              # Global styles + CSS variables
├── context/
│   └── StoreContext.jsx    # Global state provider
├── components/
│   ├── Header/
│   ├── BottomNav/
│   ├── CamionSelector/
│   ├── MetricCard/
│   ├── ProductCard/
│   ├── OrderCard/
│   ├── Modal/
│   ├── Button/
│   ├── Input/
│   ├── Toast/
│   └── ...
├── pages/
│   ├── Dashboard/
│   ├── Pedidos/
│   ├── Inventario/
│   └── Analytics/
├── utils/
│   ├── fuzzyMatch.js
│   ├── parser.js          # WhatsApp text parser
│   ├── formatters.js
│   └── storage.js
└── data/
    └── initialData.js     # Productos base, precios
```
