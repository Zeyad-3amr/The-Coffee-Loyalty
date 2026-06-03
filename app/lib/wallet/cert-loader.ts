export interface Certificates {
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase?: string;
  wwdr: Buffer;
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export function loadCertificates(): Certificates {
  return {
    signerCert: Buffer.from(requireEnv('PASS_SIGNER_CERT'), 'base64'),
    signerKey: Buffer.from(requireEnv('PASS_SIGNER_KEY'), 'base64'),
    signerKeyPassphrase: process.env.PASS_SIGNER_KEY_PASSPHRASE,
    wwdr: Buffer.from(requireEnv('WWDR_CERT'), 'base64'),
  };
}
