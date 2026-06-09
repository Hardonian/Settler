import { randomUUID } from "node:crypto";

export const v4 = (): string => randomUUID();
