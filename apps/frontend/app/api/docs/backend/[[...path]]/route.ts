import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to serve static assets from backend TypeDoc documentation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = resolvedParams.path || [];
    let requestedPath = filePath.join('/');
    
    // Normalize path
    requestedPath = requestedPath.replace(/^\/+|\/+$/g, '');
    
    // Security: prevent directory traversal
    if (requestedPath.includes('..') || requestedPath.startsWith('/')) {
      console.error('[API Backend Docs] Invalid path:', requestedPath);
      return new NextResponse('Not Found', { status: 404 });
    }

    // Backend docs are in the backend directory
    const backendDocsPath = path.join(process.cwd(), '..', 'backend', 'docs');
    const fullPath = path.join(backendDocsPath, requestedPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error('[API Backend Docs] File not found:', {
        requestedPath,
        fullPath,
        backendDocsPath,
        filePath,
      });
      return new NextResponse('Not Found', { status: 404 });
    }

  const stats = fs.statSync(fullPath);
  if (stats.isDirectory()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Read file
  const fileContent = fs.readFileSync(fullPath);
  
  // Determine content type
  const ext = path.extname(fullPath);
  const contentTypeMap: Record<string, string> = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
  };

  const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('[API Backend Docs] Error:', {
      error: error?.message || error,
      stack: error?.stack,
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

