const express = require('express');
const router = express.Router();
var fetchuser = require('../middlewere/fetchuser');
const multer  = require('multer');
const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)
    }
});
const upload = multer({ storage: multerStorage });
var dbUtils = require('../helper/index').Db;

// Create an uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Create a Account
router.post('/upload', fetchuser, upload.array('files'), [], async (req, res)=>{
    let status = 0;
    const { id } = req.user;
    try{
        req.files.forEach((value, index) => {
            let fileData = [];
            fileData['file_name'] = value.originalname;
            fileData['file_url'] = value.filename;
            fileData['file_full_url'] = value.path.replace("\\", "/").replace(/\\/g, "/").replace("public/", "");
            fileData['file_type'] = value.mimetype;
            fileData['file_data'] = JSON.stringify(value);
            fileData['user_id'] = id;
            dbUtils.insert('tbl_files',fileData);
        });
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
        const files = await dbUtils.execute(`SELECT * FROM tbl_files WHERE id = '${id}' AND user_id = '${req.user.id}'`);
        if(!files){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            // Add logic for check file use
            dbUtils.delete('tbl_files',"id='"+id+"'");
            res.json({ status: 1, message: "File deleted successfully." });
        }
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error", error_data: error});
    }
});

module.exports = router;