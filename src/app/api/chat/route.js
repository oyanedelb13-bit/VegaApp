import { NextResponse } from 'next/server';
import sql from '../../../lib/db';
import { callGroqWithFallback, transcribeAudio } from '../../../lib/groq';

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'crear_pedido',
      description: 'Crea un pedido para un cliente con productos y cantidades. Si el cliente o algun producto no existe, primero usa crear_cliente o crear_producto.',
      parameters: {
        type: 'object',
        properties: {
          cliente_nombre: { type: 'string', description: 'Nombre del cliente (exacto o aproximado)' },
          cliente_telefono: { type: 'string', description: 'Telefono del cliente si se menciona' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                producto_nombre: { type: 'string' },
                cantidad: { type: 'number' },
                precio_unitario: { type: 'number' },
              },
              required: ['producto_nombre', 'cantidad'],
            },
          },
        },
        required: ['cliente_nombre', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cargar_stock',
      description: 'Carga stock a productos del camion activo. Acepta texto tipo "100 lechuga, 50 cebolla".',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                producto_nombre: { type: 'string' },
                cantidad: { type: 'number' },
              },
              required: ['producto_nombre', 'cantidad'],
            },
          },
        },
        required: ['items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_producto',
      description: 'Crea un producto nuevo en el catalogo cuando no existe',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          emoji: { type: 'string' },
          unidad: { type: 'string', enum: ['kg', 'unidad', 'manojo', 'bandeja', 'paquete', 'bolsa'] },
        },
        required: ['nombre', 'unidad'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_cliente',
      description: 'Crea un cliente nuevo cuando no existe',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          telefono: { type: 'string' },
        },
        required: ['nombre'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'actualizar_precio',
      description: 'Cambia el precio default de un producto',
      parameters: {
        type: 'object',
        properties: {
          producto_nombre: { type: 'string' },
          nuevo_precio: { type: 'number' },
        },
        required: ['producto_nombre', 'nuevo_precio'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'eliminar_pedido',
      description: 'Elimina un pedido. Usar con precaucion.',
      parameters: {
        type: 'object',
        properties: {
          pedido_id: { type: 'string' },
          cliente_nombre: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'eliminar_cliente',
      description: 'Elimina un cliente y todos sus pedidos. Usar con precaucion.',
      parameters: {
        type: 'object',
        properties: {
          cliente_nombre: { type: 'string' },
        },
        required: ['cliente_nombre'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_estado',
      description: 'Consulta informacion del sistema. NO requiere confirmacion, es solo lectura.',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['stock', 'pedidos', 'clientes', 'productos', 'camion'] },
          filtro: { type: 'string', description: 'Filtro opcional por nombre' },
        },
        required: ['tipo'],
      },
    },
  },
];

function buildSystemPrompt(productos, clientes, activeCamion) {
  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: '2-digit' });
  return `Eres el asistente de Vega, gestion de pedidos de una feria libre.
Fecha: ${today}
Camion activo: ${activeCamion?.nombre || 'ninguno'}

PRODUCTOS DISPONIBLES (usa nombre o variantes para fuzzy match):
${productos.map(p => `- ${p.nombre} (${p.unidad})`).join('\n')}

CLIENTES REGISTRADOS:
${clientes.length === 0 ? '(ninguno registrado aun)' : clientes.map(c => `- ${c.nombre}${c.telefono ? ' (' + c.telefono + ')' : ''}`).join('\n')}

INSTRUCCIONES:
- Interpreta pedidos en lenguaje natural chileno: "5 papas, 4 zanahorias a Maria"
- Acepta plurales, faltas de ortografia: "papas", "zanaoria", "brocoli"
- Si el producto no existe, usa crear_producto con un emoji apropiado
- Si el cliente no existe, usa crear_cliente
- Para textacos de WhatsApp, estructura TODOS los items en una sola llamada crear_pedido
- Para consultas, devuelve bullets cortos y escaneables
- Siempre responde en espanol chileno
- Se breve, ve al grano`;
}

function buildConsultaResponse(tipo, filtro, pedidos, productos, clientes, activeCamion) {
  if (tipo === 'stock' && activeCamion) {
    const items = activeCamion.productos || [];
    const filtered = filtro
      ? items.filter(i => i.productoId.includes(filtro.toLowerCase()))
      : items;
    if (filtered.length === 0) return 'No hay stock cargado.';
    return filtered
      .map(i => {
        const p = productos.find(pr => pr.id === i.productoId);
        return `- ${p?.nombre || i.productoId}: ${i.stockTotal} (reservado: ${i.reservado || 0})`;
      })
      .join('\n');
  }
  if (tipo === 'pedidos') {
    const filtered = filtro
      ? pedidos.filter(p => p.clienteId.includes(filtro.toLowerCase()))
      : pedidos;
    if (filtered.length === 0) return 'No hay pedidos.';
    return filtered.slice(0, 20).map(p => {
      const c = clientes.find(cl => cl.id === p.clienteId);
      return `- ${c?.nombre || '?'}: ${p.items.length} items, estado ${p.estado}`;
    }).join('\n');
  }
  if (tipo === 'clientes') {
    if (clientes.length === 0) return 'No hay clientes registrados.';
    return clientes.map(c => `- ${c.nombre}${c.telefono ? ' (' + c.telefono + ')' : ''}`).join('\n');
  }
  if (tipo === 'productos') {
    return productos.slice(0, 50).map(p => `- ${p.emoji || ''} ${p.nombre} (${p.unidad})`).join('\n');
  }
  if (tipo === 'camion') {
    if (!activeCamion) return 'No hay camion activo.';
    const totalStock = (activeCamion.productos || []).reduce((s, p) => s + p.stockTotal, 0);
    const totalReservado = (activeCamion.productos || []).reduce((s, p) => s + (p.reservado || 0), 0);
    return `Camion: ${activeCamion.nombre}\nEstado: ${activeCamion.estado}\nStock total: ${totalStock}\nReservado: ${totalReservado}`;
  }
  return 'Tipo de consulta no reconocido.';
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let text = '';
    let isAudio = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audioFile = formData.get('audio');
      if (audioFile && audioFile instanceof File) {
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        text = await transcribeAudio(buffer, audioFile.name || 'audio.webm');
        isAudio = true;
      } else {
        text = formData.get('text') || '';
      }
    } else {
      const body = await request.json();
      text = body.text || '';
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Texto vacio' }, { status: 400 });
    }

    const [productos, clientes, camiones, pedidos] = await Promise.all([
      sql`SELECT * FROM productos ORDER BY nombre ASC`,
      sql`SELECT * FROM clientes ORDER BY nombre ASC`,
      sql`SELECT * FROM camiones ORDER BY created_at DESC`,
      sql`SELECT * FROM pedidos ORDER BY created_at DESC LIMIT 50`,
    ]);

    const productosFormatted = productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      emoji: p.emoji,
      unidad: p.unidad,
      variantes: p.nombre_variantes || [],
    }));
    const clientesFormatted = clientes.map(c => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
    }));
    const activeCamion = camiones.find(c => c.estado === 'abierto') || null;

    const systemPrompt = buildSystemPrompt(productosFormatted, clientesFormatted, activeCamion);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ];

    const completion = await callGroqWithFallback({
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
    });

    const choice = completion.choices[0];
    const message = choice.message;
    const toolCalls = (message.tool_calls || []).map(tc => ({
      id: tc.id,
      name: tc.function.name,
      args: JSON.parse(tc.function.arguments || '{}'),
    }));

    if (toolCalls.length > 0 && toolCalls[0].function?.name === 'consultar_estado') {
      const consultaCall = toolCalls[0];
      const consultaText = buildConsultaResponse(
        consultaCall.args.tipo,
        consultaCall.args.filtro,
        pedidos,
        productosFormatted,
        clientesFormatted,
        activeCamion
      );
      const finalMessages = [
        ...messages,
        message,
        { role: 'tool', tool_call_id: consultaCall.id, content: consultaText },
      ];
      const finalCompletion = await callGroqWithFallback({ messages: finalMessages, tools: TOOLS });
      const finalReply = finalCompletion.choices[0].message.content || consultaText;
      return NextResponse.json({ reply: finalReply, toolCalls: [], audio: isAudio });
    }

    return NextResponse.json({
      reply: message.content || '',
      toolCalls,
      audio: isAudio,
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: err.message || 'Error en el chat' }, { status: 500 });
  }
}
