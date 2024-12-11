const cronAuth = (req,res, next) => {
    // Get user from JWT and add it into req object
    const token = req.header();
    console.log(token);
    next();
}

module.exports = cronAuth;