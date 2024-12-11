const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const multer = require('multer');
const upload = multer();

// Get User time by Id
router.get('/', fetchuser, upload.none(), [], async (req, res)=>{
    // res(`Hello from ${process.env.VERCEL_REGION}`);
    res.status(500).json({ message: "Hello"});
});

module.exports = router;