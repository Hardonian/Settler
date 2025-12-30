/**
 * UX System Playground
 * 
 * Internal route for verifying motion system and state machine patterns.
 * This demonstrates:
 * - Motion primitives (AnimatedButton, AnimatedCard, Reveal)
 * - State machine patterns (demo form machine)
 * - Success/error handling
 * - Reduced motion support
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedButton } from '@/components/motion/AnimatedButton';
import { AnimatedCard } from '@/components/motion/AnimatedCard';
import { Reveal } from '@/components/motion/Reveal';
import { useMachineState } from '@/lib/xstate/hooks';
import { demoFormMachine } from '@/lib/xstate/demo-machine';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UXPlaygroundPage() {
  const [activeSection, setActiveSection] = useState<'motion' | 'state'>('motion');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal variant="fadeUp">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              UX System Playground
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Internal verification of motion system and state machine patterns
            </p>
          </div>
        </Reveal>

        {/* Navigation */}
        <Reveal variant="fadeUp" delay={0.1}>
          <div className="flex gap-4 mb-8">
            <AnimatedButton
              variant={activeSection === 'motion' ? 'default' : 'outline'}
              onClick={() => setActiveSection('motion')}
            >
              Motion Primitives
            </AnimatedButton>
            <AnimatedButton
              variant={activeSection === 'state' ? 'default' : 'outline'}
              onClick={() => setActiveSection('state')}
            >
              State Machine Demo
            </AnimatedButton>
          </div>
        </Reveal>

        {/* Motion Primitives Section */}
        {activeSection === 'motion' && (
          <div className="space-y-6">
            <Reveal variant="fadeUp" delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Motion Primitives</CardTitle>
                  <CardDescription>
                    Reusable animated components with consistent motion tokens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Animated Buttons */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Animated Buttons</h3>
                    <div className="flex flex-wrap gap-4">
                      <AnimatedButton animation="subtle">Subtle</AnimatedButton>
                      <AnimatedButton animation="bounce">Bounce</AnimatedButton>
                      <AnimatedButton animation="scale">Scale</AnimatedButton>
                      <AnimatedButton animation="none">No Animation</AnimatedButton>
                      <AnimatedButton loading>Loading</AnimatedButton>
                      <AnimatedButton disabled>Disabled</AnimatedButton>
                    </div>
                  </div>

                  {/* Animated Cards */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Animated Cards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <AnimatedCard animation="fadeUp" hoverAnimation>
                        <CardHeader>
                          <CardTitle className="text-sm">Fade Up</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Card with fade up animation
                          </p>
                        </CardContent>
                      </AnimatedCard>
                      <AnimatedCard animation="scale" hoverAnimation delay={0.1}>
                        <CardHeader>
                          <CardTitle className="text-sm">Scale</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Card with scale animation
                          </p>
                        </CardContent>
                      </AnimatedCard>
                      <AnimatedCard animation="fade" hoverAnimation delay={0.2}>
                        <CardHeader>
                          <CardTitle className="text-sm">Fade</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Card with fade animation
                          </p>
                        </CardContent>
                      </AnimatedCard>
                    </div>
                  </div>

                  {/* Reveal Examples */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Reveal Components</h3>
                    <div className="space-y-4">
                      <Reveal variant="fadeUp">
                        <Card>
                          <CardContent className="pt-6">
                            <p>This card fades up on mount</p>
                          </CardContent>
                        </Card>
                      </Reveal>
                      <Reveal variant="fadeDown" delay={0.1}>
                        <Card>
                          <CardContent className="pt-6">
                            <p>This card fades down with delay</p>
                          </CardContent>
                        </Card>
                      </Reveal>
                      <Reveal variant="scale" delay={0.2}>
                        <Card>
                          <CardContent className="pt-6">
                            <p>This card scales in</p>
                          </CardContent>
                        </Card>
                      </Reveal>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        )}

        {/* State Machine Demo Section */}
        {activeSection === 'state' && (
          <Reveal variant="fadeUp" delay={0.1}>
            <StateMachineDemo />
          </Reveal>
        )}
      </div>
    </div>
  );
}

/**
 * State Machine Demo Component
 * Demonstrates XState form machine with validation and async submission
 */
function StateMachineDemo() {
  const { state, send, isPending, isSuccess, isError, isIdle } = useMachineState(demoFormMachine);
  const context = state.context;

  const handleSubmit = () => {
    send({ type: 'SUBMIT' });
  };

  const handleReset = () => {
    send({ type: 'RESET' });
  };

  const handleRetry = () => {
    send({ type: 'RETRY' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>State Machine Demo</CardTitle>
        <CardDescription>
          Form submission flow with validation, async operations, and error handling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current State Indicator */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Current State</Label>
          <div className="flex items-center gap-2">
            {isIdle && (
              <>
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-sm">Idle</span>
              </>
            )}
            {isPending && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm">Submitting...</span>
              </>
            )}
            {isSuccess && (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">Success</span>
              </>
            )}
            {isError && (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm">Error</span>
              </>
            )}
            {state.value === 'validationError' && (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">Validation Error</span>
              </>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="demo-name">Name</Label>
            <Input
              id="demo-name"
              value={context.formData.name}
              onChange={(e) =>
                send({ type: 'UPDATE_NAME', name: e.target.value })
              }
              disabled={isPending}
              className="mt-1"
            />
            {context.validationErrors.name && (
              <p className="text-sm text-red-600 mt-1">{context.validationErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="demo-email">Email</Label>
            <Input
              id="demo-email"
              type="email"
              value={context.formData.email}
              onChange={(e) =>
                send({ type: 'UPDATE_EMAIL', email: e.target.value })
              }
              disabled={isPending}
              className="mt-1"
            />
            {context.validationErrors.email && (
              <p className="text-sm text-red-600 mt-1">{context.validationErrors.email}</p>
            )}
          </div>
        </div>

        {/* Success Message */}
        {isSuccess && context.data && (
          <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-300">Success!</AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-400">
              {context.data.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {isError && context.error && (
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-900 dark:text-red-300">Error</AlertTitle>
            <AlertDescription className="text-red-800 dark:text-red-400">
              {context.error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {isIdle || state.value === 'validationError' ? (
            <AnimatedButton onClick={handleSubmit} disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </AnimatedButton>
          ) : null}

          {isError && (
            <>
              <AnimatedButton onClick={handleRetry} variant="outline" className="flex-1">
                Retry
              </AnimatedButton>
              <AnimatedButton onClick={handleReset} variant="outline" className="flex-1">
                Reset
              </AnimatedButton>
            </>
          )}

          {isSuccess && (
            <AnimatedButton onClick={handleReset} className="flex-1">
              Reset Form
            </AnimatedButton>
          )}
        </div>

        {/* State Debug Info */}
        <details className="mt-6">
          <summary className="text-sm font-semibold cursor-pointer text-slate-600 dark:text-slate-400">
            Debug: State Machine Info
          </summary>
          <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
            <pre className="text-xs font-mono overflow-auto">
              {JSON.stringify(
                {
                  value: state.value,
                  context: {
                    formData: context.formData,
                    validationErrors: context.validationErrors,
                    hasData: !!context.data,
                    hasError: !!context.error,
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
