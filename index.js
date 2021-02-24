const express = require('express');
const RPC = require("discord-rpc");
const open = require("open");
console.clear()

const client = new RPC.Client({
    transport: 'ipc'
});
var connected = false;

function connect_discord() {
    client.login({
        clientId: '785150339308716082'
    }).catch(() => {
        console.log('Error when trying to connnect to Discord Client Application.\nRetrying...')
    });
}

connect_discord();

client.on('disconnected', () => {
    connected = false;
    console.log('Client disconnected!');
});

var last_request = null;
client.on('ready', () => {
    connected = true;
    console.log('Authed for user', client.user.username);
    client.subscribe('ACTIVITY_JOIN', (data) => {
        var data = Buffer.from(data.secret, 'base64');
        data = JSON.parse(data.toString('ascii'));
        if (last_request == null || new Date() - last_request > 3000) {
            last_request = new Date();
            open(data.url);
        }
    });
});

setInterval(() => {
    if (!connected)
        connect_discord();
}, 10000);

const app = express();
app.use(express.json());
app.get("/iot-presence", (request, response) => {
    if (!connected) {
        response.sendStatus(500);
        return;
    }
    var body = request.query;
    var action = body.action;
    switch (action) {
        case "update":
            var presence = body.presence;
            if (presence.startTimestamp)
                presence.startTimestamp = parseInt(presence.startTimestamp);
            if (presence.partySize)
                presence.partySize = parseInt(presence.partySize);
            if (presence.partyMax)
                presence.partyMax = parseInt(presence.partyMax);
            if (presence.endTimestamp)
                presence.endTimestamp = parseInt(presence.endTimestamp);
            presence.instance = true;
            client.setActivity(presence);
            break;
        case "clear":
            client.clearActivity();
            break;
    }
    response.send(`console.log("discord-rpc: success");`);
    response.end();
});

app.listen(3000, () => {
    console.log('IOT - Discord Rich Presence is listening on port 3000!')
});