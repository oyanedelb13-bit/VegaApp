import { NextResponse } from 'next/server';
import sql from '../../../lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM productos ORDER BY nombre ASC`;
    return NextResponse.json(rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      emoji: r.emoji,
      unidad: r.unidad,
      activo: r.activo,
      precioDefault: r.precio_default,
      nombreVariantes: r.nombre_variantes || []
    })));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id, nombre, emoji, unidad, activo, precioDefault, nombreVariantes } = await request.json();
    await sql`
      INSERT INTO productos (id, nombre, emoji, unidad, activo, precio_default, nombre_variantes)
      VALUES (${id}, ${nombre}, ${emoji || ''}, ${unidad || 'unidad'}, ${activo !== false}, ${precioDefault || 0}, ${JSON.stringify(nombreVariantes || [])}::jsonb)
      ON CONFLICT (id) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
