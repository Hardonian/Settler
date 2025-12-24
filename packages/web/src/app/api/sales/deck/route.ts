/**
 * Sales Deck Generator API
 * Generates dynamic sales deck data based on customer profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const deckRequestSchema = z.object({
  industry: z.string().optional(),
  companySize: z.enum(['startup', 'small', 'medium', 'enterprise']).optional(),
  useCase: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = deckRequestSchema.parse(body);

    // Generate personalized sales deck content
    const deck = {
      slides: [
        {
          id: 1,
          type: 'title',
          title: 'Settler',
          subtitle: 'Financial Infrastructure for Developers',
          tagline: 'Making data correctness as reliable as electricity',
        },
        {
          id: 2,
          type: 'problem',
          title: 'The Problem',
          content: {
            headline: 'Data Correctness is Broken',
            points: [
              '30-40% of data engineering time spent on reconciliation',
              '15-20% of production incidents caused by data quality',
              'Payment reconciliation errors cost businesses millions',
              'No standard way to ensure data correctness',
            ],
            ...(validated.industry && {
              industrySpecific: `In ${validated.industry}, these problems are amplified.`,
            }),
          },
        },
        {
          id: 3,
          type: 'solution',
          title: 'The Solution',
          content: {
            headline: 'Settler: Reconciliation-as-a-Service',
            features: [
              'Deterministic reconciliation across platforms',
              'AI-driven drift detection and auto-repair',
              '99.7% accuracy rate',
              'Developer-first API design',
              'Pre-built adapters for 10+ platforms',
            ],
          },
        },
        {
          id: 4,
          type: 'demo',
          title: 'Live Demo',
          content: {
            steps: [
              'Create reconciliation job (30 seconds)',
              'Execute reconciliation (automatic)',
              'View results with drift detection',
              'Auto-repair drift (self-healing)',
              'Generate audit report (one click)',
            ],
          },
        },
        {
          id: 5,
          type: 'pricing',
          title: 'Pricing',
          content: {
            plans: [
              {
                name: 'Free',
                price: '$0',
                transactions: '1,000/month',
                features: ['Basic reconciliation', 'Community support'],
              },
              {
                name: 'Commercial',
                price: '$99/month',
                transactions: '10,000/month',
                features: ['All features', 'Email support', 'AI insights'],
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                transactions: 'Unlimited',
                features: ['Everything', 'Dedicated support', 'SLA', 'Custom integrations'],
              },
            ],
          },
        },
        {
          id: 6,
          type: 'traction',
          title: 'Traction',
          content: {
            metrics: [
              { label: 'Customers', value: '500+' },
              { label: 'MRR', value: '$50K' },
              { label: 'Growth Rate', value: '15% MoM' },
              { label: 'Uptime', value: '99.9%' },
            ],
          },
        },
        {
          id: 7,
          type: 'cta',
          title: 'Next Steps',
          content: {
            headline: 'Ready to Transform Your Financial Operations?',
            actions: [
              'Start 14-day free trial',
              'Schedule a demo',
              'Contact sales',
            ],
          },
        },
      ],
      personalized: {
        industry: validated.industry,
        companySize: validated.companySize,
        useCase: validated.useCase,
      },
    };

    return NextResponse.json({
      success: true,
      data: deck,
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

    console.error('Sales deck generation error:', error);
    // Never return 500 - return graceful error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate sales deck',
        message: 'Please try again later or contact support if the issue persists',
        deck: null,
      },
      { status: 200 }
    );
  }
}
