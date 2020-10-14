const express = require('express');
const fs = require('fs');
const http = require('http');
const os = require('os');
const pty = require('node-pty');
const socketIo = require('socket.io');

const PORT = 3000;

// Setup the Express App
const app = express();
// Create Express App's Server for Socket.io
const server = http.createServer(app);
// Socket IO Instance
const io = socketIo(server);
// Shell Setup
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// Socket IO Handling
io.on('connection', function(socket) {
  // Log Connection
  console.log('someone has connected');
  
  // Create terminal
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  // Listen on the terminal for output and send it to the client
  ptyProcess.on('data', function(data){
    socket.emit('output', data);
  });

  // Listen on the client and send any input to the terminal
  socket.on('input', function(data) {
    ptyProcess.write(data);
  });

  // When socket disconnects, destroy the terminal
  socket.on('disconnect', function(){
    ptyProcess.destroy();
    console.log('bye');
  });
});

// Static file serving
app.use("/",express.static("./"));

// Listen
server.listen(PORT, () => {
  console.log('App listening on port', PORT);
});