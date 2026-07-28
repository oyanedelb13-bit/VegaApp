import { NextResponse } from 'next/server';
import sql from '../../../lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM camiones ORDER BY created_at DESC`;
    return NextResponse.json(rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      fecha: r.fecha,
      estado: r.estado,
      productos: r.productos || [],
      createdAt: r.created_at,
      closedAt: r.closed_at
    })));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id, nombre, fecha, estado } = await request.json();
    await sql`
      INSERT INTO camiones (id, nombre, fecha, estado, productos)
      VALUES (${id}, ${nombre}, ${fecha}, ${estado || 'abierto'}, '[]'::jsonb)
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
