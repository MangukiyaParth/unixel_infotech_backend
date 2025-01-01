const express = require('express');
const router = express.Router();
const dbUtils = require('../helper/index').Db;

// Get User time by Id
router.get('/', async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const weekOffDays = getWeekOffDays(year);
        
        const existingHolidays = await dbUtils.execute_single(`SELECT id FROM tbl_holiday WHERE holiday_year = '${year}' AND is_weekend = '1'`);
        let existingDates = new Set();
        if(existingHolidays && existingHolidays.length == 0){
            existingDates = new Set(existingHolidays.map(h => h.holiday_date));
        }
        // Prepare new records for batch insert
        const newHolidays = weekOffDays
            .filter(date => !existingDates.has(date))
            .map(date => ({
                holiday_year: year,
                holiday_date: date,
                holiday_title: 'Week Off',
                is_weekend: '1',
                user_id: '410544b2-4001-4271-9855-fec4b6a6442a',
            }));

        // Perform batch insert if there are new holidays
        if (newHolidays.length > 0) {
            await dbUtils.insertBatch('tbl_holiday', newHolidays);
        }
        // for (const date of weekOffDays) {
        //     if(!holidayExists){
        //         const holidayData = {
        //             holiday_year: year,
        //             holiday_date: date,
        //             holiday_title: 'Week Off',
        //             is_weekend: '1',
        //             user_id: '410544b2-4001-4271-9855-fec4b6a6442a',
        //         };
        //         await dbUtils.insert('tbl_holiday', holidayData);
        //     }
        // }

        res.status(200).json({ message: "Success" });
    } catch (error) {
        console.error('Error processing week-off days:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Utility function to get all week-off days for a given year
function getWeekOffDays(year) {
    const days = [];
    const startDate = new Date(year, 0, 1);

    // Find first Sunday of the year
    while (startDate.getDay() !== 0) {
        startDate.setDate(startDate.getDate() + 1);
    }

    // Add all Sundays of the year
    const sundayDate = new Date(startDate);
    while (sundayDate.getFullYear() === year) {
        days.push(formatDate(sundayDate));
        sundayDate.setDate(sundayDate.getDate() + 7);
    }

    // Add all first Saturdays of each month
    const saturdayDate = new Date(year, 0, 1);
    for (let month = 0; month < 12; month++) {
        saturdayDate.setMonth(month, 1); // Set to the 1st of the month
        while (saturdayDate.getDay() !== 6) {
            saturdayDate.setDate(saturdayDate.getDate() + 1);
        }
        days.push(formatDate(saturdayDate));
    }

    return days;
}

// Utility function to format date as DD/MM/YYYY
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

module.exports = router;