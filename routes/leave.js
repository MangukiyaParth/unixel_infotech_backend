const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const multer = require('multer');
const upload = multer();

// Create a Leave
router.post('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0; 
    const {leaveDate, leave_type, leave_description, start_date, end_date, dateData} = req.body;
    const { id, user_name } = req.user;
    try{
        let already_added = false;
        if(dateData){
            const datesdata = JSON.parse(dateData);
            for(const val of datesdata) {
                const loopDate = val.date;
                const loopTime = val.leaveTime;
                let extraWhere = "";
                if(loopTime == 1 || loopTime == 2){
                    extraWhere = ` AND (ld.leave_time = '${loopTime}' OR ld.leave_time = '3')`;
                }
                const user_leave = await dbUtils.execute_single(`SELECT ld.* FROM tbl_leave_dates ld 
                    JOIN tbl_leaves l ON l.id = ld.leave_id
                    WHERE ld.user_id = '${id}' AND l.leave_status != 2 ${extraWhere} AND
                    TO_DATE('${loopDate}','YYYY-MM-DD') = TO_DATE(ld.leave_date,'YYYY-MM-DD')`);
                if(user_leave){
                    // return res.status(400).json({ status:status, error: "sorry you have already add leave for this time period"});
                    already_added = true;
                    break;
                }
            }
        }

        if(already_added){
            return res.status(400).json({ status:status, error: "sorry you have already add leave for this time period"});
        }

        if(leave_type == 1){
            const yearly_leave_limit = 12;
            let remain_leave = 0;
            const yearly_taken_paid_leave = await dbUtils.execute_single(`SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END) AS yearly_leave 
            FROM tbl_leave_dates ld
            join tbl_leaves l on l.id = ld.leave_id
            WHERE ld.user_id = '${req.user.id}' AND l.leave_type = '1' AND l.leave_status != '2' AND
            to_char(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY') = to_char(TO_DATE('${start_date}','YYYY-MM-DD'),'YYYY')`);
            const used_yearly_leave = (yearly_taken_paid_leave && yearly_taken_paid_leave.yearly_leave) ? yearly_taken_paid_leave.yearly_leave : 0;
            if(used_yearly_leave >= yearly_leave_limit){
                return res.status(400).json({ status:status, error: "Sorry! You have reached yearly Free leave Limit ("+yearly_leave_limit+")"});
            }
            else{
                const monthly_leave = await dbUtils.execute_single(`SELECT
                    (SELECT free_leave_limit FROM tbl_settings LIMIT 1) AS free_leave_limit,
                    (SELECT TO_CHAR(TO_DATE(join_date,'DD/MM/YYYY'),'MM-DD') FROM tbl_users WHERE id = '${req.user.id}') AS join_date`);
                const monthly_leave_limit = monthly_leave.free_leave_limit;
                const join_date = monthly_leave.join_date;
                const start_year = (start_date.split('-')[0] - 1);
                const curr_year_chk = start_year+""+(monthly_leave.join_date.replace("-",""));
                const curr_full_date_chk = start_date.replaceAll("-","");
                let leave_tenure_start_date = `${start_year}-${join_date}`;
                if(parseInt(curr_year_chk) > parseInt(curr_full_date_chk)){
                    leave_tenure_start_date = `${start_year - 1}-${join_date}`;
                }
                const monthly_taken_paid_leave = await dbUtils.execute_single(`SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END) AS monthly_leave 
                    FROM tbl_leave_dates ld
                    join tbl_leaves l on l.id = ld.leave_id
                    WHERE ld.user_id = '${req.user.id}' AND l.leave_type = '1' AND l.leave_status != '2' AND
                    to_char(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY-MM') = to_char(TO_DATE('${start_date}','YYYY-MM-DD'),'YYYY-MM')`);
                let used_monthly_leave = (monthly_taken_paid_leave && monthly_taken_paid_leave.monthly_leave) ? monthly_taken_paid_leave.monthly_leave : 0;
                if(used_monthly_leave >= monthly_leave_limit){
                    return res.status(400).json({ status:status, error: "Sorry! You have reached monthly Free leave Limit ("+monthly_leave_limit+")"});
                }
                else{
                    const monthly_leave_balance = monthly_leave_limit - used_monthly_leave;
                    const yearly_leave_balance = yearly_leave_limit - used_yearly_leave;
                    remain_leave = ((monthly_leave_balance) < (yearly_leave_balance)) ? monthly_leave_balance : yearly_leave_balance;
                }
            }
            const datesdata = JSON.parse(dateData);
            let applied_days = 0;
            for(const val of datesdata) {
                applied_days += (val.leaveTime == '3') ? 1 : 0.5;
            }
            if(applied_days > remain_leave){
                return res.status(400).json({ status:status, error: "Sorry! You have exceeded Free leave Limit"});
            }
        }
        let leaveData = [];
        leaveData['leave_date'] = leaveDate;
        leaveData['leave_type'] = leave_type;
        leaveData['description'] = leave_description;
        leaveData['start_date'] = start_date;
        leaveData['end_date'] = end_date;
        leaveData['date_data'] = dateData;
        leaveData['user_id'] = id;
        let newId = await dbUtils.insert('tbl_leaves',leaveData, 'id');
        if(newId[0].id){
            const datesdata = JSON.parse(dateData);
            for(const val of datesdata) {
                let leaveDateData = [];
                leaveDateData['leave_id'] = newId[0].id;
                leaveDateData['leave_date'] = val.date;
                leaveDateData['leave_time'] = val.leaveTime;
                leaveDateData['user_id'] = id;
                dbUtils.insert('tbl_leave_dates',leaveDateData);
            }
        }

        let notification_data = [];
        notification_data['user_id'] = id;
        notification_data['for_admin'] = '1';
        notification_data['module_id'] = newId[0].id;
        notification_data['notification_type'] = 'LEAVE';
        notification_data['title'] = "Request from "+user_name;
        notification_data['message'] = "Leave apply for "+leaveDate;
        await dbUtils.insert('tbl_notification', notification_data);
        res.json({status: 1, message: "Leave added successfully."});
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error", error_data: error});
    }
});

// Update a leave 
router.put('/', fetchuser, upload.none(), [], async (req, res)=>{
        let status = 0;
        const {leaveDate, leave_type, leave_description, start_date, end_date, dateData, id} = req.body;
        try{
            let already_added = false;
            if(dateData){
                const datesdata = JSON.parse(dateData);
                for(const val of datesdata) {
                    const loopDate = val.date;
                    const loopTime = val.leaveTime;
                    let extraWhere = "";
                    if(loopTime == 1 || loopTime == 2){
                        extraWhere = ` AND (ld.leave_time = '${loopTime}' OR ld.leave_time = '3')`;
                    }
                    const user_leave = await dbUtils.execute_single(`SELECT ld.* FROM tbl_leave_dates ld 
                        JOIN tbl_leaves l ON l.id = ld.leave_id
                        WHERE ld.user_id = '${id}' AND ld.leave_id != '${id}' AND l.leave_status != 2 ${extraWhere} AND
                        TO_DATE('${loopDate}','YYYY-MM-DD') = TO_DATE(ld.leave_date,'YYYY-MM-DD')`);
                    if(user_leave){
                        // return res.status(400).json({ status:status, error: "sorry you have already add leave for this time period"});
                        already_added = true;
                        break;
                    }
                }
            }

            if(already_added){
                return res.status(400).json({ status:status, error: "sorry you have already add leave for this time period"});
            }

            if(leave_type == 1){
                const yearly_leave_limit = 12;
                let remain_leave = 0;
                const joinData = await dbUtils.execute_single(`SELECT TO_CHAR(TO_DATE(join_date,'DD/MM/YYYY'),'MM-DD') AS join_date FROM tbl_users WHERE id = '${req.user.id}'`);
                const join_date = joinData.join_date;
                const start_year = (start_date.split('-')[0] - 1);
                const curr_year_chk = start_year+""+(joinData.join_date.replace("-",""));
                const curr_full_date_chk = start_date.replaceAll("-","");
                let leave_tenure_start_date = `${start_year}-${join_date}`;
                if(parseInt(curr_year_chk) > parseInt(curr_full_date_chk)){
                    leave_tenure_start_date = `${start_year - 1}-${join_date}`;
                }

                const yearly_taken_paid_leave = await dbUtils.execute_single(`SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END) AS yearly_leave 
                FROM tbl_leave_dates ld
                join tbl_leaves l on l.id = ld.leave_id
                WHERE ld.user_id = '${req.user.id}' AND l.leave_type = '1' AND l.leave_status != '2' AND ld.leave_id != '${id}'  AND
                TO_DATE(ld.leave_date,'YYYY-MM-DD') BETWEEN TO_DATE('${leave_tenure_start_date}','YYYY-MM-DD') AND (TO_DATE('${leave_tenure_start_date}','YYYY-MM-DD') + INTERVAL '1 year' - INTERVAL '1 day')`);
                const used_yearly_leave = (yearly_taken_paid_leave && yearly_taken_paid_leave.yearly_leave) ? yearly_taken_paid_leave.yearly_leave : 0;
                if(used_yearly_leave >= yearly_leave_limit){
                    return res.status(400).json({ status:status, error: "Sorry! You have reached yearly Free leave Limit ("+yearly_leave_limit+")"});
                }
                else{
                    const monthly_leave = await dbUtils.execute_single(`SELECT free_leave_limit FROM tbl_settings LIMIT 1`);
                    const monthly_leave_limit = monthly_leave.free_leave_limit;

                    const monthly_taken_paid_leave = await dbUtils.execute_single(`SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END) AS monthly_leave 
                        FROM tbl_leave_dates ld
                        join tbl_leaves l on l.id = ld.leave_id
                        WHERE ld.user_id = '${req.user.id}' AND l.leave_type = '1' AND l.leave_status != '2' AND ld.leave_id != '${id}' AND
                        to_char(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY-MM') = to_char(TO_DATE('${start_date}','YYYY-MM-DD'),'YYYY-MM')`);
                    let used_monthly_leave = (monthly_taken_paid_leave && monthly_taken_paid_leave.monthly_leave) ? monthly_taken_paid_leave.monthly_leave : 0;
                    if(used_monthly_leave >= monthly_leave_limit){
                        return res.status(400).json({ status:status, error: "Sorry! You have reached monthly Free leave Limit ("+monthly_leave_limit+")"});
                    }
                    else{
                        const monthly_leave_balance = monthly_leave_limit - used_monthly_leave;
                        const yearly_leave_balance = yearly_leave_limit - used_yearly_leave;
                        remain_leave = ((monthly_leave_balance) < (yearly_leave_balance)) ? monthly_leave_balance : yearly_leave_balance;
                    }
                }
                const datesdata = JSON.parse(dateData);
                let applied_days = 0;
                for(const val of datesdata) {
                    applied_days += (val.leaveTime == '3') ? 1 : 0.5;
                }
                if(applied_days > remain_leave){
                    return res.status(400).json({ status:status, error: "Sorry! You have exceeded Free leave Limit"});
                }
            }
            let leaveData = [];
            leaveData['leave_date'] = leaveDate;
            leaveData['leave_type'] = leave_type;
            leaveData['description'] = leave_description;
            leaveData['start_date'] = start_date;
            leaveData['end_date'] = end_date;
            leaveData['date_data'] = dateData;
            dbUtils.update('tbl_leaves',leaveData, "id='"+id+"'");

            if(dateData){
                await dbUtils.delete('tbl_leave_dates',`leave_id = '${id}'`);
                const datesdata = JSON.parse(dateData);
                for(const val of datesdata) {
                    let leaveDateData = [];
                    leaveDateData['leave_id'] = id;
                    leaveDateData['leave_date'] = val.date;
                    leaveDateData['leave_time'] = val.leaveTime;
                    leaveDateData['user_id'] = req.user.id;
                    dbUtils.insert('tbl_leave_dates',leaveDateData);
                }
            }
            res.json({status:1, message: "User updated successfully."});
        } catch (error){
            res.status(500).json({ status:status, error: "Internal server error"});
        }
});

// Delete a leave
router.delete('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const {id} = req.body;
    try{
        // Check Song Exist
        const leave = await dbUtils.execute(`SELECT id FROM tbl_leaves WHERE id = '${id}' AND user_id = '${req.user.id}'`);
        if(leave && id && id != "" && leave.length > 0) {
            await dbUtils.delete('tbl_leaves',`id = '${id}'`);
            await dbUtils.delete('tbl_leave_dates',`leave_id = '${id}'`);
            status=1;
        }
        else {
            {return res.status(400).json({ status:status, errors: "Not Found!" });}
        }
        
        res.json({status: status, message: "Account Deleted Successfully"});

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Get leaves
router.get('/', fetchuser, upload.none(), [], async (req, res)=>{
	let { search, page, page_size, sortField, sortDirection } = req.query;
	const ITEMS_PER_PAGE = page_size;
    page = parseInt(page);
    const offset = (page - 1) * ITEMS_PER_PAGE;
    let status = 0;
    let orderBy = "l.entry_date DESC";
    if(sortField != ""){
        orderBy = sortField + " " + ((sortDirection != "") ? sortDirection : 'asc');
    }
    try{
        let extraWhere = "";
        if(req.user.roleId != process.env.NEXT_PUBLIC_MAINUTYPE && req.user.roleId != process.env.NEXT_PUBLIC_SUBUTYPE){
            extraWhere = " l.user_id = '"+req.user.id+"' AND ";
        }
        const account = await dbUtils.execute(`SELECT l.*, u.name, 
            CASE WHEN (l.leave_type = '1') THEN 'Free Leave' ELSE 'Paid Leave' END AS leave_type_text,
            CASE WHEN (l.leave_status = '1') THEN 'Approved' WHEN (l.leave_status = '2') THEN 'Rejected' ELSE 'Pending' END AS leave_status_text, 
            CASE WHEN (l.leave_status = '1') THEN 'green' WHEN (l.leave_status = '2') THEN 'red' ELSE 'yellow' END AS leave_status_color  
            FROM tbl_leaves l
            join tbl_users u on u.id = l.user_id 
            WHERE ${extraWhere}
                (
                    u.name LIKE '${`%${search}%`}' OR
                    CASE WHEN (l.leave_type = '1') THEN 'Free Leave' ELSE 'Paid Leave' END LIKE '${`%${search}%`}' OR
                    CASE WHEN (l.leave_status = '1') THEN 'Approved' WHEN (l.leave_status = '2') THEN 'Rejected' ELSE 'Pending' END LIKE '${`%${search}%`}' OR
                    l.leave_date LIKE '${`%${search}%`}'
                )
            ORDER BY ${orderBy}
            LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}`);

        if(!account){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            const account_total = await dbUtils.execute_single(`SELECT COUNT(u.id)
            FROM tbl_leaves l
            join tbl_users u on u.id = l.user_id 
            WHERE ${extraWhere}
                (
                    u.name LIKE '${`%${search}%`}' OR
                    CASE WHEN (l.leave_type = '1') THEN 'Free Leave' ELSE 'Paid Leave' END LIKE '${`%${search}%`}' OR
                    CASE WHEN (l.leave_status = '1') THEN 'Approved' WHEN (l.leave_status = '2') THEN 'Rejected' ELSE 'Pending' END LIKE '${`%${search}%`}' OR
                    l.leave_date LIKE '${`%${search}%`}'
                )`);
            res.json({ status: 1, res_data: account, total: account_total['count']});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Get leave by Id
router.get('/leavebyid', fetchuser, upload.none(), [], async (req, res)=>{
	let { id } = req.query;
    try{
        const leave = await dbUtils.execute_single(`SELECT l.* FROM tbl_leaves l WHERE id = '${id}'`);

        if(!leave){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            res.json({ status: 1, res_data: leave});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Update a leave status
router.put('/status', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const {modalLeaveId, modalLeaveStatus, rejectDescription} = req.body;
    try{
        const user_leave = await dbUtils.execute_single(`SELECT l.id, l.user_id, l.leave_date FROM tbl_leaves l WHERE l.id = '${modalLeaveId}'`);
        if(user_leave){
            let leaveData = [];
            leaveData['leave_status'] = modalLeaveStatus;
            leaveData['status_description'] = (modalLeaveStatus != 2) ? "" : rejectDescription;
            dbUtils.update('tbl_leaves',leaveData, "id='"+modalLeaveId+"'");

            let noti_action = "Approved";
            if(modalLeaveStatus == '2'){
                noti_action = "Rejected";
            }
            let notification_data = [];
            notification_data['user_id'] = user_leave.user_id;
            notification_data['for_admin'] = '0';
            notification_data['module_id'] = modalLeaveId;
            notification_data['notification_type'] = 'LEAVE';
            notification_data['title'] = `Request ${noti_action} by Admin`;
            notification_data['message'] = `Your Leave for ${user_leave.leave_date} is ${noti_action} by Admin.`;
            await dbUtils.insert('tbl_notification', notification_data);
        }
        else {
            return res.status(400).json({ status:status, message: "sorry, somthing went wrong!"});
        }
        status = 1;
        res.json({status:status, message: "User updated successfully."});
    } catch (error){
        res.status(500).json({ status:status, message: "Internal server error"});
    }
});

// Get free leave count
router.get('/free-count', fetchuser, upload.none(), [], async (req, res)=>{
	let { id, startDate } = req.query;
    const date = new Date(decodeURI(startDate));
    const curr_year = date.getFullYear();
    const curr_month = date.getFullYear()+"-"+(date.getMonth() + 1);
    const yearly_leave_limit = 12;
    const resp = {
        remain_leave: 0,
        yearly_leave_limit: 12
    }
    try{
        let where = ``;
        if(id && typeof id != ''){
            where = ` AND id != '${id}' `;
        }
        const yearly_taken_paid_leave = await dbUtils.execute_single(`SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END) AS yearly_leave 
                FROM tbl_leave_dates ld
                join tbl_leaves l on l.id = ld.leave_id
                WHERE ld.user_id = '${req.user.id}' AND l.leave_type = '1' AND l.leave_status != '2' ${where} AND
                to_char(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY') = '${curr_year}'`);
        const used_yearly_leave = (yearly_taken_paid_leave && yearly_taken_paid_leave.yearly_leave) ? yearly_taken_paid_leave.yearly_leave : 0;
        if(used_yearly_leave >= yearly_leave_limit){
            res.json({ status: 1, res_data: resp});
        }
        else{
            const monthly_leave = await dbUtils.execute_single(`SELECT free_leave_limit FROM tbl_settings LIMIT 1`);
            const monthly_leave_limit = monthly_leave.free_leave_limit;

            const monthly_taken_paid_leave = await dbUtils.execute_single(`SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END) AS monthly_leave 
                FROM tbl_leave_dates ld
                join tbl_leaves l on l.id = ld.leave_id
                WHERE ld.user_id = '${req.user.id}' AND l.leave_type = '1' AND l.leave_status != '2' ${where} AND
                to_char(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY-MM') = '${curr_month}'`);
            let used_monthly_leave = (monthly_taken_paid_leave && monthly_taken_paid_leave.monthly_leave) ? monthly_taken_paid_leave.monthly_leave : 0;
            if(used_monthly_leave >= monthly_leave_limit){
                res.json({ status: 1, res_data: resp});
            }
            else{
                const monthly_leave_balance = monthly_leave_limit - used_monthly_leave;
                const yearly_leave_balance = yearly_leave_limit - used_yearly_leave;
                // resp.remain_leave = ((monthly_leave_balance) < (yearly_leave_balance)) ? monthly_leave_balance : yearly_leave_balance;
                resp.remain_leave = yearly_leave_balance;
                res.json({ status: 1, res_data: resp});
            }

        }
    } catch (error){
        res.status(500).json({ status:0, error: "Internal server error"});
    }
});
module.exports = router;