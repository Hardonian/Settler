import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { stableHash } from '@settler/protocol';
import chalk from 'chalk';

export const verifyCommand = new Command('verify')
  .description('Verify a Reconciliation Proof Capsule (RPC) against source data')
  .argument('<capsule-path>', 'Path to Reconciliation Proof Capsule (RPC) JSON')
  .option('-i, --input <path>', 'Path to input data JSON (tenantId + source/target transactions)')
  .option('-r, --rules <path>', 'Path to reconciliation rules JSON')
  .option('-o, --output <path>', 'Path to reconciliation matches/output JSON')
  .action(async (capsulePath, options) => {
    try {
      console.log(chalk.blue('🔍 Verifying Reconciliation Proof...'));

      const fullCapsulePath = path.resolve(process.cwd(), capsulePath);
      if (!fs.existsSync(fullCapsulePath)) {
        console.error(chalk.red(`Error: Capsule file not found at ${fullCapsulePath}`));
        process.exit(1);
      }

      const capsule = JSON.parse(fs.readFileSync(fullCapsulePath, 'utf-8'));

      // Protocol validation: ReconciliationProofCapsule interface
      const requiredFields = ['capsuleVersion', 'jobId', 'inputHash', 'ruleHash', 'outputHash', 'versionHash', 'createdAt'];
      const missingFields = requiredFields.filter(f => !capsule[f]);

      if (missingFields.length > 0) {
        console.error(chalk.red(`Error: Invalid capsule format. Missing fields: ${missingFields.join(', ')}`));
        process.exit(1);
      }

      console.log(chalk.gray(`Capsule Version: ${capsule.capsuleVersion}`));
      console.log(chalk.gray(`Job ID: ${capsule.jobId}`));
      console.log(chalk.gray(`Created At: ${capsule.createdAt}`));
      console.log(chalk.gray(`Version Hash: ${capsule.versionHash}`));

      console.log('\n' + chalk.bold('Verification Status:'));

      let allMatch = true;

      // 1. Verify Input Hash
      if (options.input) {
        const inputData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), options.input), 'utf-8'));
        const computedInputHash = stableHash(inputData);
        if (computedInputHash === capsule.inputHash) {
          console.log(`${chalk.green('✓')} Input Hash: ${chalk.green('MATCH')}`);
        } else {
          console.log(`${chalk.red('✗')} Input Hash: ${chalk.red('MISMATCH')}`);
          console.log(chalk.gray(`  Expected: ${capsule.inputHash}`));
          console.log(chalk.gray(`  Computed: ${computedInputHash}`));
          allMatch = false;
        }
      } else {
        console.log(`${chalk.yellow('?')} Input Hash: ${chalk.yellow('SKIPPED')} (No input data provided)`);
      }

      // 2. Verify Rule Hash
      if (options.rules) {
        const rulesData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), options.rules), 'utf-8'));
        const computedRuleHash = stableHash(rulesData);
        if (computedRuleHash === capsule.ruleHash) {
          console.log(`${chalk.green('✓')} Rule Hash: ${chalk.green('MATCH')}`);
        } else {
          console.log(`${chalk.red('✗')} Rule Hash: ${chalk.red('MISMATCH')}`);
          console.log(chalk.gray(`  Expected: ${capsule.ruleHash}`));
          console.log(chalk.gray(`  Computed: ${computedRuleHash}`));
          allMatch = false;
        }
      } else {
        console.log(`${chalk.yellow('?')} Rule Hash: ${chalk.yellow('SKIPPED')} (No rules data provided)`);
      }

      // 3. Verify Output Hash
      if (options.output) {
        const outputData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), options.output), 'utf-8'));
        const computedOutputHash = stableHash(outputData);
        if (computedOutputHash === capsule.outputHash) {
          console.log(`${chalk.green('✓')} Output Hash: ${chalk.green('MATCH')}`);
        } else {
          console.log(`${chalk.red('✗')} Output Hash: ${chalk.red('MISMATCH')}`);
          console.log(chalk.gray(`  Expected: ${capsule.outputHash}`));
          console.log(chalk.gray(`  Computed: ${computedOutputHash}`));
          allMatch = false;
        }
      } else {
        console.log(`${chalk.yellow('?')} Output Hash: ${chalk.yellow('SKIPPED')} (No output data provided)`);
      }

      if (!allMatch) {
        console.log('\n' + chalk.red('❌ PROOF VERIFICATION FAILED'));
        process.exit(1);
      } else {
        console.log('\n' + chalk.green('✅ PROOF VERIFICATION SUCCESSFUL'));
        console.log(chalk.gray('The provided data matches the cryptographic signatures in this capsule.'));
      }

    } catch (e: any) {
      console.error(chalk.red(`\nVerification Error: ${e.message}`));
      process.exit(1);
    }
  });
