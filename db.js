const mysql = require("mysql2/promise");
const dbPW = process.env.DB_PASSWORD;

const config = {
    host: "127.0.0.1",
    user: "root",
    password: dbPW,
    database: "cns",
};

const get_Indices = async () => {
    const connection = await mysql.createConnection(config);
    const [cols, _] = await connection.execute("SHOW COLUMNS FROM bidding");
    let indices = new Array();
    for (let i = 1; i < cols.length; ++i)
        indices.push(cols[i].Field);
    await connection.end();
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
        const [rows, _] = await connection.execute(`SELECT colname FROM cols WHERE idx = ${indices[i]}`)
        colNames.push(rows[0].colname);
    }
    await connection.end();
    return colNames;
}

const getRows = async () => {
    const connection = await mysql.createConnection(config);
    const [rows, _] = await connection.execute("SELECT * FROM bidding");
    await connection.end();
    rowsArr = new Array();
    for (let i = 0; i < rows.length; ++i)
        rowsArr.push(Object.values(rows[i]));
    return rowsArr;
}

const getRow = async (idx) => {
    const connection = await mysql.createConnection(config);
    const [rows, _] = await connection.execute("SELECT * FROM bidding WHERE ID = ?", [idx]);
    await connection.end();
    return Object.values(rows[0]);
}

const getIds = async () => {
    const connection = await mysql.createConnection(config);
    const [rows, _] = await connection.execute("SELECT id FROM bidding");
    await connection.end();
    let ids = new Array();
    for (let i = 0; i < rows.length; ++i)
        ids.push(rows[i].id);
    return ids;
}

module.exports = { config, getIndices, get_Indices, getColNames, getRows, getRow, getIds };
