const vscode = require('vscode');
const util = require('util');
const { Location, Uri } = require("vscode");
var readLine = require('readline');
const { readlink } = require('fs');
const { resolveSoa } = require('dns');
const { idText } = require('typescript');

module.exports = class ALHoverProvider {
    constructor(reader) {
        this.reader = reader;
    }

    provideHover(textDocument, position, token) {
        return new Promise(async (resolve) => {
            if (!textDocument.fileName.toLowerCase().startsWith(this.reader.settings.get('alObjectHelper.savePath').toLowerCase())) {
                resolve(undefined);
                return undefined
            }
            var definitionLine = textDocument.lineAt(position.line).text;

            let message = this.navigateToVariable(textDocument.fileName, definitionLine, position);

            if (message == undefined)
                message = this.navigateToVariableCall(textDocument, definitionLine, position);

            if (message == undefined)
                message = this.navigateFromVariable(definitionLine, position);

            if (message != undefined) {
                var hoverContent = {
                    contents: [{ language: 'al', value: message.DisplayContent }]
                };
                resolve(hoverContent);
                return hoverContent;
            }

            return undefined;
        });
    }


    navigateFromVariable(line, position) {
        let part = line;
        let startPos = 0,
            endPos = -1,
            length = part.length;

        for (let i = position.character; i >= 0; i--) {
            if ([',', ';'].indexOf(part[i]) != -1) {
                startPos = i;
                break;
            }
        }

        for (let i = position.character; i < length; i++) {
            if ([',', ';', ')'].indexOf(part[i]) != -1) {
                endPos = i;
                break;
            }
        }

        if (endPos === -1) {
            return null;
        }

        part = line.substring(startPos, endPos);
        let pattern = /\:.*?(codeunit|page|pageextension|pagecustomization|dotnet|enum|interface|enumextension|query|report|record|tableextension|xmlport|profile|controladdin)\s?(.*)/gmi;
        let found = pattern.exec(part);
        if (found && found.length > 2) {
            let type = found[1].replace(/record/gi, 'Table');
            let name = found[2].replace(/"/g, '');

            var alObject = this.reader.alObjects.reverse().find(element => element.type == type.toLowerCase() && element.name.toLowerCase() == name.toLowerCase());
            if (alObject != undefined) {
                let message = {
                    Type: type,
                    Type2: "",
                    Name: name,
                    Path: alObject.path,
                    LineNo: 0,
                    DisplayContent: `${type} ${name}`
                };

                return message;
            }
        }

        return undefined;
    }

    navigateToVariable(path, line, position) {
        var r = /(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)/gmi;
        var match;
        match = r.exec(line);
        if (!(position.character > match.index && position.character < match.index + match[0].length)) {
            let len = match.length - 2;
            while (match = r.exec(line)) {
                if (position.character > match.index && position.character < match.index + match[0].length) {
                    break;
                }
            }
        }

        if (match == null || match == undefined || match.length == 0)
            return undefined;
        const alObject = this.reader.alObjects.find(a => a.path.toLowerCase() == path.toLowerCase());
        var variableName = line.substring(match.index, match.index + match[0].length);
        let message;

        if (variableName == "Rec" || variableName == "xRec") {
            if (alObject.type == "table") {
                message = this.getObjectDefinition(path, variableName);
            }
            else if (alObject.type == "page") {
                var tableAlObject = this.reader.alObjects.find(a => a.type == "table" && a.name == alObject.pageSourceTable);
                message = this.getObjectDefinition(tableAlObject.path, variableName);
            }
            else if (alObject.type == "tableextension") {
                var tableAlObject = this.reader.alObjects.find(a => a.type == "table" && a.id == alObject.extendsID);
                message = this.getObjectDefinition(tableAlObject.path, variableName);
            }
            else if (alObject.type == "pageextension") {
                var pageAlObject = this.reader.alObjects.find(a => a.type == "page" && a.id == alObject.extendsID);
                var tableAlObject = this.reader.alObjects.find(a => a.type == "table" && a.name == pageAlObject.pageSourceTable);
                message = this.getObjectDefinition(tableAlObject.path, variableName);
            }

            if (message != undefined)
                return message;
        }

        message = this.getVariableDefinition(path, variableName, position.line);
        if (message != undefined)
            return message;

        message = this.getFunctionDefinition(path, variableName);
        if (message != undefined)
            return message;

        message = this.getFieldDefinition(path, variableName);
        if (message != undefined)
            return message;
    }

    getVariableDefinition(path, variableName, lineNo) {
        let variableStartLineNo = this.getLastProcedure(path, lineNo);
        let variableEndLineNo = lineNo;
        if (variableStartLineNo != -1) {
            let alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
            let variables = alObject.variables.filter(element => element.lineNo > variableStartLineNo && element.lineNo < variableEndLineNo);
            if (variables == undefined || variables.length == 0) {
                variables = alObject.variables.filter(element => !element.local);
            }
            let variable = variables.reverse().find(element => element.name == variableName);
            if (variable == undefined) {
                variables = alObject.variables.filter(element => !element.local);
                variable = variables.reverse().find(element => element.name == variableName);
            }
            if (variable != undefined) {
                var displayContent = `${variable.name}: ${variable.type}`;
                if (variable.subType != "") {
                    if (variable.subType.startsWith("\""))
                        displayContent += ` ${variable.subType}`;
                    else
                        displayContent += ` "${variable.subType}"`;
                }

                let message = {
                    Type: variable.type,
                    Type2: variable.subType,
                    Name: variable.name,
                    Path: path,
                    LineNo: variable.lineNo,
                    DisplayContent: displayContent
                };

                if (variable.type == "Record") {
                    var tableName = variable.subType;
                    if (tableName.startsWith("\"")){
                        tableName = tableName.substring(1);
                        tableName = tableName.substring(0, tableName.length - 1);
                    }
                    var tableAlObject = this.reader.alObjects.find(a => a.type == "table" && a.name == tableName);
                    if (tableAlObject != undefined){
                        return this.getObjectDefinition(tableAlObject.path, variable.name, !variable.local);
                    }
                }

                return message;
            }
        }
        else {
            let alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
            var variables = alObject.variables.filter(element => !element.local);
            if (variables != undefined) {
                let variable = variables.reverse().find(element => element.name == variableName);
                if (variable != undefined) {
                    var displayContent = `${variable.name}: ${variable.type}`;
                    if (variable.subType != "") {
                        if (variable.subType.startsWith("\""))
                            displayContent += ` ${variable.subType}`;
                        else
                            displayContent += ` "${variable.subType}"`;
                    }

                    let message = {
                        Type: variable.type,
                        Type2: variable.subType,
                        Name: variable.name,
                        Path: path,
                        LineNo: variable.lineNo,
                        DisplayContent: displayContent
                    };

                    if (variable.type == "Record") {
                        var tableName = variable.subType;
                        if (tableName.startsWith("\"")){
                            tableName = tableName.substring(1);
                            tableName = tableName.substring(0, tableName.length - 1);
                        }
                        var tableAlObject = this.reader.alObjects.find(a => a.type == "table" && a.name == tableName);
                        if (tableAlObject != undefined){
                            return this.getObjectDefinition(tableAlObject.path, variable.name, !variable.local);
                        }
                    }

                    return message;
                }
            }
        }
    }

    getFunctionDefinition(path, variableName) {
        let alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
        let alFunction = alObject.functions.find(element => element.name == variableName);

        if (alFunction != undefined) {
            var parameters = "";
            if (alFunction.parameters.length != 0) {
                for (let index = 0; index < alFunction.parameters.length; index++) {
                    const element = alFunction.parameters[index];
                    if (element.isVar)
                        parameters += "var ";
                    parameters += `${element.name}: ${element.type}`;
                    if (element.subType != "") {
                        if (element.subType.startsWith("\""))
                            parameters += " " + element.subType;
                        else
                            parameters += ` "${element.subType}"`;
                    }
                    if (index < alFunction.parameters.length - 1)
                        parameters += "; ";
                }
            }

            var displayContent = `procedure ${alFunction.name}(${parameters})`;
            let message = {
                Type: "procedure",
                Type2: "",
                Name: alFunction.name,
                Path: path,
                LineNo: alFunction.lineNo,
                DisplayContent: displayContent
            };

            return message;
        }
    }

    getFieldDefinition(path, variableName) {
        let alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
        let field = alObject.fields.find(element => element.name == variableName);

        if (field != undefined) {
            let message = {
                Type: "field",
                Type2: "",
                Name: field.name,
                Path: path,
                LineNo: field.lineNo,
                DisplayContent: `field ${field.name}`
            };

            return message;
        }
    }

    getObjectDefinition(path, variableName, isGlobal = true) {
        var alObject = this.reader.alObjects.find(a => a.path.toLowerCase() == path.toLowerCase());

        if (alObject != undefined) {
            let objectName = alObject.name;
            if (objectName.startsWith("\"")){
                objectName = objectName.substring(1);
                objectName = objectName.substring(0, objectName.length - 1);
            }
            let message = {
                Type: alObject.type,
                Type2: "",
                Name: alObject.name,
                Path: path,
                LineNo: 0,
                DisplayContent: `${alObject.type} ${objectName}`
            };

            if (alObject.type == "table") {
                if (isGlobal)
                    message.DisplayContent = `(global) ${variableName}: Record ${objectName}`;
                else
                    message.DisplayContent = `(local) ${variableName}: Record ${objectName}`;

                for (let index = 0; index < alObject.fields.length; index++) {
                    const element = alObject.fields[index];
                    message.DisplayContent += "\n";
                    message.DisplayContent += element.id;
                    message.DisplayContent += " - ";
                    message.DisplayContent += element.name;
                    for (let index = element.name.length + element.id.length + 3; index < 50; index++) {
                        message.DisplayContent += " ";
                    }
                    message.DisplayContent += element.type;
                }
            }

            return message;
        }
    }

    /*
        Jump to a Function or Field Definition in a other File (From a Variable)
        Ex. Customer."No." -> Jump to the Field No. in the Customer Table, because Customer is a Record Variable of Customer
    */
    navigateToVariableCall(textDocument, line, position) {
        var r = /((\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\.(\"[^\"\r\n\t]+\"|[a-z0-9\_]+))/gmi;
        var match;
        match = r.exec(line);
        if (match == null)
            return undefined;

        if (!(position.character > match.index && position.character < match.index + match[0].length)) {
            let len = match.length - 2;
            while (match = r.exec(line)) {
                if (position.character > match.index && position.character < match.index + match[0].length) {
                    break;
                }
            }
        }
        if (match == null || match == undefined || match.length == 0)
            return undefined;
        var secondVariableName = match[3];
        let message = this.getVariableDefinition(textDocument.fileName, match[2], position.line);
        let alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == textDocument.fileName.toLowerCase());
        let variable = alObject.variables.find(element => element.lineNo == message.LineNo);

        var definitionLine = textDocument.lineAt(variable.lineNo).text;
        var index = definitionLine.indexOf(":");
        index = this.regexIndexOf(definitionLine, /[a-z]/gi, index) + 1;

        message = this.navigateFromVariable(definitionLine, new vscode.Position(variable.lineNo, index));
        // Parent Object
        alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == message.Path.toLowerCase());

        var functions = alObject.functions.filter(element => element.name == secondVariableName && !element.local);
        if (functions != undefined && functions.length != 0) {
            var alFunction = functions.reverse()[0];
            var parameters = "";
            if (alFunction.parameters.length != 0) {
                for (let index = 0; index < alFunction.parameters.length; index++) {
                    const element = alFunction.parameters[index];
                    if (element.isVar)
                        parameters += "var ";
                    parameters += `${element.name}: ${element.type}`;
                    if (element.subType != "") {
                        if (element.subType.startsWith("\""))
                            parameters += " " + element.subType;
                        else
                            parameters += ` "${element.subType}"`;
                        if (index < alFunction.parameters.length - 1)
                            parameters += "; ";
                    }
                }
            }

            var displayContent = `procedure ${alFunction.name}(${parameters})`;
            let message = {
                Type: "procedure",
                Type2: "",
                Name: alFunction.name,
                Path: alObject.path,
                LineNo: alFunction.lineNo,
                DisplayContent: displayContent
            };

            return message;
        }

        var field = alObject.fields.find(element => element.name == secondVariableName);
        if (field != undefined) {
            let message = {
                Type: "field",
                Type2: "",
                Name: field.name,
                Path: alObject.path,
                LineNo: field.lineNo,
                DisplayContent: `field ${field.name}`
            };

            return message;
        }
    }

    getLastProcedure(path, lineNo) {
        var alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
        var functions = alObject.functions.filter(element => element.lineNo < lineNo);
        if (functions == undefined || functions.length == 0)
            return -1;
        return functions[functions.length - 1].lineNo;
    }

    regexIndexOf(value, regex, startpos) {
        var indexOf = value.substring(startpos || 0).search(regex);
        return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
    }
}