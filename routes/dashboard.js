const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const multer = require('multer');
const upload = multer();

// Get User time by Id
router.get('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    process.env.TZ = 'Asia/Kolkata';
    const curr_date = new Date();

    let curr_month = ""+(curr_date.getMonth() + 1);
    curr_month = (curr_month.length < 2) ? ('0' + curr_month) : curr_month;

    let curr_day = ""+curr_date.getDate();
    curr_day = (curr_day.length < 2) ? ('0' + curr_day) : curr_day;
    let next_day = ""+(curr_date.getDate() + 1);
    next_day = (next_day.length < 2) ? ('0' + next_day) : next_day;

    var month = curr_month + "-" + curr_day;
    var curr_full_date = curr_date.getFullYear() + "-" + curr_month + "-" + curr_day;
    const curr_year = curr_date.getFullYear();
    try{
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
            WHERE TO_CHAR(TO_DATE(join_date, 'DD/MM/YYYY'),'MM-DD') = '${month}'`);

        const yearly_taken_leave = await dbUtils.execute_single(`SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END) AS yearly_leave 
                FROM tbl_leave_dates ld
                join tbl_leaves l on l.id = ld.leave_id
                WHERE ld.user_id = '${req.user.id}' AND l.leave_type = '1' AND l.leave_status != '2' AND
                to_char(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY') = '${curr_year}'`);
        let yearly_leave = yearly_taken_leave.yearly_leave || 0;
        const leave_cnt = {
            total_leave: 12,
            leave_taken: yearly_leave,
            remain_leave: 12 - yearly_leave
        };
        res.json({ status: 1, birthdayData: birthdayData, workAnniData: workAnniData, leave_cnt: leave_cnt});

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

module.exports = router;