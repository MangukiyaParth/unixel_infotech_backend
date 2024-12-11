const express = require('express');
const router = express.Router();
var dbUtils = require('../helper/index').Db;
const multer = require('multer');
const upload = multer();

// Get User time by Id
router.get('/', upload.none(), [], async (req, res)=>{
    // res(`Hello from ${process.env.VERCEL_REGION}`);
    res.status(500).json({ message: "Hello"});
});

module.exports = router;