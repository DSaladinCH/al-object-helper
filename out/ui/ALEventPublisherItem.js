"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALEventPublisherItem = void 0;
class ALEventPublisherItem {
    constructor(alFunction) {
        this.description = "";
        this.detail = "";
        this.label = alFunction.functionName + alFunction.elementName.replace(/\W/g, "");
        this.alFunction = alFunction;
    }
}
exports.ALEventPublisherItem = ALEventPublisherItem;
//# sourceMappingURL=ALEventPublisherItem.js.map