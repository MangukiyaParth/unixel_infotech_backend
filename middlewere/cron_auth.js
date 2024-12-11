const cronAuth = (req,res, next) => {
    // Get user from JWT and add it into req object
    const token = req.header('auth-token');
    console.log(req);
    next();
}

module.exports = cronAuth;