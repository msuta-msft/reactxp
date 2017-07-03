/**
* International.ts
*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT license.
*
* Web-specific implementation for i18n.
*/
"use strict";
var International = (function () {
    function International() {
    }
    International.prototype.allowRTL = function (allow) {
        // Need to implement
    };
    International.prototype.forceRTL = function (force) {
        // Need to implement
    };
    International.prototype.isRTL = function () {
        return false;
    };
    return International;
}());
exports.International = International;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new International();
