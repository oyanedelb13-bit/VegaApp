import { NextResponse } from 'next/server';
import sql from '../../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    if (data.precioDefault !== undefined) {
      await sql`UPDATE productos SET precio_default = ${data.precioDefault} WHERE id = ${id}`;
    }
    if (data.nombre !== undefined) {
      await sql`UPDATE productos SET nombre = ${data.nombre} WHERE id = ${id}`;
    }
    if (data.emoji !== undefined) {
      await sql`UPDATE productos SET emoji = ${data.emoji} WHERE id = ${id}`;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM productos WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
