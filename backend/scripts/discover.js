import dgram from "dgram";

// Create a UDP socket
const socket = dgram.createSocket("udp4");

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
// socket.send(discoveryMessage, 0, discoveryMessage.length, 9999, "255.255.255.255", (err) => {
//     if (err) {
//         console.error("Error sending message:", err);
//     } else {
//         console.log("Discovery message sent");
//     }
// });
