/**
 * Approval Workflow System
 * 
 * Manages content approval before publishing
 * Routes through approval queue with notifications
 * 
 * Usage: node approval-workflow.js --action=list
 */

const fs = require('fs');
const path = require('path');

const APPROVAL_DIR = './output/approvals';
const PUBLISHED_DIR = './output/published';
const QUEUE_FILE = path.join(APPROVAL_DIR, 'queue.json');

// Ensure directories exist
[APPROVAL_DIR, PUBLISHED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface QueueItem {
  id: string;
  type: 'blog' | 'social' | 'email' | 'partnership';
  title: string;
  content: string;
  platform?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  submittedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  notes?: string;
}

class ApprovalWorkflow {
  private queue: QueueItem[] = [];

  constructor() {
    this.loadQueue();
  }

  loadQueue() {
    try {
      if (fs.existsSync(QUEUE_FILE)) {
        this.queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
      }
    } catch (e) {
      console.error('Error loading queue:', e);
      this.queue = [];
    }
  }

  saveQueue() {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(this.queue, null, 2));
  }

  submit(item: Omit<QueueItem, 'id' | 'submittedAt' | 'status'>): QueueItem {
    const newItem: QueueItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    this.queue.push(newItem);
    this.saveQueue();

    console.log(`✅ Submitted: "${newItem.title}"`);
    console.log(`   Type: ${newItem.type}`);
    console.log(`   ID: ${newItem.id}`);
    console.log(`   Status: PENDING`);

    // In production: Send notification (Slack, email)
    this.notify(`New ${newItem.type} awaiting approval: "${newItem.title}"`);

    return newItem;
  }

  approve(id: string, approver: string, notes?: string): QueueItem | null {
    const item = this.queue.find(i => i.id === id);
    if (!item) {
      console.log(`❌ Item not found: ${id}`);
      return null;
    }

    if (item.status !== 'pending') {
      console.log(`❌ Item already ${item.status}: ${id}`);
      return null;
    }

    item.status = 'approved';
    item.approvedBy = approver;
    item.approvedAt = new Date().toISOString();
    item.notes = notes;

    this.saveQueue();

    console.log(`✅ Approved: "${item.title}"`);
    console.log(`   By: ${approver}`);
    if (notes) console.log(`   Notes: ${notes}`);

    this.notify(`✅ "${item.title}" approved by ${approver}`);

    return item;
  }

  reject(id: string, approver: string, reason: string): QueueItem | null {
    const item = this.queue.find(i => i.id === id);
    if (!item) {
      console.log(`❌ Item not found: ${id}`);
      return null;
    }

    item.status = 'rejected';
    item.approvedBy = approver;
    item.approvedAt = new Date().toISOString();
    item.notes = reason;

    this.saveQueue();

    console.log(`❌ Rejected: "${item.title}"`);
    console.log(`   By: ${approver}`);
    console.log(`   Reason: ${reason}`);

    this.notify(`❌ "${item.title}" rejected by ${approver}: ${reason}`);

    return item;
  }

  publish(id: string): QueueItem | null {
    const item = this.queue.find(i => i.id === id);
    if (!item) {
      console.log(`❌ Item not found: ${id}`);
      return null;
    }

    if (item.status !== 'approved') {
      console.log(`❌ Item must be approved before publishing: ${id}`);
      return null;
    }

    item.status = 'published';
    item.publishedAt = new Date().toISOString();

    // Save to published folder
    const publishPath = path.join(PUBLISHED_DIR, `${item.type}_${id}.json`);
    fs.writeFileSync(publishPath, JSON.stringify(item, null, 2));

    // In production: Actually publish to platform
    this.executePublish(item);

    this.saveQueue();

    console.log(`🚀 Published: "${item.title}"`);
    console.log(`   Platform: ${item.platform || 'N/A'}`);
    console.log(`   Saved to: ${publishPath}`);

    this.notify(`🚀 "${item.title}" published to ${item.platform || 'platform'}`);

    return item;
  }

  executePublish(item: QueueItem) {
    // In production: Integrate with Twitter API, LinkedIn API, etc.
    console.log(`   [Would publish to ${item.platform || 'blog'}]`);
    
    switch (item.platform) {
      case 'twitter':
        console.log('   → Posting to Twitter API...');
        break;
      case 'linkedin':
        console.log('   → Posting to LinkedIn API...');
        break;
      case 'blog':
        console.log('   → Publishing to blog...');
        break;
      default:
        console.log('   → Publishing to appropriate channel...');
    }
  }

  list(status?: string): QueueItem[] {
    let items = this.queue;
    
    if (status) {
      items = items.filter(i => i.status === status);
    }

    return items.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  getStats(): Record<string, number> {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'pending').length,
      approved: this.queue.filter(i => i.status === 'approved').length,
      rejected: this.queue.filter(i => i.status === 'rejected').length,
      published: this.queue.filter(i => i.status === 'published').length
    };
  }

  notify(message: string) {
    // In production: Send Slack notification, email, etc.
    console.log(`   [NOTIFICATION] ${message}`);
  }

  autoApprove(item: QueueItem): boolean {
    // Auto-approve low-risk content
    if (item.type === 'social' && item.platform === 'twitter') {
      const lowRiskIndicators = [
        'tips',
        'best practices',
        'guide'
      ];
      
      if (lowRiskIndicators.some(indicator => 
        item.title.toLowerCase().includes(indicator)
      )) {
        console.log(`   🤖 Auto-approved (low-risk): "${item.title}"`);
        this.approve(item.id, 'system', 'Auto-approved: Low-risk content');
        return true;
      }
    }
    
    return false;
  }
}

// CLI
const workflow = new ApprovalWorkflow();
const args = process.argv.slice(2);
const action = args.find(a => a.startsWith('--action='))?.split('=')[1];

switch (action) {
  case 'submit': {
    const type = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'blog';
    const title = args.find(a => a.startsWith('--title='))?.split('=')[1] || 'Test Title';
    const content = args.find(a => a.startsWith('--content='))?.split('=')[1] || 'Test content';
    const platform = args.find(a => a.startsWith('--platform='))?.split('=')[1];
    
    const item = workflow.submit({
      type: type as any,
      title,
      content,
      platform,
      submittedBy: 'automated-system'
    });
    
    // Try auto-approve
    workflow.autoApprove(item);
    break;
  }

  case 'approve': {
    const id = args.find(a => a.startsWith('--id='))?.split('=')[1];
    const approver = args.find(a => a.startsWith('--approver='))?.split('=')[1] || 'admin';
    const notes = args.find(a => a.startsWith('--notes='))?.split('=')[1];
    
    if (!id) {
      console.log('Usage: --action=approve --id=xxx [--approver=name] [--notes=xxx]');
      break;
    }
    
    workflow.approve(id, approver, notes);
    break;
  }

  case 'reject': {
    const id = args.find(a => a.startsWith('--id='))?.split('=')[1];
    const approver = args.find(a => a.startsWith('--approver='))?.split('=')[1] || 'admin';
    const reason = args.find(a => a.startsWith('--reason='))?.split('=')[1] || 'No reason provided';
    
    if (!id) {
      console.log('Usage: --action=reject --id=xxx [--approver=name] --reason=xxx');
      break;
    }
    
    workflow.reject(id, approver, reason);
    break;
  }

  case 'publish': {
    const id = args.find(a => a.startsWith('--id='))?.split('=')[1];
    
    if (!id) {
      console.log('Usage: --action=publish --id=xxx');
      break;
    }
    
    workflow.publish(id);
    break;
  }

  case 'list': {
    const status = args.find(a => a.startsWith('--status='))?.split('=')[1];
    const items = workflow.list(status);
    
    console.log(`\n📋 Approval Queue${status ? ` (${status})` : ''}`);
    console.log('=' .repeat(60));
    
    if (items.length === 0) {
      console.log('No items found.');
    } else {
      items.forEach((item, i) => {
        console.log(`\n${i + 1}. "${item.title}"`);
        console.log(`   Type: ${item.type}${item.platform ? ` (${item.platform})` : ''}`);
        console.log(`   Status: ${item.status.toUpperCase()}`);
        console.log(`   Submitted: ${item.submittedAt}`);
        console.log(`   ID: ${item.id}`);
      });
    }
    break;
  }

  case 'stats': {
    const stats = workflow.getStats();
    console.log('\n📊 Approval Statistics');
    console.log('=' .repeat(60));
    console.log(`Total items:     ${stats.total}`);
    console.log(`Pending:         ${stats.pending}`);
    console.log(`Approved:        ${stats.approved}`);
    console.log(`Rejected:        ${stats.rejected}`);
    console.log(`Published:       ${stats.published}`);
    break;
  }

  default:
    console.log('Approval Workflow System');
    console.log('=' .repeat(60));
    console.log('');
    console.log('Actions:');
    console.log('  --action=submit --type=blog|social|email --title="xxx" --content="xxx" [--platform=twitter|linkedin]');
    console.log('  --action=approve --id=xxx [--approver=name] [--notes=xxx]');
    console.log('  --action=reject --id=xxx [--approver=name] --reason=xxx');
    console.log('  --action=publish --id=xxx');
    console.log('  --action=list [--status=pending|approved|rejected|published]');
    console.log('  --action=stats');
    console.log('');
    console.log('Examples:');
    console.log('  node approval-workflow.js --action=submit --type=social --title="5 Tips" --platform=twitter');
    console.log('  node approval-workflow.js --action=approve --id=item_123 --approver=Scott');
    console.log('  node approval-workflow.js --action=list --status=pending');
}

module.exports = { ApprovalWorkflow };
