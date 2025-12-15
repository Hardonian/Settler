/**
 * ROI Calculator API
 * Calculates ROI for potential customers based on their usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const roiCalculatorSchema = z.object({
  monthlyTransactions: z.number().min(0),
  hoursPerMonth: z.number().min(0),
  hourlyRate: z.number().min(0).optional(),
  currentErrorRate: z.number().min(0).max(100).optional(),
  averageTransactionValue: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = roiCalculatorSchema.parse(body);

    const {
      monthlyTransactions,
      hoursPerMonth,
      hourlyRate = 50, // Default $50/hour
      currentErrorRate = 5, // Default 5% error rate
      averageTransactionValue = 100, // Default $100 per transaction
    } = validated;

    // Calculate current costs
    const currentLaborCost = hoursPerMonth * hourlyRate;
    const currentErrorCost = monthlyTransactions * (currentErrorRate / 100) * averageTransactionValue * 0.1; // 10% of transaction value lost to errors
    const currentTotalCost = currentLaborCost + currentErrorCost;

    // Calculate Settler costs
    // Free: 1,000 transactions/month
    // Commercial: $99/month for 10,000 transactions
    // Pro: $499/month for 100,000 transactions
    let settlerPlan = 'Free';
    let settlerCost = 0;
    
    if (monthlyTransactions <= 1000) {
      settlerPlan = 'Free';
      settlerCost = 0;
    } else if (monthlyTransactions <= 10000) {
      settlerPlan = 'Commercial';
      settlerCost = 99;
    } else if (monthlyTransactions <= 100000) {
      settlerPlan = 'Pro';
      settlerCost = 499;
    } else {
      settlerPlan = 'Enterprise';
      settlerCost = 1999; // Estimated enterprise pricing
    }

    // Settler reduces manual work by 90% and errors by 95%
    const settlerLaborCost = hoursPerMonth * 0.1 * hourlyRate; // 90% reduction
    const settlerErrorRate = currentErrorRate * 0.05; // 95% reduction
    const settlerErrorCost = monthlyTransactions * (settlerErrorRate / 100) * averageTransactionValue * 0.1;
    const settlerTotalCost = settlerCost + settlerLaborCost + settlerErrorCost;

    // Calculate savings
    const monthlySavings = currentTotalCost - settlerTotalCost;
    const annualSavings = monthlySavings * 12;
    const roi = ((annualSavings - settlerCost * 12) / (settlerCost * 12)) * 100;
    const paybackPeriod = settlerCost / monthlySavings; // months

    return NextResponse.json({
      success: true,
      data: {
        current: {
          laborCost: Math.round(currentLaborCost),
          errorCost: Math.round(currentErrorCost),
          totalCost: Math.round(currentTotalCost),
          hoursPerMonth,
          errorRate: currentErrorRate,
        },
        withSettler: {
          plan: settlerPlan,
          subscriptionCost: settlerCost,
          laborCost: Math.round(settlerLaborCost),
          errorCost: Math.round(settlerErrorCost),
          totalCost: Math.round(settlerTotalCost),
          hoursPerMonth: Math.round(hoursPerMonth * 0.1),
          errorRate: Number(settlerErrorRate.toFixed(2)),
        },
        savings: {
          monthly: Math.round(monthlySavings),
          annual: Math.round(annualSavings),
          roi: Number(roi.toFixed(1)),
          paybackPeriod: Number(paybackPeriod.toFixed(1)),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('ROI calculator error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate ROI',
      },
      { status: 500 }
    );
  }
}
