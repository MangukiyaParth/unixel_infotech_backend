const express = require('express');
const router = express.Router();

// Get User time by Id
router.get('/', async (req, res)=>{
    let year = (new Date()).getFullYear() + 1;
    
    var date = new Date(year, 0, 1);
    while (date.getDay() != 0) {
        date.setDate(date.getDate() + 1);
    }
    var days = [];
    while (date.getFullYear() == year) {
        var m = date.getMonth() + 1;
        var d = date.getDate();
        days.push(
            (d < 10 ? '0' + d : d) + '/' +
            (m < 10 ? '0' + m : m) + '/' +
            year
        );
        date.setDate(date.getDate() + 7);
    }
    let weekoffDays = days;
    console.log(weekoffDays);
    // res(`Hello from ${process.env.VERCEL_REGION}`);
    res.status(200).json({ message: "Hello"});
});

module.exports = router;