const vscode = require('vscode');
const { Location, Uri } = require("vscode");
var readLine = require('readline');
const { readlink } = require('fs');

module.exports = class ALDefinitionProvider {
    provideDefinition(textDocument, position, token) {
        return new Promise(async (resolve) => {
            var definitionLine = "";
            var counter = 0;
            var readStream = readLine.createInterface({
                input: (require('fs').createReadStream(textDocument.fileName))
            })
            await new Promise((resolve) => {
                readStream.on('line', function (line) {
                    if (counter == position.line) {
                        definitionLine = line;
                        resolve();
                    }
                    counter++;
                });
            });

            if (/\s/.test(definitionLine[position.character])) {
                return new Location(Uri.parse(''), position);
            }

            var firstMatchPos = 0;
            var secondMatchPos = 0;
            var match = /[^a-zA-Z0-9&\/ -]/.exec(definitionLine.substring(position.character));
            if (match) {
                console.log("\"" + definitionLine.substr(position.character + match.index, 2) + "\"");
                if (definitionLine.substring(position.character)[match.index] == '.') {
                    if (definitionLine.substr(position.character + match.index, 2).endsWith("\""))
                        secondMatchPos = position.character + match.index + 2;
                }
                else if (definitionLine.substring(position.character)[match.index] == '"'){
                    secondMatchPos = position.character + match.index + 1;
                }
                else
                    secondMatchPos = position.character + match.index;
            }

            const positionReversed = definitionLine.length - position.character;
            var definitionLineReversed = definitionLine.split("").reverse().join("");
            var match = /[^a-zA-Z0-9&\/ -]/.exec(definitionLineReversed.substring(positionReversed));
            if (match) {
                console.log("\"" + definitionLine.substr(definitionLine.length - positionReversed - match.index - 1, 1) + "\"");
                if (definitionLine.substr(definitionLine.length - positionReversed - match.index - 1, 1) == "\"")
                    firstMatchPos = definitionLine.length - positionReversed - match.index - 1;
                else
                    firstMatchPos = definitionLine.length - positionReversed - match.index;
            }
            console.log("Definition for: " + definitionLine.substring(firstMatchPos, secondMatchPos).trim());
            return new Location(Uri.parse(''), position);
        });
    }
}