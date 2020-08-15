const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const ALObject = require('./ALObjects/ALObject');
const fs = require('fs');
const readline = require('readline');
const firstLine = require('firstline');

const alObjects = [];
const promises = [];
for (let index = workerData.start; index < workerData.end; index++) {
    promises.push(findALObject(alObjects, workerData.files[index], workerData.appPackageName, workerData.start, index, workerData.end));
}

Promise.all(promises).then((value) => {
    //parentPort.postMessage(`Finished (${workerData.start} - ${workerData.end})`);
    parentPort.postMessage(alObjects);
});

async function findALObject(localAlObjects, file, appPackageName, start, index, end) {
    return await new Promise(async (resolve) => {
        var line = await firstLine(file);
        var alObject = getALObject(line, file);
        if (alObject == undefined) {
            const fileStream = fs.createReadStream(file);
            const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

            for await (const line of rl) {
                alObject = getALObject(line, file);

                if (alObject != undefined) {
                    break;
                }
            }
        }

        if (alObject != undefined) {
            var alObject2 = new ALObject(alObject);
            alObject2.appPackageName = appPackageName;
            localAlObjects.push(alObject2);
            resolve();
        }
        // Could be a profile AL File
        else
            resolve();
    });
}

function getALObject(firstLine, pathToFile) {
    var alObjectPattern = /^([a-z]+)\s([0-9]+)\s([a-z0-9\_]+|\"[^\"]+\")(\sextends\s([a-z0-9\_]+|\"[^\"]+\")|[\s\{]?|)[\s\{]?/gi;
    var matches = alObjectPattern.exec(firstLine);

    if (matches == null) {
        return undefined;
    }

    if (matches.length == 6) {
        // No Extension
        if (matches[5] == undefined) {
            var type = matches[1];
            var id = matches[2];
            var name = matches[3];
            if (name.startsWith("\"")) {
                name = name.substring(1);
                name = name.substring(0, name.length - 1);
            }
            return new ALObject(pathToFile, type.toLowerCase(), id, name, '');
        }
        // Extension
        else {
            var type = matches[1];
            var id = matches[2];
            var name = matches[3];
            if (name.startsWith("\"")) {
                name = name.substring(1);
                name = name.substring(0, name.length - 1);
            }
            var extendsName = matches[5];
            if (extendsName.startsWith("\"")) {
                extendsName = extendsName.substring(1);
                extendsName = extendsName.substring(0, extendsName.length - 1);
            }
            return new ALObject(pathToFile, type.toLowerCase(), id, name, extendsName);
        }
    }

    return undefined;
}