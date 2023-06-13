const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');

let channels = JSON.parse(fs.readFileSync('channels.json', 'utf8'));

// Watch channels.json for changes and reload if it is updated
fs.watch('channels.json', (eventType, filename) => {
    if (eventType === 'change') {
        console.log(`channels.json was updated, reloading...`);
        channels = JSON.parse(fs.readFileSync('channels.json', 'utf8'));
    }
});

const app = express();
const port = 8080;

app.get('/stream/:channelName', (req, res) => {
    const channelName = req.params.channelName;
    console.log(`Received request for /stream/${channelName}`);

    const channel = channels[channelName];

    if (!channel) {
        res.status(404).send('Channel not found');
        return;
    }

    // Start the streamlink command
    console.log(`Starting Streamlink command for channel: ${channelName}`);
    const streamlinkProcess = spawn('/root/.local/bin/streamlink', [
        '--http-header', 'User-Agent=Mozilla/5.0 (SMART-TV; Linux; Tizen 2.3) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.0 TV Safari/538.1',
        channel.url, 'best',
        '-decryption_key', 
        channel.key, 
        '--ffmpeg-fout', 'mpegts',
        '-O']);

   streamlinkProcess.stderr.on('data', (data) => {
        console.error(`Streamlink: ${data}`);
    });

    streamlinkProcess.on('error', (error) => {
        console.error(`Streamlink process error: ${error}`);
    });

     // Pipe the output to the response
    res.setHeader('Content-Type', 'video/MP2T');
    streamlinkProcess.stdout.pipe(res);

    // If the connection is closed by the client, stop the processes
    req.on('close', () => {
        console.log(`Client closed the connection for channel: ${channelName}, stopping Streamlink`);
        streamlinkProcess.kill();
    });

    streamlinkProcess.on('exit', (code) => {
        console.log(`Streamlink process for channel: ${channelName} exited with code ${code}`);
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
});