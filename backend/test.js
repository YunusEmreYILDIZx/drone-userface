import { MavLinkPacketSplitter, MavLinkPacketParser, common, send } from 'node-mavlink';
import dgram from 'dgram';

const REGISTRY = { ...common.REGISTRY };
const mavlinkParser = new MavLinkPacketParser();
const mavlinkSplitter = new MavLinkPacketSplitter();
mavlinkSplitter.pipe(mavlinkParser);

const udpServer = dgram.createSocket('udp4');
udpServer.on('message', (msg, rinfo) => {
    console.log('Received UDP packet:', msg);
    mavlinkSplitter.write(msg);
});

mavlinkParser.on('data', (packet) => {
    console.log('Parsed packet msgid:', packet.header.msgid);
    const clazz = REGISTRY[packet.header.msgid];
    if (clazz) {
        const data = packet.protocol.data(packet.payload, clazz);
        console.log('Data:', data);
    }
});

udpServer.bind(14555, () => {
    console.log('UDP server bound');
    
    // Simulate sending a heartbeat packet to ourselves
    const client = dgram.createSocket('udp4');
    
    // Create a dummy MAVLink 1 / 2 packet
    // Just send a raw valid heartbeat manually, but wait, `send` from node-mavlink requires a socket with a `send` method or something.
    // Let's see if we can just emit an event or see the node-mavlink API
    const heartbeat = new common.Heartbeat();
    heartbeat.type = 2; // QUADROTOR
    heartbeat.autopilot = 3; // ARDUPILOTMEGA
    heartbeat.baseMode = 128; // SAFETY_ARMED
    heartbeat.customMode = 0;
    heartbeat.systemStatus = 4; // ACTIVE
    heartbeat.mavlinkVersion = 3;
    
    // Just send it via the library:
    import('node-mavlink').then((mavlink) => {
        // We'd have to construct the payload
        // Actually, we can just look up node-mavlink documentation.
    });
});
