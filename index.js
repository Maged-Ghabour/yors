const express = require('express')
const cors = require('cors')
var session = require('express-session')
const path = require('path')
const { onlyParent } = require('./middlewares/parent')
const { onlySchool } = require('./middlewares/school')
const { onlyAuthenticatedUsers } = require('./middlewares/authenticated')


const app = express()
const port = 3000

// Set view engine to EJS
app.set('view engine', 'ejs')
// Set views directory
app.set('views', path.join(__dirname, 'views'))

// Middleware to enable CORS
app.use(cors())

// Middleware to parse JSON bodies
app.use(express.json())

// Middleware to parse URL-encoded form bodies
app.use(express.urlencoded({ extended: true }))

// Middleware for sessions
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'some_secret_key_here',
    cookie: { secure: false } // secure true when use https
}))

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')))

// protect uploads folder for only authenticated users
app.use("/uploads", onlyAuthenticatedUsers, express.static(path.join(__dirname, 'uploads')))


app.use('/', require('./routers/main'))
app.use('/auth', require('./routers/auth'))
app.use('/parent', onlyParent, require('./routers/parent'))
app.use('/school', onlySchool, require('./routers/school'))
app.use('/requests', onlyAuthenticatedUsers, require('./routers/requests'))

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
