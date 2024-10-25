/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const session = require("express-session")
const pool = require('./database/')
const express = require("express")
const expressLayouts = require("express-ejs-layouts") 
const env = require("dotenv").config()
const app = express()
const utilities = require("./utilities/")
const static = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");
const bodyParser = require("body-parser")



/* ***********************
 * Middleware
 * ************************/
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret',  // Use fallback if secret not set
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


// Express Messages Middleware
app.use(require('connect-flash')())
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res)
  next()
})

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") // not at views root


/* ***********************
 * Routes
 *************************/
app.use(static)

// Index route
app.get("/", utilities.handleErrors(baseController.buildHome))

// Apply routes and wrap async operations with try/catch
app.get("/", async (req, res, next) => {
  try {
    await baseController.buildHome(req, res);
  } catch (err) {
    next(err);
  }
});       

// Inventory routes
app.use("/inv", inventoryRoute)

// File Not Found Route - must be last route in list
app.use(async (req, res, next) => {
  next({status: 404, message: "Sorry, we appear to have lost that page."})
})

// Account routes
app.use("/account", accountRoute)


/* ***********************
* Express Error Handler
* Place after all other middleware
*************************/
//W03: Task 03//
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav(); // Assuming you have this for navigation
  console.error(`Error at: "${req.originalUrl}": ${err.message}`);

  // Check if the error is a 404 or a 500 error
  let message;
  if (err.status == 404) {
    message = err.message;  // Display the 404 message
  } else {
    message = "Oh no! There was a crash. Maybe try a different route?";  // Default for 500 errors
  }

  res.status(err.status || 500);  // Set the correct status code
  res.render("errors/error", {
    title: err.status || "Server Error",
    message,
    nav
  });
});

 
/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 5500;  // Default to port 5500 if not set
const host = process.env.HOST || 'localhost';  // Default to 'localhost'

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
});
