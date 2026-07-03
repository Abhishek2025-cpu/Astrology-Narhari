module.exports = (req, res, next) => {

    if (!["admin", "subadmin"].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "Access denied"
        });
    }

    next();

};