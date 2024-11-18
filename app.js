require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connection = require("./db");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.static("uploads"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use("/", require("./routes/login_router").router);
app.use("/", require("./routes/router"));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})