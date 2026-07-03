module.exports = (req, res, next) => {

    if (req.user.role !== "partner") {
        return res.status(403).json({
            success: false,
            message: "Access denied"
        });
    }

    next();

};