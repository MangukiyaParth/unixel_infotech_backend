const express = require('express');
const router = express.Router();

// Get User time by Id
router.get('/', async (req, res)=>{
    // res(`Hello from ${process.env.VERCEL_REGION}`);
    res.status(500).json({ message: "Hello"});
});

module.exports = router;