const server_address = 'ws://localhost:3000'

const websocket = new WebSocket('ws://localhost:3000');

const clientName = process.argv[2]
const clientId = process.argv[3]

class Player {
    name = 'Untitled'
    constructor(name) {
        this.name = name
    }

    connect(room_id) {
        
    }
}

websocket.onopen = () => {
    console.log('WebSocket connection established.');

    // Function to send data to the server
    function sendToServer(data) {
        if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(data); // 'data' can be a string, Blob, ArrayBuffer, or ArrayBufferView
            console.log('Data sent to server:', data);
        } else {
            console.error('Server is not online');
        }
    }

    // Example of sending different types of data:
    // sendToServer('Hello from the client!'); // Sending a string
    sendToServer(JSON.stringify({name: clientName, id: clientId})); // Sending JSON
    // You can also send binary data using Blob or ArrayBuffer
};

websocket.onclose = () => {
    console.log('WebSocket connection closed.');
};

websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

websocket.onmessage = (event) => {
    console.log('Server: ', event.data);
};