/**
 * Job Execution Domain Entity
 * Represents a single execution of a reconciliation job
 */

export enum ExecutionStatus {
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface ExecutionSummary {
  matched: number;
  unmatched: number;
  errors: number;
  accuracy?: number;
}

export interface ExecutionProps {
  id: string;
  jobId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  summary?: ExecutionSummary;
  createdAt: Date;
}

export class Execution {
  private constructor(private props: ExecutionProps) {}

  static create(
    props: Omit<ExecutionProps, "id" | "status" | "startedAt" | "createdAt">
  ): Execution {
    return new Execution({
      ...props,
      id: crypto.randomUUID(),
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: ExecutionProps): Execution {
    return new Execution(props);
  }

  get id(): string {
    return this.props.id;
  }

  get jobId(): string {
    return this.props.jobId;
  }

  get status(): ExecutionStatus {
    return this.props.status;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get error(): string | undefined {
    return this.props.error;
  }

  get summary(): ExecutionSummary | undefined {
    return this.props.summary ? { ...this.props.summary } : undefined;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  complete(summary: ExecutionSummary): void {
    this.props.status = ExecutionStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.summary = summary;

    // Calculate accuracy if possible
    const total = summary.matched + summary.unmatched;
    if (total > 0) {
      this.props.summary.accuracy = (summary.matched / total) * 100;
    }
  }

  fail(error: string): void {
    this.props.status = ExecutionStatus.FAILED;
    this.props.completedAt = new Date();
    this.props.error = error;
  }

  cancel(): void {
    this.props.status = ExecutionStatus.CANCELLED;
    this.props.completedAt = new Date();
  }

  toPersistence(): ExecutionProps {
    return { ...this.props };
  }
}
