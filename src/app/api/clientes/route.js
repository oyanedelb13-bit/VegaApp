import { NextResponse } from 'next/server';
import sql from '../../../lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM clientes ORDER BY nombre ASC`;
    return NextResponse.json(rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      telefono: r.telefono
    })));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id, nombre, telefono } = await request.json();
    await sql`
      INSERT INTO clientes (id, nombre, telefono)
      VALUES (${id}, ${nombre}, ${telefono || ''})
      ON CONFLICT (id) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
