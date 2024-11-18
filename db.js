const mysql = require("mysql2/promise");
const dbName = process.env.DB_NAME;
const dbPW = process.env.DB_PASSWORD;

const config = {
    host: "127.0.0.1",
    user: "root",
    database: dbName,
    password: dbPW,
};

const get_Indices = async () => {
    const connection = await mysql.createConnection(config);
    const [cols, _] = await connection.execute("SHOW COLUMNS FROM biddings");
    await connection.end();
    let indices = new Array();
    for (let i = 1; i < cols.length; ++i)
        indices.push(cols[i].Field);
    return indices;
};
const getIndices = async () => {
    let indices = await get_Indices();
    for (let i = 0; i < indices.length; ++i)
        indices[i] = indices[i].slice(1);
    return indices;
}
const getColNames = async () => {
    const indices = await getIndices();
    const connection = await mysql.createConnection(config);
    let colNames = new Array();
    for (let i = 0; i < indices.length; ++i) {
        const [rows, _] = await connection.execute(`SELECT colname FROM col_info WHERE id = ${indices[i]}`)
        colNames.push(rows[0].colname);
    }
    await connection.end();
    return colNames;
}
const getRows = async () => {
    const connection = await mysql.createConnection(config);
    const [rows, _] = await connection.execute("SELECT * FROM biddings");
    await connection.end();
    rowsArr = new Array();
    for (let i = 0; i < rows.length; ++i)
        rowsArr.push(Object.values(rows[i]));
    return rowsArr;
}
const getRow = async (idx) => {
    const connection = await mysql.createConnection(config);
    const [rows, _] = await connection.execute("SELECT * FROM biddings WHERE ID = ?", [idx]);
    await connection.end();
    return Object.values(rows[0]);
}
const getIds = async () => {
    const connection = await mysql.createConnection(config);
    const [rows, _] = await connection.execute("SELECT id FROM biddings");
    await connection.end();
    let ids = new Array();
    for (let i = 0; i < rows.length; ++i)
        ids.push(rows[i].id);
    return ids;
}
const getWidths = async () => {
    const indices = await getIndices();
    const connection = await mysql.createConnection(config);
    let widths = new Array();
    for (let i = 0; i < indices.length; ++i) {
        const [rows, _] = await connection.execute(`SELECT w FROM width WHERE id = ${indices[i]}`);
        widths.push(rows[0].w);
    }
    await connection.end();
    return widths;
}
const isText = async () => {
    const indices = await getIndices();
    const connection = await mysql.createConnection(config);
    let isText = new Array();
    for (let i = 0; i < indices.length; ++i) {
        const [rows, _] = await connection.execute(`SELECT isText FROM col_info WHERE id = ${indices[i]}`);
        isText.push(rows[0].isText);
    }
    await connection.end();
    return isText;
}
const getFileCols = async () => {
    let indices = await getIndices();
    let ret = new Array();
    const connection = await mysql.createConnection(config);
    for (let i = 0; i < indices.length; ++i) {
        const [rows, _] = await connection.execute(`SELECT isText FROM col_info WHERE id = ${indices[i]}`);
        if (rows[0].isText != 1)
            ret.push(indices[i]);
    }
    await connection.end();
    return ret;
}
const getFileColNames = async () => {
    const indices = await getFileCols();
    let ret = new Array();
    const connection = await mysql.createConnection(config);
    for (let i = 0; i < indices.length; ++i) {
        const [rows, _] = await connection.execute(`SELECT colName FROM col_info WHERE id = ${indices[i]}`);
        ret.push(rows[0].colName);
    }
    await connection.end();
    return ret;

}
module.exports = { config, getIndices, get_Indices, getColNames, getRows, getRow, getIds, getWidths, isText, getFileCols, getFileColNames };
