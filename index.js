const express = require('express');
const app = express();
const path = require('path');
__path = process.cwd()
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
let code = require('./bilal-xd'); 

require('events').EventEmitter.defaultMaxListeners = 500;

// Configuration de base Express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__path)); // Pour servir les fichiers statiques

// Route principale - page pair.html
app.get('/', async (req, res) => {
    res.sendFile(path.join(__path, 'pair.html'));
});

// Route API
app.use('/code', code);

// Route alternative pour pair.html
app.get('/pair', async (req, res) => {
    res.sendFile(path.join(__path, 'pair.html'));
});

app.listen(PORT, () => {
    console.log(`
█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█ 𝐁𝐈𝐋𝐀𝐋 𝐁𝐔𝐆 𝐗𝐃 𝐒𝐄𝐑𝐕𝐄𝐑
█ Running on port: ${PORT}
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
    `);
});

module.exports = app;