// Use real Prisma with fallback to mock
let prisma: any;

const globalForPrisma = global as unknown as { prisma?: any };

function initializePrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  try {
    // Only use real Prisma in production when DATABASE_URL is set
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      const { PrismaClient } = require('@prisma/client');
      const client = new PrismaClient({
        log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
      });

      globalForPrisma.prisma = client;
      console.log('✓ Initialized real Prisma client');
      return client;
    }
  } catch (e) {
    console.error('Prisma init error:', e instanceof Error ? e.message : String(e));
  }

  // Fallback to mock database
  try {
    const { prisma: mockPrisma } = require('./db-mock');
    globalForPrisma.prisma = mockPrisma;
    console.log('✓ Using mock database');
    return mockPrisma;
  } catch (mockError) {
    console.error('Mock database error:', mockError);
    throw new Error('Failed to initialize any database');
  }
}

prisma = initializePrisma();

export default prisma;
