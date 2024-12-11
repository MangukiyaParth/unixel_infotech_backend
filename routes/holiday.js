const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const multer = require('multer');
const upload = multer();

// Get User by Id
router.get('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    let { year, isWeekOff } = req.query;
    try{
        const holidays = await dbUtils.execute(`SELECT * FROM tbl_holiday WHERE holiday_year = '${year}' AND is_weekend = '${isWeekOff}'`);
        if(!holidays){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            res.json({ status: 1, res_data: holidays});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
})

// Add Holiday 
router.post('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const { year, date, name, isWeekOff } = req.body;
    try{
        const holidayData = await dbUtils.execute_single(`SELECT id FROM tbl_holiday WHERE holiday_year = '${year}' AND holiday_date = '${date}' AND is_weekend = '${isWeekOff}'`);
        if(!holidayData){
            let holidayData = [];
            holidayData['holiday_year'] = year;
            holidayData['holiday_date'] = date;
            holidayData['holiday_title'] = name;
            holidayData['is_weekend'] = isWeekOff;
            holidayData['user_id'] = req.user.id;
            await dbUtils.insert('tbl_holiday',holidayData);
        }
        else{
            return res.status(400).json({status:0, error: "Data already exist."})
        }
        
        status = 1;
        res.json({status:status, message: "holiday added successfully."});
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Delete a holiday
router.delete('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const {id} = req.body;
    console.log(id);
    try{
        // Check Song Exist
        const user = await dbUtils.execute(`SELECT id FROM tbl_holiday WHERE id = '${id}'`);
        if(user && id && id != "" && user.length > 0) {
            await dbUtils.delete('tbl_holiday',`id = '${id}'`);
            status=1;
        }
        else {
            {return res.status(400).json({ status:status, errors: "Not Found!" });}
        }
        
        res.json({status: status, message: "Holiday Deleted Successfully"});

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

module.exports = router;