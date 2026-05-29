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

def map_prisma_type_to_sql(field_name: str, field_def: str) -> str:
    """Map Prisma scalar type to PostgreSQL type."""
    # Remove comments
    field_def = re.sub(r'//.*$', '', field_def).strip()

    parts = field_def.split()
    type_modifier = parts[0]

    is_optional = '?' in type_modifier
    is_array = '[]' in type_modifier

    base_type = type_modifier.replace('?', '').replace('[]', '')

    # Map types
    if '@db.Uuid' in field_def:
        sql_type = 'UUID'
    elif base_type == 'String':
        sql_type = 'TEXT'
    elif base_type == 'Int':
        sql_type = 'INTEGER'
    elif base_type == 'BigInt':
        sql_type = 'BIGINT'
    elif base_type == 'Float':
        sql_type = 'DOUBLE PRECISION'
    elif base_type == 'Decimal':
        sql_type = 'DECIMAL'
    elif base_type == 'Boolean':
        sql_type = 'BOOLEAN'
    elif base_type == 'DateTime':
        sql_type = 'TIMESTAMPTZ'
    elif base_type == 'Json':
        sql_type = 'JSONB'
    else:
        # Enums or other models
        sql_type = 'TEXT'

    if is_array:
        sql_type += '[]'

    constraints = []

    # Handle autoincrement properly
    if '@default(autoincrement())' in field_def:
        if base_type == 'Int':
            sql_type = 'SERIAL'
        elif base_type == 'BigInt':
            sql_type = 'BIGSERIAL'

    if '@id' in field_def:
        constraints.append('PRIMARY KEY')
    elif '@unique' in field_def:
        constraints.append('UNIQUE')

    if not is_optional and '@id' not in field_def:
        constraints.append('NOT NULL')

    # Handle defaults (ignoring autoincrement here because it's handled via SERIAL type)
    if '@default' in field_def and 'autoincrement()' not in field_def:
        default_match = re.search(r'@default\((.*?)\)', field_def)
        if default_match:
            default_val = default_match.group(1)
            if default_val == 'uuid()':
                constraints.append('DEFAULT gen_random_uuid()')
            elif default_val == 'now()':
                constraints.append('DEFAULT NOW()')
            elif default_val.startswith('"') or default_val.startswith("'"):
                # Remove both types of quotes safely
                clean_val = default_val[1:-1] if len(default_val) >= 2 else default_val
                constraints.append(f"DEFAULT '{clean_val}'")
            elif default_val in ('true', 'false'):
                constraints.append(f"DEFAULT {default_val}")
            elif default_val.isdigit():
                constraints.append(f"DEFAULT {default_val}")
            elif default_val == '{}' or default_val == '[]':
                # For Json
                constraints.append(f"DEFAULT '{default_val}'::jsonb")

    constraint_str = " ".join(constraints)
    if constraint_str:
        return f"{sql_type} {constraint_str}"
    return sql_type

def generate_table_sql(table_name: str, model_info: Dict) -> str:
    """Generate SQL CREATE TABLE statement from Prisma model."""
    sql = f"-- Table: {table_name} (from Prisma model {model_info['model_name']})\n"
    sql += f"CREATE TABLE IF NOT EXISTS {table_name} (\n"

    columns = []
    for field_name, field_def in model_info['fields'].items():
        col_name = camel_to_snake(field_name)
        col_def = map_prisma_type_to_sql(field_name, field_def)
        columns.append(f"  {col_name} {col_def}")

    sql += ",\n".join(columns)
    sql += "\n);\n\n"
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
