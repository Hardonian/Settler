/**
 * Reconciliation Job Domain Entity
 * Represents a reconciliation job configuration
 */

export enum JobStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  ARCHIVED = "archived",
}

export interface MatchingRule {
  field: string;
  type: "exact" | "fuzzy" | "range";
  tolerance?: number;
  threshold?: number;
  days?: number;
}

export interface ReconciliationRules {
  matching: MatchingRule[];
  conflictResolution: "first-wins" | "last-wins" | "manual-review";
}

export interface JobProps {
  id: string;
  userId: string;
  name: string;
  sourceAdapter: string;
  sourceConfigEncrypted: string;
  targetAdapter: string;
  targetConfigEncrypted: string;
  rules: ReconciliationRules;
  schedule?: string;
  status: JobStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Job {
  private constructor(private props: JobProps) {}

  static create(
    props: Omit<JobProps, "id" | "status" | "version" | "createdAt" | "updatedAt">
  ): Job {
    return new Job({
      ...props,
      id: crypto.randomUUID(),
      status: JobStatus.ACTIVE,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: JobProps): Job {
    return new Job(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get sourceAdapter(): string {
    return this.props.sourceAdapter;
  }

  get sourceConfigEncrypted(): string {
    return this.props.sourceConfigEncrypted;
  }

  get targetAdapter(): string {
    return this.props.targetAdapter;
  }

  get targetConfigEncrypted(): string {
    return this.props.targetConfigEncrypted;
  }

  get rules(): ReconciliationRules {
    return { ...this.props.rules };
  }

  get schedule(): string | undefined {
    return this.props.schedule;
  }

  get status(): JobStatus {
    return this.props.status;
  }

  get version(): number {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  pause(): void {
    if (this.props.status === JobStatus.ACTIVE) {
      this.props.status = JobStatus.PAUSED;
      this.props.updatedAt = new Date();
      this.props.version += 1;
    }
  }

  resume(): void {
    if (this.props.status === JobStatus.PAUSED) {
      this.props.status = JobStatus.ACTIVE;
      this.props.updatedAt = new Date();
      this.props.version += 1;
    }
  }

  archive(): void {
    this.props.status = JobStatus.ARCHIVED;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  updateRules(rules: ReconciliationRules): void {
    this.props.rules = rules;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  updateSchedule(schedule: string | undefined): void {
    if (schedule !== undefined) {
      this.props.schedule = schedule;
    } else {
      delete this.props.schedule;
    }
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  updateConfigs(sourceConfigEncrypted: string, targetConfigEncrypted: string): void {
    this.props.sourceConfigEncrypted = sourceConfigEncrypted;
    this.props.targetConfigEncrypted = targetConfigEncrypted;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPersistence(): JobProps {
    return { ...this.props };
  }
}
