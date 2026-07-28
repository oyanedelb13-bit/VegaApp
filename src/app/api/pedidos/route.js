import { NextResponse } from 'next/server';
import sql from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const camionId = searchParams.get('camion_id');
    let rows;
    if (camionId) {
      rows = await sql`SELECT * FROM pedidos WHERE camion_id = ${camionId} ORDER BY created_at DESC`;
    } else {
      rows = await sql`SELECT * FROM pedidos ORDER BY created_at DESC`;
    }
    return NextResponse.json(rows.map(r => ({
      id: r.id,
      camionId: r.camion_id,
      clienteId: r.cliente_id,
      items: r.items || [],
      estado: r.estado,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    })));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id, camionId, clienteId, items, estado } = await request.json();
    const now = new Date().toISOString();
    await sql`
      INSERT INTO pedidos (id, camion_id, cliente_id, items, estado, created_at, updated_at)
      VALUES (${id}, ${camionId}, ${clienteId}, ${JSON.stringify(items)}::jsonb, ${estado || 'pendiente'}, ${now}, ${now})
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
