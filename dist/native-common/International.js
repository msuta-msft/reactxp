/**
* International.ts
*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT license.
*
* RN-specific implementation for i18n.
*/
"use strict";
var RN = require("react-native");
var International = (function () {
    function International() {
    }
    International.prototype.allowRTL = function (allow) {
        RN.I18nManager.allowRTL(allow);
    };
    International.prototype.forceRTL = function (force) {
        RN.I18nManager.forceRTL(force);
    };
    International.prototype.isRTL = function () {
        return RN.I18nManager.isRTL;
    };
    return International;
}());
exports.International = International;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new International();
