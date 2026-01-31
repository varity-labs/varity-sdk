#!/bin/bash

echo "🔍 Varity GCS Gateway - Installation Verification"
echo "=================================================="
echo ""

# Check directory structure
echo "✅ Checking directory structure..."
dirs=("src" "src/auth" "src/controllers" "src/routes" "src/services" "src/middleware" "src/types" "src/utils" "tests" "examples")
for dir in "${dirs[@]}"; do
  if [ -d "$dir" ]; then
    echo "  ✓ $dir"
  else
    echo "  ✗ $dir (MISSING)"
  fi
done
echo ""

# Check critical files
echo "✅ Checking critical files..."
files=(
  "package.json"
  "tsconfig.json"
  "README.md"
  "src/server.ts"
  "src/auth/oauth2.ts"
  "src/auth/service-account.ts"
  "src/services/storage.service.ts"
  "src/services/resumable-upload.service.ts"
  "src/controllers/bucket.controller.ts"
  "src/controllers/object.controller.ts"
  ".env.example"
)
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
  fi
done
echo ""

# Count files
echo "📊 File Statistics:"
echo "  TypeScript files: $(find src -name "*.ts" | wc -l)"
echo "  Test files: $(find tests -name "*.test.ts" | wc -l)"
echo "  Example files: $(find examples -name "*.ts" | wc -l)"
echo "  Total lines of code: $(find src -name "*.ts" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo ""

# Check package.json
echo "📦 Package Information:"
if [ -f "package.json" ]; then
  echo "  Name: $(cat package.json | grep '"name"' | head -1 | cut -d'"' -f4)"
  echo "  Version: $(cat package.json | grep '"version"' | head -1 | cut -d'"' -f4)"
  echo "  Description: $(cat package.json | grep '"description"' | head -1 | cut -d'"' -f4)"
fi
echo ""

echo "✅ Installation verification complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure"
echo "  2. Run 'pnpm install' to install dependencies"
echo "  3. Run 'pnpm dev' to start development server"
echo "  4. Run 'pnpm test' to run tests"
echo ""
