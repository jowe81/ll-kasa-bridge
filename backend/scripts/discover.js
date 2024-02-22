import dgram from "dgram";
import { decrypt, encrypt } from "tplink-smarthome-crypto";
const discoveryMsgBuf = encrypt('{"system":{"get_sysinfo":{}}}');
// Create a UDP socket
const socket = dgram.createSocket("udp4");
const broadcast = "192.168.1.255";

// Listen for messages
socket.on("message", (msg, rinfo) => {
    console.log(`Received message from ${rinfo.address}:${rinfo.port}: ${msg}`);
});

// Bind socket to listen for messages on a specific port and address
socket.bind(9999, "0.0.0.0", () => {
    console.log("UDP socket is listening for messages");
});

// Send a discovery message to a specific broadcast address and port
const discoveryMessage = Buffer.from("Hello, anyone there?");

console.log("Sending");

socket.send(discoveryMsgBuf, 0, discoveryMsgBuf.length, 9999, broadcast, (err) => {
    if (err) {
        console.error("Error sending message:", err);
    } else {
        console.log("Discovery message sent");
    }
});
