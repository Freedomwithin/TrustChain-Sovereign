#!/bin/bash
set -e

# Target directory for the new standalone repo
TARGET_DIR="../trustchain-ui-standalone"

echo "Initializing standalone UI repository at $TARGET_DIR..."

# Create target directory
if [ -d "$TARGET_DIR" ]; then
    echo "Directory $TARGET_DIR already exists. Please remove it or choose another location."
    exit 1
fi
mkdir -p "$TARGET_DIR"

# Copy files from current directory (frontend/)
# We assume this script is run from inside frontend/
if [ "$(basename "$PWD")" != "frontend" ]; then
    echo "Please run this script from the frontend/ directory."
    exit 1
fi

echo "Copying files..."
cp -r . "$TARGET_DIR"

# Cleanup monorepo artifacts
echo "Cleaning up monorepo artifacts..."
rm -f "$TARGET_DIR/.pnp.cjs"
rm -f "$TARGET_DIR/.pnp.loader.mjs"
rm -rf "$TARGET_DIR/.yarn"
rm -rf "$TARGET_DIR/node_modules"
rm -f "$TARGET_DIR/init_standalone.sh" # Remove self from the new repo

# Initialize Git
echo "Initializing Git repository..."
cd "$TARGET_DIR"
git init
git add .
git commit -m "Initial commit: Standalone TrustChain UI"

echo "Done! Standalone UI is ready at $TARGET_DIR"
echo "Next steps:"
echo "1. cd $TARGET_DIR"
echo "2. yarn install"
echo "3. cp .env.example .env"
