#!/usr/bin/env python3
"""
Verify that the patch was applied successfully
"""
import psycopg2

def verify_patch():
    conn_params = {
        'host': 'aws-0-us-west-2.pooler.supabase.com',
        'port': 5432,
        'database': 'postgres',
        'user': 'postgres.johfcvvmtfiomzxipspz',
        'password': 'JtLWi74CXuTcaeha'
    }
    
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("VERIFICATION REPORT")
    print("="*70 + "\n")
    
    # 1. Check critical tables exist
    print("1. CRITICAL TABLES")
    print("-" * 70)
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('tenants', 'billing_accounts')
        ORDER BY table_name
    """)
    tables = cursor.fetchall()
    for table in tables:
        print(f"  ✓ {table[0]} exists")
    if len(tables) < 2:
        print(f"  ✗ Missing {2 - len(tables)} critical table(s)")
    print()
    
    # 2. Check RLS is enabled
    print("2. ROW LEVEL SECURITY STATUS")
    print("-" * 70)
    cursor.execute("""
        SELECT c.relname, c.relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relname IN ('tenants', 'billing_accounts')
        ORDER BY c.relname
    """)
    rls_status = cursor.fetchall()
    for table_name, rls_enabled in rls_status:
        status = "✓ ENABLED" if rls_enabled else "✗ DISABLED"
        print(f"  {status}: {table_name}")
    print()
    
    # 3. Check RLS policies exist
    print("3. RLS POLICIES")
    print("-" * 70)
    cursor.execute("""
        SELECT tablename, policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('tenants', 'billing_accounts')
        ORDER BY tablename, cmd, policyname
    """)
    policies = cursor.fetchall()
    if policies:
        for table_name, policy_name, cmd in policies:
            print(f"  ✓ {table_name}.{policy_name} ({cmd})")
    else:
        print("  ✗ No policies found")
    print(f"  Total policies: {len(policies)}")
    print()
    
    # 4. Check helper functions exist
    print("4. HELPER FUNCTIONS")
    print("-" * 70)
    cursor.execute("""
        SELECT p.proname, pg_get_function_identity_arguments(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN ('get_user_tenant_ids', 'current_tenant_id')
        ORDER BY p.proname
    """)
    functions = cursor.fetchall()
    for func_name, args in functions:
        print(f"  ✓ {func_name}({args})")
    if len(functions) < 2:
        print(f"  ✗ Missing {2 - len(functions)} critical function(s)")
    print()
    
    # 5. Check critical indexes
    print("5. CRITICAL INDEXES")
    print("-" * 70)
    cursor.execute("""
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename IN ('tenants', 'billing_accounts')
        AND (
            indexname LIKE '%user_id%' 
            OR indexname LIKE '%tenant_id%'
            OR indexname LIKE '%stripe_customer_id%'
            OR indexname LIKE '%slug%'
            OR indexname LIKE '%billing_account_id%'
        )
        ORDER BY tablename, indexname
    """)
    indexes = cursor.fetchall()
    for table_name, index_name in indexes:
        print(f"  ✓ {table_name}.{index_name}")
    print(f"  Total indexes: {len(indexes)}")
    print()
    
    # 6. Check grants
    print("6. TABLE PERMISSIONS")
    print("-" * 70)
    cursor.execute("""
        SELECT grantee, table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public'
        AND table_name IN ('tenants', 'billing_accounts')
        AND grantee IN ('authenticated', 'service_role', 'public')
        GROUP BY grantee, table_name
        ORDER BY table_name, grantee
    """)
    grants = cursor.fetchall()
    for grantee, table_name, privileges in grants:
        status = "⚠️ PUBLIC" if grantee == 'public' else "✓"
        print(f"  {status} {grantee} on {table_name}: {privileges}")
    print()
    
    # Summary
    print("="*70)
    print("VALIDATION SUMMARY")
    print("="*70)
    
    all_ok = True
    if len(tables) < 2:
        print("✗ CRITICAL: Missing critical tables")
        all_ok = False
    else:
        print("✓ Critical tables exist")
    
    if not all(rls_enabled for _, rls_enabled in rls_status):
        print("✗ CRITICAL: RLS not enabled on all critical tables")
        all_ok = False
    else:
        print("✓ RLS enabled on critical tables")
    
    if len(policies) < 4:
        print(f"⚠️  WARNING: Only {len(policies)} policies found (expected at least 4)")
    else:
        print(f"✓ RLS policies created ({len(policies)})")
    
    if len(functions) < 2:
        print("✗ CRITICAL: Missing helper functions")
        all_ok = False
    else:
        print("✓ Helper functions exist")
    
    if len(indexes) < 3:
        print(f"⚠️  WARNING: Only {len(indexes)} critical indexes found")
    else:
        print(f"✓ Critical indexes created ({len(indexes)})")
    
    print()
    if all_ok:
        print("✅ ALL CRITICAL VALIDATIONS PASSED")
    else:
        print("❌ SOME VALIDATIONS FAILED - Review output above")
    
    print("="*70 + "\n")
    
    cursor.close()
    conn.close()
    
    return all_ok

if __name__ == "__main__":
    success = verify_patch()
    exit(0 if success else 1)
