# GAVAC — Sistema de conteo de garrapatas con IA

MVP web (responsiva, instalable como PWA) para que un veterinario/vacunador
seleccione una finca y un animal, fotografíe el lado del cuerpo del bovino,
y obtenga un conteo automático de garrapatas (teleóginas ≥4,5mm) mediante
IA, quedando el resultado guardado en el historial del animal.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS) — desplegado en **Vercel**.
- **Supabase** — Postgres (fincas/animales/conteos), Auth (email/password), Storage (fotos).
- **OpenAI API** (visión) — conteo de garrapatas por foto, sin modelo propio entrenado.
- **PWA** (`@ducanh2912/next-pwa`) — instalable en celular.

> Nota: este proyecto usa `next build --webpack` / `next dev --webpack` en vez de
> Turbopack (el default de Next 16), porque `next-pwa` depende de un plugin de
> Webpack para generar el service worker.

## Configuración local

1. Copiá `.env.local.example` a `.env.local` y completá las variables:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: desde el
     dashboard de Supabase (Project Settings > API).
   - `SUPABASE_SERVICE_ROLE_KEY`: solo si se necesita en el futuro para
     operaciones server-side que salteen RLS (no se usa todavía en el MVP).
   - `OPENAI_API_KEY`: desde https://platform.openai.com/api-keys.
2. `npm install`
3. `npm run dev` y abrir http://localhost:3000

## Estructura

```
app/
  login/            -> pantalla de ingreso / registro
  fincas/           -> listar/buscar/crear fincas
  fincas/[id]/animales/  -> listar/buscar/crear animales de una finca + QR
  animales/[id]/conteo/  -> captura de foto + conteo IA + guardado
  scan/             -> lector de QR (finca o animal)
  api/count/        -> route handler que llama a OpenAI Vision
lib/
  supabase/         -> helpers cliente/servidor/proxy
  openai.ts         -> integración con la API de OpenAI (Structured Outputs)
  types.ts          -> tipos de dominio
supabase/           -> (migraciones aplicadas directamente vía MCP de Supabase)
```

## Alcance de este MVP

Incluye: login, fincas, animales, captura de foto, conteo con IA, guardado
del resultado, búsqueda manual y QR.

Fuera de alcance (siguiente etapa): módulo de vacunación, dashboard con
gráficos históricos, georreferenciación/clima automático por foto, roles
diferenciados (veterinario/supervisor/admin), lectura RFID, modo offline.

## Deploy

Repo conectado a Vercel (deploy automático en cada push a `main`). Variables
de entorno cargadas en Vercel > Project Settings > Environment Variables
(las mismas 4 de `.env.local`).
