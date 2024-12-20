const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const multer = require('multer');
const upload = multer();

// Get User time by Id
router.get('/', fetchuser, upload.none(), [], async (req, res)=>{
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
router.get('/monthly', fetchuser, upload.none(), [], async (req, res)=>{
	let { id } = req.user;
    
    let status = 0;
    const date = new Date();
    const curr_date = date.toLocaleDateString("en-CA").split('-');
    const curr_month = curr_date[0]+"-"+curr_date[1];
    try{
        const timerData = await dbUtils.execute(`SELECT to_char(start_time, 'YYYY-MM-DD HH24:MI:SS') AS start_time, 
            to_char(end_time, 'YYYY-MM-DD HH24:MI:SS') AS end_time, 
            total_time,
            CASE WHEN action_type = 1 THEN false ELSE true END as is_break 
            FROM tbl_employee_time 
            WHERE user_id = '${id}' AND to_char(start_time, 'YYYY-MM') = '${curr_month}' AND end_time is not null ORDER BY start_time`);
        if(!timerData){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            res.json({ status: 1, res_data: timerData});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Add employee time
router.post('/', fetchuser, upload.none(), [], async (req, res)=>{
    const { currStatus } = req.body;
    const { id } = req.user;
    const date = new Date();
    const curr_date = date.toLocaleDateString("en-CA");
    let status = 0;
    let askReason = false;
    let updateEndTime = false;
    try{
        const account = await dbUtils.execute_single(`SELECT id, start_time FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' AND end_time is null ORDER BY entry_date DESC LIMIT 1`);
        if(currStatus == 3){
            // Add logic for clock out
            const totalTimeData = await dbUtils.execute_single(`SELECT
                (SELECT SUM(ROUND(EXTRACT(EPOCH FROM (CASE WHEN (end_time is null) THEN now() ELSE end_time END - start_time)))) AS difference FROM tbl_employee_time where action_type = 1 AND user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}') as total_time,
                (SELECT full_day_time*60 FROM tbl_settings LIMIT 1) AS full_day_time,
                (SELECT half_day_time*60 FROM tbl_settings LIMIT 1) AS half_day_time,
                COALESCE((SELECT ld.leave_time FROM tbl_leave_dates ld join tbl_leaves l ON l.id = ld.leave_id where l.leave_status = 1 AND ld.user_id = '${id}' AND ld.leave_date = '${curr_date}'),'0') AS leave_type`);
                if((totalTimeData.full_day_time > totalTimeData.total_time && totalTimeData.leave_type == '0') || 
                ((totalTimeData.leave_type == 1 || totalTimeData.leave_type == 2) && totalTimeData.half_day_time > totalTimeData.total_time)){
                    askReason = true;
            }
            else{
                updateEndTime = true;
            }
        }
        else {
            updateEndTime = true;
            if(account || currStatus == 1){
                let timeData = [];
                timeData['user_id'] = id;
                timeData['action_type'] = currStatus;
                await dbUtils.insert('tbl_employee_time',timeData);
            }
        }

        if(account && updateEndTime){
            var startDate = new Date(account.start_time);
            var endDate   = new Date();
            var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
            let time_update = [];
            time_update['end_time'] = 'NOW()';
            time_update['total_time'] = seconds;
            await dbUtils.update('tbl_employee_time', time_update, "id='"+account.id+"'");
        }
        res.json({ status: 1, message: 'success', askReason: askReason});
        
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Add employee clockout
router.put('/clockout', fetchuser, upload.none(), [], async (req, res)=>{
    const { reason } = req.body;
    const { id } = req.user;
    const date = new Date();
    const curr_date = date.toLocaleDateString("en-CA");
    let status = 0;
    try{
        const account = await dbUtils.execute_single(`SELECT id, start_time FROM tbl_employee_time where user_id = '${id}' AND to_char(start_time, 'YYYY-MM-DD') = '${curr_date}' AND end_time is null ORDER BY entry_date DESC LIMIT 1`);
        if(account){
            var startDate = new Date(account.start_time);
            var endDate   = new Date();
            var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
            let time_update = [];
            time_update['end_time'] = 'NOW()';
            time_update['total_time'] = seconds;
            time_update['reason'] = reason;
            await dbUtils.update('tbl_employee_time', time_update, "id='"+account.id+"'");
        }
        res.json({ status: 1, message: 'success'});
        
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Get User time
router.get('/details', fetchuser, upload.none(), [], async (req, res)=>{
    let { empId, date } = req.query;
    
    let status = 0;
    const timer_date = new Date(decodeURI(date));
    const curr_date = timer_date.toLocaleDateString("en-CA");
    try{
        const timerData = await dbUtils.execute(`SELECT et.id,
            et.start_time AS stime,
            CASE WHEN (th.status = 1 OR th.id is null) THEN to_char(et.start_time, 'HH:MI AM') ELSE to_char(th.updated_start_time, 'HH:MI AM') END AS start_time, 
            CASE WHEN (th.status = 1 OR th.id is null) THEN to_char(et.end_time, 'HH:MI AM') ELSE to_char(th.updated_end_time, 'HH:MI AM') END AS end_time, 
            CASE WHEN (th.status = 1 OR th.id is null) THEN to_char(et.start_time, 'HH24:MI') ELSE to_char(th.updated_start_time, 'HH24:MI') END AS full_start_time, 
            CASE WHEN (th.status = 1 OR th.id is null) THEN to_char(et.end_time, 'HH24:MI') ELSE to_char(th.updated_end_time, 'HH24:MI') END AS full_end_time,
            et.total_time, et.action_type,
            to_char(th.start_time, 'HH:MI AM') AS old_start_time,
	        to_char(th.end_time, 'HH:MI AM') AS old_end_time,
            th.status, th.status_description,
            CASE WHEN (th.status = '1') THEN 'Approved' WHEN (th.status = '2') THEN 'Rejected' WHEN (th.status = '0') THEN 'Pending' ELSE 'NONE' END AS status_text, 
            CASE WHEN (th.status = '1') THEN 'green' WHEN (th.status = '2') THEN 'red' WHEN (th.status = '0') THEN 'yellow' ELSE 'NONE' END AS status_color  
            FROM tbl_employee_time et
            left join tbl_employee_time_history th ON et.id = th.time_id AND th.is_latest = 1
            WHERE et.user_id = '${empId}' AND to_char(et.start_time, 'YYYY-MM-DD') = '${curr_date}' ORDER BY stime`);
        if(!timerData){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            res.json({ status: 1, res_data: timerData});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Add employee clockout
router.put('/manage', fetchuser, upload.none(), [], async (req, res)=>{
    const { start_time, end_time, timer_date, timer_id, timer_user } = req.body;
    const { roleId, id } = req.user;
    let status = 0;
    const start_date = timer_date+" "+start_time+":00";
    const end_date = timer_date+" "+end_time+":00";
    try{
        var startDate = new Date(start_date);
        var endDate   = new Date(end_date);
        var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
        if(timer_id){
            const oldData = await dbUtils.execute_single(`SELECT *, TO_CHAR(start_time,'YYYY-MM-DD HH24:MI:SS') AS start_time_format, TO_CHAR(end_time,'YYYY-MM-DD HH24:MI:SS') AS end_time_format FROM tbl_employee_time WHERE id = '${timer_id}'`);
            
            // Manage History
            const historyData = await dbUtils.execute_single(`SELECT id FROM tbl_employee_time_history WHERE status != '1' AND time_id = '${timer_id}' ORDER BY entry_date DESC LIMIT 1`);
            if(historyData){
                let history_time_update = [];
                history_time_update['updated_start_time'] = start_date;
                history_time_update['updated_end_time'] = end_date;
                await dbUtils.update('tbl_employee_time_history', history_time_update, "id='"+historyData.id+"'");
            }
            else{
                let history_time_update = [];
                history_time_update['is_latest'] = '0';
                await dbUtils.update('tbl_employee_time_history', history_time_update, "time_id='"+oldData.id+"'");

                let history_time_insert = [];
                history_time_insert['time_id'] = oldData.id;
                history_time_insert['start_time'] = oldData.start_time_format;
                history_time_insert['end_time'] = oldData.end_time_format;
                history_time_insert['total_time'] = oldData.total_time;
                history_time_insert['updated_start_time'] = start_date;
                history_time_insert['updated_end_time'] = end_date;
                history_time_insert['user_id'] = oldData.user_id;
                history_time_insert['action_type'] = oldData.action_type;
                history_time_insert['reason'] = oldData.reason;
                if(roleId == process.env.NEXT_PUBLIC_MAINUTYPE){
                    history_time_insert['status'] = '1';
                }
                await dbUtils.insert('tbl_employee_time_history', history_time_insert);
            }
            
            // Manage Emplyee Time
            if(roleId == process.env.NEXT_PUBLIC_MAINUTYPE){
                let time_update = [];
                time_update['start_time'] = start_date;
                time_update['end_time'] = end_date;
                time_update['total_time'] = seconds;
                time_update['is_updated'] = '1';
                await dbUtils.update('tbl_employee_time', time_update, "id='"+timer_id+"'");

                const idData = await dbUtils.execute_single(`SELECT
                    (SELECT id FROM tbl_employee_time 
                        WHERE user_id = '${timer_user}' AND TO_CHAR(start_time, 'YYYY-MM-DD') = '${timer_date}' AND end_time <= timestamp '${oldData.start_time_format}' ORDER BY end_time DESC LIMIT 1) AS prev_timer_id,
                    (SELECT TO_CHAR(start_time,'YYYY-MM-DD HH24:MI:SS') FROM tbl_employee_time 
                        WHERE user_id = '${timer_user}' AND TO_CHAR(start_time, 'YYYY-MM-DD') = '${timer_date}' AND end_time <= timestamp '${oldData.start_time_format}' ORDER BY end_time DESC LIMIT 1) AS prev_start_time,
                    (SELECT id FROM tbl_employee_time 
                        WHERE user_id = '${timer_user}' AND TO_CHAR(start_time, 'YYYY-MM-DD') = '${timer_date}' AND start_time >= timestamp '${oldData.end_time_format}' ORDER BY start_time ASC LIMIT 1) AS next_timer_id,
                    (SELECT TO_CHAR(end_time,'YYYY-MM-DD HH24:MI:SS') FROM tbl_employee_time 
                        WHERE user_id = '${timer_user}' AND TO_CHAR(start_time, 'YYYY-MM-DD') = '${timer_date}' AND start_time >= timestamp '${oldData.end_time_format}' ORDER BY start_time ASC LIMIT 1) AS next_end_time`); 
                if(idData.prev_timer_id){
                    var startDate = new Date(idData.prev_start_time);
                    var endDate = new Date(start_date);
                    let seconds = 0;
                    if(start_date && idData.prev_start_time) seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    let time_update = [];
                    time_update['end_time'] = start_date;
                    time_update['total_time'] = seconds;
                    await dbUtils.update('tbl_employee_time', time_update, "id='"+idData.prev_timer_id+"'");
                }
                if(idData.next_timer_id){
                    var startDate = new Date(end_date);
                    var endDate   = new Date(idData.next_end_time);
                    let seconds = 0;
                    if(end_date && idData.next_end_time) seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    let time_update = [];
                    time_update['start_time'] = end_date;
                    time_update['total_time'] = seconds;
                    await dbUtils.update('tbl_employee_time', time_update, "id='"+idData.next_timer_id+"'");
                }
            }
        }
        else{
            const timerData = await dbUtils.execute_single(`SELECT id FROM tbl_employee_time 
                where user_id = '${timer_user}'
                AND
                (
                    start_time BETWEEN timestamp '${start_date}' AND timestamp '${end_date}'
                    OR
                    timestamp '${start_date}' BETWEEN start_time AND end_time
                )`);
            if(timerData){
                res.status(500).json({ status:status, message: "Time already added in this time period"});
            }
            else{
                let time_insert = [];
                time_insert['start_time'] = start_date;
                time_insert['end_time'] = end_date;
                time_insert['total_time'] = seconds;
                time_insert['user_id'] = timer_user;
                time_insert['action_type'] = '1';
                time_insert['is_updated'] = '1';
                await dbUtils.insert('tbl_employee_time', time_insert);
            }
        }
        res.json({ status: 1, message: 'success'});
        
    } catch (error){
        console.log(error);
        res.status(500).json({ status:status, message: "Internal server error"});
    }
});

// Update a leave status
router.put('/status', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const {modalId, modalStatus, rejectDescription} = req.body;
    try{
        const oldData = await dbUtils.execute_single(`SELECT *, TO_CHAR(start_time,'YYYY-MM-DD HH24:MI:SS') AS start_time_format, TO_CHAR(end_time,'YYYY-MM-DD HH24:MI:SS') AS end_time_format FROM tbl_employee_time WHERE id = '${modalId}'`);
        if(oldData){
            // Manage History
            const historyData = await dbUtils.execute_single(`SELECT id, TO_CHAR(updated_start_time,'YYYY-MM-DD HH24:MI:SS') AS start_time_format, TO_CHAR(updated_end_time,'YYYY-MM-DD HH24:MI:SS') AS end_time_format 
                FROM tbl_employee_time_history WHERE status != '1' AND time_id = '${modalId}' ORDER BY entry_date DESC LIMIT 1`);
            if(historyData){
                let history_time_update = [];
                history_time_update['status'] = modalStatus;
                history_time_update['status_description'] = rejectDescription ? rejectDescription : '';
                await dbUtils.update('tbl_employee_time_history', history_time_update, "id='"+historyData.id+"'");
                
                if(modalStatus == '1'){
                    var startDate = new Date(historyData.start_time_format);
                    var endDate   = new Date(historyData.end_time_format);
                    var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    const timer_date = startDate.toLocaleDateString("en-CA");

                    let time_update = [];
                    time_update['start_time'] = historyData.start_time_format;
                    time_update['end_time'] = historyData.end_time_format;
                    time_update['total_time'] = seconds;
                    time_update['is_updated'] = '1';
                    await dbUtils.update('tbl_employee_time', time_update, "id='"+oldData.id+"'");

                    const idData = await dbUtils.execute_single(`SELECT
                        (SELECT id FROM tbl_employee_time 
                            WHERE user_id = '${oldData.user_id}' AND TO_CHAR(start_time, 'YYYY-MM-DD') = '${timer_date}' AND end_time <= timestamp '${oldData.start_time_format}' ORDER BY end_time DESC LIMIT 1) AS prev_timer_id,
                        (SELECT TO_CHAR(start_time,'YYYY-MM-DD HH24:MI:SS') FROM tbl_employee_time 
                            WHERE user_id = '${oldData.user_id}' AND TO_CHAR(start_time, 'YYYY-MM-DD') = '${timer_date}' AND end_time <= timestamp '${oldData.start_time_format}' ORDER BY end_time DESC LIMIT 1) AS prev_start_time,
                        (SELECT id FROM tbl_employee_time 
                            WHERE user_id = '${oldData.user_id}' AND TO_CHAR(start_time, 'YYYY-MM-DD') = '${timer_date}' AND start_time >= timestamp '${oldData.end_time_format}' ORDER BY start_time ASC LIMIT 1) AS next_timer_id,
                        (SELECT TO_CHAR(end_time,'YYYY-MM-DD HH24:MI:SS') FROM tbl_employee_time 
                            WHERE user_id = '${oldData.user_id}' AND TO_CHAR(start_time, 'YYYY-MM-DD') = '${timer_date}' AND start_time >= timestamp '${oldData.end_time_format}' ORDER BY start_time ASC LIMIT 1) AS next_end_time`); 
                    if(idData.prev_timer_id){
                        var startDate = new Date(idData.prev_start_time);
                        var endDate = new Date(historyData.start_time_format);
                        let seconds = 0;
                        if(historyData.start_time_format && idData.prev_start_time) seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                        let time_update = [];
                        time_update['end_time'] = historyData.start_time_format;
                        time_update['total_time'] = seconds;
                        await dbUtils.update('tbl_employee_time', time_update, "id='"+idData.prev_timer_id+"'");
                    }
                    if(idData.next_timer_id){
                        var startDate = new Date(historyData.end_time_format);
                        var endDate   = new Date(idData.next_end_time);
                        let seconds = 0;
                        if(historyData.end_time_format && idData.next_end_time) seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                        let time_update = [];
                        time_update['start_time'] = historyData.end_time_format;
                        time_update['total_time'] = seconds;
                        await dbUtils.update('tbl_employee_time', time_update, "id='"+idData.next_timer_id+"'");
                    }
                }
                status = 1;
                res.json({status:status, message: "User updated successfully."});
            }
            else {
                return res.status(400).json({ status:status, message: "sorry, somthing went wrong!"});
            }
        }
        else {
            return res.status(400).json({ status:status, message: "sorry, somthing went wrong!"});
        }
    } catch (error){
        res.status(500).json({ status:status, message: "Internal server error"});
    }
});

module.exports = router;