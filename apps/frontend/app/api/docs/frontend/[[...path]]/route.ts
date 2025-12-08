import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to serve static assets from frontend TypeDoc documentation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = resolvedParams.path || [];
    let requestedPath = Array.isArray(filePath) ? filePath.join('/') : filePath;
    
    console.log('[API Frontend Docs] Request received:', {
      filePath,
      requestedPath,
      params: resolvedParams,
    });
    
    // Normalize path - remove leading/trailing slashes
    requestedPath = requestedPath.replace(/^\/+|\/+$/g, '');
    
    if (!requestedPath) {
      console.error('[API Frontend Docs] Empty path');
      return new NextResponse('Not Found', { status: 404 });
    }
    
    // Security: prevent directory traversal
    if (requestedPath.includes('..') || requestedPath.startsWith('/')) {
      console.error('[API Frontend Docs] Invalid path:', requestedPath);
      return new NextResponse('Not Found', { status: 404 });
    }

    const docsPath = path.join(process.cwd(), 'docs');
    const fullPath = path.join(docsPath, requestedPath);

    console.log('[API Frontend Docs] Path resolution:', {
      requestedPath,
      fullPath,
      docsPath,
      exists: fs.existsSync(fullPath),
    });

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error('[API Frontend Docs] File not found:', {
        requestedPath,
        fullPath,
        docsPath,
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
    console.error('[API Frontend Docs] Error:', {
      error: error?.message || error,
      stack: error?.stack,
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

