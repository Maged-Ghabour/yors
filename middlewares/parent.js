const { UserType } = require("../prisma/generated/prisma");

function onlyParent(req, res, next) {
    if (req.session.user?.userType != UserType.PARENT || req.session?.user.access != UserType.PARENT) {
        res.redirect('/auth/login')
        return;
    }
    next();
}

module.exports = { onlyParent };