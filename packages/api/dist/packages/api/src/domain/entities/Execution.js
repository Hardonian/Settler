"use strict";
/**
 * Job Execution Domain Entity
 * Represents a single execution of a reconciliation job
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Execution = exports.ExecutionStatus = void 0;
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["RUNNING"] = "running";
    ExecutionStatus["COMPLETED"] = "completed";
    ExecutionStatus["FAILED"] = "failed";
    ExecutionStatus["CANCELLED"] = "cancelled";
})(ExecutionStatus || (exports.ExecutionStatus = ExecutionStatus = {}));
class Execution {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        return new Execution({
            ...props,
            id: crypto.randomUUID(),
            status: ExecutionStatus.RUNNING,
            startedAt: new Date(),
            createdAt: new Date(),
        });
    }
    static fromPersistence(props) {
        return new Execution(props);
    }
    get id() {
        return this.props.id;
    }
    get jobId() {
        return this.props.jobId;
    }
    get status() {
        return this.props.status;
    }
    get startedAt() {
        return this.props.startedAt;
    }
    get completedAt() {
        return this.props.completedAt;
    }
    get error() {
        return this.props.error;
    }
    get summary() {
        return this.props.summary ? { ...this.props.summary } : undefined;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    complete(summary) {
        this.props.status = ExecutionStatus.COMPLETED;
        this.props.completedAt = new Date();
        this.props.summary = summary;
        // Calculate accuracy if possible
        const total = summary.matched + summary.unmatched;
        if (total > 0) {
            this.props.summary.accuracy = (summary.matched / total) * 100;
        }
    }
    fail(error) {
        this.props.status = ExecutionStatus.FAILED;
        this.props.completedAt = new Date();
        this.props.error = error;
    }
    cancel() {
        this.props.status = ExecutionStatus.CANCELLED;
        this.props.completedAt = new Date();
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.Execution = Execution;
//# sourceMappingURL=Execution.js.map