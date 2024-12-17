const express = require('express');
const router = express.Router();
var dbUtils = require('../helper/index').Db;

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

    var date = new Date(year, 0, 1);
    let curr_loop_month = 1;
    while (date.getFullYear() == year) {
        var m = date.getMonth() + 1;
        var d = date.getDate();
        if(date.getDay()==6 && m == curr_loop_month){   //if Saturday
            days.push(
                (d < 10 ? '0' + d : d) + '/' +
                (m < 10 ? '0' + m : m) + '/' +
                year
            );
            curr_loop_month++;
        }
        date.setDate(date.getDate() + 1);
    }
    let weekoffDays = days;
    for(const date of weekoffDays) {
        const holidayData = await dbUtils.execute_single(`SELECT id FROM tbl_holiday WHERE holiday_year = '${year}' AND holiday_date = '${date}' AND is_weekend = '1'`);
        if(!holidayData){
            let holidayData = [];
            holidayData['holiday_year'] = year;
            holidayData['holiday_date'] = date;
            holidayData['holiday_title'] = 'Week Off';
            holidayData['is_weekend'] = '1';
            holidayData['user_id'] = '410544b2-4001-4271-9855-fec4b6a6442a';
            await dbUtils.insert('tbl_holiday',holidayData);
        }
    }
    // res(`Hello from ${process.env.VERCEL_REGION}`);
    res.status(200).json({ message: "Success"});
});

module.exports = router;