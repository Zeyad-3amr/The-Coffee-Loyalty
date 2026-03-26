// Mock database for local testing - uses in-memory storage
// When deployed to Vercel, this will be replaced with real Prisma

import { nanoid } from 'nanoid';

interface Shop {
  id: string;
  name: string;
  qrCode: string;
  createdAt: Date;
}

interface Customer {
  id: string;
  phoneNumber: string;
  createdAt: Date;
}

interface Stamp {
  id: string;
  shopId: string;
  customerId: string;
  stampCount: number;
  lastScannedAt: Date | null;
  rewardActive: boolean;
  rewardExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

class MockDatabase {
  private shops: Map<string, Shop> = new Map();
  private customers: Map<string, Customer> = new Map();
  private stamps: Map<string, Stamp> = new Map();
  private shopsByQrCode: Map<string, string> = new Map();
  private customersByPhone: Map<string, string> = new Map();
  private stampsByShopAndCustomer: Map<string, string> = new Map();

  shop = {
    findUnique: async ({ where }: any) => {
      if (where.id) return this.shops.get(where.id) || null;
      if (where.qrCode) return this.shops.get(this.shopsByQrCode.get(where.qrCode) || '') || null;
      return null;
    },
    create: async ({ data }: any) => {
      const shop: Shop = {
        id: nanoid(),
        name: data.name,
        qrCode: data.qrCode,
        createdAt: new Date(),
      };
      this.shops.set(shop.id, shop);
      this.shopsByQrCode.set(shop.qrCode, shop.id);
      return shop;
    },
  };

  customer = {
    findUnique: async ({ where }: any) => {
      if (where.phoneNumber) {
        const id = this.customersByPhone.get(where.phoneNumber);
        return id ? this.customers.get(id) || null : null;
      }
      return this.customers.get(where.id) || null;
    },
    create: async ({ data }: any) => {
      const customer: Customer = {
        id: nanoid(),
        phoneNumber: data.phoneNumber,
        createdAt: new Date(),
      };
      this.customers.set(customer.id, customer);
      this.customersByPhone.set(customer.phoneNumber, customer.id);
      return customer;
    },
  };

  stamp = {
    findUnique: async ({ where }: any) => {
      if (where.shopId_customerId) {
        const key = `${where.shopId_customerId.shopId}:${where.shopId_customerId.customerId}`;
        const id = this.stampsByShopAndCustomer.get(key);
        return id ? this.stamps.get(id) || null : null;
      }
      return this.stamps.get(where.id) || null;
    },
    findMany: async ({ where, include, orderBy }: any) => {
      const results = Array.from(this.stamps.values()).filter((s) => s.shopId === where.shopId);

      if (include?.customer) {
        return results.map((stamp) => ({
          ...stamp,
          customer: this.customers.get(stamp.customerId),
        }));
      }
      return results;
    },
    create: async ({ data }: any) => {
      const stamp: Stamp = {
        id: nanoid(),
        shopId: data.shopId,
        customerId: data.customerId,
        stampCount: data.stampCount ?? 0,
        lastScannedAt: null,
        rewardActive: false,
        rewardExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.stamps.set(stamp.id, stamp);
      const key = `${stamp.shopId}:${stamp.customerId}`;
      this.stampsByShopAndCustomer.set(key, stamp.id);
      return stamp;
    },
    update: async ({ where, data }: any) => {
      const stamp = this.stamps.get(where.id);
      if (!stamp) throw new Error('Stamp not found');

      const updated: Stamp = {
        ...stamp,
        ...data,
        updatedAt: new Date(),
      };
      this.stamps.set(stamp.id, updated);
      return updated;
    },
  };

  $disconnect = async () => {
    // No-op for mock database
  };
}

// Use singleton pattern to ensure database persists across requests
let instance: MockDatabase;

function getPrisma() {
  if (!instance) {
    instance = new MockDatabase();
  }
  return instance;
}

export const prisma = getPrisma() as any;
export default prisma;
