const express = require('express');
const router = express.Router();
var dbUtils = require('../helper/index').Db;

// Get User time by Id
router.get('/', async (req, res)=>{
    const settingData = await dbUtils.execute_single(`SELECT end_time FROM tbl_settings LIMIT 1`);
    let office_end_time = (settingData && settingData?.end_time) ? (settingData.end_time+":00.000000") : '18:00:00.000000';
    const timeData = await dbUtils.execute(`SELECT id, start_time, TO_CHAR(start_time, 'YYYY-MM-DD') AS only_date FROM tbl_employee_time WHERE end_time is null`);
    if(timeData){
        timeData.map(async(data, index) => {
            let endTime = data.only_date + " " + office_end_time;
            let startDate = new Date(data.start_time);
            let endDate   = new Date(endTime);
            let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
            let timeUpdateData = [];
            timeUpdateData['end_time'] = endTime;
            timeUpdateData['total_time'] = seconds;
            await dbUtils.update('tbl_employee_time',timeUpdateData,` id = '${data.id}' `);
        });
    }
    // res(`Hello from ${process.env.VERCEL_REGION}`);
    res.status(200).json({ message: "Success"});
});

module.exports = router;