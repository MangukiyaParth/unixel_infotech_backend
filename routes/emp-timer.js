const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;

// Get User time by Id
router.get('/', fetchuser, [], async (req, res)=>{
	let { id } = req.user;
    
    let status = 0;
    const date = new Date();
    const curr_date = date.toLocaleDateString("en-CA");
    try{
        const timerData = await dbUtils.execute_single(`SELECT * FROM tbl_employee_time WHERE user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}'`);
        if(!timerData){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            const statusData = await dbUtils.execute_single(`SELECT (SELECT action_type FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' ORDER BY entry_date DESC LIMIT 1) AS last_status,
                (SELECT CASE WHEN (end_time is null) THEN 0 ELSE 1 END FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' ORDER BY entry_date DESC LIMIT 1) AS last_timer_status,
                (SELECT SUM(ROUND(EXTRACT(EPOCH FROM (CASE WHEN (end_time is null) THEN now() ELSE end_time END - start_time)))) AS difference FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' AND action_type = 1) AS total_curr_time,
                (SELECT SUM(ROUND(EXTRACT(EPOCH FROM (CASE WHEN (end_time is null) THEN now() ELSE end_time END - start_time)))) AS difference FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' AND action_type = 2) AS total_break_time`);
            res.json({ status: 1, res_data: timerData, status_data: statusData});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Get User monthly time
router.get('/monthly', fetchuser, [], async (req, res)=>{
	let { id } = req.user;
    
    let status = 0;
    const date = new Date();
    const curr_date = date.toLocaleDateString("en-CA").split('-');
    const curr_month = curr_date[0]+"-"+curr_date[1];
    try{
        const timerData = await dbUtils.execute(`SELECT to_char(start_time, 'YYYY-MM-DD HH24:MI:SS') AS start_time, to_char(end_time, 'YYYY-MM-DD HH24:MI:SS') AS end_time, CASE WHEN action_type = 1 THEN false ELSE true END as is_break FROM tbl_employee_time WHERE user_id = '${id}' AND to_char(start_time, 'YYYY-MM') = '${curr_month}' AND end_time is not null ORDER BY start_time`);
        if(!timerData){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            const statusData = await dbUtils.execute_single(`SELECT (SELECT action_type FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' ORDER BY entry_date DESC LIMIT 1) AS last_status,
                (SELECT CASE WHEN (end_time is null) THEN 0 ELSE 1 END FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' ORDER BY entry_date DESC LIMIT 1) AS last_timer_status,
                (SELECT SUM(ROUND(EXTRACT(EPOCH FROM (CASE WHEN (end_time is null) THEN now() ELSE end_time END - start_time)))) AS difference FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' AND action_type = 1) AS total_curr_time,
                (SELECT SUM(ROUND(EXTRACT(EPOCH FROM (CASE WHEN (end_time is null) THEN now() ELSE end_time END - start_time)))) AS difference FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' AND action_type = 2) AS total_break_time`);
            res.json({ status: 1, res_data: timerData, status_data: statusData});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Add employee time
router.post('/', fetchuser, [], async (req, res)=>{
	const { currStatus } = req.body;
    const { id } = req.user;
    const date = new Date();
    const curr_date = date.toLocaleDateString("en-CA");
    let status = 0;
    try{
        const account = await dbUtils.execute_single(`SELECT id FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' AND end_time is null ORDER BY entry_date DESC LIMIT 1`);
        if(currStatus == 3){
            if(account){
                let_update = [];
                let_update['end_time'] = 'NOW()';
                dbUtils.update('tbl_employee_time', let_update, "id='"+account.id+"'");
            }
        }
        else{
            if(account){
                let_update = [];
                let_update['end_time'] = 'NOW()';
                dbUtils.update('tbl_employee_time', let_update, "id='"+account.id+"'");
            }
            if(account || currStatus == 1){
                let timeData = [];
                timeData['user_id'] = id;
                timeData['action_type'] = currStatus;
                dbUtils.insert('tbl_employee_time',timeData);
            }
        }
        res.json({ status: 1, message: 'success'});

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

module.exports = router;