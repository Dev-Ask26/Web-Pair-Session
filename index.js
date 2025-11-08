const express = require('express');
const app = express();
__path = process.cwd()
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
let code = require('./bilal-xd'); 

require('events').EventEmitter.defaultMaxListeners = 500;

app.use('/code', code);
app.use('/bilal-xd', async (req, res, next) => {
    res.sendFile(__path + '/pair.html')
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`𝐁𝐈𝐋𝐀𝐋 𝐁𝐔𝐆 𝐗𝐃 𝐑𝐔𝐍𝐍𝐈𝐍𝐆
Server running on http://localhost:` + PORT)
});

module.exports = app;
