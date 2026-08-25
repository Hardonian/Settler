#!/usr/bin/env python3
"""
Execute SQL files against Supabase database
"""
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def execute_sql_file(conn_string, sql_file):
    """Execute a SQL file against the database"""
    try:
        conn = psycopg2.connect(conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print(f"\n{'='*70}")
        print(f"Executing: {sql_file}")
        print(f"{'='*70}\n")
        
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        # Execute the SQL
        cursor.execute(sql_content)
        
        # Try to fetch results if it's a SELECT
        try:
            results = cursor.fetchall()
            if results:
                print(f"Results ({len(results)} rows):")
                for row in results[:20]:  # Limit output
                    print(row)
                if len(results) > 20:
                    print(f"... ({len(results) - 20} more rows)")
        except:
            pass  # Not a SELECT query
        
        print(f"\n✓ Successfully executed {sql_file}")
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"\n✗ Error executing {sql_file}:")
        print(f"  {str(e)}")
        return False

if __name__ == "__main__":
    conn_string = sys.argv[1] if len(sys.argv) > 1 else None
    sql_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not conn_string or not sql_file:
        print("Usage: python3 execute_sql.py <connection_string> <sql_file>")
        sys.exit(1)
    
    success = execute_sql_file(conn_string, sql_file)
    sys.exit(0 if success else 1)
