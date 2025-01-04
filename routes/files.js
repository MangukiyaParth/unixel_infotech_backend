const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
const axios = require('axios');
const multer  = require('multer');
const FormData = require('form-data');
// const multerStorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/')
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + "-" + file.originalname)
//     }
// });
// const upload = multer({ storage: multerStorage });
var dbUtils = require('../helper/index').Db;

// Create an uploads directory if it doesn't exist
// const fs = require('fs');
// if (!fs.existsSync('uploads')) {
//     fs.mkdirSync('uploads');
// }

const upload = multer({ storage: multer.memoryStorage() }); // Memory storage for Vercel

// Create a Account
router.post('/upload', fetchuser, upload.array('files'), [], async (req, res)=>{
    let status = 0;
    const { id } = req.user;
    try{
        const form = new FormData();
        
        // Append each file to the FormData instance
        req.files.forEach((file) => {
            form.append('files[]', file.buffer, file.originalname);
        });
        
        // Send the files to the PHP server
        const api_response = await axios.post(process.env.NEXT_PUBLIC_FILE_URL+'upload.php', form, {
            headers: form.getHeaders(),
        });
        const { file_data, file_status } = api_response.data;
        const newFiles = [];
        if(file_status == 1){
            req.files.forEach(async (value, index) => {
                let fileData = [];
                fileData['file_name'] = value.originalname;
                fileData['file_url'] = file_data[index].file;
                fileData['file_full_url'] = file_data[index].path;
                fileData['file_type'] = value.mimetype;
                // fileData['file_data'] = JSON.stringify(value);
                fileData['user_id'] = id;
                newFiles.push(fileData);
                // await dbUtils.insert('tbl_files',fileData, 'id');
            });
        }

        if (newFiles.length > 0) {
            await dbUtils.insertBatch('tbl_files', newFiles);
        }
        status = 1;
        res.json({status:status, message: "File(s) added successfully."});
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error", error_data: error});
    }
});
// Get Files
router.get('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const { id } = req.user;
    try{
        const files = await dbUtils.execute(`SELECT * FROM tbl_files WHERE user_id = '${id}'`);
        if(!files){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            res.json({ status: 1, res_data: files });
        }
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error", error_data: error});
    }
});

// Update File Name
router.put('/update-file-name', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const { fileName, file_id } = req.body;
    try{
        const files = await dbUtils.execute_single(`SELECT * FROM tbl_files WHERE id = '${file_id}'`);
        if(!files){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            let file_split = files.file_name.split('.');
            let ext = file_split[file_split.length - 1];
            let fileData = [];
            fileData['file_name'] = fileName+"."+ext;
            dbUtils.update('tbl_files',fileData,"id='"+file_id+"'");
            res.json({ status: 1, message: "File name updated successfully." });
        }
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error", error_data: error});
    }
});

// Delete File
router.delete('/', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const { id } = req.body;
    try{
        const files = await dbUtils.execute_single(`SELECT * FROM tbl_files WHERE id = '${id}' AND user_id = '${req.user.id}'`);
        if(!files){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            const check_file_use = await dbUtils.execute_single(`SELECT id FROM tbl_users WHERE profile_pic_id = '${id}' OR adhar_front_id = '${id}' OR adhar_back_id = '${id}' OR pan_front_id = '${id}' OR  pan_back_id = '${id}' LIMIT 1`);
            if(check_file_use){
                res.json({ status: 0, message: "File is in use." });
            }
            else{
                // Add logic for check file use
                const form = new FormData();
                form.append('url', files.file_url);
                
                // Send the files to the PHP server
                await axios.post(process.env.NEXT_PUBLIC_FILE_URL+'delete.php', form, {
                    headers: form.getHeaders(),
                });
                dbUtils.delete('tbl_files',"id='"+id+"'");
                res.json({ status: 1, message: "File deleted successfully." });
            }
        }
    } catch (error){
        res.status(500).json({ status:status, message: "Internal server error", error_data: error});
    }
});

module.exports = router;