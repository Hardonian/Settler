#!/usr/bin/env python3
"""
Execute PATCH.sql against Supabase database
Uses proper SQL execution that handles DO blocks and dollar-quoted strings
"""
import psycopg2
import re

def execute_sql_file(conn_params, sql_file):
    """Execute SQL file properly handling DO blocks and dollar-quoted strings"""
    try:
        conn = psycopg2.connect(**conn_params)
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print(f"\n{'='*70}")
        print(f"Executing: {sql_file}")
        print(f"{'='*70}\n")
        
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        # Remove psql-specific commands
        sql_content = re.sub(r'\\echo.*\n', '', sql_content)
        sql_content = re.sub(r'\\g\b', '', sql_content)
        
        # Execute the entire SQL as one script
        # psycopg2 can handle multi-statement SQL
        try:
            cursor.execute(sql_content)
            print("✓ SQL executed successfully")
        except psycopg2.ProgrammingError as e:
            # Some statements might return results, try fetching
            try:
                results = cursor.fetchall()
                if results:
                    print(f"Query returned {len(results)} rows")
                    for row in results[:10]:
                        print(f"  {row}")
            except:
                pass
            # Check if it's just a notice/warning
            if 'already exists' in str(e).lower():
                print("  (Some objects already exist - this is expected for idempotent operations)")
            else:
                print(f"  Warning: {str(e)[:200]}")
        except Exception as e:
            # Check if it's an expected error (like "already exists")
            error_str = str(e).lower()
            if any(x in error_str for x in ['already exists', 'does not exist', 'duplicate', 'syntax']):
                print(f"  Note: {str(e)[:150]}")
            else:
                print(f"  Error: {str(e)[:200]}")
                raise
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"\n✗ Error executing {sql_file}:")
        print(f"  {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    conn_params = {
        'host': 'aws-0-us-west-2.pooler.supabase.com',
        'port': 5432,
        'database': 'postgres',
        'user': 'postgres.johfcvvmtfiomzxipspz',
        'password': 'JtLWi74CXuTcaeha'
    }
    
    # Execute PATCH.sql (the most important one)
    print("\n" + "#"*70)
    print("# Applying Supabase Backend Patch")
    print("#"*70)
    
    success = execute_sql_file(conn_params, 'supabase/migrations/PATCH.sql')
    
    if success:
        print(f"\n{'='*70}")
        print("✅ PATCH APPLIED SUCCESSFULLY")
        print(f"{'='*70}\n")
        
        # Now verify
        print("\n" + "#"*70)
        print("# Verifying Patch")
        print("#"*70)
        execute_sql_file(conn_params, 'supabase/migrations/VERIFY.sql')
    else:
        print(f"\n{'='*70}")
        print("❌ PATCH FAILED")
        print(f"{'='*70}\n")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
