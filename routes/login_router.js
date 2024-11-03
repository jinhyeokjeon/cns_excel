const express = require("express");
const mysql = require("mysql2/promise");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const loginLayout = "../views/layouts/login.ejs"
const jwt = require("jsonwebtoken");
const db = require("../db");
const jwtSecret = process.env.JWT_SECRET;
const bcrypt = require("bcryptjs");

const checkToken = (req, res) => {
    const token = req.cookies.token;
    if (!token) return false;
    try {
        jwt.verify(token, jwtSecret);
        return true;
    } catch (err) {
        return false;
    }
}

const checkLogin = (req, res, next) => {
    if (checkToken(req, res))
        next();
    else res.redirect("/login");
}

router.get("/login", (req, res) => {
    if (checkToken(req, res)) res.redirect("/");
    else res.render("login", { loginError: "", layout: loginLayout });
})

router.post("/login", asyncHandler(async (req, res) => {
    try {
        const { userid, password } = req.body;
        const connection = await mysql.createConnection(db.config);
        const [rows, fileds] = await connection.execute("SELECT password FROM users WHERE id = ?", [userid]);
        await connection.end();
        if (rows.length == 0)
            return res.render("login", { loginError: 1, layout: loginLayout });
        const isValidPassword = await bcrypt.compare(password, rows[0].password);
        if (!isValidPassword)
            return res.render("login", { loginError: 2, layout: loginLayout });
        const token = jwt.sign({ id: userid }, jwtSecret);
        res.cookie("token", token, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
        res.redirect("/");
    } catch (err) {
        console.log("database connection error");
        res.send("database connection error");
    }
}));

router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
})

module.exports = { router, checkLogin };