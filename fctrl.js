const path = require("path");
const fs = require("fs");

const getAllFilePathById = (id, ith) => {
    const p = `./uploads/${id}/${ith}`
    const files = fs.readdirSync(p);
    for (let i = 0; i < files.length; ++i)
        files[i] = `/${id}/${ith}/` + files[i];
    return files;
}

const getAllFilePathByIds = (ids, ith) => {
    let ret = new Array();
    for (let i = 0; i < ids.length; ++i)
        ret.push(getAllFilePathById(ids[i], ith));
    return ret;
}

const getAllFileNameByIds = (ids, ith) => {
    let ret = new Array();
    for (let i = 0; i < ids.length; ++i)
        ret.push(fs.readdirSync(`./uploads/${ids[i]}/${ith}`));
    return ret;
}

const getAllFileNameById = (id, ith) => {
    return fs.readdirSync(`./uploads/${id}/${ith}`);
}

module.exports = { getAllFilePathById, getAllFilePathByIds, getAllFileNameByIds, getAllFileNameById };