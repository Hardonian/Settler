'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Video, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Demo Booking Widget Component
 * 
 * Prominent CTA for booking demos, especially on enterprise and pricing pages.
 * Can be embedded inline or as a floating widget.
 */
interface DemoBookingWidgetProps {
  variant?: 'inline' | 'floating';
  className?: string;
}

export function DemoBookingWidget({ variant = 'inline', className }: DemoBookingWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'floating') {
    return (
      <div className={cn('fixed bottom-24 right-6 z-40', className)}>
        <Card className="w-80 shadow-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg">Schedule a Demo</CardTitle>
            </div>
            <CardDescription className="text-sm">
              See Settler in action with a personalized demo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="lg"
            >
              <Link href="/enterprise#demo-form">
                <Calendar className="w-4 h-4 mr-2" />
                Book Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 text-center">
              No commitment required • 30 minutes
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'border-2 border-blue-200 dark:border-blue-800',
        'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800',
        'transition-all duration-300',
        isHovered && 'shadow-xl scale-[1.02]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">See Settler in Action</CardTitle>
            <CardDescription>
              Schedule a personalized demo with our team
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>30-minute personalized walkthrough</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>See how it works with your use case</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Get answers to your questions</span>
            </li>
          </ul>
          <Button
            asChild
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            size="lg"
          >
            <Link href="/enterprise#demo-form">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
