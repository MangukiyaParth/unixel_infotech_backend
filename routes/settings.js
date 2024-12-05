const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const multer = require('multer');
const upload = multer();

// Get User by Id
router.get('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    try{
        const settings = await dbUtils.execute_single(`SELECT * FROM tbl_settings LIMIT 1`);
        if(!settings){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            res.json({ status: 1, res_data: settings});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
})

// Update setting 
router.put('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const { late_time, notice, paid_leave_limit, full_day_time, half_day_time } = req.body;
    try{
        dbUtils.execute('TRUNCATE tbl_settings');
        let settingData = [];
        settingData['late_time'] = late_time;
        settingData['notice'] = notice;
        settingData['paid_leave_limit'] = paid_leave_limit;
        settingData['full_day_time'] = full_day_time;
        settingData['half_day_time'] = half_day_time;
        dbUtils.insert('tbl_settings',settingData);
       
        status = 1;
        res.json({status:status, message: "Setting updated successfully."});
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

module.exports = router;