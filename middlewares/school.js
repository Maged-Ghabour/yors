const { UserType } = require("../prisma/generated/prisma");

function onlySchool(req, res, next) {
    if (req.session.user?.userType != UserType.SCHOOL || req.session?.user.access != UserType.SCHOOL) {
        res.redirect('/auth/login')
        return;
    }
    next();
}

module.exports = { onlySchool };