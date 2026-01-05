import https from 'https';
import selfsigned from 'selfsigned';

export function createHttpsServer(app) {
  // Create self-signed certificate (for development only)
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, { days: 365 });

  return https.createServer(
    {
      key: pems.private,
      cert: pems.cert,
    },
    app
  );
}

