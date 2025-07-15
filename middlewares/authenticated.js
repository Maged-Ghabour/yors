const { UserType } = require("../prisma/generated/prisma");

function onlyAuthenticatedUsers(req, res, next) {
    if (![UserType.PARENT, UserType.SCHOOL].includes(req.session?.user?.access)) {
        res.redirect('/auth/login')
        return;
    }
    next();
}

module.exports = { onlyAuthenticatedUsers };