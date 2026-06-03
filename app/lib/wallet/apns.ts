import apn from '@parse/node-apn';

let provider: apn.Provider | null = null;

function getProvider(): apn.Provider {
  if (provider) return provider;

  const key = process.env.APNS_KEY;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;

  if (!key || !keyId || !teamId) {
    throw new Error('Missing APNS_KEY, APNS_KEY_ID, or APNS_TEAM_ID');
  }

  provider = new apn.Provider({
    token: {
      key: Buffer.from(key, 'base64'),
      keyId,
      teamId,
    },
    production: process.env.NODE_ENV === 'production',
  });

  return provider;
}

export async function sendPassUpdatePush(pushTokens: string[]): Promise<void> {
  if (pushTokens.length === 0) return;

  const prov = getProvider();
  const notification = new apn.Notification();
  notification.topic = `${process.env.PASS_TYPE_IDENTIFIER}.voip`;

  // Apple Wallet passes use an empty payload push — just a wake-up signal
  notification.payload = {};

  await prov.send(notification, pushTokens);
}
