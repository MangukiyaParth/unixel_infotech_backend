var jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.ENCR;

const fetchuser = (req,res, next) => {
    // Get user from JWT and add it into req object
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({error: "Please authenticate using valid token"})
    }

    try{
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    } catch (error){
        console.log(error);
        res.status(500).send({error: "Internal server error"})
    }
}

module.exports = fetchuser;