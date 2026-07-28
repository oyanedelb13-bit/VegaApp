import { NextResponse } from 'next/server';
import sql from '../../../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { productos } = await request.json();
    await sql`
      UPDATE camiones
      SET productos = ${JSON.stringify(productos)}::jsonb
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
