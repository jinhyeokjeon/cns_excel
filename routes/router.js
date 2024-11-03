const express = require("express");
const mysql = require("mysql2/promise");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const mainLayout = "../views/layouts/main.ejs";
const checkLogin = require("./login_router").checkLogin;
const db = require("../db");
const fctrl = require("../fctrl");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            const id = req.params.id;
            done(null, `./uploads/${id}/`);
        },
        filename(req, file, done) {
            // 파일 이름을 UTF-8로 변환
            const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const ext = path.extname(fileName);
            done(null, path.basename(fileName, ext) + ext);
        }
    }),
    limits: { filzeSize: 100 * 1024 * 1024 },
});

router.get("/", checkLogin, asyncHandler(async (req, res) => {
    const colNames = await db.getColNames();
    const indices = await db.getIndices();
    const rowsArr = await db.getRowArrs();
    const ids = await db.getIds();
    const filePaths = fctrl.getAllFilePathByIds(ids);
    const fileNames = fctrl.getAllFileNameByIds(ids);
    res.render("index", { colNames, indices, rowsArr, ids, filePaths, fileNames, layout: mainLayout });
}));

router.get("/edit/:id", checkLogin, asyncHandler(async (req, res) => {
    const colNames = await db.getColNames();
    const rowArr = await db.getRowArr(req.params.id);
    const indices = await db.getIndices();
    const fileName = fctrl.getAllFileNameById(req.params.id);
    res.render("edit", { colNames, rowArr, indices, fileName, layout: mainLayout });
}));

router.put("/edit/:id", checkLogin, upload.array("files"), asyncHandler(async (req, res) => {
    const _indices = await db.get_Indices();
    str = "UPDATE bidding SET ";
    for (let i = 0; i < _indices.length; ++i) {
        str += `${_indices[i]} = ?`;
        if (i < _indices.length - 1) str += ", ";
    }
    str += " WHERE id = ? ";
    let value = Object.values(req.body);
    value.push(req.params.id);
    const connection = await mysql.createConnection(db.config);
    await connection.execute(str, value);
    await connection.end();
    res.redirect(`/edit/${req.params.id}`);
}));

router.get("/delete/:id", checkLogin, asyncHandler(async (req, res) => {
    const connection = await mysql.createConnection(db.config);
    await connection.execute("DELETE FROM bidding WHERE ID = ?", [req.params.id]);
    const [maxId, _] = await connection.execute("SELECT MAX(id) as maxId from bidding");
    if (maxId[0].maxId === null) await connection.execute("ALTER TABLE bidding AUTO_INCREMENT = 1");
    else await connection.execute(`ALTER TABLE bidding AUTO_INCREMENT = ${maxId[0].maxId + 1}`);
    await connection.end();
    fs.rmSync(`./uploads/${req.params.id}`, { recursive: true });
    res.redirect("/");
}));

router.get("/add", checkLogin, asyncHandler(async (req, res) => {
    const indices = await db.getIndices();
    const colNames = await db.getColNames();
    res.render("add", { indices, colNames, layout: mainLayout });
}));

const addPath = asyncHandler(async (req, res, next) => {
    connection = await mysql.createConnection(db.config);
    const [maxId, _] = await connection.execute("SELECT MAX(id) as maxId from bidding");
    await connection.end();
    const id = (maxId[0].maxId == null ? 1 : (maxId[0].maxId + 1));
    fs.mkdirSync(`./uploads/${id}/`);
    req.params.id = id;
    next();
});

router.post("/add", checkLogin, addPath, upload.array("files"), asyncHandler(async (req, res) => {
    str = "INSERT INTO bidding VALUES (NULL";
    let value = Object.values(req.body);
    for (let i = 0; i < value.length; ++i)
        str += ", ?"
    str += ") ";
    const connection = await mysql.createConnection(db.config);
    await connection.execute(str, value);
    await connection.end();
    res.redirect("/");
}));

router.get("/editcol", checkLogin, asyncHandler(async (req, res) => {
    const colNames = await db.getColNames();
    const indices = await db.getIndices();
    res.render("edit_col", { colNames, indices, layout: mainLayout });
}));

router.get("/addcol/:id", checkLogin, asyncHandler(async (req, res) => {
    const idx = req.params.id;
    const columnName = req.query.colname;
    const connection = await mysql.createConnection(db.config);
    await connection.execute(`INSERT INTO cols VALUES (null, "${columnName}")`);
    const [rows, _] = await connection.execute("SELECT MAX(idx) as idx from cols");
    await connection.execute(`ALTER TABLE bidding ADD COLUMN _${rows[0].idx} TEXT AFTER _${idx}`);
    await connection.end();
    res.redirect("/");
}));

router.get("/editcol/:id", checkLogin, asyncHandler(async (req, res) => {
    const idx = req.params.id;
    const columnName = req.query.colname;
    const connection = await mysql.createConnection(db.config);
    await connection.execute(`UPDATE cols SET colname = "${columnName}" WHERE idx = ${idx}`);
    await connection.end();
    res.redirect("/");
}));

router.delete("/deletecol/:id", checkLogin, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const connection = await mysql.createConnection(db.config);
    await connection.execute(`DELETE FROM cols WHERE idx = ${id}`);
    await connection.execute(`ALTER TABLE bidding DROP COLUMN _${id}`);
    const [maxIdx, _] = await connection.execute("SELECT MAX(idx) as idx from cols");
    await connection.execute(`ALTER TABLE cols AUTO_INCREMENT = ${maxIdx[0].idx + 1}`);
    await connection.end();
    res.redirect("/");
}));

router.get("/deletefile/:id", checkLogin, (req, res) => {
    const id = req.params.id;
    const fileName = req.query.fileName;
    fs.unlinkSync(`./uploads/${id}/${fileName}`);
    res.redirect(`/edit/${id}`);
});

module.exports = router;