"use strict";
/**
 * Admin CLI Commands
 * CLI interface for admin operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminCommands = createAdminCommands;
const commander_1 = require("commander");
function createAdminCommands() {
    const admin = new commander_1.Command('admin');
    // Get saga status
    admin
        .command('saga:status')
        .description('Get saga status')
        .requiredOption('--saga-id <id>', 'Saga ID')
        .requiredOption('--saga-type <type>', 'Saga type')
        .action(async (options) => {
        // Implementation would call AdminService
        console.log(`Getting status for saga ${options.sagaId} of type ${options.sagaType}`);
    });
    // List events for aggregate
    admin
        .command('events:list')
        .description('List events for an aggregate')
        .requiredOption('--aggregate-id <id>', 'Aggregate ID')
        .requiredOption('--aggregate-type <type>', 'Aggregate type')
        .action(async (options) => {
        console.log(`Listing events for ${options.aggregateType}:${options.aggregateId}`);
    });
    // Resume saga
    admin
        .command('saga:resume')
        .description('Resume a saga')
        .requiredOption('--saga-id <id>', 'Saga ID')
        .requiredOption('--saga-type <type>', 'Saga type')
        .action(async (options) => {
        console.log(`Resuming saga ${options.sagaId}`);
    });
    // Retry saga
    admin
        .command('saga:retry')
        .description('Retry a saga')
        .requiredOption('--saga-id <id>', 'Saga ID')
        .requiredOption('--saga-type <type>', 'Saga type')
        .action(async (options) => {
        console.log(`Retrying saga ${options.sagaId}`);
    });
    // Cancel saga
    admin
        .command('saga:cancel')
        .description('Cancel a saga')
        .requiredOption('--saga-id <id>', 'Saga ID')
        .requiredOption('--saga-type <type>', 'Saga type')
        .action(async (options) => {
        console.log(`Cancelling saga ${options.sagaId}`);
    });
    // List dead letter queue
    admin
        .command('dlq:list')
        .description('List dead letter queue entries')
        .option('--tenant-id <id>', 'Filter by tenant ID')
        .option('--limit <n>', 'Limit results', '100')
        .action(async (options) => {
        console.log(`Listing DLQ entries (limit: ${options.limit})`);
    });
    // Resolve dead letter entry
    admin
        .command('dlq:resolve')
        .description('Resolve a dead letter queue entry')
        .requiredOption('--id <id>', 'Entry ID')
        .option('--notes <text>', 'Resolution notes')
        .action(async (options) => {
        console.log(`Resolving DLQ entry ${options.id}`);
    });
    // Rebuild projections
    admin
        .command('projections:rebuild')
        .description('Rebuild read model projections')
        .option('--reconciliation-id <id>', 'Rebuild specific reconciliation')
        .action(async (options) => {
        if (options.reconciliationId) {
            console.log(`Rebuilding projection for reconciliation ${options.reconciliationId}`);
        }
        else {
            console.log('Rebuilding all projections');
        }
    });
    // Dry-run reconciliation
    admin
        .command('reconciliation:dry-run')
        .description('Dry-run reconciliation using historical events')
        .requiredOption('--reconciliation-id <id>', 'Reconciliation ID')
        .action(async (options) => {
        console.log(`Dry-running reconciliation ${options.reconciliationId}`);
    });
    return admin;
}
//# sourceMappingURL=admin.js.map