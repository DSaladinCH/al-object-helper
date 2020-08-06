const fs = require('fs-extra');

module.exports = class utils {
    static read(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, "utf8", (error, data) => {
                if (error)
                    reject(error);
                else
                    resolve(data);
            })
        });
    }
}