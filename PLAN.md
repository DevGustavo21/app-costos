# Plan — Software de Control de Unidades de Negocio

> Estado: **Fase 1–2 implementadas** · Fecha: 2026-06-17

## 1. Objetivo

Sistema web multi-usuario para controlar finanzas de **múltiples unidades de negocio**, cada una con su dashboard y datos aislados. Módulos:

1. **Configuración** — categorías de costos/ingresos, catálogo de plantas.
2. **Costos** — registro de egresos con categorías dinámicas, upload de facturas.
3. **Ingresos** — registro de ingresos con líneas de venta de plantas.
4. **Presupuestos** — planificación y comparación presupuestado vs. real (modelo listo, UI parcial en dashboard).
5. **Dashboard** — KPIs, tendencias, distribución por categoría con panel de detalle.

Soporte bi-moneda: **USD por defecto**, **NIO (córdoba) opcional**, con tasa de cambio configurable por unidad y sobreescribible por registro.

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| Framework | **Next.js 14 (App Router)** + TypeScript |
| UI | React + Tailwind CSS + shadcn/ui |
| DB | **Supabase PostgreSQL** (cliente JS, sin ORM) |
| Auth | **Supabase Auth** |
| Validación | Zod (compartida cliente/servidor) |
| Formularios | react-hook-form + useFieldArray |
| Gráficos | Recharts |
| Storage | **Supabase Storage** (bucket `receipts`) |
| Deploy | Vercel + Supabase |

## 3. Decisiones clave de diseño

### 3.1 Modelo multi-tenant
- Toda fila transaccional lleva `businessUnitId`. Acceso filtrado por `Membership`.
- Un usuario puede pertenecer a varias unidades con distinto rol.

### 3.2 Roles
- `OWNER` — control total de la unidad.
- `ADMIN` — categorías, plantas, presupuestos.
- `ACCOUNTANT` — crea/edita costos e ingresos.
- `VIEWER` — solo lectura y dashboards.

### 3.3 Manejo de moneda
Cada registro guarda: `currency`, `amount`, `exchangeRate` (snapshot), `amountUsd` (persistido).

### 3.4 Categorías dinámicas
- **Cero categorías hardcodeadas** en formularios de Costos/Ingresos.
- CRUD en Configuración por tipo (`COST` | `INCOME`).
- Flag `isPlantCategory` en categorías de ingreso para activar sub-formulario de plantas.

### 3.5 Catálogo de plantas
- Modelo `Plant` con precio base; el precio negociado en venta se guarda en `IncomeLine.unitPrice` sin modificar el catálogo.

### 3.6 Layout de formularios
- Costos e Ingresos: **formulario siempre visible a la izquierda | tabla a la derecha**. Sin modales para creación.

### 3.7 Cortes mensuales
- Agrupación en servidor vía cliente Supabase + agregación en TypeScript.
- UI con acordeón; mes actual expandido por defecto.

## 4. Modelo de datos

```text
User, BusinessUnit, Membership, Setting
Category      (type, isPlantCategory, isActive, description)
Plant         (basePrice, stock?, isActive)
CostEntry     (+ receiptUrl)
IncomeEntry
IncomeLine    (plantId?, quantity, unitPrice, subtotal)
Budget, BudgetLine
```

Ver esquema SQL en `supabase/schema.sql`.

## 5. Estructura de carpetas (App Router)

```
src/
├── app/
│   ├── [businessUnitId]/
│   │   ├── layout.tsx              # Sidebar + shell
│   │   ├── page.tsx                # Dashboard
│   │   ├── costos/
│   │   ├── ingresos/
│   │   └── configuracion/
│   │       ├── categorias-costos/
│   │       ├── categorias-ingresos/
│   │       └── plantas/
│   ├── api/
│   │   ├── upload/                 # Supabase Storage
│   │   └── dashboard/category-detail/
│   ├── auth/callback/              # OAuth / magic link callback
│   ├── login/
│   └── page.tsx                    # Selector de unidad
├── components/
│   ├── config/                     # CategoryCrud, PlantCrud
│   ├── costs/                      # CostForm, CostMonthlyTable
│   ├── income/                     # IncomeForm, IncomeMonthlyTable
│   ├── dashboard/                  # KPIs, charts, CategoryDetailPanel
│   ├── layout/                     # Sidebar
│   ├── shared/                     # DatePicker, CurrencyFields, ReceiptUpload, MonthlyAccordionTable
│   └── ui/                         # shadcn
└── lib/
    ├── actions/                    # categories, plants, costs, income
    ├── queries/                    # costs, income, dashboard
    ├── validations/                # Zod schemas
    ├── db/                         # helpers, mappers
    ├── supabase/                   # client, server, middleware, admin
```

## 6. Módulos implementados

### Configuración
- CRUD categorías de costos e ingresos (nombre, descripción, activa/inactiva).
- CRUD plantas (nombre, descripción, precio base USD, stock opcional, estado).
- Flag "categoría de venta de plantas" en categorías de ingreso.

### Costos
- Formulario inline: fecha, categoría, descripción, moneda, monto, tasa NIO, foto factura (Vercel Blob, máx. 5MB).
- Tabla con acordeón mensual, filtros fecha/categoría, editar/eliminar.

### Ingresos
- Formulario inline con `useFieldArray` para líneas de plantas cuando `isPlantCategory=true`.
- Cálculo automático: `cantidad × precio_unitario` (negociado o base).
- Tabla con detalle expandible de líneas, filtros fecha/categoría/planta.

### Dashboard
- KPIs: ingresos, costos, neto, variación vs. mes anterior.
- Tendencia mensual (barras, 6 meses).
- Pie charts de distribución costos/ingresos con panel lateral de detalle al click.
- Ranking de plantas vendidas para categoría Plantas.
- Ejecución presupuestaria (si existe presupuesto activo).

## 7. Setup Supabase

### 1. Crear proyecto en [supabase.com](https://supabase.com)

### 2. Variables de entorno (ver `.env.example`)

### 3. Ejecutar esquema SQL
En el **SQL Editor** de Supabase, ejecutar en orden:
1. `supabase/schema.sql`
2. `supabase/setup.sql` (storage)

### 4. Datos demo
```bash
npm run db:seed
```

## 8. Seed y credenciales demo

```bash
npm run db:push
npm run db:seed
```

- Email: `admin@multinegocios.com`
- Password: `admin123`
- Business Unit ID: `seed-business-unit`

## 9. Variables de entorno

Ver `.env.example`.

## 10. Roadmap restante

**Fase 3 — Presupuestos (UI completa)**
- CRUD de presupuestos y líneas por categoría.

**Fase 4 — Pulido**
- Gestión de miembros/roles en UI.
- Export CSV/PDF.
- Cierre de períodos.
- Histórico de tasas de cambio.

## 11. Comandos útiles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run db:seed      # Datos iniciales (requiere SUPABASE_SERVICE_ROLE_KEY)
```
