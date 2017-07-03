/**
* FocusManager.ts
*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT license.
*
* Manages focusable elements for better keyboard navigation.
*/
import React = require('react');
export declare type FocusableComponentStateCallback = (restrictedOrLimited: boolean) => void;
export declare class FocusManager {
    private _parent;
    private static _rootFocusManager;
    private static _restrictionStack;
    private static _currentRestrictionOwner;
    private _isFocusLimited;
    private static _currentFocusedComponent;
    private _prevFocusedComponent;
    private static _allFocusableComponents;
    private _myFocusableComponentIds;
    constructor(parent: FocusManager);
    addFocusableComponent(component: React.Component<any, any>): void;
    removeFocusableComponent(component: React.Component<any, any>): void;
    restrictFocusWithin(): void;
    removeFocusRestriction(): void;
    limitFocusWithin(): void;
    removeFocusLimitation(): void;
    release(): void;
    subscribe(component: React.Component<any, any>, callback: FocusableComponentStateCallback): void;
    unsubscribe(component: React.Component<any, any>, callback: FocusableComponentStateCallback): void;
    isComponentFocusRestrictedOrLimited(component: React.Component<any, any>): boolean;
    private static _getStoredComponent(component);
    private static _callFocusableComponentStateChangeCallbacks(storedComponent, restrictedOrLimited);
    private static _removeFocusRestriction();
    private static _setTabIndex(component, value);
    private static _updateComponentFocusRestriction(storedComponent);
}
export declare function applyFocusableComponentMixin(Component: any, isConditionallyFocusable?: Function): void;
export default FocusManager;
