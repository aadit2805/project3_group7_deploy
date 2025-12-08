import { notFound, redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import DocsRenderer from '../../DocsRenderer';

interface PageProps {
  params: Promise<{
    path?: string[];
  }>;
}

/**
 * Serves the frontend TypeDoc documentation
 * Handles all static files from the generated docs directory
 */
export default async function FrontendDocsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const filePath = resolvedParams.path || ['index.html'];
  let requestedPath = Array.isArray(filePath) ? filePath.join('/') : filePath;
  
  // Security: prevent directory traversal
  if (requestedPath.includes('..') || requestedPath.startsWith('/')) {
    notFound();
  }

  // Normalize path - remove leading/trailing slashes
  requestedPath = requestedPath.replace(/^\/+|\/+$/g, '');
  if (!requestedPath) {
    requestedPath = 'index.html';
  }

  const docsPath = path.join(process.cwd(), 'docs');
  const fullPath = path.join(docsPath, requestedPath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    // Try with index.html if it's a directory
    if (fs.existsSync(docsPath) && fs.statSync(docsPath).isDirectory()) {
      const indexPath = path.join(docsPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        redirect('/docs/frontend/index.html');
      }
    }
    notFound();
  }

  const stats = fs.statSync(fullPath);
  
  // If it's a directory, redirect to index.html
  if (stats.isDirectory()) {
    const indexPath = path.join(fullPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      redirect(`/docs/frontend/${requestedPath}/index.html`);
    }
    notFound();
  }

  // For non-HTML files, redirect to API route
  const ext = path.extname(fullPath);
  if (ext !== '.html') {
    // Redirect to API route which can properly serve static files
    redirect(`/api/docs/frontend/${requestedPath}`);
  }

  // Read and serve HTML file
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Extract html tag attributes (especially data-base)
  // TypeDoc uses data-base to resolve relative paths - we'll preserve it
  const htmlMatch = content.match(/<html[^>]*>/i);
  const dataBaseMatch = htmlMatch ? htmlMatch[0].match(/data-base="([^"]*)"/i) : null;
  // TypeDoc always uses "./" as data-base, meaning paths are relative to current file
  const dataBase = dataBaseMatch ? dataBaseMatch[1] : './';
  
  // Extract head and body content
  const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  
  if (!bodyMatch || !headMatch) {
    notFound();
  }

  const basePath = '/docs/frontend';
  const currentDir = path.dirname(requestedPath);
  const baseDir = currentDir === '.' || currentDir === 'index.html' ? '' : currentDir;

  // Extract CSS and JS from head
  const headContent = headMatch[1] || '';
  const cssLinks: string[] = [];
  const scripts: string[] = [];
  
  // Helper to fix relative paths
  const fixPath = (relativePath: string): string => {
    // Handle hash-only links (anchor links)
    if (relativePath.startsWith('#')) {
      return relativePath;
    }
    
    // Don't modify if already has basePath
    if (relativePath.includes(basePath)) {
      return relativePath;
    }
    
    // Don't modify external URLs
    if (relativePath.startsWith('http') || relativePath.startsWith('//')) {
      return relativePath;
    }
    
    // Split path and hash fragment
    const [pathPart, hash] = relativePath.split('#');
    
    // Handle absolute paths (starting with /)
    if (pathPart.startsWith('/')) {
      const result = `${basePath}${pathPart}`;
      return hash ? `${result}#${hash}` : result;
    }
    
    // Relative path - resolve it properly
    let resolvedPath: string;
    if (baseDir && baseDir !== '.') {
      // We're in a subdirectory, resolve relative to that
      resolvedPath = path.posix.join(baseDir, pathPart);
      // Normalize the path (remove .. and .)
      resolvedPath = path.posix.normalize(resolvedPath);
    } else {
      // We're at the root, path is relative to root
      resolvedPath = pathPart;
    }
    
    // Remove leading ./ if present
    resolvedPath = resolvedPath.replace(/^\.\//, '');
    
    const result = `${basePath}/${resolvedPath}`;
    return hash ? `${result}#${hash}` : result;
  };
  
  // Extract CSS links
  const cssRegex = /<link[^>]*href="([^"]+)"[^>]*>/gi;
  let cssMatch;
  while ((cssMatch = cssRegex.exec(headContent)) !== null) {
    const fixedPath = fixPath(cssMatch[1]);
    cssLinks.push(fixedPath);
  }

  // Extract scripts
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*><\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(headContent)) !== null) {
    const fixedPath = fixPath(scriptMatch[1]);
    scripts.push(fixedPath);
  }

  // Extract inline scripts
  const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const inlineScripts: string[] = [];
  let inlineMatch;
  while ((inlineMatch = inlineScriptRegex.exec(headContent)) !== null) {
    if (inlineMatch[1] && !inlineMatch[0].includes('src=')) {
      inlineScripts.push(inlineMatch[1]);
    }
  }
  while ((inlineMatch = inlineScriptRegex.exec(bodyMatch[1])) !== null) {
    if (inlineMatch[1] && !inlineMatch[0].includes('src=')) {
      inlineScripts.push(inlineMatch[1]);
    }
  }

  // Fix paths in body content - use the same fixPath helper
  // We need to be more thorough and catch all href attributes
  let bodyContent = bodyMatch[1]
    .replace(/href\s*=\s*"([^"]+)"/gi, (match, href) => {
      const fixed = fixPath(href);
      return `href="${fixed}"`;
    })
    .replace(/href\s*=\s*'([^']+)'/gi, (match, href) => {
      const fixed = fixPath(href);
      return `href='${fixed}'`;
    })
    .replace(/src\s*=\s*"([^"]+)"/gi, (match, src) => {
      const fixed = fixPath(src);
      return `src="${fixed}"`;
    })
    .replace(/src\s*=\s*'([^']+)'/gi, (match, src) => {
      const fixed = fixPath(src);
      return `src='${fixed}'`;
    })
    .replace(/use\s+href\s*=\s*"([^"]+)"/gi, (match, href) => {
      const fixed = fixPath(href);
      return `use href="${fixed}"`;
    });

  // Ensure arrays are plain arrays for serialization by using JSON round-trip
  // This ensures they're completely serializable
  const serializedCssLinks = JSON.parse(JSON.stringify(cssLinks));
  const serializedScripts = JSON.parse(JSON.stringify(scripts));
  const serializedInlineScripts = JSON.parse(JSON.stringify(inlineScripts));

  return (
    <DocsRenderer
      bodyContent={bodyContent}
      cssLinks={serializedCssLinks}
      scripts={serializedScripts}
      inlineScripts={serializedInlineScripts}
      dataBase={dataBase}
    />
  );
}

