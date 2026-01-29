"use strict";
/**
 * Reconciliation Job Domain Entity
 * Represents a reconciliation job configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = exports.JobStatus = void 0;
var JobStatus;
(function (JobStatus) {
    JobStatus["ACTIVE"] = "active";
    JobStatus["PAUSED"] = "paused";
    JobStatus["ARCHIVED"] = "archived";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
class Job {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        return new Job({
            ...props,
            id: crypto.randomUUID(),
            status: JobStatus.ACTIVE,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    static fromPersistence(props) {
        return new Job(props);
    }
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get name() {
        return this.props.name;
    }
    get sourceAdapter() {
        return this.props.sourceAdapter;
    }
    get sourceConfigEncrypted() {
        return this.props.sourceConfigEncrypted;
    }
    get targetAdapter() {
        return this.props.targetAdapter;
    }
    get targetConfigEncrypted() {
        return this.props.targetConfigEncrypted;
    }
    get rules() {
        return { ...this.props.rules };
    }
    get schedule() {
        return this.props.schedule;
    }
    get status() {
        return this.props.status;
    }
    get version() {
        return this.props.version;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    pause() {
        if (this.props.status === JobStatus.ACTIVE) {
            this.props.status = JobStatus.PAUSED;
            this.props.updatedAt = new Date();
            this.props.version += 1;
        }
    }
    resume() {
        if (this.props.status === JobStatus.PAUSED) {
            this.props.status = JobStatus.ACTIVE;
            this.props.updatedAt = new Date();
            this.props.version += 1;
        }
    }
    archive() {
        this.props.status = JobStatus.ARCHIVED;
        this.props.updatedAt = new Date();
        this.props.version += 1;
    }
    updateRules(rules) {
        this.props.rules = rules;
        this.props.updatedAt = new Date();
        this.props.version += 1;
    }
    updateSchedule(schedule) {
        if (schedule !== undefined) {
            this.props.schedule = schedule;
        }
        else {
            delete this.props.schedule;
        }
        this.props.updatedAt = new Date();
        this.props.version += 1;
    }
    updateConfigs(sourceConfigEncrypted, targetConfigEncrypted) {
        this.props.sourceConfigEncrypted = sourceConfigEncrypted;
        this.props.targetConfigEncrypted = targetConfigEncrypted;
        this.props.updatedAt = new Date();
        this.props.version += 1;
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.Job = Job;
//# sourceMappingURL=Job.js.map