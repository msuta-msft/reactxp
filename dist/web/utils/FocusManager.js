/**
* FocusManager.ts
*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT license.
*
* Manages focusable elements for better keyboard navigation.
*/
"use strict";
var ReactDOM = require("react-dom");
var PropTypes = require("prop-types");
var _lastComponentId = 0;
var FocusManager = (function () {
    function FocusManager(parent) {
        this._myFocusableComponentIds = {};
        if (parent) {
            this._parent = parent;
        }
        else if (FocusManager._rootFocusManager) {
            console.error('FocusManager: root is already set');
        }
        else {
            FocusManager._rootFocusManager = this;
        }
    }
    // Whenever the focusable element is mounted, we let the application
    // know so that FocusManager could account for this element during the
    // focus restriction.
    FocusManager.prototype.addFocusableComponent = function (component) {
        if (component._focusableComponentId) {
            return;
        }
        var componentId = 'fc-' + ++_lastComponentId;
        var storedComponent = {
            component: component,
            restricted: false,
            limitedCount: 0,
            onFocus: function () {
                FocusManager._currentFocusedComponent = storedComponent;
            }
        };
        component._focusableComponentId = componentId;
        FocusManager._allFocusableComponents[componentId] = storedComponent;
        var withinRestrictionOwner = false;
        for (var parent_1 = this; parent_1; parent_1 = parent_1._parent) {
            parent_1._myFocusableComponentIds[componentId] = true;
            if (FocusManager._currentRestrictionOwner === parent_1) {
                withinRestrictionOwner = true;
            }
            if (parent_1._isFocusLimited) {
                storedComponent.limitedCount++;
            }
        }
        if (!withinRestrictionOwner && FocusManager._currentRestrictionOwner) {
            storedComponent.restricted = true;
        }
        FocusManager._updateComponentFocusRestriction(storedComponent);
        var el = ReactDOM.findDOMNode(component);
        if (el) {
            el.addEventListener('focus', storedComponent.onFocus);
        }
    };
    FocusManager.prototype.removeFocusableComponent = function (component) {
        var componentId = component._focusableComponentId;
        if (componentId) {
            var storedComponent = FocusManager._allFocusableComponents[componentId];
            var el = ReactDOM.findDOMNode(component);
            if (storedComponent && el) {
                el.removeEventListener('focus', storedComponent.onFocus);
            }
            storedComponent.removed = true;
            storedComponent.restricted = false;
            storedComponent.limitedCount = 0;
            FocusManager._updateComponentFocusRestriction(storedComponent);
            delete storedComponent.callbacks;
            for (var parent_2 = this; parent_2; parent_2 = parent_2._parent) {
                delete parent_2._myFocusableComponentIds[componentId];
            }
            delete FocusManager._allFocusableComponents[componentId];
            delete component._focusableComponentId;
        }
    };
    FocusManager.prototype.restrictFocusWithin = function () {
        var _this = this;
        // Limit the focus received by the keyboard navigation to all
        // the descendant focusable elements by setting tabIndex of all
        // other elements to -1.
        if (FocusManager._currentRestrictionOwner === this) {
            return;
        }
        if (FocusManager._currentRestrictionOwner) {
            FocusManager._removeFocusRestriction();
        }
        FocusManager._restrictionStack.push(this);
        FocusManager._currentRestrictionOwner = this;
        this._prevFocusedComponent = FocusManager._currentFocusedComponent;
        if (this._prevFocusedComponent && !this._prevFocusedComponent.removed) {
            var el = ReactDOM.findDOMNode(this._prevFocusedComponent.component);
            if (el && el.blur) {
                el.blur();
            }
        }
        Object.keys(FocusManager._allFocusableComponents).forEach(function (componentId) {
            if (!(componentId in _this._myFocusableComponentIds)) {
                var storedComponent = FocusManager._allFocusableComponents[componentId];
                storedComponent.restricted = true;
                FocusManager._updateComponentFocusRestriction(storedComponent);
            }
        });
    };
    FocusManager.prototype.removeFocusRestriction = function () {
        var _this = this;
        // Restore the focus to the previous view with restrictFocusWithin or
        // remove the restriction if there is no such view.
        FocusManager._restrictionStack = FocusManager._restrictionStack.filter(function (focusManager) {
            return focusManager !== _this;
        });
        var prevFocusedComponent = this._prevFocusedComponent;
        delete this._prevFocusedComponent;
        if (FocusManager._currentRestrictionOwner === this) {
            FocusManager._removeFocusRestriction();
            var prevRestrictionOwner = FocusManager._restrictionStack.pop();
            FocusManager._currentRestrictionOwner = undefined;
            if (prevRestrictionOwner) {
                prevRestrictionOwner.restrictFocusWithin();
            }
            // If possible, focus the element which was focused before the restriction.
            if (prevFocusedComponent && !prevFocusedComponent.removed &&
                !prevFocusedComponent.restricted && !prevFocusedComponent.limitedCount) {
                var el = ReactDOM.findDOMNode(prevFocusedComponent.component);
                if (el && el.focus) {
                    el.focus();
                }
            }
        }
    };
    FocusManager.prototype.limitFocusWithin = function () {
        if (this._isFocusLimited) {
            return;
        }
        this._isFocusLimited = true;
        Object.keys(this._myFocusableComponentIds).forEach(function (componentId) {
            var storedComponent = FocusManager._allFocusableComponents[componentId];
            storedComponent.limitedCount++;
            FocusManager._updateComponentFocusRestriction(storedComponent);
        });
    };
    FocusManager.prototype.removeFocusLimitation = function () {
        if (!this._isFocusLimited) {
            return;
        }
        Object.keys(this._myFocusableComponentIds).forEach(function (componentId) {
            var storedComponent = FocusManager._allFocusableComponents[componentId];
            storedComponent.limitedCount--;
            FocusManager._updateComponentFocusRestriction(storedComponent);
        });
        this._isFocusLimited = false;
    };
    FocusManager.prototype.release = function () {
        this.removeFocusRestriction();
        this.removeFocusLimitation();
    };
    FocusManager.prototype.subscribe = function (component, callback) {
        var storedComponent = FocusManager._getStoredComponent(component);
        if (storedComponent) {
            if (!storedComponent.callbacks) {
                storedComponent.callbacks = [];
            }
            storedComponent.callbacks.push(callback);
        }
    };
    FocusManager.prototype.unsubscribe = function (component, callback) {
        var storedComponent = FocusManager._getStoredComponent(component);
        if (storedComponent && storedComponent.callbacks) {
            storedComponent.callbacks = storedComponent.callbacks.filter(function (cb) {
                return cb !== callback;
            });
        }
    };
    FocusManager.prototype.isComponentFocusRestrictedOrLimited = function (component) {
        var storedComponent = FocusManager._getStoredComponent(component);
        return storedComponent && (storedComponent.restricted || storedComponent.limitedCount > 0);
    };
    FocusManager._getStoredComponent = function (component) {
        var componentId = component._focusableComponentId;
        if (componentId) {
            return FocusManager._allFocusableComponents[componentId];
        }
        return null;
    };
    FocusManager._callFocusableComponentStateChangeCallbacks = function (storedComponent, restrictedOrLimited) {
        if (!storedComponent.callbacks) {
            return;
        }
        storedComponent.callbacks.forEach(function (callback) {
            callback.call(storedComponent.component, restrictedOrLimited);
        });
    };
    FocusManager._removeFocusRestriction = function () {
        Object.keys(FocusManager._allFocusableComponents).forEach(function (componentId) {
            var storedComponent = FocusManager._allFocusableComponents[componentId];
            storedComponent.restricted = false;
            FocusManager._updateComponentFocusRestriction(storedComponent);
        });
    };
    FocusManager._setTabIndex = function (component, value) {
        var el = ReactDOM.findDOMNode(component);
        if (el) {
            var prev = el.hasAttribute('tabindex') ? el.tabIndex : undefined;
            if (value === undefined) {
                if (prev !== undefined) {
                    el.removeAttribute('tabindex');
                }
            }
            else {
                el.tabIndex = value;
            }
            return prev;
        }
        return null;
    };
    FocusManager._updateComponentFocusRestriction = function (storedComponent) {
        if ((storedComponent.restricted || (storedComponent.limitedCount > 0)) && !('origTabIndex' in storedComponent)) {
            storedComponent.origTabIndex = FocusManager._setTabIndex(storedComponent.component, -1);
            FocusManager._callFocusableComponentStateChangeCallbacks(storedComponent, true);
        }
        else if (!storedComponent.restricted && !storedComponent.limitedCount && ('origTabIndex' in storedComponent)) {
            FocusManager._setTabIndex(storedComponent.component, storedComponent.origTabIndex);
            delete storedComponent.origTabIndex;
            FocusManager._callFocusableComponentStateChangeCallbacks(storedComponent, false);
        }
    };
    return FocusManager;
}());
FocusManager._restrictionStack = [];
FocusManager._allFocusableComponents = {};
exports.FocusManager = FocusManager;
// A mixin for the focusable elements, to tell the views that
// they exist and should be accounted during the focus restriction.
//
// isConditionallyFocusable is an optional callback which will be
// called for componentDidMount() or for componentWillUpdate() to
// determine if the component is actually focusable.
function applyFocusableComponentMixin(Component, isConditionallyFocusable) {
    var contextTypes = Component.contextTypes || {};
    contextTypes.focusManager = PropTypes.object;
    Component.contextTypes = contextTypes;
    inheritMethod('componentDidMount', function (focusManager) {
        if (!isConditionallyFocusable || isConditionallyFocusable.call(this)) {
            focusManager.addFocusableComponent(this);
        }
    });
    inheritMethod('componentWillUnmount', function (focusManager) {
        focusManager.removeFocusableComponent(this);
    });
    inheritMethod('componentWillUpdate', function (focusManager, origArguments) {
        if (isConditionallyFocusable) {
            var isFocusable = isConditionallyFocusable.apply(this, origArguments);
            if (isFocusable && !this._focusableComponentId) {
                focusManager.addFocusableComponent(this);
            }
            else if (!isFocusable && this._focusableComponentId) {
                focusManager.removeFocusableComponent(this);
            }
        }
    });
    function inheritMethod(methodName, action) {
        var origCallback = Component.prototype[methodName];
        Component.prototype[methodName] = function () {
            var focusManager = this._focusManager || (this.context && this.context.focusManager);
            if (focusManager) {
                action.call(this, focusManager, arguments);
            }
            else {
                console.error('FocusableComponentMixin: context error!');
            }
            if (origCallback) {
                origCallback.apply(this, arguments);
            }
        };
    }
}
exports.applyFocusableComponentMixin = applyFocusableComponentMixin;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FocusManager;
