const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const upload = multer();

// Get State
router.get('/state', fetchuser, upload.none(), [], async (req, res)=>{
        let status = 0;
        try{
            const state = await dbUtils.execute(`SELECT id, state_name FROM tbl_states`);
            if(!state){
                return res.status(400).json({status:0, error: "Data not found."})
            }
            else 
            {
                res.json({ status: 1, res_data: state});
            }

        } catch (error){
            res.status(500).json({ status:status, error: "Internal server error"});
        }
})

// Get City
router.get('/city', fetchuser, upload.none(), [], async (req, res)=>{
        let status = 0;
        
        try{
            let { state_id } = req.query;
            state_id = state_id ? state_id : "";
            const city = await dbUtils.execute(`SELECT id, city_name, state_id FROM tbl_cities WHERE state_id::character LIKE '%${state_id}%'`);
            if(!city){
                return res.status(400).json({status:0, error: "Data not found."})
            }
            else 
            {
                res.json({ status: 1, res_data: city});
            }

        } catch (error){
            res.status(500).json({ status:status, error: "Internal server error"});
        }
})

// Get Notification Count
router.get('/notification-cnt', fetchuser, upload.none(), [], async (req, res)=>{
        let status = 0;
        
        try{
            const { roleId, id } = req.user;
            let extraWhere = ` AND for_admin=0 AND user_id='${id}'`;
            if(roleId == process.env.NEXT_PUBLIC_MAINUTYPE || roleId == process.env.NEXT_PUBLIC_SUBUTYPE){
                extraWhere = " AND for_admin=1 ";
            }
            const notification = await dbUtils.execute(`SELECT id FROM tbl_notification WHERE is_read=0 ${extraWhere}`);
            if(!notification){
                return res.status(400).json({status:0, error: "Data not found."})
            }
            else 
            {
                res.json({ status: 1, res_data: notification.length});
            }

        } catch (error){
            res.status(500).json({ status:status, error: "Internal server error"});
        }
})

// Get Notification
router.get('/notification', fetchuser, upload.none(), [], async (req, res)=>{
        let status = 0;
        
        try{
            const { roleId, id } = req.user;
            let extraWhere = ` AND for_admin=0 AND user_id='${id}'`;
            if(roleId == process.env.NEXT_PUBLIC_MAINUTYPE || roleId == process.env.NEXT_PUBLIC_SUBUTYPE){
                extraWhere = " AND n.for_admin=1 ";
            }
            const notification = await dbUtils.execute(`SELECT n.*, u.name FROM tbl_notification n JOIN tbl_users u ON u.id = n.user_id WHERE n.is_read=0 ${extraWhere}`);
            if(!notification){
                return res.status(400).json({status:0, error: "Data not found."})
            }
            else 
            {
                res.json({ status: 1, res_data: notification});
            }

        } catch (error){
            res.status(500).json({ status:status, error: "Internal server error"});
        }
})

// Delete a notification
router.put('/read-notification', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const {id} = req.body;
    try{
        // Check Song Exist
        const user = await dbUtils.execute(`SELECT id FROM tbl_notification WHERE id = '${id}'`);
        if(user && id && id != "" && user.length > 0) {
            let notiData = [];
            notiData['is_read'] = '1';
            await dbUtils.update('tbl_notification', notiData,`id = '${id}'`);
            status=1;
        }
        else {
            {return res.status(400).json({ status:status, errors: "Not Found!" });}
        }
        
        res.json({status: status, message: "Notification Marked as read Successfully"});

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

module.exports = router;