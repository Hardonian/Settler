#!/usr/bin/env python3
"""
Audit script to find missing tables by comparing Prisma schema with migrations.
Generates consolidated migration SQL for all missing tables.
"""

import re
import os
from pathlib import Path
from typing import Set, Dict, List

def extract_prisma_tables() -> Set[str]:
    """Extract table names from Prisma schema files."""
    tables = set()
    
    schema_files = [
        'prisma/schema.prisma',
        'prisma/schema-additions.prisma'
    ]
    
    for schema_file in schema_files:
        if not os.path.exists(schema_file):
            continue
            
        with open(schema_file, 'r') as f:
            content = f.read()
            # Find all @@map("table_name") patterns
            for match in re.finditer(r'@@map\("([^"]+)"\)', content):
                tables.add(match.group(1))
    
    return tables

def extract_migration_tables() -> Set[str]:
    """Extract table names from SQL migration files."""
    tables = set()
    migrations_dir = Path('supabase/migrations')
    
    if not migrations_dir.exists():
        return tables
    
    for sql_file in migrations_dir.glob('*.sql'):
        with open(sql_file, 'r') as f:
            content = f.read()
            # Find CREATE TABLE statements
            # Match: CREATE TABLE IF NOT EXISTS "table_name" or CREATE TABLE "table_name"
            patterns = [
                r'CREATE TABLE (?:IF NOT EXISTS )?["\']?(\w+)["\']?\s*\(',
                r'CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(',
            ]
            for pattern in patterns:
                for match in re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE):
                    table_name = match.group(1).lower()
                    # Skip comments and other non-table matches
                    if table_name not in ['begin', 'end', 'if', 'not', 'exists']:
                        tables.add(table_name)
    
    return tables

def get_table_definitions_from_prisma() -> Dict[str, str]:
    """Extract table definitions from Prisma schema."""
    # This is a simplified version - in reality, we'd need to parse Prisma schema
    # For now, we'll return empty dict and generate SQL from Prisma schema directly
    return {}

def main():
    print("Auditing missing tables...")
    
    prisma_tables = extract_prisma_tables()
    migration_tables = extract_migration_tables()
    
    print(f"\nTables in Prisma schema: {len(prisma_tables)}")
    print(f"Tables in migrations: {len(migration_tables)}")
    
    missing = prisma_tables - migration_tables
    
    print(f"\nMissing tables ({len(missing)}):")
    for table in sorted(missing):
        print(f"  - {table}")
    
    return sorted(missing)

if __name__ == '__main__':
    missing = main()
    print(f"\nTotal missing: {len(missing)}")
