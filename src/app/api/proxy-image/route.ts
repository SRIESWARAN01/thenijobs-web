import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse('Failed to fetch target image', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('Error proxying image:', err);
    return new NextResponse(err?.message || 'Internal Server Error', { status: 500 });
  }
}
