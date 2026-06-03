import { PKPass } from 'passkit-generator';
import path from 'path';
import fs from 'fs';
import { loadCertificates } from './cert-loader';
import type { PassBuildParams } from './types';

function templateFile(name: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), 'pass-template', name));
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export async function buildPass(params: PassBuildParams): Promise<Buffer> {
  const { stampId, serialNumber, authToken, stampCount, shopName } = params;

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: requireEnv('PASS_TYPE_IDENTIFIER'),
    serialNumber,
    teamIdentifier: requireEnv('TEAM_IDENTIFIER'),
    webServiceURL: requireEnv('PASS_WEB_SERVICE_URL'),
    authenticationToken: authToken,
    organizationName: 'Rekur',
    description: 'Coffee Loyalty Card',
    logoText: '',
    foregroundColor: 'rgb(251, 191, 36)',
    backgroundColor: 'rgb(12, 10, 9)',
    labelColor: 'rgb(168, 162, 158)',
    storeCard: {
      headerFields: [
        { key: 'stamps', label: 'STAMPS', value: `${stampCount} / 10` },
      ],
      primaryFields: [
        {
          key: 'reward',
          label: 'REWARD',
          value: stampCount >= 10 ? '🎉 Free Coffee Ready!' : 'Free Coffee at 10 Stamps',
        },
      ],
      auxiliaryFields: [
        { key: 'shop', label: 'SHOP', value: shopName },
      ],
    },
    barcodes: [
      {
        message: stampId,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: 'Show to cashier',
      },
    ],
  };

  const pass = new PKPass(
    {
      'pass.json': Buffer.from(JSON.stringify(passJson)),
      'icon.png': templateFile('icon.png'),
      'icon@2x.png': templateFile('icon@2x.png'),
      'logo.png': templateFile('logo.png'),
      'logo@2x.png': templateFile('logo@2x.png'),
    },
    loadCertificates(),
  );

  return pass.getAsBuffer();
}
