require('dotenv').config();
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
var cors = require('cors');
const client = require('./db');

const app = express();
// Middleware
app.use(cors({ origin: 'https://unixel-infotech.vercel.app' }));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('static'));

// const port = process.env.PORT;
// client.connect();

app.get('/', (req, res) => {
    res.json({ message: 'Hello from Node.js backend!' });
});


// Available Routes
app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/general', require('./routes/general'));
app.use('/api/v1/emp-timer', require('./routes/emp-timer'));
app.use('/api/v1/leave', require('./routes/leave'));
// app.use('/api/v1/files', require('./routes/files'));
app.use('/api/v1/settings', require('./routes/settings'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/holiday', require('./routes/holiday'));
app.use('/hello', require('./api/hello'));

//START SERVER
// app.listen(port, ()=>{
//     console.log(`Server running on port ${port}`);
// })
module.exports = app;
