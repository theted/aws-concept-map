import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

// MIME type mapping for common static file types
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

// Binary file extensions that need base64 encoding
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'
]);

// Static files directory (relative to Lambda execution context)
const STATIC_DIR = join(__dirname, 'dist');

/**
 * Lambda handler for serving static files
 * Compatible with AWS Lambda Function URLs and API Gateway HTTP API
 */
export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    // Extract path from request, defaulting to index.html
    let requestPath = event.rawPath || '/';

    // Remove leading slash and default to index.html for root
    if (requestPath === '/' || requestPath === '') {
      requestPath = '/index.html';
    }

    // Security: prevent directory traversal attacks
    const normalizedPath = requestPath.replace(/\.\./g, '');

    // Build full file path
    const filePath = join(STATIC_DIR, normalizedPath);

    // Check if file exists
    if (!existsSync(filePath)) {
      // For SPA routing, serve index.html for non-file routes
      const indexPath = join(STATIC_DIR, 'index.html');
      if (existsSync(indexPath) && !extname(normalizedPath)) {
        return serveFile(indexPath, '.html');
      }

      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Not Found',
      };
    }

    const ext = extname(filePath).toLowerCase();
    return serveFile(filePath, ext);
  } catch (error) {
    console.error('Error serving request:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Internal Server Error',
    };
  }
}

/**
 * Serves a file with appropriate headers and encoding
 */
function serveFile(filePath: string, ext: string): APIGatewayProxyResultV2 {
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isBinary = BINARY_EXTENSIONS.has(ext);

  const fileContent = readFileSync(filePath);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html'
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=31536000, immutable',
    },
    body: isBinary ? fileContent.toString('base64') : fileContent.toString('utf-8'),
    isBase64Encoded: isBinary,
  };
}
