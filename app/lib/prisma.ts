// Use mock database for local testing, real Prisma for production
let prisma: any;

if (process.env.NODE_ENV === 'production' || process.env.USE_REAL_DB === 'true') {
  // Use real Prisma in production or when explicitly requested
  try {
    const { PrismaClient } = require('@prisma/client');
    const globalForPrisma = global as unknown as { prisma: any };

    prisma =
      globalForPrisma.prisma ||
      new PrismaClient({
        log: ['error', 'warn'],
      });

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  } catch (e) {
    console.error('Prisma client error, falling back to mock:', e);
    const { prisma: mockPrisma } = require('./db-mock');
    prisma = mockPrisma;
  }
} else {
  // Use mock database for local development
  const { prisma: mockPrisma } = require('./db-mock');
  prisma = mockPrisma;
}

export default prisma;
