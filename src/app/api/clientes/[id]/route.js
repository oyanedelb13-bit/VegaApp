import { NextResponse } from 'next/server';
import sql from '../../../../lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM pedidos WHERE cliente_id = ${id}`;
    await sql`DELETE FROM clientes WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
