CREATE TABLE IF NOT EXISTS camiones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  fecha TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierto',
  productos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TEXT,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS productos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  emoji TEXT DEFAULT '',
  unidad TEXT DEFAULT 'unidad',
  activo BOOLEAN DEFAULT true,
  precio_default NUMERIC DEFAULT 0,
  nombre_variantes JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS pedidos (
  id TEXT PRIMARY KEY,
  camion_id TEXT REFERENCES camiones(id),
  cliente_id TEXT REFERENCES clientes(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TEXT,
  updated_at TEXT
);
