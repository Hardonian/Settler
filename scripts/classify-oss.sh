#!/bin/bash
# Classify files as OSS_PUBLIC or private
# This script finds all files marked as OSS_PUBLIC and lists them for syncing

OSS_FILES=""

# Find all files marked as OSS_PUBLIC
find . -type f \( -name "OSS_PUBLIC" -o -name ".oss-public" \) | while read marker; do
  dir=$(dirname "$marker")
  find "$dir" -type f ! -name "OSS_PUBLIC" ! -name ".oss-public" ! -path "*/.git/*" ! -path "*/.turbo/*" ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/build/*" | while read file; do
    echo "$file"
  done
done

# Also check for explicit OSS_PUBLIC directories
for dir in packages/sdk packages/sdk-python packages/sdk-go packages/sdk-ruby packages/api-client packages/protocol packages/react-settler packages/cli examples docs/public; do
  if [ -d "$dir" ] && [ ! -f "$dir/.private" ]; then
    find "$dir" -type f ! -path "*/.git/*" ! -path "*/.turbo/*" ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/build/*" ! -name "*.private" | while read file; do
      echo "$file"
    done
  fi
done
