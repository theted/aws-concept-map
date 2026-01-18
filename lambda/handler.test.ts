import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

// Use vi.hoisted to create mocks that are available during vi.mock hoisting
const { mockExistsSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

// Mock fs module - this is hoisted to top of file
vi.mock('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
}));

// Import handler after mocking
import { handler } from './handler';

// Helper to create minimal event objects
function createEvent(path: string): APIGatewayProxyEventV2 {
  return {
    rawPath: path,
    version: '2.0',
    routeKey: '$default',
    rawQueryString: '',
    headers: {},
    requestContext: {
      accountId: '123456789012',
      apiId: 'api-id',
      domainName: 'id.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'id',
      http: {
        method: 'GET',
        path: path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      requestId: 'id',
      routeKey: '$default',
      stage: '$default',
      time: '12/Mar/2020:19:03:58 +0000',
      timeEpoch: 1583348638390,
    },
    isBase64Encoded: false,
  };
}

describe('Lambda Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Path handling', () => {
    it('serves index.html for root path', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('<html></html>'));

      const result = await handler(createEvent('/'));

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Content-Type']).toBe('text/html; charset=utf-8');
      expect(mockExistsSync).toHaveBeenCalled();
    });

    it('serves requested file with correct MIME type', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('body { color: red; }'));

      const result = await handler(createEvent('/style.css'));

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Content-Type']).toBe('text/css; charset=utf-8');
    });

    it('serves JavaScript files with correct MIME type', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('console.log("test");'));

      const result = await handler(createEvent('/main.js'));

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Content-Type']).toBe('application/javascript; charset=utf-8');
    });

    it('prevents directory traversal attacks', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        // Only return true for paths without ..
        return !String(path).includes('..');
      });
      mockReadFileSync.mockReturnValue(Buffer.from('<html></html>'));

      await handler(createEvent('/../../../etc/passwd'));

      // Should not include .. in the resolved path
      expect(mockExistsSync).toHaveBeenCalled();
      const calledPath = mockExistsSync.mock.calls[0][0] as string;
      expect(calledPath).not.toContain('..');
    });
  });

  describe('404 handling', () => {
    it('returns 404 for non-existent files', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await handler(createEvent('/non-existent.txt'));

      expect(result.statusCode).toBe(404);
      expect(result.body).toBe('Not Found');
    });

    it('falls back to index.html for non-file routes (SPA support)', async () => {
      mockExistsSync
        .mockReturnValueOnce(false)  // First check for /some-route
        .mockReturnValueOnce(true);  // Second check for index.html
      mockReadFileSync.mockReturnValue(Buffer.from('<html></html>'));

      const result = await handler(createEvent('/some-route'));

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Content-Type']).toBe('text/html; charset=utf-8');
    });
  });

  describe('Binary file handling', () => {
    it('serves PNG files as base64 encoded', async () => {
      mockExistsSync.mockReturnValue(true);
      const pngData = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
      mockReadFileSync.mockReturnValue(pngData);

      const result = await handler(createEvent('/image.png'));

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Content-Type']).toBe('image/png');
      expect(result.isBase64Encoded).toBe(true);
      expect(result.body).toBe(pngData.toString('base64'));
    });

    it('serves SVG files as text (not base64)', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('<svg></svg>'));

      const result = await handler(createEvent('/icon.svg'));

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Content-Type']).toBe('image/svg+xml');
      expect(result.isBase64Encoded).toBe(false);
    });
  });

  describe('Cache headers', () => {
    it('sets no-cache for HTML files', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('<html></html>'));

      const result = await handler(createEvent('/index.html'));

      expect(result.headers?.['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    });

    it('sets long cache for static assets', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('body {}'));

      const result = await handler(createEvent('/style.css'));

      expect(result.headers?.['Cache-Control']).toBe('public, max-age=31536000, immutable');
    });
  });

  describe('Error handling', () => {
    it('returns 500 on unexpected errors', async () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await handler(createEvent('/'));

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe('Internal Server Error');
    });
  });
});
