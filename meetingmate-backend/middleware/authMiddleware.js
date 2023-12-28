// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.tokens) {
        next();
    } else {
        res.status(401).send('You are not authenticated');
    }
};

module.exports = isAuthenticated;
