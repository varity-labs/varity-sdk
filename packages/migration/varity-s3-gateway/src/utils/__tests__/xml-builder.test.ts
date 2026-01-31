import {
  buildXMLErrorResponse,
  buildListBucketsResponse,
  buildListObjectsV2Response,
  buildCompleteMultipartUploadResponse,
  buildInitiateMultipartUploadResponse,
  buildCopyObjectResponse,
  buildDeleteObjectsResponse,
  generateRequestId,
  parseXMLBody
} from '../xml-builder';

describe('XML Builder Utilities', () => {
  describe('buildXMLErrorResponse()', () => {
    it('should build error XML with all fields', () => {
      const xml = buildXMLErrorResponse(
        'NoSuchBucket',
        'The specified bucket does not exist',
        '/test-bucket',
        'REQUEST123'
      );

      expect(xml).toContain('<Code>NoSuchBucket</Code>');
      expect(xml).toContain('<Message>The specified bucket does not exist</Message>');
      expect(xml).toContain('<Resource>/test-bucket</Resource>');
      expect(xml).toContain('<RequestId>REQUEST123</RequestId>');
    });

    it('should build error XML without optional fields', () => {
      const xml = buildXMLErrorResponse('AccessDenied', 'Access Denied');

      expect(xml).toContain('<Code>AccessDenied</Code>');
      expect(xml).toContain('<Message>Access Denied</Message>');
      expect(xml).toContain('<RequestId>');
    });

    it('should handle special characters in message', () => {
      const xml = buildXMLErrorResponse(
        'InvalidArgument',
        'Value "test&value" is invalid'
      );

      expect(xml).toContain('test&amp;value');
    });

    it('should generate different request IDs', () => {
      const xml1 = buildXMLErrorResponse('Error1', 'Message1');
      const xml2 = buildXMLErrorResponse('Error2', 'Message2');

      expect(xml1).not.toBe(xml2);
    });
  });

  describe('buildListBucketsResponse()', () => {
    it('should build list buckets XML with multiple buckets', () => {
      const buckets = [
        { name: 'bucket1', creationDate: new Date('2024-01-01T00:00:00Z') },
        { name: 'bucket2', creationDate: new Date('2024-01-02T00:00:00Z') }
      ];

      const xml = buildListBucketsResponse(buckets, 'owner123', 'Owner Name');

      expect(xml).toContain('<?xml');
      expect(xml).toContain('<ListAllMyBucketsResult');
      expect(xml).toContain('xmlns="http://s3.amazonaws.com/doc/2006-03-01/"');
      expect(xml).toContain('<ID>owner123</ID>');
      expect(xml).toContain('<DisplayName>Owner Name</DisplayName>');
      expect(xml).toContain('<Name>bucket1</Name>');
      expect(xml).toContain('<Name>bucket2</Name>');
      expect(xml).toContain('2024-01-01T00:00:00');
      expect(xml).toContain('2024-01-02T00:00:00');
    });

    it('should build list buckets XML with no buckets', () => {
      const xml = buildListBucketsResponse([], 'owner123', 'Owner Name');

      expect(xml).toContain('<ListAllMyBucketsResult');
      expect(xml).toContain('<Owner>');
      expect(xml).toContain('<Buckets>');
    });

    it('should format dates correctly', () => {
      const buckets = [
        { name: 'test-bucket', creationDate: new Date('2024-11-05T12:30:45.123Z') }
      ];

      const xml = buildListBucketsResponse(buckets, 'owner', 'Owner');

      expect(xml).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('buildListObjectsV2Response()', () => {
    it('should build list objects XML with objects', () => {
      const objects = [
        {
          key: 'file1.txt',
          size: 1024,
          etag: '"abc123"',
          lastModified: new Date('2024-01-01T00:00:00Z'),
          storageClass: 'STANDARD'
        },
        {
          key: 'file2.txt',
          size: 2048,
          etag: '"def456"',
          lastModified: new Date('2024-01-02T00:00:00Z')
        }
      ];

      const xml = buildListObjectsV2Response('test-bucket', objects);

      expect(xml).toContain('<?xml');
      expect(xml).toContain('<ListBucketResult');
      expect(xml).toContain('<Name>test-bucket</Name>');
      expect(xml).toContain('<Key>file1.txt</Key>');
      expect(xml).toContain('<Key>file2.txt</Key>');
      expect(xml).toContain('<Size>1024</Size>');
      expect(xml).toContain('<Size>2048</Size>');
      expect(xml).toContain('<ETag>"abc123"</ETag>');
      expect(xml).toContain('<StorageClass>STANDARD</StorageClass>');
    });

    it('should handle prefix parameter', () => {
      const xml = buildListObjectsV2Response('test-bucket', [], 'photos/');

      expect(xml).toContain('<Prefix>photos/</Prefix>');
    });

    it('should handle max keys parameter', () => {
      const xml = buildListObjectsV2Response('test-bucket', [], undefined, 500);

      expect(xml).toContain('<MaxKeys>500</MaxKeys>');
    });

    it('should handle pagination tokens', () => {
      const xml = buildListObjectsV2Response(
        'test-bucket',
        [],
        undefined,
        1000,
        'token123',
        'token456'
      );

      expect(xml).toContain('<IsTruncated>true</IsTruncated>');
      expect(xml).toContain('<ContinuationToken>token123</ContinuationToken>');
      expect(xml).toContain('<NextContinuationToken>token456</NextContinuationToken>');
    });

    it('should show not truncated when no next token', () => {
      const xml = buildListObjectsV2Response('test-bucket', []);

      expect(xml).toContain('<IsTruncated>false</IsTruncated>');
      expect(xml).not.toContain('<NextContinuationToken>');
    });

    it('should include key count', () => {
      const objects = [
        { key: 'f1', size: 100, etag: '"e1"', lastModified: new Date() },
        { key: 'f2', size: 200, etag: '"e2"', lastModified: new Date() }
      ];

      const xml = buildListObjectsV2Response('test-bucket', objects);

      expect(xml).toContain('<KeyCount>2</KeyCount>');
    });
  });

  describe('buildCompleteMultipartUploadResponse()', () => {
    it('should build complete multipart upload XML', () => {
      const xml = buildCompleteMultipartUploadResponse(
        'test-bucket',
        'test-key.txt',
        '"etag123"',
        'https://s3.amazonaws.com/test-bucket/test-key.txt'
      );

      expect(xml).toContain('<?xml');
      expect(xml).toContain('<CompleteMultipartUploadResult');
      expect(xml).toContain('<Location>https://s3.amazonaws.com/test-bucket/test-key.txt</Location>');
      expect(xml).toContain('<Bucket>test-bucket</Bucket>');
      expect(xml).toContain('<Key>test-key.txt</Key>');
      expect(xml).toContain('<ETag>"etag123"</ETag>');
    });
  });

  describe('buildInitiateMultipartUploadResponse()', () => {
    it('should build initiate multipart upload XML', () => {
      const xml = buildInitiateMultipartUploadResponse(
        'test-bucket',
        'large-file.bin',
        'upload123'
      );

      expect(xml).toContain('<?xml');
      expect(xml).toContain('<InitiateMultipartUploadResult');
      expect(xml).toContain('<Bucket>test-bucket</Bucket>');
      expect(xml).toContain('<Key>large-file.bin</Key>');
      expect(xml).toContain('<UploadId>upload123</UploadId>');
    });
  });

  describe('buildCopyObjectResponse()', () => {
    it('should build copy object XML', () => {
      const lastModified = new Date('2024-01-01T12:00:00Z');
      const xml = buildCopyObjectResponse('"copyetag"', lastModified);

      expect(xml).toContain('<?xml');
      expect(xml).toContain('<CopyObjectResult>');
      expect(xml).toContain('<ETag>"copyetag"</ETag>');
      expect(xml).toContain('<LastModified>2024-01-01T12:00:00');
    });
  });

  describe('buildDeleteObjectsResponse()', () => {
    it('should build delete objects XML with deleted objects', () => {
      const deleted = [
        { key: 'file1.txt', versionId: 'v1' },
        { key: 'file2.txt' }
      ];

      const xml = buildDeleteObjectsResponse(deleted, []);

      expect(xml).toContain('<?xml');
      expect(xml).toContain('<DeleteResult');
      expect(xml).toContain('<Key>file1.txt</Key>');
      expect(xml).toContain('<VersionId>v1</VersionId>');
      expect(xml).toContain('<Key>file2.txt</Key>');
      expect(xml).not.toContain('<Error>');
    });

    it('should build delete objects XML with errors', () => {
      const errors = [
        { key: 'file3.txt', code: 'AccessDenied', message: 'Access Denied' }
      ];

      const xml = buildDeleteObjectsResponse([], errors);

      expect(xml).toContain('<Error>');
      expect(xml).toContain('<Key>file3.txt</Key>');
      expect(xml).toContain('<Code>AccessDenied</Code>');
      expect(xml).toContain('<Message>Access Denied</Message>');
    });

    it('should build delete objects XML with both deleted and errors', () => {
      const deleted = [{ key: 'file1.txt' }];
      const errors = [{ key: 'file2.txt', code: 'NoSuchKey', message: 'Not found' }];

      const xml = buildDeleteObjectsResponse(deleted, errors);

      expect(xml).toContain('<Deleted>');
      expect(xml).toContain('<Error>');
    });
  });

  describe('generateRequestId()', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).not.toBe(id2);
    });

    it('should generate request ID with timestamp', () => {
      const id = generateRequestId();

      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate alphanumeric IDs', () => {
      const id = generateRequestId();

      expect(id).toMatch(/^[\da-z-]+$/);
    });
  });

  describe('parseXMLBody()', () => {
    it('should parse valid XML', async () => {
      const xml = '<Root><Item>Value</Item></Root>';
      const parsed = await parseXMLBody(xml);

      expect(parsed).toHaveProperty('Root');
      expect(parsed.Root).toHaveProperty('Item');
      expect(parsed.Root.Item[0]).toBe('Value');
    });

    it('should parse S3 error XML', async () => {
      const xml = '<Error><Code>NoSuchBucket</Code><Message>Not found</Message></Error>';
      const parsed = await parseXMLBody(xml);

      expect(parsed.Error.Code[0]).toBe('NoSuchBucket');
      expect(parsed.Error.Message[0]).toBe('Not found');
    });

    it('should handle nested XML elements', async () => {
      const xml = '<Root><Parent><Child>Value</Child></Parent></Root>';
      const parsed = await parseXMLBody(xml);

      expect(parsed.Root.Parent[0].Child[0]).toBe('Value');
    });

    it('should handle XML with attributes', async () => {
      const xml = '<Root xmlns="http://example.com"><Item>Value</Item></Root>';
      const parsed = await parseXMLBody(xml);

      expect(parsed.Root).toHaveProperty('Item');
    });

    it('should reject invalid XML', async () => {
      const xml = '<Root><Unclosed>';

      await expect(parseXMLBody(xml)).rejects.toThrow();
    });
  });

  describe('XML Format Compliance', () => {
    it('should generate well-formed XML for errors', () => {
      const xml = buildXMLErrorResponse('TestError', 'Test message');

      expect(xml).toMatch(/<Code>.*<\/Code>/);
      expect(xml).toMatch(/<Message>.*<\/Message>/);
    });

    it('should escape special characters in XML content', () => {
      const xml = buildXMLErrorResponse(
        'Error',
        'Message with <tags> & "quotes"'
      );

      expect(xml).toContain('&lt;tags&gt;');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;');
    });

    it('should include XML declaration in appropriate responses', () => {
      const xml = buildListBucketsResponse([], 'owner', 'Owner');

      expect(xml).toMatch(/^<\?xml version/);
    });

    it('should include namespace in S3 responses', () => {
      const xml = buildListBucketsResponse([], 'owner', 'Owner');

      expect(xml).toContain('xmlns="http://s3.amazonaws.com/doc/2006-03-01/"');
    });
  });
});
