const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
var generalUtils = require('../helper/index').general;
const multer = require('multer');
const upload = multer();
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const path = require('path');
const fs = require('fs');
import { Resend } from 'resend';
const isLocal = process.env.NODE_ENV === 'development';

// Create a Salary
router.post('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0; 
    const {employee, format_month, job_title, pan_no, bank_name, account_no, bonus, bonus_descr, expense, expense_descr, weekend_cnt, holiday_cnt, free_leave, paid_leave, salary_data} = req.body;
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
            salaryData['job_title'] = job_title;
            salaryData['pan_no'] = pan_no;
            salaryData['bank_name'] = bank_name;
            salaryData['account_no'] = account_no;
            salaryData['bonus'] = bonus;
            salaryData['bonus_descr'] = bonus_descr;
            salaryData['expense'] = expense;
            salaryData['expense_descr'] = expense_descr;
            salaryData['salary'] = parseFloat(salary_details?.salary.toString());
            salaryData['total_month_days'] = parseInt(salary_details?.total_month_days.toString());
            salaryData['free_leave'] = parseFloat((free_leave ?? 0).toString());
            salaryData['paid_leave'] = parseFloat((paid_leave ?? 0).toString());
            salaryData['weekend_cnt'] = parseInt(weekend_cnt.toString());
            salaryData['holiday_cnt'] = parseInt(holiday_cnt.toString());
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

router.get('/slip', upload.none(), [], async (req, res)=>{
    let { id } = req.query;
    try {
        const salaryData = await dbUtils.execute_single(`SELECT s.*, TO_CHAR(TO_DATE((s.salary_month || '-01'),'YYYY-MM-DD'),'Month YYYY') AS month_formated,
            u.name, u.bank_name AS user_bank_name, u.account_no AS user_account_no, u.pan_no AS user_pan_no, TO_CHAR(TO_DATE(u.join_date,'DD/MM/YYYY'),'DD Mon YYYY') AS join_date, et.employeetype
            FROM tbl_salary s
            join tbl_users u on u.id = s.user_id 
            LEFT JOIN tbl_employee_types et ON u.employeetype = et.id
            WHERE s.id = '${id}'`);
        const leave_amt = ((salaryData.paid_leave && salaryData.paid_leave != '') ? salaryData.paid_leave : 0) * (salaryData.salary_per_day ?? 0);
        let options = { format: 'A4' };
        
        const logoPath = path.join(process.cwd(), 'public', 'assets', 'unixel.png');
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = logoBuffer.toString('base64');
        let html = `
        <style>
            .pdf-body{
                margin: 40px 30px; 
                -webkit-print-color-adjust: exact; 
                font-family: 'Mulish', sans-serif; 
                font-optical-sizing: auto;
                letter-spacing: 0.4;
                color: #333;
                font-size: 15px;
            }
            td, th {
                padding: 8px;
                font-size: 15px;
            }
            td {
                color: #888;
            }
            th {
                color: #444;
                font-weight: 500;
            }
            .flex{
                display: flex;
            }
            .items-center{
                align-items: center;
            }
            .w-75{
                width: 75%;
            }
            .w-25{
                width: 25%;
            }
            .mt-3 {
                margin-top: 10px;
            }
            .mb-3 {
                margin-top: 10px;
            }

            .header {
                margin-bottom: 15px;
            }
            .logo-img{
                height: 70px; 
                width: 160px;
            }
            .address-div {
                margin-left: 15px; 
                color: #777;
            }
            .header-amt-div {
                padding: 5px 0 5px 20px;
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                padding: 15px 0px; 
                background-color: #e7f2e5; 
                border-radius: 10px; 
                border: 1px dashed #a7e4aa;
                font-size: 16px;
                color: #444;
            }
            .header-amt-div .amount{
                margin-top: 8px;
                font-size: 20px; 
                font-weight: 300;
            }
            .text-green{
                color: #5fbd51;
            }
            .text-light{
                color: #888;
            }
            .text-center{
                text-align: center;
            }
            .underline {
                text-decoration: underline;
            }

            hr{
                display: block; 
                height: 1px; 
                border: 0; 
                margin: 1em 0; 
                padding: 0;
            }
            .lite-hr{
                border-top: 1px solid #ccc; 
            }
            .slip-heading {
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                padding: 5px 0;
            }
            .dark-hr{
                border-top: 1px solid #888; 
            }

            table{
                width: 100%; 
                text-align: left;
                font-size: 16px;
                border-collapse: collapse;
            }
            .box-table{
                margin: 0 10px;
            }
            .box-table thead tr{
                border: 1px solid #DDD;
                background-color: #EEE;
            }
            .box-table tfoot tr{
                border-top: 1px solid #DDD;
                border-bottom: 1px solid #DDD;
            }
            .box-table thead th, .box-table tfoot th{
                padding: 15px;
            }
            .box-table thead tr th:nth-child(2), .box-table tfoot th:nth-child(2){
                text-align: right;
            }
            .box-table tbody th, .box-table tbody td{
                padding: 8px 15px;
            }
            .box-table tbody th{
                text-align: right;
            }
            .amount-div{
                display: flex;
                padding: 30px 10px;
                margin: 25px 10px;
                border-top: 2px daSHED #a7e4aa;
                border-bottom: 2px daSHED #a7e4aa;
                background-color: #f8fff8;
            }
            
            .salary-detail{
                padding: 0 20px 10px 20px;
            }
            .authority-detail{
                margin-top: 80px;
                margin-bottom: 30px;
                padding: 20px;
                display: flex;
                justify-content: space-between;
            }
        </style>
        <div class="pdf-body">
            <div class="header flex items-center">
                <div class="flex items-center w-75">
                    <img src="data:image/png;base64,${logoBase64}" class="logo-img" />
                    <div class="address-div">
                        <sapn>317 - Silver Trade Center, Utran, Surat</span><br/>
                        <span style="margin-top: 5px">+91 9998389464</span>
                    </div>
                </div>
                <div class="w-25 header-amt-div">
                    <span>Net Payable Amount</span>
                    <span class="amount text-green">${await  generalUtils.INRFormat(parseFloat(salaryData.total_payable_amt))}</span>
                </div>
            </div>
            <hr class="lite-hr" />
            <div class="slip-heading">
                Salary Slip - ${salaryData.month_formated}
            </div>
            <hr class="dark-hr" />
            <div style="padding: 15px;">
                <table>
                    <tbody>
                        <tr>
                            <td style="width: 20%;">Employee Name</td>
                            <th style="width: 40%;">: ${salaryData.name}</th>
                            <td style="width: 20%;">Working Days</td>
                            <th style="width: 20%;">: ${ (salaryData.total_month_days ?? 0) - parseInt((salaryData.weekend_cnt ?? 0).toString()) - parseInt((salaryData.holiday_cnt ?? 0).toString()) }</th>
                        </tr>
                        <tr>
                            <td>Job Title</td>
                            <th>: ${salaryData.job_title ?? salaryData.employeetype}</th>
                            <td>Present Days</td>
                            <th>: ${salaryData.present_days ?? 0}</th>
                        </tr>
                        <tr>
                            <td>Bank Name</td>
                            <th>: ${salaryData.bank_name ?? salaryData.user_bank_name}</th>
                            <td>Holiday Days</td>
                            <th>: ${salaryData.holiday_cnt ?? 0}</th>
                        </tr>
                        <tr>
                            <td>Account No</td>
                            <th>: ${salaryData.account_no ?? salaryData.user_account_no}</th>
                            <td>Weekoff Days</td>
                            <th>: ${salaryData.weekend_cnt ?? 0}</th>
                        </tr>
                        <tr>
                            <td>Joining Date</td>
                            <th>: ${salaryData.join_date}</th>
                            <td>Free Leave</td>
                            <th>: ${salaryData.free_leave ?? 0}</th>
                        </tr>
                        <tr>
                            <td>PAN Number</td>
                            <th>: ${salaryData.user_pan_no ?? salaryData.pan_no}</th>
                            <td>Paid Leave</td>
                            <th>: ${salaryData.paid_leave ?? 0}</th>
                        </tr>
                    </tbody>
                </table>
            </div>
            <hr class="dark-hr" />
            <div class="flex">
                <table class="box-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Earning</th>
                            <th style="width: 50%;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Basic</td>
                            <th>${await  generalUtils.INRFormat(parseFloat(salaryData.salary))}</th>
                        </tr>
                        <tr>
                            <td>Bonus</td>
                            <th>${await  generalUtils.INRFormat(parseFloat(salaryData.bonus))}</th>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total Earning</th>
                            <th>${await  generalUtils.INRFormat(parseFloat(salaryData.salary) + parseFloat(salaryData.bonus))}</th>
                        </tr>
                    </tfoot>
                </table>
                <table class="box-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Deduction</th>
                            <th style="width: 50%;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Other Deduction</td>
                            <th>${await  generalUtils.INRFormat(parseFloat(salaryData.expense))}</th>
                        </tr>
                        <tr>
                            <td>Leave</td>
                            <th>${await  generalUtils.INRFormat(leave_amt)}</th>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total Deduction</th>
                            <th>${await  generalUtils.INRFormat(parseFloat(salaryData.expense) + parseFloat(leave_amt))}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="amount-div">
                Total Net Payable Amount: <span class="text-green">&nbsp;${await  generalUtils.INRFormat(parseFloat(salaryData.total_payable_amt))}</span>&nbsp; ( ${await  generalUtils.price_in_words(parseFloat(salaryData.total_payable_amt))} Rupee Only )
            </div>

            <div class="salary-detail">
                <div class="mb-3"><span class="text-light">Salary:</span>&nbsp;${await  generalUtils.INRFormat(parseFloat(salaryData.salary))}&nbsp;(${await  generalUtils.INRFormat(parseFloat(salaryData.salary_per_day))} Per Day)</div>
                <div class="mb-3"><span class="text-light">Bonus:</span>&nbsp; ${(salaryData.expense) ? `${salaryData.bonus_descr} =` : '' } ${await  generalUtils.INRFormat(parseFloat(salaryData.bonus))}</div>
                <div class="mb-3"><span class="text-light">Other Deduction:</span>&nbsp; ${(salaryData.expense) ? `${salaryData.expense_descr} =` : '' } ${await  generalUtils.INRFormat(parseFloat(salaryData.expense))}</div>
            </div>
            <div class="authority-detail">
                <div>
                    <span class="text-light underline">Authorised By:</span>
                </div>
                <div>
                    <span class="text-light underline">Employee's Signature:</span>
                </div>
            </div>
            <div class="mt-3 text-center text-light">
                This is a system-generated payslip, hence the signature is not required.
            </div>
        </div>`;
    
        try {
            const browser = await puppeteer.launch({
                args: isLocal ? [] : [
                    ...chromium.args, 
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process'
                ],
                executablePath: isLocal
                    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' // Local Chromium
                    : await chromium.executablePath() || '/usr/bin/google-chrome-stable',
                headless: chromium.headless
            });
            const page = await browser.newPage();
            await page.setContent(html); // Set the HTML content to render
            const pdfBuffer = await page.pdf({ format: 'A4' }); // Generate the PDF buffer
            await browser.close();

            // Send the PDF buffer as a response
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Length', pdfBuffer.length);
            // res.send(pdfBuffer);
            const resp = {
                "pdf": pdfBuffer,
                "id": id,
                "file_name": `Salary Slip ~ ${salaryData.name} | ${salaryData.month_formated}`
            };
            res.json({ status: 1, res_data: resp });
        } catch (error) {
            console.error("Error during Puppeteer execution:", error);
            res.status(500).json({ error: "Internal server error", details: error.message });
        }
    } catch (error){
        res.status(500).json({ status:0, error: "Internal server error"});
    }
});

router.post('/email', upload.none(), [], async (req, res)=>{
    let { id, pdfData } = req.body;
    try {
        const salaryData = await dbUtils.execute_single(`SELECT s.*, TO_CHAR(TO_DATE((s.salary_month || '-01'),'YYYY-MM-DD'),'Month YYYY') AS month_formated,
            u.name, u.email
            FROM tbl_salary s
            join tbl_users u on u.id = s.user_id 
            LEFT JOIN tbl_employee_types et ON u.employeetype = et.id
            WHERE s.id = '${id}'`);

        const resend = new Resend('re_GquiNJNm_B97YdwvePPAa2aLpNn3vtpTb');
        (async function () {
            const byteArray = new Uint8Array(JSON.parse(pdfData));
      		const pdfBlob = new Blob([byteArray], { type: "application/pdf" });
            const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
            const pdfBase64 = pdfBuffer.toString('base64');
            const { data, error } = await resend.emails.send({
                from: 'Unixel Infotech <salary@hr.unixelinfotech.com>',
                to: [salaryData?.email],
                subject: `Salary Slip - ${salaryData?.month_formated}`,
                html: `<p>Please find your salary slip of <strong>${salaryData?.month_formated}</strong> in attechment bellow!</p>`,
                attachments: [
                    {
                        filename: `salary_slip_${salaryData?.month_formated}.pdf`,
                        content: pdfBase64, // Send as Base64
                    },
                ],
            });
            if (error) {
                res.json({ status: 0, message: error?.message });
            }
            else {
                res.json({ status: 1, message: "mail send success fully" });
            }
        })();
    } catch (error){
        res.status(500).json({ status:0, error: "Internal server error"});
    }
});
module.exports = router;