import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dgram from 'dgram';
import { MavLinkPacketSplitter, MavLinkPacketParser, common } from 'node-mavlink';

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
const UDP_PORT = 14550; // Standart MAVLink portu

// Base telemetry state
let currentTelemetry = {
  pitch: 0,
  roll: 0,
  yaw: 0,
  altitude: 0,
  speed: 0,
  battery: 0,
  gps: {
    lat: 0,
    lng: 0
  },
  flightMode: 'UNKNOWN',
  armed: false
};


let droneAddress = null; // Drone/MAVProxy'nin bağlı olduğu (UDP datası gelen) adres

// MAVLink Parser ve Splitter Kurulumu
const REGISTRY = {
  ...common.REGISTRY,
};
const mavlinkParser = new MavLinkPacketParser();
const mavlinkSplitter = new MavLinkPacketSplitter();
mavlinkSplitter.pipe(mavlinkParser);

// UDP Sunucusunu Oluştur
const udpServer = dgram.createSocket('udp4');

udpServer.on('error', (err) => {
  console.error(`UDP Server error:\n${err.stack}`);
  udpServer.close();
});

let udpMessageCount = 0;
// Drone'dan veya MAVProxy'den gelen ham UDP mesajını (Buffer) alıp MAVLink formatına bölelim
udpServer.on('message', (msg, rinfo) => {
  udpMessageCount++;
  // Gelen verinin kaynağını kaydet (Geri komut göndermek için)
  if (!droneAddress || droneAddress.address !== rinfo.address || droneAddress.port !== rinfo.port) {
    droneAddress = { address: rinfo.address, port: rinfo.port };
    console.log(`[+] Drone telemetry data detected from ${rinfo.address}:${rinfo.port}`);
  }
  
  // Mesaj chunk'ını MAVLink ayırıcıya yolla
  mavlinkSplitter.write(msg);
});


let parsedPacketCount = 0;
let lastUdpMessageCount = 0;
let lastParsedPacketCount = 0;

setInterval(() => {
    if (udpMessageCount !== lastUdpMessageCount || parsedPacketCount !== lastParsedPacketCount) {
        console.log(`[Debug] UDP Received: ${udpMessageCount} | MAVLink Parsed: ${parsedPacketCount}`);
        lastUdpMessageCount = udpMessageCount;
        lastParsedPacketCount = parsedPacketCount;
    }
}, 5000);

// MAVLink Paketleri Çözümlendiğinde
mavlinkParser.on('data', (packet) => {
  parsedPacketCount++;
  const clazz = REGISTRY[packet.header.msgid];
  if (clazz) {
    try {
        const data = packet.protocol.data(packet.payload, clazz);

        // Attitude (Pitch, Roll, Yaw) - Radyan'dan Dereceye dönüştür
        if (data instanceof common.Attitude) {
          currentTelemetry.pitch = (data.pitch * 180) / Math.PI;
          currentTelemetry.roll = (data.roll * 180) / Math.PI;
          currentTelemetry.yaw = (data.yaw * 180) / Math.PI;
          if (currentTelemetry.yaw < 0) currentTelemetry.yaw += 360; // Pozitif derece
        }
        // GPS ve Irtifa (GlobalPositionInt)
        else if (data instanceof common.GlobalPositionInt) {
          currentTelemetry.gps.lat = data.lat / 10000000;
          currentTelemetry.gps.lng = data.lon / 10000000;
          currentTelemetry.altitude = data.relativeAlt / 1000; // Milimetreden metreye
        }
        // Hız (VfrHud)
        else if (data instanceof common.VfrHud) {
          currentTelemetry.speed = data.groundspeed;
        }
        // Batarya (SysStatus)
        else if (data instanceof common.SysStatus) {
          if (data.batteryRemaining !== -1) {
            currentTelemetry.battery = data.batteryRemaining;
          }
        }
        // Durum ve Armed/Disarmed (Heartbeat)
        else if (data instanceof common.Heartbeat) {
          // BaseMode bitmask'i içinden ARMED bayrağını (128) ara
          const MAV_MODE_FLAG_SAFETY_ARMED = 128; 
          const isArmed = (data.baseMode & MAV_MODE_FLAG_SAFETY_ARMED) !== 0;
          if (currentTelemetry.armed !== isArmed) {
            currentTelemetry.armed = isArmed;
            io.emit('status_update', { message: isArmed ? 'Drone Armed' : 'Drone Disarmed' });
          }
        }
    } catch (err) {
        console.error(`[Error] Failed to parse payload for MSGID ${packet.header.msgid}:`, err);
    }
  }
});

mavlinkParser.on('error', (err) => {
    console.error(`[MAVLink Parser Error]:`, err);
});

udpServer.on('listening', () => {
  const address = udpServer.address();
  console.log(`🚁 MAVLink UDP Listener aktif: Port ${address.port}`);
});

// 14550 standart MAVLink veri bağı / MAVProxy portudur
udpServer.bind(UDP_PORT); 

// Her 100ms'de bir en güncel MAVLink verisi ağaca (Frontend) postalanır
setInterval(() => {
    io.emit('telemetry', currentTelemetry);
}, 100); // 10Hz

// Frontend WebSocket Bağlantısı
io.on('connection', (socket) => {
  console.log(`[+] GCS Client Connected: ${socket.id}`);
  
  // İlk bağlantı anında varsayılan bilgileri yolla
  socket.emit('telemetry', currentTelemetry);

  // GCS Arayüzünden gelen komutları al (Web Browser -> Sunucu)
  socket.on('command', (cmd) => {
    console.log(`[CMD] Frontend requested: ${cmd.action}`);
    
    // Eğer bir drone UDP ile bağlı değilse uyarı ver
    if (!droneAddress) {
        console.warn('Drone UDP bağlantısı kurulamadığından komut iletilemiyor!');
        socket.emit('status_update', { message: 'HATA: Drone hedef IP bulunamadı' });
        return;
    }

    if (cmd.action === 'ARM') {
       console.log(`--> Sending STANDART_ARM to ${droneAddress.address}:${droneAddress.port}`);
       // TODO: Burada MAVLink CommandLong paketi encode edilip "udpServer.send(paket, droneAddress.port, ...)" ile atılacak
       socket.emit('status_update', { message: 'Komut İletildi: Drone Armed (İstek)' });
    } else if (cmd.action === 'DISARM') {
       console.log(`--> Sending STANDART_DISARM to ${droneAddress.address}:${droneAddress.port}`);
       socket.emit('status_update', { message: 'Komut İletildi: Drone Disarmed (İstek)' });
    } else if (cmd.action === 'SET_MODE') {
       console.log(`--> Sending SET_MODE ${cmd.mode} to ${droneAddress.address}`);
       socket.emit('status_update', { message: `Mod Değiştirildi: ${cmd.mode} (İstek)` });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[-] GCS Client Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Drone GCS Backend (WebSockets) port ${PORT} üzerinde çalışıyor.`);
});
