const vscode = require('vscode');
const util = require('util');
const { Location, Uri } = require("vscode");
var readLine = require('readline');
const { readlink } = require('fs');

module.exports = class ALDefinitionProvider {
    constructor(reader) {
        this.reader = reader;
    }
    provideDefinition(textDocument, position, token) {
        return new Promise(async (resolve) => {
            // var definitionLine = "";
            // var counter = 0;
            // var readStream = readLine.createInterface({
            //     input: (require('fs').createReadStream(textDocument.fileName))
            // })
            // await new Promise((resolve) => {
            //     readStream.on('line', function (line) {
            //         if (counter == position.line) {
            //             definitionLine = line;
            //             resolve();
            //         }
            //         counter++;
            //     });
            // });

            var definitionLine = textDocument.lineAt(position.line).text;

            //console.log(textDocument);
            let message = this.navigateToVariable(textDocument.fileName, definitionLine, position);
            if (message != undefined) {
                console.log("Go to line No: " + message.lineNo);
                const definitionResource = vscode.Uri.file(textDocument.fileName);
                resolve(new Location(definitionResource, new vscode.Position(message.lineNo, 0)));
            }

            let message2 = this.navigateFromVariable(definitionLine, position);

            if (message2 != undefined) {
                console.log("Definition for: " + message2.Type + " " + message2.Name);
                var alObject = this.reader.alObjects.findLast(element => element.type == message2.Type.toLowerCase() && element.name.toLowerCase() == message2.Name.toLowerCase());
                if (alObject != undefined) {
                    const definitionResource = vscode.Uri.file(alObject.path);
                    resolve(new Location(definitionResource, new vscode.Position(0, 0)));
                }
            }

            // if (/\s/.test(definitionLine[position.character])) {
            //     return new Location(Uri.parse(''), position);
            // }

            // var firstMatchPos = 0;
            // var secondMatchPos = 0;
            // var match = /[^a-zA-Z0-9&\/ -]/.exec(definitionLine.substring(position.character));
            // if (match) {
            //     console.log("\"" + definitionLine.substr(position.character + match.index, 2) + "\"");
            //     if (definitionLine.substring(position.character)[match.index] == '.') {
            //         if (definitionLine.substr(position.character + match.index, 2).endsWith("\""))
            //             secondMatchPos = position.character + match.index + 2;
            //     }
            //     else if (definitionLine.substring(position.character)[match.index] == '"') {
            //         secondMatchPos = position.character + match.index + 1;
            //     }
            //     else
            //         secondMatchPos = position.character + match.index;
            // }

            // const positionReversed = definitionLine.length - position.character;
            // var definitionLineReversed = definitionLine.split("").reverse().join("");
            // var match = /[^a-zA-Z0-9&\/ -]/.exec(definitionLineReversed.substring(positionReversed));
            // if (match) {
            //     console.log("\"" + definitionLine.substr(definitionLine.length - positionReversed - match.index - 1, 1) + "\"");
            //     if (definitionLine.substr(definitionLine.length - positionReversed - match.index - 1, 1) == "\"")
            //         firstMatchPos = definitionLine.length - positionReversed - match.index - 1;
            //     else
            //         firstMatchPos = definitionLine.length - positionReversed - match.index;
            // }
            // console.log("Definition for: " + definitionLine.substring(firstMatchPos, secondMatchPos).trim());
            return new Location(Uri.parse(''), position);
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

            let message = {
                Command: 'Definition',
                Type: type,
                Name: name
            };

            return message;
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
        var variableName = line.substring(match.index, match.index + match[0].length);

        //indexes.push([match.index, match.index + match[0].length]);

        // var leftText, rightText;
        // leftText = line.substring(0, position.character);
        // rightText = line.substring(position.character);

        // var startPos = 0, endPos = 0;

        // var regexMatch = /[^a-zA-Z0-9&\/ -]/.exec(rightText);
        // if (regexMatch) {
        //     endPos = position.character + regexMatch.index
        // }

        // leftText = leftText.split("").reverse().join("");
        // var regexMatch = /[^a-zA-Z0-9&\/ -]/.exec(leftText);
        // if (regexMatch) {
        //     startPos = leftText.length - regexMatch.index;
        // }

        // var variableName = line.substring(startPos, endPos).trim();
        let variableStartLineNo = this.getLastProcedure(path, position.line);
        let variableEndLineNo = position.line;
        if (variableStartLineNo != -1) {
            let alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
            let variables = alObject.variables.filter(element => element.lineNo > variableStartLineNo && element.lineNo < variableEndLineNo);
            if (variables == undefined || variables.length == 0) {
                variables = alObject.variables.filter(element => !element.local);
            }
            let variable = variables.reverse().find(element => element.name == variableName);
            if (variable == undefined){
                variables = alObject.variables.filter(element => !element.local);
                variable = variables.reverse().find(element => element.name == variableName);
            }
            if (variable != undefined) {
                let message = {
                    Command: 'Definition',
                    lineNo: variable.lineNo
                };

                return message;
            }
        }
    }

    getLastProcedure(path, lineNo) {
        var alObject = this.reader.alObjects.find(element => element.path.toLowerCase() == path.toLowerCase());
        var functions = alObject.functions.filter(element => element.lineNo < lineNo);
        if (functions == undefined)
            return -1;
        return functions[functions.length - 1].lineNo;
    }
}