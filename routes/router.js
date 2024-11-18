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
            let fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const col_id = fileName.slice(0, fileName.indexOf("_"));
            done(null, `./uploads/${id}/${col_id}`);
        },
        filename(req, file, done) {
            // 파일 이름을 UTF-8로 변환
            let fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            fileName = fileName.slice(fileName.indexOf("_") + 1);
            const ext = path.extname(fileName);
            done(null, path.basename(fileName, ext) + ext);
        }
    }),
    limits: { filzeSize: 100 * 1024 * 1024 },
});
router.get("/", checkLogin, asyncHandler(async (req, res) => {
    const colNames = await db.getColNames();
    const indices = await db.getIndices();
    const rows = await db.getRows();
    const ids = await db.getIds();
    const fileCols = await db.getFileCols();
    let filePaths = new Array();
    for (let i = 0; i < fileCols.length; ++i)
        filePaths.push(fctrl.getAllFilePathByIds(ids, fileCols[i]));
    const widths = await db.getWidths();
    const isText = await db.isText();
    res.render("index", { colNames, indices, rows, filePaths, widths, isText, fileCols, layout: mainLayout });
}));
router.get("/edit/:id", checkLogin, asyncHandler(async (req, res) => {
    const colNames = await db.getColNames();
    const indices = await db.getIndices();
    const rows = await db.getRows();
    const ids = await db.getIds();
    const id = req.params.id;
    const fileCols = await db.getFileCols();
    let filePaths = new Array();
    for (let i = 0; i < fileCols.length; ++i)
        filePaths.push(fctrl.getAllFilePathByIds(ids, fileCols[i]));
    let fileNames = new Array();
    for (let i = 0; i < fileCols.length; ++i)
        fileNames.push(fctrl.getAllFileNameById(id, fileCols[i]));
    const fileColNames = await db.getFileColNames();
    const widths = await db.getWidths();
    const isText = await db.isText();
    res.render("edit", { colNames, indices, rows, id, filePaths, fileNames, widths, isText, fileColNames, fileCols, layout: mainLayout });
}));
router.put("/edit/:id", checkLogin, upload.array("files"), asyncHandler(async (req, res) => {
    const _indices = await db.get_Indices();
    str = "UPDATE biddings SET ";
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
    res.redirect("/");
}));
router.get("/delete/:id", checkLogin, asyncHandler(async (req, res) => {
    const connection = await mysql.createConnection(db.config);
    await connection.execute("DELETE FROM biddings WHERE ID = ?", [req.params.id]);
    const [maxId, _] = await connection.execute("SELECT MAX(id) as maxId from biddings");
    if (maxId[0].maxId === null) await connection.execute("ALTER TABLE biddings AUTO_INCREMENT = 1");
    else await connection.execute(`ALTER TABLE biddings AUTO_INCREMENT = ${maxId[0].maxId + 1}`);
    await connection.end();
    fs.rmSync(`./uploads/${req.params.id}`, { recursive: true });
    res.redirect("/");
}));
const addPath = asyncHandler(async (req, res, next) => {
    connection = await mysql.createConnection(db.config);
    const [maxId, _] = await connection.execute("SELECT MAX(id) as maxId from biddings");
    await connection.end();
    const id = (maxId[0].maxId == null ? 1 : (maxId[0].maxId + 1));
    const fileCols = await db.getFileCols();
    try {
        fs.mkdirSync(`./uploads/${id}/`);
        for (let i = 0; i < fileCols.length; ++i)
            fs.mkdirSync(`./uploads/${id}/${fileCols[i]}`)
    } catch (err) {
        if (err.code === 'EEXIST') {
            fs.rmSync(`./uploads/${id}`, { recursive: true });
            fs.mkdirSync(`./uploads/${id}/`);
            for (let i = 0; i < fileCols.length; ++i)
                fs.mkdirSync(`./uploads/${id}/${fileCols[i]}`)
        }
    }
    req.params.id = id;
    next();
});
router.post("/add", checkLogin, addPath, upload.array("files"), asyncHandler(async (req, res) => {
    str = "INSERT INTO biddings VALUES (NULL";
    let value = Object.values(req.body);
    for (let i = 0; i < value.length; ++i)
        str += ", ?"
    str += ") "
    const connection = await mysql.createConnection(db.config);
    await connection.execute(str, value);
    await connection.end();
    res.redirect("/");
}));
router.get("/editcol", checkLogin, asyncHandler(async (req, res) => {
    const colNames = await db.getColNames();
    const indices = await db.getIndices();
    const fileColNames = await db.getFileColNames();
    const widths = await db.getWidths();
    const isText = await db.isText();
    res.render("edit_col", { colNames, indices, fileColNames, widths, isText, layout: mainLayout });
}));
router.get("/addcol/:id/:isText", checkLogin, asyncHandler(async (req, res) => {
    let id = req.params.id;
    if (id != 'id') id = "_" + id;
    const columnName = req.query.colname;
    const isText = req.params.isText;
    const connection = await mysql.createConnection(db.config);
    await connection.execute(`INSERT INTO col_info VALUES (null, "${columnName}", "${isText}")`);
    const [rows, _] = await connection.execute("SELECT MAX(id) as id from col_info");
    await connection.execute(`ALTER TABLE biddings ADD COLUMN _${rows[0].id} TEXT AFTER ${id}`);
    await connection.execute(`INSERT INTO width VALUES (${rows[0].id}, 100)`);
    await connection.end();
    if (isText == "0") {
        const dirs = fs.readdirSync("./uploads");
        for (let i = 0; i < dirs.length; ++i)
            fs.mkdirSync(`./uploads/${dirs[i]}/${rows[0].id}`);
        const connection = await mysql.createConnection(db.config);
        await connection.execute(`UPDATE biddings SET _${rows[0].id} = "$file_col"`);
        await connection.end();
    }
    res.redirect("/");
}));
router.get("/editcol/:id", checkLogin, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const columnName = req.query.colname;
    const connection = await mysql.createConnection(db.config);
    await connection.execute(`UPDATE col_info SET colName = "${columnName}" WHERE id = ${id}`);
    await connection.end();
    res.redirect("/");
}));
router.get("/editwidth/:id", checkLogin, asyncHandler(async (req, res) => {
    const idx = req.params.id;
    const width = req.query.width;
    const connection = await mysql.createConnection(db.config);
    await connection.execute(`UPDATE width SET w = ${width} WHERE id = ${idx}`);
    await connection.end();
    res.redirect("/");
}));
router.get("/editfilecol/:id", checkLogin, asyncHandler(async (req, res) => {
    const idx = req.params.id;
    const columnName = req.query.colname;
    const connection = await mysql.createConnection(db.config);
    await connection.execute(`UPDATE files SET name = "${columnName}" WHERE id = ${idx}`);
    await connection.end();
    res.redirect("/");
}));
router.delete("/deletecol/:id/:isText", checkLogin, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const isText = req.params.isText;
    const connection = await mysql.createConnection(db.config);
    await connection.execute(`DELETE FROM col_info WHERE id = ${id}`);
    await connection.execute(`ALTER TABLE biddings DROP COLUMN _${id}`);
    await connection.execute(`DELETE FROM width WHERE id = ${id}`);
    const [maxIdx, _] = await connection.execute("SELECT MAX(id) as id from col_info");
    let incr = maxIdx[0].idx;
    if (incr == null) incr = 1;
    else ++incr;
    await connection.execute(`ALTER TABLE col_info AUTO_INCREMENT = ${incr}`);
    await connection.end();
    if (isText == "0") {
        const dirs = fs.readdirSync("./uploads");
        for (let i = 0; i < dirs.length; ++i)
            fs.rmSync(`./uploads/${dirs[i]}/${id}`, { recursive: true });
    }
    res.redirect("/");
}));
router.get("/deletefile/:ith/:id", checkLogin, (req, res) => {
    const ith = req.params.ith;
    const id = req.params.id;
    const fileName = req.query.fileName;
    fs.unlinkSync(`./uploads/${id}/${ith}/${fileName}`);
    res.redirect(`/edit/${id}`);
});
module.exports = router;