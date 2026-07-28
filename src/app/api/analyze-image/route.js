import { NextResponse } from 'next/server';
import { analyzeImage } from '../../../lib/groq';

export async function POST(request) {
  try {
    const { image, message } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    const result = await analyzeImage(image, message);
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
