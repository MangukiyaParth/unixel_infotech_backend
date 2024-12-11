console.log("Run");
var dbUtils = require('../helper/index').Db;

if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
}

export default async function handler(req, res) {
    let year = (new Date()).getFullYear() + 1;
    let weekoffDays = getDefaultOffDays(year);
    console.log(weekoffDays);
    for(const val of weekoffDays) {
        let date = val;
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
    return res.status(200).end('Hello Cron!');
}

function getDefaultOffDays(year) {
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
    return days;
}