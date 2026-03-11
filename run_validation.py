#!/usr/bin/env python3
"""
Execute Supabase validation scripts
"""
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import re

def execute_sql(conn_string, sql_content, script_name):
    """Execute SQL and capture notices/output"""
    try:
        # Try URL string first, fall back to dict if needed
        try:
            conn = psycopg2.connect(conn_string)
        except:
            # Parse connection string into dict
            import urllib.parse
            parsed = urllib.parse.urlparse(conn_string)
            conn = psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                database=parsed.path.lstrip('/'),
                user=parsed.username,
                password=parsed.password
            )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        print(f"\n{'='*70}")
        print(f"Executing: {script_name}")
        print(f"{'='*70}\n")
        
        # Remove psql-specific commands and execute
        sql_clean = sql_content
        sql_clean = re.sub(r'\\echo.*\n', '', sql_clean)
        sql_clean = re.sub(r'\\g', '', sql_clean)
        
        # Execute - handle multi-statement SQL
        # Split by semicolons and execute each statement
        statements = [s.strip() for s in sql_clean.split(';') if s.strip() and not s.strip().startswith('--')]
        
        for i, stmt in enumerate(statements):
            if not stmt:
                continue
            try:
                cursor.execute(stmt)
                # Try to fetch if it's a SELECT
                try:
                    results = cursor.fetchall()
                    if results and len(results) > 0:
                        print(f"\nQuery {i+1} returned {len(results)} rows")
                        for j, row in enumerate(results[:10], 1):
                            print(f"  {j}. {row}")
                        if len(results) > 10:
                            print(f"  ... ({len(results) - 10} more rows)")
                except:
                    pass  # Not a SELECT
            except Exception as e:
                # Skip errors for statements that might fail (like CREATE IF NOT EXISTS)
                if 'already exists' in str(e).lower() or 'does not exist' in str(e).lower():
                    pass  # Expected for idempotent operations
                else:
                    print(f"  Warning in statement {i+1}: {str(e)[:100]}")
        
        # Commit any changes
        conn.commit()
        
        # Try to fetch results
        try:
            results = cursor.fetchall()
            if results:
                print(f"\nQuery Results ({len(results)} rows):")
                for i, row in enumerate(results[:50], 1):
                    print(f"  {i}. {row}")
                if len(results) > 50:
                    print(f"  ... ({len(results) - 50} more rows)")
        except:
            pass
        
        cursor.close()
        conn.close()
        
        print(f"\n✓ Successfully executed {script_name}")
        return True
        
    except Exception as e:
        print(f"\n✗ Error executing {script_name}:")
        print(f"  {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    # Connection parameters (brackets in connection string are delimiters, not part of password)
    conn_params = {
        'host': os.getenv('SUPABASE_DB_HOST', 'localhost'),
        'port': int(os.getenv('SUPABASE_DB_PORT', '5432')),
        'database': os.getenv('SUPABASE_DB_NAME', 'postgres'),
        'user': os.getenv('SUPABASE_DB_USER'),
        'password': os.getenv('SUPABASE_DB_PASSWORD')
    }

    if not conn_params['user'] or not conn_params['password']:
        raise RuntimeError('Missing SUPABASE_DB_USER or SUPABASE_DB_PASSWORD environment variables')
    conn_string = f"postgresql://{conn_params['user']}:{conn_params['password']}@{conn_params['host']}:{conn_params['port']}/{conn_params['database']}"
    
    scripts = [
        ("INTROSPECTION.sql", "Step 1: Capturing database state"),
        ("GAPS_REPORT.sql", "Step 2: Identifying gaps"),
        ("PATCH.sql", "Step 3: Applying patch"),
        ("VERIFY.sql", "Step 4: Verifying results"),
    ]
    
    for script_file, description in scripts:
        script_path = f"supabase/migrations/{script_file}"
        try:
            with open(script_path, 'r') as f:
                sql_content = f.read()
            
            print(f"\n{'#'*70}")
            print(f"# {description}")
            print(f"{'#'*70}")
            
            success = execute_sql(conn_string, sql_content, script_file)
            
            if not success:
                print(f"\n⚠️  Failed at {script_file}. Stopping.")
                sys.exit(1)
                
        except FileNotFoundError:
            print(f"✗ File not found: {script_path}")
            sys.exit(1)
        except Exception as e:
            print(f"✗ Error reading {script_path}: {e}")
            sys.exit(1)
    
    print(f"\n{'='*70}")
    print("✅ VALIDATION COMPLETE")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
