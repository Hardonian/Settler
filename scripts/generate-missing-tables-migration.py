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
        # Find all model definitions carefully, handling nested braces in strings
        # A simpler way since Prisma schema is mostly well-behaved:
        # Match from 'model Name {' until the closing '}' that is at the start of a line.
        model_pattern = r'^model\s+(\w+)\s*\{(.*?)^}'
        for match in re.finditer(model_pattern, content, re.MULTILINE | re.DOTALL):
            model_name = match.group(1)
            model_body = match.group(2)
            
            # Find @@map("table_name")
            table_match = re.search(r'@@map\("([^"]+)"\)', model_body)
            table_name = table_match.group(1) if table_match else camel_to_snake(model_name)
            
            # Extract fields
            fields = {}
            field_pattern = r'(\w+)\s+(\w+[?]?)\s*(@[^@\n]+)?'
            for field_match in re.finditer(r'^\s*(\w+)\s+([^\n]+?)\s*$', model_body, re.MULTILINE):
                field_name = field_match.group(1)
                field_def = field_match.group(2).strip()
                # Remove comments
                if '//' in field_def:
                    field_def = field_def.split('//')[0].strip()
                
                # Skip relation fields and special directives
                if field_name.startswith('@@') or is_relation(field_def):
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

def is_relation(field_def: str) -> bool:
    if 'relation(' in field_def or '@relation' in field_def:
        return True

    parts = field_def.split()
    if not parts:
        return True

    base_type_str = parts[0]

    is_optional = base_type_str.endswith('?')
    if is_optional:
        base_type_str = base_type_str[:-1]

    is_array = base_type_str.endswith('[]')
    if is_array:
        base_type_str = base_type_str[:-2]

    primitive_types = {'String', 'Int', 'BigInt', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'Bytes'}

    if base_type_str not in primitive_types:
        return True

    return False

def get_sql_type(field_def: str, base_type_str: str) -> str:
    if '@db.Uuid' in field_def:
        return 'UUID'
    if '@db.Text' in field_def:
        return 'TEXT'
    if '@db.JSONB' in field_def:
        return 'JSONB'

    type_mapping = {
        'String': 'TEXT',
        'Int': 'INTEGER',
        'BigInt': 'BIGINT',
        'Float': 'DOUBLE PRECISION',
        'Boolean': 'BOOLEAN',
        'DateTime': 'TIMESTAMPTZ',
        'Json': 'JSONB',
        'Decimal': 'DECIMAL',
        'Bytes': 'BYTEA'
    }
    return type_mapping.get(base_type_str, 'TEXT')

def generate_table_sql(table_name: str, model_info: Dict) -> str:
    """Generate SQL CREATE TABLE statement from Prisma model."""
    sql = f"-- Table: {table_name} (from Prisma model {model_info['model_name']})\n"
    sql += f"CREATE TABLE IF NOT EXISTS {table_name} (\n"

    column_defs = []
    has_id = False

    for field_name, field_def in model_info.get('fields', {}).items():
        if field_name.startswith('@@') or is_relation(field_def):
            continue

        map_match = re.search(r'@map\("([^"]+)"\)', field_def)
        db_col_name = map_match.group(1) if map_match else camel_to_snake(field_name)

        if db_col_name == 'id':
            has_id = True

        parts = field_def.split()
        if not parts:
            continue

        base_type_str = parts[0]

        is_optional = base_type_str.endswith('?')
        if is_optional:
            base_type_str = base_type_str[:-1]

        is_array = base_type_str.endswith('[]')
        if is_array:
            base_type_str = base_type_str[:-2]

        sql_type = get_sql_type(field_def, base_type_str)

        if is_array:
            sql_type += '[]'

        constraints = []

        if '@id' in field_def:
            constraints.append('PRIMARY KEY')

        if '@unique' in field_def:
            constraints.append('UNIQUE')

        def_match = re.search(r'@default\((.*?)\)(?:\s|$|@)', field_def)
        if def_match:
            default_val = def_match.group(1)
            if default_val == 'now()':
                constraints.append('DEFAULT NOW()')
            elif default_val == 'uuid()':
                constraints.append('DEFAULT gen_random_uuid()')
            elif default_val == 'autoincrement()':
                if base_type_str == 'Int':
                    sql_type = 'SERIAL'
                elif base_type_str == 'BigInt':
                    sql_type = 'BIGSERIAL'
            elif default_val.lower() in ('true', 'false'):
                constraints.append(f'DEFAULT {default_val.lower()}')
            else:
                if default_val.startswith('"') and default_val.endswith('"'):
                    inner_str = default_val[1:-1].replace("'", "''")
                    if sql_type == 'JSONB':
                        constraints.append(f"DEFAULT '{inner_str}'::jsonb")
                    else:
                        constraints.append(f"DEFAULT '{inner_str}'")
                else:
                    constraints.append(f'DEFAULT {default_val}')

        if not is_optional and '@id' not in field_def and 'autoincrement()' not in field_def:
            constraints.append('NOT NULL')

        sql_def = f"{sql_type}"
        if constraints:
            sql_def += f" {' '.join(constraints)}"

        column_defs.append(f"  {db_col_name} {sql_def}")

    if not has_id:
        column_defs.insert(0, "  id UUID PRIMARY KEY DEFAULT gen_random_uuid()")

    sql += ",\n".join(column_defs)
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
