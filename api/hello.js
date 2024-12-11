const express = require('express');
const router = express.Router();

// Get User time by Id
router.get('/', async (req, res)=>{
    let year = (new Date()).getFullYear() + 1;
    let weekoffDays = getDefaultOffDays(year);
    console.log(weekoffDays);
    // res(`Hello from ${process.env.VERCEL_REGION}`);
    res.status(200).json({ message: "Hello"});
});

module.exports = router;