const pool = require('./db');
const bcrypt = require('bcrypt');

async function seedUsers() {
    try {
        // Create the "users" table if it doesn't exist
        const createTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_users (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                usertype UUID NOT NULL,
                employeetype UUID NOT NULL,
                gender integer NULL,
                alias VARCHAR(255) NULL,
                firstname VARCHAR(255) NOT NULL,
                lastname VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                email TEXT NOT NULL UNIQUE,
                address VARCHAR(255) NULL,
                stateId UUID NULL,
                cityId UUID NULL,
                district VARCHAR(255) NULL,
                pincode VARCHAR(255) NULL,
                mobile VARCHAR(255) NULL,
                username TEXT NULL UNIQUE,
                password TEXT NULL,
                marital_status integer NULL,
                profile_pic text NULL,
                profile_pic_id uuid NULL,
                bank_name text NULL,
                account_no text NULL,
                branch_name text NULL,
                ifsc_code text NULL,
                adhar_front text NULL,
                adhar_front_id uuid NULL,
                adhar_back text NULL,
                adhar_back_id uuid NULL,
                pan_front text NULL,
                pan_front_id uuid NULL,
                pan_back text NULL,
                pan_back_id uuid NULL,
                father_name text NULL,
                mother_name text NULL,
                father_contact text NULL,
                mother_contact text NULL,
                join_date VARCHAR(50) NULL,
                birth_date VARCHAR(50) NULL,
                salary integer NULL,
                entry_uid UUID NULL,
                entry_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log(`Created "tbl_users" table`);

        const hashedPassword = await bcrypt.hash('admin', 10);
        pool.query(`INSERT INTO tbl_users (usertype, employeetype, firstname, lastname, name, email, username, password)
            VALUES ('410544b2-4001-4271-9855-fec4b6a6442a', '410544b2-4001-4271-9855-fec4b6a6442a', 'Admin', '', 'Admin', 'admin@gmail.com', 'admin@gmail.com', '${hashedPassword}');`);

        return {
            createTable
        };
    } catch (error) {
        console.error('Error seeding users:', error);
        throw error;
    }
}

async function seedUserTypes() {
    try {
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        // Create the "users" table if it doesn't exist
        const createTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_user_types (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                usertype VARCHAR(255) NOT NULL,
                isaccount BOOLEAN DEFAULT false
            );
        `);

        console.log(`Created "tbl_user_types" table`);

        pool.query(`INSERT INTO tbl_user_types (id, usertype) VALUES ('410544b2-4001-4271-9855-fec4b6a6442a', 'Admin');`);
        pool.query(`INSERT INTO tbl_user_types (id, usertype, isaccount) VALUES ('729ccecc-b8eb-4aee-b87c-4d2635637c95', 'Employee', true);`);

        return {
            createTable
        };
    } catch (error) {
        console.error('Error seeding user type:', error);
        throw error;
    }
}

async function seedEmpTypes() {
    try {
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        // Create the "users" table if it doesn't exist
        const createTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_employee_types (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                employeetype VARCHAR(255) NOT NULL
            );
        `);

        console.log(`Created "tbl_employee_types" table`);

        pool.query(`INSERT INTO tbl_employee_types (employeetype) VALUES ('Android Developer');`);
        pool.query(`INSERT INTO tbl_employee_types (employeetype) VALUES ('Designer');`);

        return {
            createTable
        };
    } catch (error) {
        console.error('Error seeding employee type:', error);
        throw error;
    }
}

async function seedEmployeeTime() {
    try {
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        // Create the "users" table if it doesn't exist
        const createTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_employee_time
            (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                user_id uuid,
                entry_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                action_type integer DEFAULT 1,
                start_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                total_time numeric NOT NULL DEFAULT 0,
                end_time timestamp without time zone,
                reason text
            );
        `);

        console.log(`Created "tbl_employee_time" table`);

        return {
            createTable
        };
    } catch (error) {
        console.error('Error seeding employee time:', error);
        throw error;
    }
}

async function seedStateCity() {
    try {
        
        // Create the "users" table if it doesn't exist
        const createTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_states (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                state_name VARCHAR(50) NOT NULL,
                state_sub_id INTEGER NOT NULL
            );
        `);

        console.log(`Created "tbl_states" table`);
        pool.query(`INSERT INTO tbl_states (state_sub_id, state_name) VALUES (1, 'ANDHRA PRADESH'),(2, 'ASSAM'),(3, 'ARUNACHAL PRADESH'),(4, 'BIHAR'),(5, 'GUJARAT'),(6, 'HARYANA'),(7, 'HIMACHAL PRADESH'),(8, 'JAMMU & KASHMIR'),(9, 'KARNATAKA'),(10, 'KERALA'),(11, 'MADHYA PRADESH'),(12, 'MAHARASHTRA'),(13, 'MANIPUR'),(14, 'MEGHALAYA'),(15, 'MIZORAM'),(16, 'NAGALAND'),(17, 'ORISSA'),(18, 'PUNJAB'),(19, 'RAJASTHAN'),(20, 'SIKKIM'),(21, 'TAMIL NADU'),(22, 'TRIPURA'),(23, 'UTTAR PRADESH'),(24, 'WEST BENGAL'),(25, 'DELHI'),(26, 'GOA'),(27, 'PONDICHERY'),(28, 'LAKSHDWEEP'),(29, 'DAMAN & DIU'),(30, 'DADRA & NAGAR'),(31, 'CHANDIGARH'),(32, 'ANDAMAN & NICOBAR'),(33, 'UTTARANCHAL'),(34, 'JHARKHAND'),(35, 'CHATTISGARH');`);

        const createSubTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_cities (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                city_name VARCHAR(50) NOT NULL,
                state_sub_id INTEGER NOT NULL,
                state_id UUID NULL
            );
        `);
        pool.query(`INSERT INTO tbl_cities (city_name, state_sub_id) VALUES ('North and Middle Andaman', 32),('South Andaman', 32),('Nicobar', 32),('Adilabad', 1),('Anantapur', 1),('Chittoor', 1),('East Godavari', 1),('Guntur', 1),('Hyderabad', 1),('Kadapa', 1),('Karimnagar', 1),('Khammam', 1),('Krishna', 1),('Kurnool', 1),('Mahbubnagar', 1),('Medak', 1),('Nalgonda', 1),('Nellore', 1),('Nizamabad', 1),('Prakasam', 1),('Rangareddi', 1),('Srikakulam', 1),('Vishakhapatnam', 1),('Vizianagaram', 1),('Warangal', 1),('West Godavari', 1),('Anjaw', 3),('Changlang', 3),('East Kameng', 3),('Lohit', 3),('Lower Subansiri', 3),('Papum Pare', 3),('Tirap', 3),('Dibang Valley', 3),('Upper Subansiri', 3),('West Kameng', 3),('Barpeta', 2),('Bongaigaon', 2),('Cachar', 2),('Darrang', 2),('Dhemaji', 2),('Dhubri', 2),('Dibrugarh', 2),('Goalpara', 2),('Golaghat', 2),('Hailakandi', 2),('Jorhat', 2),('Karbi Anglong', 2),('Karimganj', 2),('Kokrajhar', 2),('Lakhimpur', 2),('Marigaon', 2),('Nagaon', 2),('Nalbari', 2),('North Cachar Hills', 2),('Sibsagar', 2),('Sonitpur', 2),('Tinsukia', 2),('Araria', 4),('Aurangabad', 4),('Banka', 4),('Begusarai', 4),('Bhagalpur', 4),('Bhojpur', 4),('Buxar', 4),('Darbhanga', 4),('Purba Champaran', 4),('Gaya', 4),('Gopalganj', 4),('Jamui', 4),('Jehanabad', 4),('Khagaria', 4),('Kishanganj', 4),('Kaimur', 4),('Katihar', 4),('Lakhisarai', 4),('Madhubani', 4),('Munger', 4),('Madhepura', 4),('Muzaffarpur', 4),('Nalanda', 4),('Nawada', 4),('Patna', 4),('Purnia', 4),('Rohtas', 4),('Saharsa', 4),('Samastipur', 4),('Sheohar', 4),('Sheikhpura', 4),('Saran', 4),('Sitamarhi', 4),('Supaul', 4),('Siwan', 4),('Vaishali', 4),('Pashchim Champaran', 4),('Bastar', 35),('Bilaspur', 35),('Dantewada', 35),('Dhamtari', 35),('Durg', 35),('Jashpur', 35),('Janjgir-Champa', 35),('Korba', 35),('Koriya', 35),('Kanker', 35),('Kawardha', 35),('Mahasamund', 35),('Raigarh', 35),('Rajnandgaon', 35),('Raipur', 35),('Surguja', 35),('Diu', 29),('Daman', 29),('Central Delhi', 25),('East Delhi', 25),('New Delhi', 25),('North Delhi', 25),('North East Delhi', 25),('North West Delhi', 25),('South Delhi', 25),('South West Delhi', 25),('West Delhi', 25),('North Goa', 26),('South Goa', 26),('Ahmedabad', 5),('Amreli District', 5),('Anand', 5),('Banaskantha', 5),('Bharuch', 5),('Bhavnagar', 5),('Dahod', 5),('The Dangs', 5),('Gandhinagar', 5),('Jamnagar', 5),('Junagadh', 5),('Kutch', 5),('Kheda', 5),('Mehsana', 5),('Narmada', 5),('Navsari', 5),('Patan', 5),('Panchmahal', 5),('Porbandar', 5),('Rajkot', 5),('Sabarkantha', 5),('Surendranagar', 5),('Surat', 5),('Vadodara', 5),('Valsad', 5),('Ambala', 6),('Bhiwani', 6),('Faridabad', 6),('Fatehabad', 6),('Gurgaon', 6),('Hissar', 6),('Jhajjar', 6),('Jind', 6),('Karnal', 6),('Kaithal', 6),('Kurukshetra', 6),('Mahendragarh', 6),('Mewat', 6),('Panchkula', 6),('Panipat', 6),('Rewari', 6),('Rohtak', 6),('Sirsa', 6),('Sonepat', 6),('Yamuna Nagar', 6),('Palwal', 6),('Bilaspur', 7),('Chamba', 7),('Hamirpur', 7),('Kangra', 7),('Kinnaur', 7),('Kulu', 7),('Lahaul and Spiti', 7),('Mandi', 7),('Shimla', 7),('Sirmaur', 7),('Solan', 7),('Una', 7),('Anantnag', 8),('Badgam', 8),('Bandipore', 8),('Baramula', 8),('Doda', 8),('Jammu', 8),('Kargil', 8),('Kathua', 8),('Kupwara', 8),('Leh', 8),('Poonch', 8),('Pulwama', 8),('Rajauri', 8),('Srinagar', 8),('Samba', 8),('Udhampur', 8),('Bokaro', 34),('Chatra', 34),('Deoghar', 34),('Dhanbad', 34),('Dumka', 34),('Purba Singhbhum', 34),('Garhwa', 34),('Giridih', 34),('Godda', 34),('Gumla', 34),('Hazaribagh', 34),('Koderma', 34),('Lohardaga', 34),('Pakur', 34),('Palamu', 34),('Ranchi', 34),('Sahibganj', 34),('Seraikela and Kharsawan', 34),('Pashchim Singhbhum', 34),('Ramgarh', 34),('Bidar', 9),('Belgaum', 9),('Bijapur', 9),('Bagalkot', 9),('Bellary', 9),('Bangalore Rural District', 9),('Bangalore Urban District', 9),('Chamarajnagar', 9),('Chikmagalur', 9),('Chitradurga', 9),('Davanagere', 9),('Dharwad', 9),('Dakshina Kannada', 9),('Gadag', 9),('Gulbarga', 9),('Hassan', 9),('Haveri District', 9),('Kodagu', 9),('Kolar', 9),('Koppal', 9),('Mandya', 9),('Mysore', 9),('Raichur', 9),('Shimoga', 9),('Tumkur', 9),('Udupi', 9),('Uttara Kannada', 9),('Ramanagara', 9),('Chikballapur', 9),('Yadagiri', 9),('Alappuzha', 10),('Ernakulam', 10),('Idukki', 10),('Kollam', 10),('Kannur', 10),('Kasaragod', 10),('Kottayam', 10),('Kozhikode', 10),('Malappuram', 10),('Palakkad', 10),('Pathanamthitta', 10),('Thrissur', 10),('Thiruvananthapuram', 10),('Wayanad', 10),('Alirajpur', 11),('Anuppur', 11),('Ashok Nagar', 11),('Balaghat', 11),('Barwani', 11),('Betul', 11),('Bhind', 11),('Bhopal', 11),('Burhanpur', 11),('Chhatarpur', 11),('Chhindwara', 11),('Damoh', 11),('Datia', 11),('Dewas', 11),('Dhar', 11),('Dindori', 11),('Guna', 11),('Gwalior', 11),('Harda', 11),('Hoshangabad', 11),('Indore', 11),('Jabalpur', 11),('Jhabua', 11),('Katni', 11),('Khandwa', 11),('Khargone', 11),('Mandla', 11),('Mandsaur', 11),('Morena', 11),('Narsinghpur', 11),('Neemuch', 11),('Panna', 11),('Rewa', 11),('Rajgarh', 11),('Ratlam', 11),('Raisen', 11),('Sagar', 11),('Satna', 11),('Sehore', 11),('Seoni', 11),('Shahdol', 11),('Shajapur', 11),('Sheopur', 11),('Shivpuri', 11),('Sidhi', 11),('Singrauli', 11),('Tikamgarh', 11),('Ujjain', 11),('Umaria', 11),('Vidisha', 11),('Ahmednagar', 12),('Akola', 12),('Amrawati', 12),('Aurangabad', 12),('Bhandara', 12),('Beed', 12),('Buldhana', 12),('Chandrapur', 12),('Dhule', 12),('Gadchiroli', 12),('Gondiya', 12),('Hingoli', 12),('Jalgaon', 12),('Jalna', 12),('Kolhapur', 12),('Latur', 12),('Mumbai City', 12),('Mumbai suburban', 12),('Nandurbar', 12),('Nanded', 12),('Nagpur', 12),('Nashik', 12),('Osmanabad', 12),('Parbhani', 12),('Pune', 12),('Raigad', 12),('Ratnagiri', 12),('Sindhudurg', 12),('Sangli', 12),('Solapur', 12),('Satara', 12),('Thane', 12),('Wardha', 12),('Washim', 12),('Yavatmal', 12),('Bishnupur', 13),('Churachandpur', 13),('Chandel', 13),('Imphal East', 13),('Senapati', 13),('Tamenglong', 13),('Thoubal', 13),('Ukhrul', 13),('Imphal West', 13),('East Garo Hills', 14),('East Khasi Hills', 14),('Jaintia Hills', 14),('Ri-Bhoi', 14),('South Garo Hills', 14),('West Garo Hills', 14),('West Khasi Hills', 14),('Aizawl', 15),('Champhai', 15),('Kolasib', 15),('Lawngtlai', 15),('Lunglei', 15),('Mamit', 15),('Saiha', 15),('Serchhip', 15),('Dimapur', 16),('Kohima', 16),('Mokokchung', 16),('Mon', 16),('Phek', 16),('Tuensang', 16),('Wokha', 16),('Zunheboto', 16),('Angul', 17),('Boudh', 17),('Bhadrak', 17),('Bolangir', 17),('Bargarh', 17),('Baleswar', 17),('Cuttack', 17),('Debagarh', 17),('Dhenkanal', 17),('Ganjam', 17),('Gajapati', 17),('Jharsuguda', 17),('Jajapur', 17),('Jagatsinghpur', 17),('Khordha', 17),('Kendujhar', 17),('Kalahandi', 17),('Kandhamal', 17),('Koraput', 17),('Kendrapara', 17),('Malkangiri', 17),('Mayurbhanj', 17),('Nabarangpur', 17),('Nuapada', 17),('Nayagarh', 17),('Puri', 17),('Rayagada', 17),('Sambalpur', 17),('Subarnapur', 17),('Sundargarh', 17),('Karaikal', 27),('Mahe', 27),('Puducherry', 27),('Yanam', 27),('Amritsar', 18),('Bathinda', 18),('Firozpur', 18),('Faridkot', 18),('Fatehgarh Sahib', 18),('Gurdaspur', 18),('Hoshiarpur', 18),('Jalandhar', 18),('Kapurthala', 18),('Ludhiana', 18),('Mansa', 18),('Moga', 18),('Mukatsar', 18),('Nawan Shehar', 18),('Patiala', 18),('Rupnagar', 18),('Sangrur', 18),('Ajmer', 19),('Alwar', 19),('Bikaner', 19),('Barmer', 19),('Banswara', 19),('Bharatpur', 19),('Baran', 19),('Bundi', 19),('Bhilwara', 19),('Churu', 19),('Chittorgarh', 19),('Dausa', 19),('Dholpur', 19),('Dungapur', 19),('Ganganagar', 19),('Hanumangarh', 19),('Juhnjhunun', 19),('Jalore', 19),('Jodhpur', 19),('Jaipur', 19),('Jaisalmer', 19),('Jhalawar', 19),('Karauli', 19),('Kota', 19),('Nagaur', 19),('Pali', 19),('Pratapgarh', 19),('Rajsamand', 19),('Sikar', 19),('Sawai Madhopur', 19),('Sirohi', 19),('Tonk', 19),('Udaipur', 19),('East Sikkim', 20),('North Sikkim', 20),('South Sikkim', 20),('West Sikkim', 20),('Ariyalur', 21),('Chennai', 21),('Coimbatore', 21),('Cuddalore', 21),('Dharmapuri', 21),('Dindigul', 21),('Erode', 21),('Kanchipuram', 21),('Kanyakumari', 21),('Karur', 21),('Madurai', 21),('Nagapattinam', 21),('The Nilgiris', 21),('Namakkal', 21),('Perambalur', 21),('Pudukkottai', 21),('Ramanathapuram', 21),('Salem', 21),('Sivagangai', 21),('Tiruppur', 21),('Tiruchirappalli', 21),('Theni', 21),('Tirunelveli', 21),('Thanjavur', 21),('Thoothukudi', 21),('Thiruvallur', 21),('Thiruvarur', 21),('Tiruvannamalai', 21),('Vellore', 21),('Villupuram', 21),('Dhalai', 22),('North Tripura', 22),('South Tripura', 22),('West Tripura', 22),('Almora', 33),('Bageshwar', 33),('Chamoli', 33),('Champawat', 33),('Dehradun', 33),('Haridwar', 33),('Nainital', 33),('Pauri Garhwal', 33),('Pithoragharh', 33),('Rudraprayag', 33),('Tehri Garhwal', 33),('Udham Singh Nagar', 33),('Uttarkashi', 33),('Agra', 23),('Allahabad', 23),('Aligarh', 23),('Ambedkar Nagar', 23),('Auraiya', 23),('Azamgarh', 23),('Barabanki', 23),('Badaun', 23),('Bagpat', 23),('Bahraich', 23),('Bijnor', 23),('Ballia', 23),('Banda', 23),('Balrampur', 23),('Bareilly', 23),('Basti', 23),('Bulandshahr', 23),('Chandauli', 23),('Chitrakoot', 23),('Deoria', 23),('Etah', 23),('Kanshiram Nagar', 23),('Etawah', 23),('Firozabad', 23),('Farrukhabad', 23),('Fatehpur', 23),('Faizabad', 23),('Gautam Buddha Nagar', 23),('Gonda', 23),('Ghazipur', 23),('Gorkakhpur', 23),('Ghaziabad', 23),('Hamirpur', 23),('Hardoi', 23),('Mahamaya Nagar', 23),('Jhansi', 23),('Jalaun', 23),('Jyotiba Phule Nagar', 23),('Jaunpur District', 23),('Kanpur Dehat', 23),('Kannauj', 23),('Kanpur Nagar', 23),('Kaushambi', 23),('Kushinagar', 23),('Lalitpur', 23),('Lakhimpur Kheri', 23),('Lucknow', 23),('Mau', 23),('Meerut', 23),('Maharajganj', 23),('Mahoba', 23),('Mirzapur', 23),('Moradabad', 23),('Mainpuri', 23),('Mathura', 23),('Muzaffarnagar', 23),('Pilibhit', 23),('Pratapgarh', 23),('Rampur', 23),('Rae Bareli', 23),('Saharanpur', 23),('Sitapur', 23),('Shahjahanpur', 23),('Sant Kabir Nagar', 23),('Siddharthnagar', 23),('Sonbhadra', 23),('Sant Ravidas Nagar', 23),('Sultanpur', 23),('Shravasti', 23),('Unnao', 23),('Varanasi', 23),('Birbhum', 24),('Bankura', 24),('Bardhaman', 24),('Darjeeling', 24),('Dakshin Dinajpur', 24),('Hooghly', 24),('Howrah', 24),('Jalpaiguri', 24),('Cooch Behar', 24),('Kolkata', 24),('Malda', 24),('Midnapore', 24),('Murshidabad', 24),('Nadia', 24),('North 24 Parganas', 24),('South 24 Parganas', 24),('Purulia', 24),('Uttar Dinajpur', 24);`);
        pool.query(`update tbl_cities citi set state_id = states.id FROM tbl_states states where states.state_sub_id = citi.state_sub_id ;`);
        pool.query(`ALTER TABLE IF EXISTS tbl_cities
                        ADD CONSTRAINT state_id FOREIGN KEY (state_id)
                        REFERENCES tbl_states (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE NO ACTION
                        NOT VALID;`);

        return {
            createTable
        };
    } catch (error) {
        console.error('Error seeding state:', error);
        throw error;
    }
}

async function seedLeave() {
    try {
        // Create the "users" table if it doesn't exist
        const createTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_leaves
            (
                id uuid DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                user_id uuid,
                leave_date character varying(50),
                leave_type character varying(50),
                description text,
                start_date character varying(50),
                end_date character varying(50),
                entry_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                leave_status integer DEFAULT 0,
                status_description text,
                date_data text
            );
        `);

        console.log(`Created "tbl_leaves" table`);

        const createSubTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_leave_dates
            (
                id uuid DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                user_id uuid,
                leave_id uuid,
                leave_date character varying(50),
                leave_time character varying(50)
            );
        `);

        return {
            createTable
        };
    } catch (error) {
        console.error('Error seeding Leave:', error);
        throw error;
    }
}

async function seedFiles() {
    try {
        // Create the "users" table if it doesn't exist
        const createTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_files
            (
                id uuid DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                file_name text,
                file_url text,
                file_full_url text,
                file_type text,
                file_data text,
                user_id uuid,
                entry_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log(`Created "tbl_files" table`);
        return {
            createTable
        };
    } catch (error) {
        console.error('Error seeding Files:', error);
        throw error;
    }
}

async function seedSettings() {
    try {
        // Create the "users" table if it doesn't exist
        const createTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_settings
            (
                id uuid DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                late_time VARCHAR(25),
                free_leave_limit integer,
                notice text,
                full_day_time integer,
                half_day_time integer,
                end_time VARCHAR(25),
                entry_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log(`Created "tbl_settings" table`);
        return {
            createTable
        };
    } catch (error) {
        console.error('Error seeding Settings:', error);
        throw error;
    }
}

async function seedHoliday() {
    try {
        // Create the "users" table if it doesn't exist
        const createTable = await pool.query(`
            CREATE TABLE IF NOT EXISTS tbl_holiday
            (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY UNIQUE,
                holiday_year VARCHAR(50),
                holiday_date VARCHAR(50),
                holiday_title VARCHAR(100),
                is_weekend integer DEFAULT 1,
                user_id uuid,
                entry_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log(`Created "tbl_holiday" table`);
        return {
            createTable
        };
    } catch (error) {
        console.error('Error seeding Holiday:', error);
        throw error;
    }
}

async function main() {
    await client.connect();
    client.on('error', (err) => {
        console.error('something bad has happened!', err.stack)
    })
  
    await seedUserTypes();
    await seedEmpTypes();
    await seedUsers();
    await seedStateCity();
    await seedEmployeeTime();
    await seedLeave();
    await seedFiles();
    await seedSettings();
    await seedHoliday();
  
    return;
    // await client.end();
}

main().catch((err) => {
    console.error(
        'An error occurred while attempting to seed the database:',
        err,
    );
});
