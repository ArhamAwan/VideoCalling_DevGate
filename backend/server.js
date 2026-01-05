import { createApp, createServer } from './src/config/server.js';
import { initializeSocketIO } from './src/config/socket.io.js';
import os from 'os';

const app = createApp();
const server = createServer(app);
initializeSocketIO(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('WebRTC signaling server ready');

  // Show network IP addresses
  const networkInterfaces = os.networkInterfaces();

  console.log('\nAvailable on your network:');
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  http://${iface.address}:${PORT}`);
      }
    });
  });
});

