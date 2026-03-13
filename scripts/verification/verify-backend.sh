#!/bin/bash
# Quick verification script for backend proxy implementation

echo "=========================================="
echo "Backend Proxy Verification Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check backend files
echo "1. Checking backend files..."
BACKEND_FILES=(
    "backend/server.js"
    "backend/package.json"
    "backend/.env.example"
    "backend/README.md"
    "backend/DEPLOYMENT.md"
    "backend/TESTING.md"
    "backend/MIGRATION.md"
    "backend/SECURITY_ANALYSIS.md"
    "backend/config/index.js"
    "backend/middleware/validation.js"
    "backend/middleware/rateLimit.js"
    "backend/middleware/cache.js"
    "backend/routes/fueleconomy.js"
)

ALL_FILES_EXIST=true
for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ${GREEN}✅${NC} $file"
    else
        echo "   ${RED}❌${NC} $file (missing)"
        ALL_FILES_EXIST=false
    fi
done
echo ""

# Check frontend changes
echo "2. Checking frontend changes..."
FRONTEND_FILES=(
    "src/services/vehicleApiService.js"
    "vite.config.js"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Check if CORS_PROXY is removed from vehicleApiService.js
        if [[ "$file" == *"vehicleApiService.js"* ]]; then
            if grep -q "CORS_PROXY = 'https://corsproxy.io" "$file"; then
                echo "   ${RED}❌${NC} $file (CORS_PROXY still present)"
                ALL_FILES_EXIST=false
            else
                echo "   ${GREEN}✅${NC} $file (CORS_PROXY removed)"
            fi
        else
            echo "   ${GREEN}✅${NC} $file"
        fi
    else
        echo "   ${RED}❌${NC} $file (missing)"
        ALL_FILES_EXIST=false
    fi
done
echo ""

# Check environment configuration
echo "3. Checking environment configuration..."
ENV_FILES=(
    ".env.development"
    ".env.example"
)

for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Check for VITE_USE_PROXY variable
        if grep -q "VITE_USE_PROXY" "$file"; then
            echo "   ${GREEN}✅${NC} $file (VITE_USE_PROXY configured)"
        else
            echo "   ${YELLOW}⚠️${NC} $file (VITE_USE_PROXY not found)"
        fi
    else
        echo "   ${YELLOW}⚠️${NC} $file (optional, not found)"
    fi
done
echo ""

# Check if backend is configured
echo "4. Checking backend configuration..."
if [ -f "backend/.env" ]; then
    echo "   ${GREEN}✅${NC} backend/.env exists"
    if grep -q "PORT=" backend/.env; then
        echo "   ${GREEN}✅${NC} PORT configured"
    else
        echo "   ${YELLOW}⚠️${NC} PORT not configured"
    fi
    if grep -q "CORS_ORIGINS=" backend/.env; then
        echo "   ${GREEN}✅${NC} CORS_ORIGINS configured"
    else
        echo "   ${YELLOW}⚠️${NC} CORS_ORIGINS not configured"
    fi
else
    echo "   ${YELLOW}⚠️${NC} backend/.env not found (run: cp backend/.env.example backend/.env)"
fi
echo ""

# Check if node modules are installed
echo "5. Checking dependencies..."
if [ -d "backend/node_modules" ]; then
    echo "   ${GREEN}✅${NC} Backend dependencies installed"
else
    echo "   ${YELLOW}⚠️${NC} Backend dependencies not installed (run: cd backend && npm install)"
fi
echo ""

# Summary
echo "=========================================="
if [ "$ALL_FILES_EXIST" = true ]; then
    echo "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. cd backend"
    echo "2. cp .env.example .env"
    echo "3. Edit .env with your values"
    echo "4. npm install"
    echo "5. npm start"
    echo ""
    echo "Then test the proxy:"
    echo "curl http://localhost:3000/health"
    exit 0
else
    echo "${RED}❌ Some checks failed${NC}"
    echo ""
    echo "Please review the output above and fix any issues."
    exit 1
fi
