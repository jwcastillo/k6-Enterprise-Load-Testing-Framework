import { check } from 'k6';
import ws from 'k6/ws';

export const options = {
  vus: 10,
  duration: '30s'
};

export default function () {
  // WebSocket Echo Server for testing
  const url = 'wss://echo.websocket.org';
  
  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      console.log('WebSocket connection established');
      
      // Send initial message
      socket.send('Hello from k6!');
      
      // Send periodic messages
      socket.setInterval(() => {
        socket.send(JSON.stringify({
          timestamp: Date.now(),
          message: 'Periodic ping',
          vu: __VU,
          iter: __ITER
        }));
      }, 2000);
    });

    socket.on('message', (data) => {
      console.log(`Received: ${data}`);
      
      // Validate message
      check(data, {
        'message received': (msg) => msg !== null && msg !== undefined,
        'message is not empty': (msg) => msg.length > 0
      });
    });

    socket.on('close', () => {
      console.log('WebSocket connection closed');
    });

    socket.on('error', (e) => {
      if (e.error) {
        console.error(`WebSocket error: ${e.error()}`);
      }
    });

    // Keep connection open for 10 seconds
    socket.setTimeout(() => {
      console.log('Closing WebSocket connection');
      socket.close();
    }, 10000);
  });

  check(res, {
    'WebSocket connection successful': (r) => r && r.status === 101
  });
}
