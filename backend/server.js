import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Base telemetry state
let currentTelemetry = {
  pitch: 0,
  roll: 0,
  yaw: 0,
  altitude: 10,
  speed: 0,
  battery: 100,
  gps: {
    lat: 41.0082, // Istanbul
    lng: 28.9784
  },
  flightMode: 'STABILIZE',
  armed: false
};

// Simulate Drone Telemetry (Mock MAVLink Stream)
setInterval(() => {
  // Add some realistic noise to the flight characteristics
  if (currentTelemetry.armed) {
    currentTelemetry.pitch = Math.sin(Date.now() / 1000) * 5 + (Math.random() - 0.5) * 2;
    currentTelemetry.roll = Math.cos(Date.now() / 1500) * 8 + (Math.random() - 0.5) * 2;
    currentTelemetry.yaw = (currentTelemetry.yaw + 0.5) % 360;
    currentTelemetry.altitude = 10 + Math.sin(Date.now() / 2000) * 2;
    currentTelemetry.speed = 15 + Math.random() * 2;
    currentTelemetry.battery -= 0.01;
    currentTelemetry.gps.lat += (Math.random() - 0.5) * 0.0001;
    currentTelemetry.gps.lng += (Math.random() - 0.5) * 0.0001;
  }

  // Emit to all connected clients
  io.emit('telemetry', currentTelemetry);
}, 100); // 10Hz tick rate

io.on('connection', (socket) => {
  console.log(`[+] GCS Client Connected: ${socket.id}`);

  // Example of receiving commands from the web UI
  socket.on('command', (cmd) => {
    console.log(`[CMD] Received command: ${cmd.action}`);
    if (cmd.action === 'ARM') {
      currentTelemetry.armed = true;
      io.emit('status_update', { message: 'Drone Armed' });
    } else if (cmd.action === 'DISARM') {
      currentTelemetry.armed = false;
      currentTelemetry.pitch = 0;
      currentTelemetry.roll = 0;
      currentTelemetry.speed = 0;
      io.emit('status_update', { message: 'Drone Disarmed' });
    } else if (cmd.action === 'SET_MODE') {
      currentTelemetry.flightMode = cmd.mode;
      io.emit('status_update', { message: `Mode changed to ${cmd.mode}` });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[-] GCS Client Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Drone GCS Backend running on port ${PORT}`);
});
