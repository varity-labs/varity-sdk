# Varity S3 Gateway - Test Suite

Comprehensive test coverage for the S3-compatible gateway with **90%+ coverage target**.

## Test Structure

```
tests/
├── integration/         # Integration tests (full API workflows)
│   └── s3-api.integration.test.ts
└── e2e/                # End-to-end tests (AWS CLI compatibility)
    └── aws-cli.test.ts

src/
├── auth/__tests__/     # Authentication tests
│   ├── signature-v4.test.ts      # AWS Signature V4 verification
│   └── middleware.test.ts        # Auth middleware
├── controllers/__tests__/         # Controller tests
│   ├── bucket.controller.test.ts
│   └── object.controller.test.ts
├── routes/__tests__/             # Route tests
│   └── s3.routes.test.ts
├── services/__tests__/           # Service tests
│   └── storage.service.test.ts
└── utils/__tests__/              # Utility tests
    ├── etag.test.ts
    └── xml-builder.test.ts
```

## Test Categories

### 1. Unit Tests
Located in `src/**/__tests__/` directories alongside source code.

**Coverage:**
- ✅ Authentication (AWS Signature V4)
- ✅ Auth Middleware
- ✅ Bucket Controller
- ✅ Object Controller
- ✅ Storage Service
- ✅ ETag Utilities
- ✅ XML Builder

### 2. Integration Tests
Located in `tests/integration/`

**Coverage:**
- ✅ Complete bucket lifecycle (create, list, delete)
- ✅ Complete object lifecycle (upload, download, metadata, delete)
- ✅ Object copying
- ✅ List operations with pagination
- ✅ Error handling (404, 403, 400)
- ✅ Performance tests (parallel uploads, large files)

### 3. E2E Tests
Located in `tests/e2e/`

**Coverage:**
- ✅ Real AWS CLI compatibility
- ✅ Bucket operations (`aws s3 mb`, `aws s3 ls`, etc.)
- ✅ Object operations (`aws s3 cp`, `aws s3 rm`, etc.)
- ✅ Advanced S3 API operations
- ✅ Batch operations (`aws s3 sync`)
- ✅ Error handling

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm test -- src/

# Integration tests
npm test -- tests/integration/

# E2E tests (requires server running)
npm test -- tests/e2e/

# Specific test file
npm test -- src/auth/__tests__/signature-v4.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm test -- --watch
```

## Test Coverage Goals

Target: **90%+ coverage** across all metrics

- Branches: 90%+
- Functions: 90%+
- Lines: 90%+
- Statements: 90%+

## E2E Test Prerequisites

To run E2E tests with AWS CLI:

1. **Install AWS CLI**
   ```bash
   # macOS
   brew install awscli

   # Ubuntu/Debian
   sudo apt-get install awscli

   # Windows
   # Download from https://aws.amazon.com/cli/
   ```

2. **Start S3 Gateway Server**
   ```bash
   npm run dev
   ```

3. **Run E2E Tests**
   ```bash
   npm test -- tests/e2e/
   ```

To skip E2E tests:
```bash
SKIP_E2E_TESTS=1 npm test
```

## Test Features

### Authentication Tests
- ✅ Valid/invalid signature verification
- ✅ Missing/malformed authorization headers
- ✅ Signature replay attack prevention
- ✅ Multiple credential management
- ✅ Error response formats

### Controller Tests
- ✅ Bucket validation (naming rules, IP addresses, etc.)
- ✅ Object CRUD operations
- ✅ Metadata handling
- ✅ Error scenarios (404, 409, 400, 500)
- ✅ ETag generation and validation
- ✅ Pagination support

### Service Tests
- ✅ Storage layer operations
- ✅ CID generation and mapping
- ✅ Object metadata management
- ✅ List operations with filtering
- ✅ Copy operations
- ✅ Multiple storage backends (Filecoin, Lighthouse, Pinata)

### Utils Tests
- ✅ ETag generation (MD5, CID-based)
- ✅ ETag validation and matching
- ✅ Conditional request handling (If-Match, If-None-Match)
- ✅ XML error response building
- ✅ XML list response building
- ✅ Request ID generation

### Integration Tests
- ✅ Complete API workflows
- ✅ Multi-step operations
- ✅ Parallel request handling
- ✅ Large file uploads
- ✅ Batch operations

### E2E Tests
- ✅ Real AWS CLI commands
- ✅ File upload/download verification
- ✅ Metadata preservation
- ✅ Error handling
- ✅ Performance tests

## Mocking Strategy

- **Controllers**: Mock storage service and utilities
- **Routes**: Mock controllers and middleware
- **Integration**: Real services, mock external dependencies
- **E2E**: Real server, real AWS CLI

## Test Data

Test files are created/cleaned up automatically:
- `tests/e2e/test-file.txt` - Test upload file
- `tests/e2e/downloaded-file.txt` - Downloaded file (cleaned up)
- `tests/e2e/large-file.bin` - Large file test (cleaned up)
- Temporary directories for sync tests (cleaned up)

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    npm install
    npm test -- --coverage

- name: Check coverage
  run: |
    npm test -- --coverage --coverageThreshold='{"global":{"branches":90,"functions":90,"lines":90,"statements":90}}'
```

## Debugging Tests

### Run with verbose output
```bash
npm test -- --verbose
```

### Debug specific test
```bash
node --inspect-brk node_modules/.bin/jest src/auth/__tests__/signature-v4.test.ts
```

### View test logs
```bash
npm test -- --silent=false
```

## Test Maintenance

- Keep tests focused and isolated
- Mock external dependencies
- Clean up resources in afterEach/afterAll
- Use descriptive test names
- Group related tests with describe blocks
- Update tests when API changes

## Known Issues

1. **Workspace Dependencies**: The monorepo uses `workspace:*` protocol. Run `npm install` from monorepo root or use workarounds for local development.

2. **E2E Tests**: Require S3 Gateway server to be running. Set `SKIP_E2E_TESTS=1` to skip.

3. **Authentication**: Mock authentication in most tests. Real signature verification in E2E tests.

## Contributing

When adding new features:

1. Write unit tests first (TDD)
2. Add integration tests for workflows
3. Update E2E tests for AWS CLI compatibility
4. Ensure 90%+ coverage
5. Run all tests before committing

## Test Statistics

Current test count: **150+ tests**

- Auth tests: ~20 tests
- Controller tests: ~50 tests
- Service tests: ~30 tests
- Utils tests: ~30 tests
- Route tests: ~20 tests
- Integration tests: ~15 tests
- E2E tests: ~15 tests

Total assertions: **400+**
