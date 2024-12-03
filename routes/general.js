const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const { body, validationResult } = require('express-validator');

// Get State
router.get('/state', fetchuser, [], async (req, res)=>{
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
router.get('/city', fetchuser, [], async (req, res)=>{
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



module.exports = router;