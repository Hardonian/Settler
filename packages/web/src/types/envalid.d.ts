declare module "envalid" {
  export function cleanEnv<T extends Record<string, unknown>>(
    env: NodeJS.ProcessEnv,
    specs: T
  ): { [K in keyof T]: T[K] };

  export function str(options?: {
    choices?: string[];
    default?: string;
    devDefault?: string;
    desc?: string;
  }): unknown;
  export function num(options?: { default?: number; devDefault?: number; desc?: string }): unknown;
  export function url(options?: { default?: string; desc?: string }): unknown;
  export function bool(options?: { default?: boolean; desc?: string }): unknown;
  export function host(options?: { default?: string; desc?: string }): unknown;
  export function port(options?: { default?: number; desc?: string }): unknown;
}
