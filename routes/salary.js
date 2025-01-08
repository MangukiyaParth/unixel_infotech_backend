const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const multer = require('multer');
const upload = multer();

// Create a Leave
router.post('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0; 
    const {employee, format_month, bonus, bonus_descr, expense, expense_descr, salary_data} = req.body;
    // console.log(month);
    const month = decodeURI(format_month);
    try{
        const salary_chk = await dbUtils.execute_single(`SELECT id FROM tbl_salary WHERE user_id = '${employee}' AND salary_month = '${month}'`);
        if(salary_chk){
            return res.status(400).json({ status:status, error: "sorry you have already add salary for this month and employee"});
        }
        else{
            const salary_details = JSON.parse(salary_data);
            let salaryData = [];
            salaryData['user_id'] = employee;
            salaryData['salary_month'] = month;
            salaryData['bonus'] = bonus;
            salaryData['bonus_descr'] = bonus_descr;
            salaryData['expense'] = expense;
            salaryData['expense_descr'] = expense_descr;
            salaryData['salary'] = parseFloat(salary_details?.salary.toString());
            salaryData['total_month_days'] = parseInt(salary_details?.total_month_days.toString());
            salaryData['free_leave'] = parseFloat(salary_details?.free_leave.toString());
            salaryData['paid_leave'] = parseFloat(salary_details?.paid_leave.toString());
            salaryData['weekend_cnt'] = parseInt(salary_details?.weekend_cnt.toString());
            salaryData['holiday_cnt'] = parseInt(salary_details?.holiday_cnt.toString());
            salaryData['deduct_days'] = parseFloat(salary_details?.deduct_days.toString());
            salaryData['present_days'] = parseFloat(salary_details?.present_days.toString());
            salaryData['salary_per_day'] = parseFloat(salary_details?.salary_per_day.toString());
            salaryData['payable_amt'] = parseFloat(salary_details?.payable_amt.toString());
            salaryData['total_payable_amt'] = parseFloat(salary_details?.total_payable_amt.toString());
            salaryData['salary_data'] = salary_data;
            await dbUtils.insert('tbl_salary', salaryData);
            res.json({status: 1, message: "Leave added successfully."});
        }
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error", error_data: error});
    }
});

// Delete a leave
router.delete('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const {id} = req.body;
    console.log(id);
    try{
        // Check Song Exist
        const leave = await dbUtils.execute(`SELECT id FROM tbl_salary WHERE id = '${id}'`);
        if(leave && id && id != "" && leave.length > 0) {
            await dbUtils.delete('tbl_salary',`id = '${id}'`);
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
    let orderBy = "s.entry_date DESC";
    if(sortField != ""){
        orderBy = sortField + " " + ((sortDirection != "") ? sortDirection : 'asc');
    }
    try{
        let extraWhere = "";
        if(req.user.roleId != process.env.NEXT_PUBLIC_MAINUTYPE && req.user.roleId != process.env.NEXT_PUBLIC_SUBUTYPE){
            extraWhere = " s.user_id = '"+req.user.id+"' AND ";
        }
        const salary = await dbUtils.execute(`SELECT s.*, u.name
            FROM tbl_salary s
            join tbl_users u on u.id = s.user_id 
            WHERE ${extraWhere}
                (
                    u.name LIKE '${`%${search}%`}' OR
                    s.salary_month LIKE '${`%${search}%`}'
                )
            ORDER BY ${orderBy}
            LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}`);
            
        if(!salary){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            const salary_total = await dbUtils.execute_single(`SELECT COUNT(u.id)
            FROM tbl_salary s
            join tbl_users u on u.id = s.user_id 
            WHERE ${extraWhere}
                (
                    u.name LIKE '${`%${search}%`}' OR
                    s.salary_month LIKE '${`%${search}%`}'
                )`);
            res.json({ status: 1, res_data: salary, total: salary_total['count']});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

router.get('/detail', fetchuser, upload.none(), [], async (req, res)=>{
    let { month, employee } = req.query;
    const decodedMonth = decodeURI(month);
    try {             
        const salaryData = await dbUtils.execute_single(`SELECT
            (SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END)
                FROM tbl_leave_dates ld
                join tbl_leaves l on l.id = ld.leave_id
                WHERE ld.user_id = '${employee}' AND l.leave_type = '1' AND l.leave_status != '2' AND
                TO_CHAR(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY-MM') = '${decodedMonth}'
            ) AS free_leave,
            (SELECT SUM(CASE WHEN (ld.leave_time = '3') THEN 1 ELSE 0.5 END)
                FROM tbl_leave_dates ld
                join tbl_leaves l on l.id = ld.leave_id
                WHERE ld.user_id = '${employee}' AND l.leave_type = '2' AND l.leave_status != '2' AND
                TO_CHAR(TO_DATE(ld.leave_date,'YYYY-MM-DD'),'YYYY-MM') = '${decodedMonth}'
            ) AS paid_leave,
            (SELECT COUNT(id)
                FROM tbl_holiday
                WHERE is_weekend = '1' AND TO_CHAR(TO_DATE(holiday_date,'DD/MM/YYYY'),'YYYY-MM') = '${decodedMonth}'
            ) AS weekend_cnt,
            (SELECT COUNT(id)
                FROM tbl_holiday
                WHERE is_weekend = '0' AND TO_CHAR(TO_DATE(holiday_date,'DD/MM/YYYY'),'YYYY-MM') = '${decodedMonth}'
            ) AS holiday_cnt,
            (SELECT salary 
                FROM tbl_users 
                WHERE id = '${employee}'
            ) AS salary,
             (SELECT 
                date_part('days', (date_trunc('month', date '${decodedMonth}-01') + interval '1 month - 1 day'))
            ) AS total_month_days`);
        
        res.json({ status: 1, res_data: salaryData});
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

module.exports = router;