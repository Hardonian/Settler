import { Pool, PoolClient } from 'pg';
export declare const pool: Pool;
export declare function query<T = Record<string, unknown>>(text: string, params?: (string | number | boolean | null | Date)[]): Promise<T[]>;
export declare function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
export declare function initDatabase(): Promise<void>;
//# sourceMappingURL=index.d.ts.map