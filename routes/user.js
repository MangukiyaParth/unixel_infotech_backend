const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middlewere/fetchuser');
var dbUtils = require('../helper/index').Db;
const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer();

const JWT_SECRET = process.env.ENCR;

// Create a Account
router.post('/createaccount', upload.none(), [], async (req, res)=>{
    let status = 0; 
    const {accTypeId, empTypeId, alias, first_name, last_name, address, stateId, cityId, district, pincode, mobile, email, password ,gender, join_date, birth_date, salary} = req.body;
    // console.log(req.body);
    try{
        const user = await dbUtils.execute(`SELECT id FROM tbl_users WHERE email LIKE '%${email}%'`);
        if(user && email && email != "" && user.length > 0){
            return res.status(400).json({ status:status, error: "sorry a user with this email alredy exists"});
        }
        else {
            const hashedPassword = await bcrypt.hash(password, 10);
            let userData = [];
            userData['usertype'] = accTypeId;
            userData['employeetype'] = empTypeId;
            userData['alias'] = alias;
            userData['firstname'] = first_name;
            userData['lastname'] = last_name;
            userData['name'] = first_name + " " + last_name;
            userData['address'] = address;
            userData['stateId'] = stateId;
            userData['cityId'] = cityId;
            userData['district'] = district;
            userData['pincode'] = pincode;
            userData['mobile'] = mobile;
            userData['email'] = email;
            userData['username'] = email;
            userData['password'] = hashedPassword;
            userData['gender'] = gender;
            userData['join_date'] = join_date;
            userData['birth_date'] = birth_date;
            userData['salary'] = salary;
            dbUtils.insert('tbl_users',userData);
        }
        status = 1;
        res.json({status:status, message: "User added successfully."});
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error", error_data: error});
    }
});

// Update a User 
router.put('/account', fetchuser, upload.none(), [], async (req, res)=>{
        let status = 0;
        const {id, accTypeId, empTypeId, alias, first_name, last_name, address, stateId, cityId, district, pincode, mobile, email, gender, join_date, birth_date, salary} = req.body;
        
        try{
            const user = await dbUtils.execute(`SELECT id FROM tbl_users WHERE email LIKE '%${email}%'`);
            if(user && email && email != "" && user.length > 0){
                let userData = [];
                userData['usertype'] = accTypeId;
                userData['employeetype'] = empTypeId;
                userData['alias'] = alias;
                userData['firstname'] = first_name;
                userData['lastname'] = last_name;
                userData['name'] = first_name + " " + last_name;
                userData['address'] = address;
                userData['stateId'] = stateId;
                userData['cityId'] = cityId;
                userData['district'] = district;
                userData['pincode'] = pincode;
                userData['mobile'] = mobile;
                userData['email'] = email;
                userData['username'] = email;
                userData['gender'] = gender;
                userData['join_date'] = join_date;
                userData['birth_date'] = birth_date;
                userData['salary'] = salary;
                dbUtils.update('tbl_users',userData, "id='"+id+"'");
            }
            else {
                return res.status(400).json({ status:status, error: "sorry a user not found!"});
            }
            status = 1;
            res.json({status:status, message: "User updated successfully."});
        } catch (error){
            res.status(500).json({ status:status, error: "Internal server error"});
        }
});

// Delete an Account
router.delete('/account', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const {id} = req.body;
    try{
        // Check Song Exist
        const user = await dbUtils.execute(`SELECT id FROM tbl_users WHERE id = '${id}'`);
        if(user && id && id != "" && user.length > 0) {
            await dbUtils.delete('tbl_users',`id = '${id}'`);
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

// Get Users
router.get('/accounts', fetchuser, upload.none(), [], async (req, res)=>{
	let { search, page, page_size, sortField, sortDirection } = req.query;
	const ITEMS_PER_PAGE = page_size;
    page = parseInt(page);
    const offset = (page - 1) * ITEMS_PER_PAGE;
    let status = 0;
    let orderBy = "u.entry_date DESC";
    if(sortField != ""){
        orderBy = sortField + " " + ((sortDirection != "") ? sortDirection : 'asc');
    }
    try{
        const account = await dbUtils.execute(`SELECT
			u.id,
            ut.usertype,
            et.employeetype,
			u.alias,
			u.name,
			u.firstname,
			u.lastname,
			u.email,
			u.mobile,
			u.address,
			u.stateId,
			u.cityId,
			u.district,
			u.pincode,
			s.state_name,
			c.city_name,
            u.gender,
            u.join_date,
            u.birth_date,
            u.salary,
            u.profile_pic,
            u.bank_name,
            u.account_no,
            u.branch_name,
            u.ifsc_code,
            u.adhar_front,
            u.adhar_back,
            u.pan_front,
            u.pan_back,
            u.father_name,
            u.mother_name,
            u.father_contact,
            u.mother_contact,
            u.marital_status
		FROM tbl_users u
		LEFT JOIN tbl_states s ON u.stateId = s.id
		LEFT JOIN tbl_cities c ON u.cityId = c.id
		LEFT JOIN tbl_employee_types et ON u.employeetype = et.id
        JOIN tbl_user_types ut ON u.usertype = ut.id
		WHERE ut.isaccount = true AND 
			(
                ut.usertype LIKE '${`%${search}%`}' OR
                et.employeetype LIKE '${`%${search}%`}' OR
                u.alias LIKE '${`%${search}%`}' OR
                u.name LIKE '${`%${search}%`}' OR
                u.email LIKE '${`%${search}%`}' OR
                u.mobile LIKE '${`%${search}%`}' OR
                u.address LIKE '${`%${search}%`}' OR
                u.district LIKE '${`%${search}%`}' OR
                u.pincode LIKE '${`%${search}%`}' OR
                s.state_name LIKE '${`%${search}%`}' OR
                c.city_name LIKE '${`%${search}%`}' 
			)
		ORDER BY ${orderBy}
		LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}`);

        if(!account){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            const account_total = await dbUtils.execute_single(`SELECT COUNT(u.id)
            FROM tbl_users u
            LEFT JOIN tbl_states s ON u.stateId = s.id
            LEFT JOIN tbl_cities c ON u.cityId = c.id
            LEFT JOIN tbl_employee_types et ON u.employeetype = et.id
            JOIN tbl_user_types ut ON u.usertype = ut.id
            WHERE ut.isaccount = true AND 
                (
                    ut.usertype LIKE '${`%${search}%`}' OR
                    et.employeetype LIKE '${`%${search}%`}' OR
                    u.alias LIKE '${`%${search}%`}' OR
                    u.name LIKE '${`%${search}%`}' OR
                    u.email LIKE '${`%${search}%`}' OR
                    u.mobile LIKE '${`%${search}%`}' OR
                    u.address LIKE '${`%${search}%`}' OR
                    u.district LIKE '${`%${search}%`}' OR
                    u.pincode LIKE '${`%${search}%`}' OR
                    s.state_name LIKE '${`%${search}%`}' OR
                    c.city_name LIKE '${`%${search}%`}' 
                )`);
            res.json({ status: 1, res_data: account, total: account_total['count']});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
})

// Get User by Id
router.get('/accountbyid', fetchuser, upload.none(), [], async (req, res)=>{
	let { id } = req.query;
    let status = 0;
    try{
        const account = await dbUtils.execute_single(`SELECT
			u.id,
            ut.usertype,
            u.usertype AS usertypeid,
            et.employeetype,
            u.employeetype AS employeetypeid,
			u.alias,
			u.name,
			u.firstname,
			u.lastname,
			u.email,
			u.mobile,
			u.address,
			u.stateId,
			u.cityId,
			u.district,
			u.pincode,
			s.state_name,
			c.city_name,
            u.profile_pic,
            u.address,
            u.marital_status,
            u.bank_name,
            u.account_no,
            u.branch_name,
            u.ifsc_code,
            u.adhar_front,
            u.adhar_back,
            u.pan_front,
            u.pan_back,
            u.father_name,
            u.mother_name,
            u.father_contact,
            u.mother_contact,
            u.gender,
            u.join_date,
            u.birth_date,
            u.salary
		FROM tbl_users u
		LEFT JOIN tbl_states s ON u.stateId = s.id
		LEFT JOIN tbl_cities c ON u.cityId = c.id
		LEFT JOIN tbl_employee_types et ON u.employeetype = et.id
        JOIN tbl_user_types ut ON u.usertype = ut.id
		WHERE u.id = '${id}'`);

        if(!account){
            return res.status(400).json({status:0, error: "Data not found."})
        }
        else 
        {
            res.json({ status: 1, res_data: account});
        }

    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
})

// Get User Type
router.get('/usertype', fetchuser, upload.none(), [], async (req, res)=>{
	let status = 0;
	try{
		const usertype = await dbUtils.execute(`SELECT id, usertype FROM tbl_user_types`);
		if(!usertype){
			return res.status(400).json({status:0, error: "User Type not found."})
		}
		else 
		{
			res.json({ status: 1, res_data: usertype});
		}

	} catch (error){
		res.status(500).json({ status:status, error: "Internal server error"});
	}
})

// Get Employee Type
router.get('/employeetype', fetchuser, upload.none(), [], async (req, res)=>{
	let status = 0;
	try{
		const employeetype = await dbUtils.execute(`SELECT id, employeetype FROM tbl_employee_types`);
		if(!employeetype){
			return res.status(400).json({status:0, error: "Employee Type not found."})
		}
		else 
		{
			res.json({ status: 1, res_data: employeetype});
		}

	} catch (error){
		res.status(500).json({ status:status, error: "Internal server error"});
	}
})

// Get loggedin user detail 
router.post('/login', upload.none(), [body('email', 'Enter a email').exists(),body('password', 'Enter a password').exists()], async (req, res)=>{

    // Validation error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 0, errors: errors.array() });
    }
    try{
        const { email, password } = req.body;
        // const hashedPassword = await bcrypt.hash(password, 10);
        const user = await dbUtils.execute_single(`SELECT
			u.id,
            ut.usertype,
            u.usertype AS usertypeid,
            et.employeetype,
            u.employeetype AS employeetypeid,
			u.name,
			u.firstname,
			u.lastname,
			u.email,
			u.mobile,
            u.password,
            u.profile_pic
		FROM tbl_users u
		LEFT JOIN tbl_employee_types et ON u.employeetype = et.id
        JOIN tbl_user_types ut ON u.usertype = ut.id 
        WHERE u.email = '${email}'`);
        if(!user){
            return res.status(400).json({status:0, error: "User not found."})
        }
        else 
        {   
            const passwordsMatch = await bcrypt.compare(password, user.password);
            if(!passwordsMatch){
                res.status(400).json({ status:0, error: "Invalid Password"});
            }
            else{
                const data = {
                    user: {
                        id:user.id,
                        role:user.usertype,
                        roleId:user.usertypeid,
                        user_name:user.name
                    },
                    provider: user.provider_name
                };
                const authtoken = jwt.sign(data, JWT_SECRET);
                delete user.password;
                user.authtoken = authtoken;
                const res_data = {
                    user: user,
                    email: user.email,
                    authtoken: authtoken
                }
                res.json({ status: 1, res_data: res_data});
            }
        }
        // res.json({error: password, passwordsMatch: passwordsMatch});
    } catch (error){
        res.status(500).json({ status:0, error: "Internal server error", error_data: error});
    }
});

// Update a Profile 
router.put('/profile', fetchuser, upload.none(), [], async (req, res)=>{
    let status = 0;
    const { profile_pic, address, marital_status, bank_name, account_no, branch_name, ifsc_code, adhar_front, adhar_back, pan_front, pan_back, father_name, mother_name, father_contact, mother_contact} = req.body;
    try{
        const user = await dbUtils.execute(`SELECT id FROM tbl_users WHERE id = '${req.user.id}'`);
        if(user && user.length > 0){
            let userData = [];
            const profileId = JSON.parse(profile_pic).map(a => a.id);
            const adharFrontId = JSON.parse(adhar_front).map(a => a.id);
            const adharBackId = JSON.parse(adhar_back).map(a => a.id);
            const panFrontId = JSON.parse(pan_front).map(a => a.id);
            const panBackId = JSON.parse(pan_back).map(a => a.id);
            userData['profile_pic'] = profile_pic;
            userData['profile_pic_id'] = profileId[0];
            userData['address'] = address;
            userData['marital_status'] = marital_status;
            userData['bank_name'] = bank_name;
            userData['account_no'] = account_no;
            userData['branch_name'] = branch_name;
            userData['ifsc_code'] = ifsc_code;
            userData['adhar_front'] = adhar_front;
            userData['adhar_front_id'] = adharFrontId[0];
            userData['adhar_back'] = adhar_back;
            userData['adhar_back_id'] = adharBackId[0];
            userData['pan_front'] = pan_front;
            userData['pan_front_id'] = panFrontId[0];
            userData['pan_back'] = pan_back;
            userData['pan_back_id'] = panBackId[0];
            userData['father_name'] = father_name;
            userData['mother_name'] = mother_name;
            userData['father_contact'] = father_contact;
            userData['mother_contact'] = mother_contact;
            dbUtils.update('tbl_users',userData, "id='"+req.user.id+"'");
        }
        else {
            return res.status(400).json({ status:status, error: "sorry a user not found!"});
        }
        status = 1;
        res.json({status:status, message: "User updated successfully."});
    } catch (error){
        res.status(500).json({ status:status, error: "Internal server error"});
    }
});

// Get User Type
router.get('/employee', fetchuser, upload.none(), [], async (req, res)=>{
	let status = 0;
    const { roleId, id } = req.user;
	try{
        let extraWhere = "";
        if(roleId == process.env.NEXT_PUBLIC_EMPUTYPE){
            extraWhere = ` AND u.id = '${id}' `;
        }
		const users = await dbUtils.execute(`SELECT
                u.id,
                et.employeetype,
                u.name
            FROM tbl_users u
            LEFT JOIN tbl_employee_types et ON u.employeetype = et.id
            WHERE u.usertype = '${process.env.NEXT_PUBLIC_EMPUTYPE}' ${extraWhere}`);
        if(!users){
            return res.status(400).json({status:0, error: "User not found."})
        }
        else 
        {
            res.json({ status: 1, res_data: users});
        }

	} catch (error){
		res.status(500).json({ status:status, error: "Internal server error"});
	}
})

module.exports = router;