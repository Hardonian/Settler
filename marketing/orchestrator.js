#!/usr/bin/env node
/**
 * Master Marketing Orchestrator
 * 
 * Coordinates all marketing activities
 * Integrates with approval workflow and social publishing
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const APPROVAL_WORKFLOW = path.join(__dirname, 'approval-workflow.js');
const SOCIAL_PUBLISHER = path.join(__dirname, 'integrations/social-publisher.js');

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function runWithApproval() {
  log('🚀 Starting orchestrated marketing run...');
  
  // 1. Generate content
  log('Generating content...');
  execSync(`cd ${__dirname} && node daily-run.js`, { stdio: 'inherit' });
  
  // 2. Submit for approval
  log('Submitting content for approval...');
  
  const outputDir = path.join(__dirname, 'output');
  const today = new Date().toISOString().split('T')[0];
  
  // Submit blog posts
  const blogDir = path.join(outputDir, 'blog', today);
  if (fs.existsSync(blogDir)) {
    const blogs = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
    blogs.forEach(blog => {
      const title = blog.replace('.md', '').replace(/-/g, ' ');
      execSync(`node ${APPROVAL_WORKFLOW} --action=submit --type=blog --title="${title}" --content="${blogDir}/${blog}"`);
    });
  }
  
  // Submit social posts
  const socialDir = path.join(outputDir, 'social', today);
  if (fs.existsSync(socialDir)) {
    const socials = fs.readdirSync(socialDir).filter(f => f.endsWith('.md'));
    socials.forEach(social => {
      const content = fs.readFileSync(path.join(socialDir, social), 'utf-8');
      const lines = content.split('\n');
      const title = lines.find(l => l.startsWith('#'))?.replace('# ', '') || social;
      
      const platform = content.includes('TWITTER') ? 'twitter' : 
                       content.includes('LINKEDIN') ? 'linkedin' : 'twitter';
      
      execSync(`node ${APPROVAL_WORKFLOW} --action=submit --type=social --title="${title}" --content="${social}" --platform=${platform}`);
    });
  }
  
  // 3. Process scheduled posts
  log('Processing scheduled social posts...');
  execSync(`node ${SOCIAL_PUBLISHER} process`, { stdio: 'inherit' });
  
  log('✅ Orchestrated run complete!');
}

// Run
runWithApproval().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
