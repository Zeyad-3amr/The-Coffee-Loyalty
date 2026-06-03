export interface PassBuildParams {
  stampId: string;
  serialNumber: string;
  authToken: string;
  stampCount: number;
  shopName: string;
}

export interface CreatePassResult {
  serialNumber: string;
  authToken: string;
  passUrl: string;
}

export interface WalletStampResult {
  stampCount: number;
  rewardActive: boolean;
  rewardExpiresAt: Date | null;
  passUrl?: string;
}
