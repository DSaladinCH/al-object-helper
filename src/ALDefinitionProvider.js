const vscode = require('vscode');
const util = require('util');
const { Location, Uri } = require("vscode");
var readLine = require('readline');
const { readlink } = require('fs');
const ALFunction = require('./ALObjects/ALFunction');

module.exports = class ALDefinitionProvider {
    constructor(reader) {
        this.reader = reader;
    }

    provideDefinition(textDocument, position, token) {
        return new Promise(async (resolve) => {
            if (!textDocument.fileName.toLowerCase().startsWith(this.reader.settings.get('alObjectHelper.savePath').toLowerCase())) {
                resolve(undefined);
                return undefined
            }
            var definitionLine = textDocument.lineAt(position.line).text;

            let message = this.navigateToDefinition(textDocument.fileName, definitionLine, position);
            if (message != undefined) {
                console.log("Go to line No: " + message.LineNo);
                const definitionResource = vscode.Uri.file(message.Path);
                resolve(new Location(definitionResource, new vscode.Position(message.LineNo, 0)));
            }

            message = this.navigateToVariableCall(textDocument, definitionLine, position);
            if (message != undefined) {
                console.log("Definition for: " + message.Type + " " + message.Name + " on Line No. " + message.LineNo);
                const definitionResource = vscode.Uri.file(message.Path);
                resolve(new Location(definitionResource, new vscode.Position(message.LineNo, 0)));
            }

            message = this.navigateFromVariable(definitionLine, position);
            if (message != undefined) {
                console.log("Definition for: " + message.Type + " " + message.Name);
                const definitionResource = vscode.Uri.file(message.Path);
                resolve(new Location(definitionResource, new vscode.Position(message.LineNo, 0)));
            }

            resolve(undefined);
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
                    Name: name,
                    Path: alObject.path,
                    LineNo: 0
                };

                return message;
            }
        }

        return undefined;
    }

    navigateToDefinition(path, line, position) {
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
        var variableName = line.substring(match.index, match.index + match[0].length);
        let message = this.getVariableDefinition(path, variableName, position.line);
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
            let alFunction = alObject.functions.find(element => element.lineNo == variableStartLineNo);
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
                let message = {
                    Type: alObject.type,
                    Name: alObject.name,
                    Path: path,
                    LineNo: variable.lineNo
                };

                return message;
            }

            if (alFunction != undefined) {
                if (!(alFunction instanceof ALFunction))
                    return undefined;
                let parameter = alFunction.parameters.find(element => element.name == variableName);
                if (parameter == undefined)
                    return undefined;
                
                let message = {
                    Type: alObject.type,
                    Name: alObject.name,
                    Path: path,
                    LineNo: parameter.lineNo
                };
                return message;
            }
        }
    }

    getFunctionDefinition(path, variableName) {
        let alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
        let alFunction = alObject.functions.find(element => element.name == variableName);

        if (alFunction != undefined) {
            let message = {
                Type: alObject.type,
                Name: alObject.name,
                Path: path,
                LineNo: alFunction.lineNo
            };

            return message;
        }
    }

    getFieldDefinition(path, variableName) {
        let alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
        let field = alObject.fields.find(element => element.name == variableName);

        if (field != undefined) {
            let message = {
                Type: alObject.type,
                Name: alObject.name,
                Path: path,
                LineNo: field.lineNo
            };

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
            let message = {
                Type: alObject.type,
                Name: alObject.name,
                Path: alObject.path,
                LineNo: alFunction.lineNo
            };

            return message;
        }

        var field = alObject.fields.find(element => element.name == secondVariableName);
        if (field != undefined) {
            let message = {
                Type: alObject.type,
                Name: alObject.name,
                Path: alObject.path,
                LineNo: field.lineNo
            };

            return message;
        }
    }

    getLastProcedure(path, lineNo) {
        var alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
        var functions = alObject.functions.filter(element => element.lineNo < lineNo);
        if (functions == undefined)
            return -1;
        return functions[functions.length - 1].lineNo;
    }

    regexIndexOf(value, regex, startpos) {
        var indexOf = value.substring(startpos || 0).search(regex);
        return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
    }
}
