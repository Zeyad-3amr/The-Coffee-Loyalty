// Use mock database - simple and works everywhere
// For production with persistence, upgrade to Prisma Data Proxy + connection pooling
import { prisma as mockPrisma } from './db-mock';

export default mockPrisma;
