const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const multer = require('multer');
const upload = multer();

// Get User time by Id
router.get('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const curr_date = new Date();

    let curr_month = ""+(curr_date.getMonth() + 1);
    curr_month = (curr_month.length < 2) ? ('0' + curr_month) : curr_month;

    let curr_day = ""+curr_date.getDate();
    curr_day = (curr_day.length < 2) ? ('0' + curr_day) : curr_day;
    let next_day = ""+(curr_date.getDate() + 1);
    next_day = (next_day.length < 2) ? ('0' + next_day) : next_day;

    var month = curr_month + "-" + curr_day;
    var curr_full_date = curr_date.getFullYear() + "-" + curr_month + "-" + curr_day;
    var curr_full_month = curr_date.getFullYear() + "-" + curr_month;
    const curr_year = curr_date.getFullYear();
    try{
        const settingData = await dbUtils.execute_single(`SELECT *, CONCAT(' ',late_time,':00') AS office_end_time FROM tbl_settings LIMIT 1`);
        const birthdayData = await dbUtils.execute(`select u.id,u.profile_pic,ut.usertype, u.usertype AS usertypeid, et.employeetype, u.name, u.birth_date, 
            TO_DATE(u.birth_date, 'DD/MM/YYYY') as birth_date_formated,
            CASE WHEN (TO_CHAR(TO_DATE(birth_date, 'DD/MM/YYYY'),'DD') = '${curr_day}') THEN 'Today'
                WHEN (TO_CHAR(TO_DATE(birth_date, 'DD/MM/YYYY'),'DD') = '${next_day}') THEN 'Tomorrow' 
                ELSE TO_CHAR(TO_DATE(birth_date, 'DD/MM/YYYY'), 'DD Mon') 
                END AS birth_date_notation
            FROM tbl_users u
            LEFT JOIN tbl_employee_types et ON u.employeetype = et.id
            JOIN tbl_user_types ut ON u.usertype = ut.id 
            WHERE TO_CHAR(TO_DATE(birth_date, 'DD/MM/YYYY'),'MM') = '${curr_month}' AND 
            TO_CHAR(TO_DATE(birth_date, 'DD/MM/YYYY'),'MMDD') >= TO_CHAR(TO_DATE('${curr_full_date}', 'YYYY-MM-DD'),'MMDD')`);
        const workAnniData = await dbUtils.execute(`select u.id,u.profile_pic,ut.usertype, u.usertype AS usertypeid, et.employeetype, u.name, u.join_date, 
            TO_DATE(u.join_date, 'DD/MM/YYYY') as join_date_formated 
            FROM tbl_users u
            LEFT JOIN tbl_employee_types et ON u.employeetype = et.id
            JOIN tbl_user_types ut ON u.usertype = ut.id 
            WHERE TO_CHAR(TO_DATE(join_date, 'DD/MM/YYYY'),'MM-DD') = '${month}' AND TO_CHAR(TO_DATE(join_date, 'DD/MM/YYYY'),'YYYY-MM-DD') != '${curr_full_date}'`);

        const holidayData = await dbUtils.execute(`SELECT TO_CHAR(TO_DATE(holiday_date, 'DD/MM/YYYY'),'YYYY-MM-DD') as holiday_date, holiday_title FROM tbl_holiday 
            WHERE is_weekend = 0 AND TO_CHAR(TO_DATE(holiday_date, 'DD/MM/YYYY'),'YYYY-MM') = '${curr_full_month}'`);
            
        const yearly_taken_leave = await dbUtils.execute_single(`SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END) AS yearly_leave 
            FROM tbl_leave_dates ld
            join tbl_leaves l on l.id = ld.leave_id
            WHERE ld.user_id = '${req.user.id}' AND l.leave_type = '1' AND l.leave_status != '2' AND
            to_char(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY') = '${curr_year}'`);
        
        const remainHoursData = await dbUtils.execute(`SELECT * FROM 
            (
                SELECT to_char(et.start_time, 'YYYY-MM-DD') AS date,
                SUM(et.total_time) AS difference
                FROM tbl_employee_time et
                WHERE et.action_type = 1 AND et.user_id = '${req.user.id}' 
                AND to_char(et.start_time, 'YYYY-MM') = '${curr_full_month}'
                and et.end_time is not null
                GROUP BY to_char(et.start_time, 'YYYY-MM-DD')
                ORDER BY to_char(et.start_time, 'YYYY-MM-DD')
            ) AS diff WHERE diff.difference <= (${settingData.full_day_time} * 60)`);

        const late_cnt = await dbUtils.execute(`SELECT
            TO_CHAR(MIN(start_time), 'YYYY-MM-DD') AS late_date,
            TO_CHAR(MIN(start_time), 'HH:MI PM') AS start_time,
            CASE 
                WHEN MIN(start_time) > TO_TIMESTAMP(TO_CHAR(MIN(start_time), 'YYYY-MM-DD') || '${settingData.office_end_time}','YYYY-MM-DD HH24:MI:SS')
                THEN 1 
                ELSE 0 
            END AS is_late
            FROM tbl_employee_time
            WHERE user_id = '${req.user.id}' AND TO_CHAR(start_time, 'YYYY-MM') = '${curr_full_month}'
            GROUP BY TO_CHAR(start_time, 'YYYY-MM-DD')
            ORDER BY MIN(start_time)`);
        const attendance_cnt = await dbUtils.execute_single(`SELECT
            (SELECT COUNT(DISTINCT TO_CHAR(start_time, 'YYYY-MM-DD')) FROM tbl_employee_time WHERE user_id = '${req.user.id}' AND TO_CHAR(start_time, 'YYYY-MM') = '${curr_full_month}') AS present_days,
            (
                SELECT 
                    COUNT(leave_date) AS full_day_leave_count
                FROM (
                    SELECT 
                        ld.leave_date,
                        SUM(
                            CASE 
                                WHEN ld.leave_time IN ('1', '2') THEN 0.5
                                WHEN ld.leave_time = '3' THEN 1
                                ELSE 0
                            END
                        ) AS total_leave
                    FROM 
                        tbl_leave_dates ld
                    JOIN 
                        tbl_leaves l ON l.id = ld.leave_id
                    WHERE 
                        ld.user_id = '${req.user.id}' AND 
                        l.leave_status = '1' AND
                        to_char(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY-MM') = '${curr_full_month}'
                    GROUP BY 
                        ld.leave_date
                    HAVING 
                        SUM(
                            CASE 
                                WHEN ld.leave_time IN ('1', '2') THEN 0.5
                                WHEN ld.leave_time = '3' THEN 1
                                ELSE 0
                            END
                        ) >= 1
                )
            ) AS total_leaves`);
        let yearly_leave = yearly_taken_leave.yearly_leave || 0;
        const leave_cnt = {
            total_leave: 12,
            leave_taken: yearly_leave,
            remain_leave: 12 - yearly_leave
        };
        const total_late_cnt = late_cnt.reduce((acc, item) => acc + item.is_late, 0);
        const attendance = {
            present_days: attendance_cnt.present_days,
            absent_days: attendance_cnt.total_leaves,
            late_days: total_late_cnt
        };
        
        res.json({ status: 1, birthdayData: birthdayData, workAnniData: workAnniData, holidayData: holidayData, leave_cnt: leave_cnt, late_cnt: late_cnt, attendance: attendance, remainHoursData: remainHoursData });

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

module.exports = router;