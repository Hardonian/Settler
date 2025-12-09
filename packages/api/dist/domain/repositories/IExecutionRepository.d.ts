/**
 * Execution Repository Interface
 * Defines the contract for execution data persistence
 */
import { Execution } from '../entities/Execution';
export interface IExecutionRepository {
    findById(id: string): Promise<Execution | null>;
    findByJobId(jobId: string, limit: number, offset: number): Promise<Execution[]>;
    save(execution: Execution): Promise<Execution>;
    countByJobId(jobId: string): Promise<number>;
}
//# sourceMappingURL=IExecutionRepository.d.ts.map