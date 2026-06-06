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


def extract_enums(content: str) -> set:
    """Extract all enum names from Prisma schema."""
    enums = set()
    enum_pattern = r'enum\s+(\w+)\s*\{'
    for match in re.finditer(enum_pattern, content):
        enums.add(match.group(1))
    return enums

def extract_prisma_models() -> Dict[str, Dict]:
    """Extract all models from Prisma schema files."""
    models = {}
    
    schema_files = [
        'prisma/schema.prisma',
        'prisma/schema-additions.prisma'
    ]
    
    all_enums = set()
    for schema_file in schema_files:
        if Path(schema_file).exists():
            with open(schema_file, 'r') as f:
                all_enums.update(extract_enums(f.read()))


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
                    
                field_type = field_def.split()[0].replace('?', '').replace('[]', '')
                standard_scalars = {'String', 'Int', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json', 'BigInt', 'Bytes'}

                # If the type is not a standard scalar and not a known enum, it is almost certainly a relation field.
                if field_type not in standard_scalars and field_type not in all_enums:
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

def get_pg_type(prisma_type: str, annotations: str) -> str:
    """Map Prisma types to PostgreSQL types."""
    is_array = '[]' in prisma_type
    base_type = prisma_type.replace('?', '').replace('[]', '')

    pg_type = 'TEXT'
    if base_type == 'String':
        if '@db.Uuid' in annotations:
            pg_type = 'UUID'
        else:
            pg_type = 'TEXT'
    elif base_type == 'Int':
        pg_type = 'INTEGER'
    elif base_type == 'Float':
        pg_type = 'DOUBLE PRECISION'
    elif base_type == 'Decimal':
        pg_type = 'DECIMAL'
    elif base_type == 'Boolean':
        pg_type = 'BOOLEAN'
    elif base_type == 'DateTime':
        pg_type = 'TIMESTAMPTZ'
    elif base_type == 'Json':
        pg_type = 'JSONB'
    elif base_type == 'BigInt':
        pg_type = 'BIGINT'
    else:
        # Enums or complex types default to TEXT if not strictly mapped
        pg_type = 'TEXT'

    if is_array:
        pg_type += '[]'

    return pg_type


def extract_default_value(annotations: str) -> str:
    """Extract default value from @default(...) annotation."""
    idx = annotations.find('@default(')
    if idx == -1:
        return None

    start_idx = idx + 9 # len('@default(')
    parens_count = 1

    for i in range(start_idx, len(annotations)):
        if annotations[i] == '(':
            parens_count += 1
        elif annotations[i] == ')':
            parens_count -= 1
            if parens_count == 0:
                return annotations[start_idx:i]

    return None

def generate_table_sql(table_name: str, model_info: Dict) -> str:
    """Generate SQL CREATE TABLE statement from Prisma model."""
    sql_lines = []
    sql_lines.append(f"-- Table: {table_name} (from Prisma model {model_info['model_name']})")
    sql_lines.append(f"CREATE TABLE IF NOT EXISTS {table_name} (")

    columns = []

    for field_name, field_def in model_info['fields'].items():
        parts = field_def.split()
        prisma_type = parts[0]
        annotations = ' '.join(parts[1:]) if len(parts) > 1 else ''

        is_optional = '?' in prisma_type
        pg_type = get_pg_type(prisma_type, annotations)
        col_name = camel_to_snake(field_name)

        constraints = []

        if '@id' in annotations:
            constraints.append('PRIMARY KEY')
            if '@default(uuid())' in annotations or '@default(dbgenerated("gen_random_uuid()"))' in annotations:
                constraints.append('DEFAULT gen_random_uuid()')
        else:
            if not is_optional:
                constraints.append('NOT NULL')

            if '@unique' in annotations:
                constraints.append('UNIQUE')

            default_val = extract_default_value(annotations)
            if default_val is not None:
                if default_val == 'now()':
                    constraints.append('DEFAULT NOW()')
                elif default_val == 'uuid()':
                    constraints.append('DEFAULT gen_random_uuid()')
                elif default_val == 'autoincrement()':
                    pass
                elif default_val.startswith('dbgenerated('):
                    val = extract_default_value(default_val.replace('dbgenerated', '@default'))
                    if val:
                        constraints.append(f"DEFAULT {val.replace('"', "'")}")

                elif default_val.startswith('"') or default_val.startswith("'"):
                    val = default_val.replace('"', "'")
                    if pg_type == 'JSONB':
                        constraints.append(f"DEFAULT {val}::jsonb")
                    else:
                        constraints.append(f"DEFAULT {val}")
                elif default_val in ['true', 'false']:
                    constraints.append(f"DEFAULT {default_val}")
                elif default_val == '{}' or default_val == '"{}"':
                    constraints.append("DEFAULT '{}'::jsonb")
                elif default_val == '[]':
                    constraints.append("DEFAULT '[]'::jsonb")
                else:
                    constraints.append(f"DEFAULT {default_val}")

        col_def = f"  {col_name} {pg_type}"
        if constraints:
            col_def += f" {' '.join(constraints)}"
        columns.append(col_def)

    if not any(c.strip().startswith('id ') for c in columns):
        columns.insert(0, "  id UUID PRIMARY KEY DEFAULT gen_random_uuid()")

    sql_lines.append(",\n".join(columns))
    sql_lines.append(");\n")

    return "\n".join(sql_lines) + "\n"


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
