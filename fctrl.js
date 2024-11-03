const path = require("path");
const fs = require("fs");

const getAllFilePathById = (id) => {
    const p = `./uploads/${id}`
    const files = fs.readdirSync(p);
    for (let i = 0; i < files.length; ++i)
        files[i] = `/${id}/` + files[i];
    return files;
}

const getAllFilePathByIds = (ids) => {
    let ret = new Array();
    for (let i = 0; i < ids.length; ++i)
        ret.push(getAllFilePathById(ids[i]));
    return ret;
}

const getAllFileNameByIds = (ids) => {
    let ret = new Array();
    for (let i = 0; i < ids.length; ++i)
        ret.push(fs.readdirSync(`./uploads/${ids[i]}`));
    return ret;
}

const getAllFileNameById = (id) => {
    return fs.readdirSync(`./uploads/${id}`);
}

module.exports = { getAllFilePathById, getAllFilePathByIds, getAllFileNameByIds, getAllFileNameById };