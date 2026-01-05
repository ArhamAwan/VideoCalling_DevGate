import { createApp } from './src/config/server.js';
import { createHttpsServer } from './src/config/https-server.js';
import { initializeSocketIO } from './src/config/socket.io.js';
import os from 'os';

const app = createApp();
const server = createHttpsServer(app);
initializeSocketIO(server);

const PORT = process.env.PORT || 3443;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
  console.log(`Network access: https://[YOUR_IP]:${PORT}`);
  console.log('WebRTC signaling server ready (HTTPS)');
  console.log('⚠️  You will need to accept the self-signed certificate warning');

  // Show network IP addresses
  const networkInterfaces = os.networkInterfaces();

  console.log('\nAvailable on your network:');
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  https://${iface.address}:${PORT}`);
      }
    });
  });
});
