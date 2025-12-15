/**
 * Prisma Analytics Database Integration
 * Complete database integration for analytics events
 */

import { PrismaClient } from '@prisma/client';

// Use singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Save analytics event to database
 */
export async function saveAnalyticsEvent(data: {
  type: string;
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type: data.type,
        data: data.data,
        userId: data.userId,
        sessionId: data.sessionId,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error('Failed to save analytics event:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Save SDK download event
 */
export async function saveSDKDownload(data: {
  packageName: string;
  version: string;
  packageManager: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.sDKDownload.create({
      data: {
        packageName: data.packageName,
        version: data.version,
        packageManager: data.packageManager,
        userId: data.userId,
        sessionId: data.sessionId,
        userAgent: data.userAgent,
        referrer: data.referrer,
        ipAddress: data.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to save SDK download:', error);
  }
}

/**
 * Save playground usage event
 */
export async function savePlaygroundUsage(data: {
  feature: string;
  action: string;
  integration?: string;
  durationMs?: number;
  success?: boolean;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await prisma.playgroundUsage.create({
      data: {
        feature: data.feature,
        action: data.action,
        integration: data.integration,
        durationMs: data.durationMs,
        success: data.success,
        userId: data.userId,
        sessionId: data.sessionId,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error('Failed to save playground usage:', error);
  }
}

/**
 * Save chatbot conversation
 */
export async function saveChatbotConversation(data: {
  conversationId: string;
  message: string;
  response: string;
  userId?: string;
  sessionId?: string;
  deviceInfo?: Record<string, any>;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await prisma.chatbotConversation.create({
      data: {
        conversationId: data.conversationId,
        message: data.message,
        response: data.response,
        userId: data.userId,
        sessionId: data.sessionId,
        deviceInfo: data.deviceInfo,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error('Failed to save chatbot conversation:', error);
  }
}

/**
 * Save chatbot analytics event
 */
export async function saveChatbotAnalytics(data: {
  type: string;
  data: Record<string, any>;
  sessionId?: string;
  userId?: string;
}): Promise<void> {
  try {
    await prisma.chatbotAnalytics.create({
      data: {
        type: data.type,
        data: data.data,
        sessionId: data.sessionId,
        userId: data.userId,
      },
    });
  } catch (error) {
    console.error('Failed to save chatbot analytics:', error);
  }
}

/**
 * Get SDK download statistics
 */
export async function getSDKDownloadStats(startDate?: Date, endDate?: Date) {
  const where: any = {};
  
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [total, downloads] = await Promise.all([
    prisma.sDKDownload.count({ where }),
    prisma.sDKDownload.findMany({
      where,
      select: {
        packageName: true,
        timestamp: true,
      },
    }),
  ]);

  // Calculate weekly and monthly
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const weekly = await prisma.sDKDownload.count({
    where: {
      ...where,
      timestamp: { gte: weekAgo },
    },
  });

  const monthly = await prisma.sDKDownload.count({
    where: {
      ...where,
      timestamp: { gte: monthAgo },
    },
  });

  // Group by package
  const byPackage: Record<string, number> = {};
  downloads.forEach((d) => {
    byPackage[d.packageName] = (byPackage[d.packageName] || 0) + 1;
  });

  return {
    total,
    weekly,
    monthly,
    byPackage,
  };
}

/**
 * Get playground usage statistics
 */
export async function getPlaygroundStats() {
  const [totalSessions, usage] = await Promise.all([
    prisma.playgroundUsage.count(),
    prisma.playgroundUsage.findMany({
      select: {
        feature: true,
        sessionId: true,
        userId: true,
      },
    }),
  ]);

  // Count unique active users
  const activeUsers = new Set(
    usage.filter((u) => u.userId).map((u) => u.userId)
  ).size;

  // Group by feature
  const usageByFeature: Record<string, number> = {};
  usage.forEach((u) => {
    usageByFeature[u.feature] = (usageByFeature[u.feature] || 0) + 1;
  });

  return {
    totalSessions,
    activeUsers,
    usageByFeature,
  };
}

/**
 * Get chatbot analytics
 */
export async function getChatbotAnalytics() {
  const [totalInteractions, conversations] = await Promise.all([
    prisma.chatbotAnalytics.count(),
    prisma.chatbotConversation.findMany({
      select: {
        message: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 1000,
    }),
  ]);

  // Calculate average response time (mock for now)
  const averageResponseTime = 1.2;

  // Get popular questions
  const questionCounts: Record<string, number> = {};
  conversations.forEach((c) => {
    const question = c.message.substring(0, 100);
    questionCounts[question] = (questionCounts[question] || 0) + 1;
  });

  const popularQuestions = Object.entries(questionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([question, count]) => ({ question, count }));

  return {
    totalInteractions,
    averageResponseTime,
    satisfactionScore: 4.6, // TODO: Add satisfaction tracking
    popularQuestions,
  };
}
