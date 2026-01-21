declare module '@prisma/client' {
  export type PrismaModelDelegate<T = any> = {
    findUnique: (...args: any[]) => Promise<T | null>;
    findFirst: (...args: any[]) => Promise<T | null>;
    findMany: (...args: any[]) => Promise<T[]>;
    create: (...args: any[]) => Promise<T>;
    update: (...args: any[]) => Promise<T>;
    delete: (...args: any[]) => Promise<T>;
    upsert: (...args: any[]) => Promise<T>;
    createMany?: (...args: any[]) => Promise<any>;
    deleteMany?: (...args: any[]) => Promise<any>;
    updateMany?: (...args: any[]) => Promise<any>;
    count?: (...args: any[]) => Promise<number>;
    groupBy?: (...args: any[]) => Promise<any>;
    aggregate?: (...args: any[]) => Promise<any>;
  };

  export class PrismaClient {
    [key: string]: any;
    constructor(options?: any);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw(...args: any[]): Promise<any>;
    $transaction(...args: any[]): Promise<any>;
  }

  export namespace Prisma {
    export type JsonValue = any;
    export type JsonObject = Record<string, any>;
    export type JsonArray = any[];
    export type InputJsonValue = any;
    export type ExperimentUpdateInput = Record<string, any>;
    export type TenantPageGetPayload<T> = any;
    export type ExperimentGetPayload<T> = any;
  }

  export type IdempotencyKey = any;
}
