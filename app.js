require('dotenv').config();
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
var cors = require('cors');
const client = require('./db');


const app = express();
const port = process.env.PORT;
client.connect();

app.get('/', (req, res) => {
    res.json({ message: 'Hello from Node.js backend!' });
});

// Express
app.use('/static',express.static('static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());

// Available Routes
app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/general', require('./routes/general'));
app.use('/api/v1/emp-timer', require('./routes/emp-timer'));
app.use('/api/v1/leave', require('./routes/leave'));
app.use('/api/v1/files', require('./routes/files'));
app.use('/api/v1/settings', require('./routes/settings'));

//START SERVER
app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
})
