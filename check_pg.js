const net = require('net');

const client = new net.Socket();
client.connect(5432, '127.0.0.1', function() {
    console.log('PostgreSQL port 5432 is OPEN');
    client.destroy();
});

client.on('error', function(err) {
    console.error('PostgreSQL port 5432 is CLOSED:', err.message);
    client.destroy();
});
