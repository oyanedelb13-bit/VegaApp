import { findMatchingProduct } from './fuzzyMatch';

const UNIT_PATTERNS = [
  { regex: /(\d+)\s*(?:mallas?|m)\b/gi, unidad: 'malla' },
  { regex: /(\d+)\s*(?:kilos?|kg|kl)\b/gi, unidad: 'kg' },
  { regex: /(\d+)\s*(?:unidades?|un|p|pcs?)\b/gi, unidad: 'unidad' },
  { regex: /(\d+)\s*(?:manojos?|mj)\b/gi, unidad: 'manojo' },
  { regex: /(\d+)\s*/g, unidad: 'unidad' }
];

function parseQuantity(text) {
  for (const pattern of UNIT_PATTERNS) {
    const match = new RegExp(pattern.regex.source, 'gi').exec(text);
    if (match) {
      return {
        cantidad: parseInt(match[1], 10),
        unidad: pattern.unidad,
        matched: match[0]
      };
    }
  }

  const numMatch = text.match(/(\d+)/);
  if (numMatch) {
    return {
      cantidad: parseInt(numMatch[1], 10),
      unidad: 'unidad',
      matched: numMatch[0]
    };
  }

  return null;
}

function extractProductsAndQuantities(text) {
  const lines = text.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

  const results = [];

  for (const line of lines) {
    const qtyInfo = parseQuantity(line);

    if (qtyInfo) {
      const productName = line.replace(qtyInfo.matched, '').trim();

      if (productName.length > 1) {
        results.push({
          textoOriginal: line,
          nombreProducto: productName,
          cantidad: qtyInfo.cantidad,
          unidad: qtyInfo.unidad
        });
      }
    }
  }

  return results;
}

export function parseWhatsAppText(text, productos) {
  const extracted = extractProductsAndQuantities(text);

  const parsed = extracted.map(item => {
    const producto = findMatchingProduct(item.nombreProducto, productos);

    return {
      ...item,
      productoId: producto?.id || null,
      productoNombre: producto?.nombre || item.nombreProducto,
      matched: !!producto,
      precioUnitario: producto?.precioDefault || 0
    };
  });

  return parsed;
}

export function parseStockList(text, productos) {
  const parsed = parseWhatsAppText(text, productos);

  return parsed.filter(p => p.matched).map(p => ({
    productoId: p.productoId,
    cantidad: p.cantidad,
    unidad: p.unidad
  }));
}
