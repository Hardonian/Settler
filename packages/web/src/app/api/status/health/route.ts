/**
 * Health Status Endpoint
 * 
 * All-Cylinder Firing Check: Verifies all 3 KPIs are met.
 * Returns "Status: Loud and High ✓" only if all KPIs pass.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface KPIHealthStatus {
  newUsersWeek: number;
  actionsLastHour: number;
  topPostEngagement: number;
  allCylindersFiring: boolean;
}

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Query the combined KPI health status view using RPC
    let data, error;
    try {
      const result = await supabase.rpc('get_kpi_health_status').single();
      data = result.data;
      error = result.error;
    } catch (err) {
      error = err as Error;
    }
    
    // Fallback: Query individual views if RPC doesn't exist
    if (error) {
      console.warn('RPC function not available, using fallback:', error);
      const [kpi1, kpi2, kpi3] = await Promise.all([
        supabase.from('kpi_new_users_week').select('count').single(),
        supabase.from('kpi_actions_last_hour').select('count').single(),
        supabase.from('kpi_most_engaged_post_today').select('total_engagement').single(),
      ]);
      
      const newUsersWeek = (kpi1.data as any)?.count || 0;
      const actionsLastHour = (kpi2.data as any)?.count || 0;
      const topPostEngagement = (kpi3.data as any)?.total_engagement || 0;
      
      return NextResponse.json({
        status: (newUsersWeek > 50 && actionsLastHour > 100 && topPostEngagement > 100) 
          ? 'Loud and High ✓' 
          : 'Building Momentum',
        allCylindersFiring: newUsersWeek > 50 && actionsLastHour > 100 && topPostEngagement > 100,
        kpis: {
          kpi1: {
            name: 'New Users This Week',
            value: newUsersWeek,
            threshold: 50,
            passed: newUsersWeek > 50,
          },
          kpi2: {
            name: 'Actions Completed in Last Hour',
            value: actionsLastHour,
            threshold: 100,
            passed: actionsLastHour > 100,
          },
          kpi3: {
            name: 'Most Engaged Post Engagement',
            value: topPostEngagement,
            threshold: 100,
            passed: topPostEngagement > 100,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!data) {
      return NextResponse.json(
        {
          status: 'Error',
          message: 'Failed to fetch health status',
        },
        { status: 500 }
      );
    }

    const typedData = data as any;
    const healthStatus: KPIHealthStatus = {
      newUsersWeek: typedData.new_users_week || 0,
      actionsLastHour: typedData.actions_last_hour || 0,
      topPostEngagement: typedData.top_post_engagement || 0,
      allCylindersFiring: typedData.all_cylinders_firing || false,
    };

    // Check if all KPIs meet thresholds
    const kpi1Pass = healthStatus.newUsersWeek > 50;
    const kpi2Pass = healthStatus.actionsLastHour > 100;
    const kpi3Pass = healthStatus.topPostEngagement > 100;

    const allPass = kpi1Pass && kpi2Pass && kpi3Pass;

    return NextResponse.json(
      {
        status: allPass ? 'Loud and High ✓' : 'Building Momentum',
        allCylindersFiring: allPass,
        kpis: {
          kpi1: {
            name: 'New Users This Week',
            value: healthStatus.newUsersWeek,
            threshold: 50,
            passed: kpi1Pass,
          },
          kpi2: {
            name: 'Actions Completed in Last Hour',
            value: healthStatus.actionsLastHour,
            threshold: 100,
            passed: kpi2Pass,
          },
          kpi3: {
            name: 'Most Engaged Post Engagement',
            value: healthStatus.topPostEngagement,
            threshold: 100,
            passed: kpi3Pass,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
