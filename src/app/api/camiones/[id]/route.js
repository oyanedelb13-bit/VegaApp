import { NextResponse } from 'next/server';
import sql from '../../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await sql`
      UPDATE camiones
      SET estado = ${data.estado}, closed_at = ${data.closedAt || null}
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
