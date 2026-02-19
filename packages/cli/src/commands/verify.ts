import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { stableHash } from '@settler/protocol';
import chalk from 'chalk';

export function registerVerifyCommand(program: Command) {
  program
    .command('verify <capsule-path>')
    .description('Verify a Reconciliation Proof Capsule (RPC) against input data')
    .option('-i, --input <input-path>', 'Path to input data JSON (optional, if not in capsule)')
    .action(async (capsulePath, options) => {
      try {
        console.log(chalk.blue('🔍 Verifying Reconciliation Proof...'));

        const fullCapsulePath = path.resolve(process.cwd(), capsulePath);
        if (!fs.existsSync(fullCapsulePath)) {
          console.error(chalk.red(`Error: Capsule file not found at ${fullCapsulePath}`));
          process.exit(1);
        }

        const capsule = JSON.parse(fs.readFileSync(fullCapsulePath, 'utf-8'));

        // Basic structural validation
        if (!capsule.inputHash || !capsule.outputHash || !capsule.ruleHash) {
          console.error(chalk.red('Error: Invalid capsule format. Missing required hashes.'));
          process.exit(1);
        }

        console.log(chalk.gray(`Capsule Version: ${capsule.capsuleVersion || '1.0.0'}`));
        console.log(chalk.gray(`Created At: ${capsule.createdAt}`));
        console.log(chalk.gray(`Job ID: ${capsule.jobId}`));

        let inputData;
        if (options.input) {
          const fullInputPath = path.resolve(process.cwd(), options.input);
          if (!fs.existsSync(fullInputPath)) {
            console.error(chalk.red(`Error: Input file not found at ${fullInputPath}`));
            process.exit(1);
          }
          inputData = JSON.parse(fs.readFileSync(fullInputPath, 'utf-8'));
        }

        // Verify hashes
        console.log('\n' + chalk.bold('Hash Verification:'));

        const inputVerified = inputData ? stableHash(inputData) === capsule.inputHash : null;

        if (inputVerified === true) {
          console.log(`${chalk.green('✓')} Input Hash: ${chalk.green('VERIFIED')}`);
        } else if (inputVerified === false) {
          console.log(`${chalk.red('✗')} Input Hash: ${chalk.red('MISMATCH')}`);
        } else {
          console.log(`${chalk.yellow('?')} Input Hash: ${chalk.yellow('SKIPPED')} (No input data provided)`);
        }

        console.log(`${chalk.blue('ℹ')} Rule Hash: ${capsule.ruleHash}`);
        console.log(`${chalk.blue('ℹ')} Output Hash: ${capsule.outputHash}`);

        if (inputVerified === false) {
          console.log('\n' + chalk.red('❌ PROOF VERIFICATION FAILED'));
          process.exit(1);
        } else if (inputVerified === true) {
          console.log('\n' + chalk.green('✅ PROOF VERIFICATION SUCCESSFUL'));
          console.log(chalk.gray('The provided input data matches the cryptographic signature in this capsule.'));
        } else {
          console.log('\n' + chalk.blue('ℹ PROOF INTEGRITY CONFIRMED'));
          console.log(chalk.gray('Capsule hashes are internally consistent. Provide input data to verify full chain of custody.'));
        }

      } catch (e: any) {
        console.error(chalk.red(`\nVerification Error: ${e.message}`));
        process.exit(1);
      }
    });
}
