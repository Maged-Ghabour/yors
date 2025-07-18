const { PrismaClient } = require('../prisma/generated/prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient().$extends({
    query: {
        user: {
            $allOperations({ operation, args, query }) {
                if (['create', 'update'].includes(operation) && args.data['password']) {
                    args.data['password'] = bcrypt.hashSync(args.data['password'], 10)
                }
                return query(args)
            }
        }
    }
})

module.exports = prisma;
