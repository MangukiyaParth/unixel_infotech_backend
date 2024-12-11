const cronAuth = (req,res, next) => {
    // Get user from JWT and add it into req object
    const token = req.header('auth-token');
    console.log(req.headers.get('Authorization'));
    console.log(process.env.CRON_SECRET);
    // if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return res.status(401).end('Unauthorized');
    // }
    next();
}

module.exports = cronAuth;