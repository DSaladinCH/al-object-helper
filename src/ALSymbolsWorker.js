const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const ALObject = require('./ALObjects/ALObject');
const fs = require('graceful-fs');
const readline = require('readline');
const ALEventPublisher = require('./ALObjects/ALEventPublisher');
const ALFunction = require('./ALObjects/ALFunction');
const ALTableField = require('./ALObjects/ALTableField');
const ALPageField = require('./ALObjects/ALPageField');
const ALVariable = require('./ALObjects/ALVariable');

const promises = [];
for (let index = workerData.start; index < workerData.end; index++) {
    promises.push(readDefinitions(workerData.alObjects, index));
}

Promise.all(promises).then((value) => {
    //parentPort.postMessage(`Finished (${workerData.start} - ${workerData.end})`);
    parentPort.postMessage(workerData);
});

async function readDefinitions(alObjects, index) {
    return await new Promise(async (resolve) => {
        const alObject = new ALObject(alObjects[index]);
        var eventType = "";

        addObjectEventPublisher(alObjects, index);
        const fileStream = fs.createReadStream(alObject.path);
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        var saveNextLine = false;
        var regexMatch;
        var isInFunction = false;
        var isInFunctionHeader = false;
        var isVariableList = false;
        //var variablePattern = /(\S*)\s?\:\s(\S*)\s(.*)\;/gmi;
        //var variablePattern = /\s(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z]+)\s?(\'[^\']+\'|\"[^\"]+\"|[^\"\s]+)\;/gi;
        var variablePattern = /\s(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)( temporary)?\;/gi;
        var procedurePattern = /(local\s)*(procedure)\s(\S*)\(/gi;
        var triggerPattern = /(trigger)\s(\S*)\(/gi;
        var tableFieldPattern = /field\(([0-9]+)\;\s?(\"[^\"]+\"|[a-z0-9\_]+)\;\s?([a-z0-9\[\]]+|Enum (\"[^\"]+\"|[a-z0-9\_]+))\)/gi;
        var pageFieldPattern = /field\((\"[^\"]+\"|[a-z0-9\_]+)\;\s?(\"[^\"]+\"|[a-z0-9\_]+)\)/gi;
        var pageSourceTablePattern = /(?:SourceTable)\s?\=\s?([a-z0-9\_]+|\"[^\"]+\")\;/gi;
        var lineCounter = 0;

        var start = Date.now();
        for await (const line of rl) {
            if (saveNextLine) {
                if (line.includes("[Scope") || line.includes("[Obsolete")) {
                    lineCounter += 1;
                    continue;
                }
                alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, line));
                saveNextLine = false;
            }

            if (line.includes("[IntegrationEvent")) {
                isInFunction = false;
                isVariableList = false;
                eventType = "IntegrationEvent";
                saveNextLine = true;
            }
            else if (line.includes("[BusinessEvent")) {
                isInFunction = false;
                isVariableList = false;
                eventType = "BusinessEvent";
                saveNextLine = true;
            }
            else if (line.includes("procedure")) {
                isInFunction = true;
                isInFunctionHeader = true;
                isVariableList = false;
                regexMatch = procedurePattern.exec(line);
                if (regexMatch && regexMatch.length >= 3) {
                    // if length is 4, it's a local function
                    var name = regexMatch[2];
                    var local = false;
                    if (regexMatch.length == 4) {
                        name = regexMatch[3];
                        if (regexMatch[1] != undefined) {
                            local = true;
                        }
                    }
                    alObjects[index].functions.push(new ALFunction(name, lineCounter, line, local, eventType));
                }
                procedurePattern.lastIndex = 0;
                eventType = "";
            }
            else if (line.includes("trigger")) {
                isInFunction = true;
                isInFunctionHeader = true;
                isVariableList = false;
                eventType = "";
                regexMatch = triggerPattern.exec(line);
                if (regexMatch && regexMatch.length == 3) {
                    var name = regexMatch[2];
                    var local = true;
                    alObjects[index].functions.push(new ALFunction(name, lineCounter, line, local));
                }
                triggerPattern.lastIndex = 0;
            }
            else if (line.includes("field(") && alObject.type == "table") {
                isInFunction = false;
                isVariableList = false;
                eventType = "Trigger";

                regexMatch = tableFieldPattern.exec(line);
                if (regexMatch) {
                    if (regexMatch.length == 5) {
                        let id = regexMatch[1];
                        let name = regexMatch[2];
                        let type = regexMatch[3];

                        alObjects[index].fields.push(new ALTableField(id, name, type, lineCounter));
                    }
                }
                tableFieldPattern.lastIndex = 0;

                const start = line.indexOf(";") + 1;
                var elementName = line.substring(start, line.indexOf(";", start)).trim();
                if (elementName.startsWith("\"")) {
                    elementName = elementName.substring(1);
                    elementName = elementName.substring(0, elementName.length - 1);
                }
                var functionString = `local procedure OnBeforeValidate(var Rec: Record "${alObject.name}"; var xRec: Record "${alObject.name}"; CurrFieldNo: Integer)`;
                alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, functionString, "OnBeforeValidateEvent", elementName));
                functionString = `local procedure OnAfterValidate(var Rec: Record "${alObject.name}"; var xRec: Record "${alObject.name}"; CurrFieldNo: Integer)`;
                alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, functionString, "OnAfterValidateEvent", elementName));
            }
            else if (line.includes("field(") && alObject.type == "page") {
                isInFunction = false;
                isVariableList = false;
                eventType = "Trigger";

                regexMatch = pageFieldPattern.exec(line);
                if (regexMatch) {
                    if (regexMatch.length == 4) {
                        let name = regexMatch[1];
                        let fieldName = regexMatch[2];

                        alObjects[index].fields.push(new ALPageField(name, fieldName, lineCounter));
                    }
                }
                pageFieldPattern.lastIndex = 0;

                const start = line.indexOf(";") + 1;
                var elementName = line.substring(start, line.indexOf(")", start)).trim();
                if (elementName.startsWith("\"")) {
                    elementName = elementName.substring(1);
                    elementName = elementName.substring(0, elementName.length - 1);
                }
                var functionString = `local procedure OnBeforeValidate(var Rec: Record "${alObject.pageSourceTable}"; var xRec: Record "${alObject.name}")`;
                alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, functionString, "OnBeforeValidateEvent", elementName));
                functionString = `local procedure OnAfterValidate(var Rec: Record "${alObject.pageSourceTable}"; var xRec: Record "${alObject.name}")`;
                alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, functionString, "OnAfterValidateEvent", elementName));
            }
            // first begin of procedure/trigger
            else if (line.includes("begin") && isInFunctionHeader) {
                isInFunctionHeader = false;
                isVariableList = false;
                eventType = "";
            }
            else if (line.includes("var")) {
                //if (isInFunctionHeader)
                isVariableList = true;
                eventType = "";
            }
            else if (isVariableList) {
                regexMatch = variablePattern.exec(line);
                if (regexMatch) {
                    if (regexMatch.length >= 3) {
                        // if length is 4, it's a local function
                        let name = regexMatch[1];
                        let type = regexMatch[2];
                        let subType = "";
                        let isTemp = false;
                        if (regexMatch.length >= 4 && regexMatch[3] != "") {
                            subType = regexMatch[3];
                        }

                        if (regexMatch[5] != undefined)
                            isTemp = true;

                        alObjects[index].variables.push(new ALVariable(name, type, lineCounter, isInFunctionHeader, subType, isTemp));
                    }
                }
                variablePattern.lastIndex = 0;
            }
            else if (line.includes("SourceTable") && alObject.type == "page") {
                regexMatch = pageSourceTablePattern.exec(line);
                if (regexMatch) {
                    if (regexMatch.length == 2) {
                        let tableName = regexMatch[1];
                        if (tableName.startsWith("\""))
                            tableName = tableName.substring(1, tableName.length - 1);
                        alObjects[index].pageSourceTable = tableName;
                    }
                }
            }
            lineCounter += 1;
        }

        rl.close();
        fileStream.close();
        resolve();
    });
}

function addObjectEventPublisher(alObjects, index) {
    const alObject = new ALObject(alObjects[index]);
    var eventType = "Trigger";

    //if (!(alObject instanceof ALObject))
    //return;

    if (alObject.type == "table") {
        //**************//
        //*** DELETE ***//
        //**************//
        var funcString = `local procedure OnBeforeDelete(var Rec: Record "${alObject.name}"; RunTrigger: Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnBeforeDeleteEvent"));
        funcString = `local procedure OnAfterDelete(var Rec: Record "${alObject.name}"; RunTrigger: Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnAfterDeleteEvent"));

        //**************//
        //*** INSERT ***//
        //**************//
        funcString = `local procedure OnBeforeInsert(var Rec: Record "${alObject.name}"; RunTrigger: Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnBeforeInsertEvent"));
        funcString = `local procedure OnAfterInsert(var Rec: Record "${alObject.name}"; RunTrigger: Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnAfterInsertEvent"));

        //**************//
        //*** MODIFY ***//
        //**************//
        funcString = `local procedure OnBeforeModify(var Rec: Record "${alObject.name}"; var xRec: Record "${alObject.name}"; RunTrigger: Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnBeforeModifyEvent"));
        funcString = `local procedure OnAfterModify(var Rec: Record "${alObject.name}"; var xRec: Record "${alObject.name}"; RunTrigger: Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnAfterModifyEvent"));

        //**************//
        //*** RENAME ***//
        //**************//
        funcString = `local procedure OnBeforeRename(var Rec: Record "${alObject.name}"; var xRec: Record "${alObject.name}"; RunTrigger: Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnBeforeRenameEvent"));
        funcString = `local procedure OnAfterRename(var Rec: Record "${alObject.name}"; var xRec: Record "${alObject.name}"; RunTrigger: Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnAfterRenameEvent"));

        return;
    }

    if (alObject.type == "page") {
        //*********************//
        //*** GETCURRRECORD ***//
        //*********************//
        var funcString = `local procedure OnAfterGetCurrRecord(var Rec: Record "${alObject.pageSourceTable}")`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnAfterGetCurrRecordEvent"));

        //*****************//
        //*** GETRECORD ***//
        //*****************//
        var funcString = `local procedure OnAfterGetRecord(var Rec: Record "${alObject.pageSourceTable}")`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnAfterGetRecordEvent"));

        //*******************//
        //*** ONCLOSEPAGE ***//
        //*******************//
        var funcString = `local procedure OnClosePage(var Rec: Record "${alObject.pageSourceTable}")`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnClosePageEvent"));

        //**********************//
        //*** ONDELETERECORD ***//
        //**********************//
        var funcString = `local procedure OnDeleteRecord(var Rec: Record "${alObject.pageSourceTable}"; var AllowDelete : Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnDeleteRecordEvent"));

        //**********************//
        //*** ONINSERTRECORD ***//
        //**********************//
        var funcString = `local procedure OnInsertRecord(var Rec: Record "${alObject.pageSourceTable}"; BelowxRec : Boolean; var xRec : Record "${alObject.pageSourceTable}"; var AllowInsert : Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnInsertRecordEvent"));

        //**********************//
        //*** ONMODIFYRECORD ***//
        //**********************//
        var funcString = `local procedure OnModifyRecord(var Rec: Record "${alObject.pageSourceTable}"; var xRec : Record "${alObject.pageSourceTable}"; var AllowModify : Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnModifyRecordEvent"));

        //*******************//
        //*** ONNEWRECORD ***//
        //*******************//
        var funcString = `local procedure OnNewRecord(var Rec: Record "${alObject.pageSourceTable}"; BelowxRec : Boolean; var xRec : Record "${alObject.pageSourceTable}")`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnNewRecordEvent"));

        //******************//
        //*** ONOPENPAGE ***//
        //******************//
        var funcString = `local procedure OnOpenPage(var Rec: Record "${alObject.pageSourceTable}")`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnOpenPageEvent"));

        //************************//
        //*** ONQUERYCLOSEPAGE ***//
        //************************//
        var funcString = `local procedure OnQueryClosePage(var Rec: Record "${alObject.pageSourceTable}"; var AllowClose : Boolean)`;
        alObjects[index].eventPublisher.push(new ALEventPublisher(alObject, eventType, funcString, "OnQueryClosePageEvent"));
    }
}