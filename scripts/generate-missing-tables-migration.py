#!/usr/bin/env python3
"""
Generate consolidated migration SQL for all tables defined in Prisma schema
that may not exist in migrations yet.
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Set

def camel_to_snake(name: str) -> str:
    """Convert camelCase to snake_case."""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def extract_prisma_models() -> Dict[str, Dict]:
    """Extract all models from Prisma schema files."""
    models = {}
    
    schema_files = [
        'prisma/schema.prisma',
        'prisma/schema-additions.prisma'
    ]
    
    for schema_file in schema_files:
        if not Path(schema_file).exists():
            continue
            
        with open(schema_file, 'r') as f:
            content = f.read()
            
        # Find all model definitions
        model_pattern = r'model\s+(\w+)\s*\{([^}]+)\}'
        for match in re.finditer(model_pattern, content, re.DOTALL):
            model_name = match.group(1)
            model_body = match.group(2)
            
            # Find @@map("table_name")
            table_match = re.search(r'@@map\("([^"]+)"\)', model_body)
            table_name = table_match.group(1) if table_match else camel_to_snake(model_name)
            
            # Extract fields
            fields = {}
            field_pattern = r'(\w+)\s+(\w+[?]?)\s*(@[^@\n]+)?'
            for field_match in re.finditer(r'(\w+)\s+([^\n]+)', model_body):
                field_name = field_match.group(1)
                field_def = field_match.group(2).strip()
                
                # Skip relation fields and special directives
                if field_name.startswith('@@') or 'relation(' in field_def or '@relation' in field_def:
                    continue
                    
                fields[field_name] = field_def
            
            models[table_name] = {
                'model_name': model_name,
                'table_name': table_name,
                'body': model_body,
                'fields': fields
            }
    
    return models

def check_table_exists_in_migrations(table_name: str) -> bool:
    """Check if table exists in any migration file."""
    migrations_dir = Path('supabase/migrations')
    if not migrations_dir.exists():
        return False
    
    for sql_file in migrations_dir.glob('*.sql'):
        with open(sql_file, 'r') as f:
            content = f.read()
            # Check for CREATE TABLE statements
            if re.search(rf'CREATE TABLE (?:IF NOT EXISTS )?["\']?{table_name}["\']?\s*\(', content, re.IGNORECASE):
                return True
    return False

def generate_table_sql(table_name: str, model_info: Dict) -> str:
    """Generate SQL CREATE TABLE statement from Prisma model."""
    # This is a simplified version - in production, you'd use Prisma's schema parser
    # For now, we'll generate a basic structure
    sql = f"-- Table: {table_name} (from Prisma model {model_info['model_name']})\n"
    sql += f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
    sql += "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n"
    sql += "  -- TODO: Add columns based on Prisma schema\n"
    sql += "  created_at TIMESTAMPTZ DEFAULT NOW(),\n"
    sql += "  updated_at TIMESTAMPTZ DEFAULT NOW()\n"
    sql += ");\n\n"
    return sql

def main():
    print("Generating consolidated migration SQL for missing tables...")
    
    models = extract_prisma_models()
    print(f"Found {len(models)} models in Prisma schema")
    
    missing_tables = []
    for table_name, model_info in models.items():
        if not check_table_exists_in_migrations(table_name):
            missing_tables.append((table_name, model_info))
    
    print(f"\nFound {len(missing_tables)} potentially missing tables")
    
    if missing_tables:
        print("\nMissing tables:")
        for table_name, _ in missing_tables:
            print(f"  - {table_name}")
    
    return missing_tables

if __name__ == '__main__':
    missing = main()
    print(f"\nTotal missing: {len(missing)}")
