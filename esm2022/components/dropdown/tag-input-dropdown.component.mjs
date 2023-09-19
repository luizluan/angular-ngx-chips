import { Component, ContentChildren, HostListener, Input, TemplateRef, ViewChild } from '@angular/core';
import { filter, first, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Ng2Dropdown } from 'ng2-material-dropdown';
import { defaults } from '../../defaults';
import { TagInputComponent } from '../tag-input/tag-input';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "ng2-material-dropdown";
import * as i3 from "../../core/pipes/highlight.pipe";
class TagInputDropdown {
    injector;
    /**
     * @name dropdown
     */
    dropdown;
    /**
     * @name menuTemplate
     * @desc reference to the template if provided by the user
     */
    templates;
    /**
     * @name offset
     */
    offset = defaults.dropdown.offset;
    /**
     * @name focusFirstElement
     */
    focusFirstElement = defaults.dropdown.focusFirstElement;
    /**
     * - show autocomplete dropdown if the value of input is empty
     * @name showDropdownIfEmpty
     */
    showDropdownIfEmpty = defaults.dropdown.showDropdownIfEmpty;
    /**
     * @description observable passed as input which populates the autocomplete items
     * @name autocompleteObservable
     */
    autocompleteObservable;
    /**
     * - desc minimum text length in order to display the autocomplete dropdown
     * @name minimumTextLength
     */
    minimumTextLength = defaults.dropdown.minimumTextLength;
    /**
     * - number of items to display in the autocomplete dropdown
     * @name limitItemsTo
     */
    limitItemsTo = defaults.dropdown.limitItemsTo;
    /**
     * @name displayBy
     */
    displayBy = defaults.dropdown.displayBy;
    /**
     * @name identifyBy
     */
    identifyBy = defaults.dropdown.identifyBy;
    /**
     * @description a function a developer can use to implement custom matching for the autocomplete
     * @name matchingFn
     */
    matchingFn = defaults.dropdown.matchingFn;
    /**
     * @name appendToBody
     */
    appendToBody = defaults.dropdown.appendToBody;
    /**
     * @name keepOpen
     * @description option to leave dropdown open when adding a new item
     */
    keepOpen = defaults.dropdown.keepOpen;
    /**
     * @name dynamicUpdate
     */
    dynamicUpdate = defaults.dropdown.dynamicUpdate;
    /**
     * @name zIndex
     */
    zIndex = defaults.dropdown.zIndex;
    /**
     * list of items that match the current value of the input (for autocomplete)
     * @name items
     */
    items = [];
    /**
     * @name tagInput
     */
    tagInput;
    /**
     * @name _autocompleteItems
     */
    _autocompleteItems = [];
    /**
     * @name autocompleteItems
     * @param items
     */
    set autocompleteItems(items) {
        this._autocompleteItems = items;
    }
    /**
     * @name autocompleteItems
     * @desc array of items that will populate the autocomplete
     */
    get autocompleteItems() {
        const items = this._autocompleteItems;
        if (!items) {
            return [];
        }
        return items.map((item) => {
            return typeof item === 'string'
                ? {
                    [this.displayBy]: item,
                    [this.identifyBy]: item
                }
                : item;
        });
    }
    constructor(injector) {
        this.injector = injector;
        this.tagInput = this.injector.get(TagInputComponent);
    }
    /**
     * @name ngAfterviewInit
     */
    ngAfterViewInit() {
        this.onItemClicked().subscribe((item) => {
            this.requestAdding(item);
        });
        // reset itemsMatching array when the dropdown is hidden
        this.onHide().subscribe(this.resetItems);
        const DEBOUNCE_TIME = 200;
        const KEEP_OPEN = this.keepOpen;
        this.tagInput.onTextChange
            .asObservable()
            .pipe(distinctUntilChanged(), debounceTime(DEBOUNCE_TIME), filter((value) => {
            if (KEEP_OPEN === false) {
                return value.length > 0;
            }
            return true;
        }))
            .subscribe(this.show);
    }
    /**
     * @name updatePosition
     */
    updatePosition() {
        const position = this.tagInput.inputForm.getElementPosition();
        this.dropdown.menu.updatePosition(position, this.dynamicUpdate);
    }
    /**
     * @name isVisible
     */
    get isVisible() {
        return this.dropdown.menu.dropdownState.menuState.isVisible;
    }
    /**
     * @name onHide
     */
    onHide() {
        return this.dropdown.onHide;
    }
    /**
     * @name onItemClicked
     */
    onItemClicked() {
        return this.dropdown.onItemClicked;
    }
    /**
     * @name selectedItem
     */
    get selectedItem() {
        return this.dropdown.menu.dropdownState.dropdownState.selectedItem;
    }
    /**
     * @name state
     */
    get state() {
        return this.dropdown.menu.dropdownState;
    }
    /**
     *
     * @name show
     */
    show = () => {
        const maxItemsReached = this.tagInput.items.length === this.tagInput.maxItems;
        const value = this.getFormValue();
        const hasMinimumText = value.trim().length >= this.minimumTextLength;
        const position = this.calculatePosition();
        const items = this.getMatchingItems(value);
        const hasItems = items.length > 0;
        const isHidden = this.isVisible === false;
        const showDropdownIfEmpty = this.showDropdownIfEmpty && hasItems && !value;
        const isDisabled = this.tagInput.disable;
        const shouldShow = isHidden && ((hasItems && hasMinimumText) || showDropdownIfEmpty);
        const shouldHide = this.isVisible && !hasItems;
        if (this.autocompleteObservable && hasMinimumText) {
            return this.getItemsFromObservable(value);
        }
        if ((!this.showDropdownIfEmpty && !value) ||
            maxItemsReached ||
            isDisabled) {
            return this.dropdown.hide();
        }
        this.setItems(items);
        if (shouldShow) {
            this.dropdown.show(position);
        }
        else if (shouldHide) {
            this.hide();
        }
    };
    /**
     * @name hide
     */
    hide() {
        this.resetItems();
        this.dropdown.hide();
    }
    /**
     * @name scrollListener
     */
    scrollListener() {
        if (!this.isVisible || !this.dynamicUpdate) {
            return;
        }
        this.updatePosition();
    }
    /**
     * @name onWindowBlur
     */
    onWindowBlur() {
        this.dropdown.hide();
    }
    /**
     * @name getFormValue
     */
    getFormValue() {
        const formValue = this.tagInput.formValue;
        return formValue ? formValue.toString().trim() : '';
    }
    /**
     * @name calculatePosition
     */
    calculatePosition() {
        return this.tagInput.inputForm.getElementPosition();
    }
    /**
     * @name requestAdding
     * @param item {Ng2MenuItem}
     */
    requestAdding = async (item) => {
        const tag = this.createTagModel(item);
        await this.tagInput.onAddingRequested(true, tag).catch(() => { });
    };
    /**
     * @name createTagModel
     * @param item
     */
    createTagModel(item) {
        const display = typeof item.value === 'string' ? item.value : item.value[this.displayBy];
        const value = typeof item.value === 'string' ? item.value : item.value[this.identifyBy];
        return {
            ...item.value,
            [this.tagInput.displayBy]: display,
            [this.tagInput.identifyBy]: value
        };
    }
    /**
     *
     * @param value {string}
     */
    getMatchingItems(value) {
        if (!value && !this.showDropdownIfEmpty) {
            return [];
        }
        const dupesAllowed = this.tagInput.allowDupes;
        return this.autocompleteItems.filter((item) => {
            const hasValue = dupesAllowed
                ? false
                : this.tagInput.tags.some(tag => {
                    const identifyBy = this.tagInput.identifyBy;
                    const model = typeof tag.model === 'string' ? tag.model : tag.model[identifyBy];
                    return model === item[this.identifyBy];
                });
            return this.matchingFn(value, item) && hasValue === false;
        });
    }
    /**
     * @name setItems
     */
    setItems(items) {
        this.items = items.slice(0, this.limitItemsTo || items.length);
    }
    /**
     * @name resetItems
     */
    resetItems = () => {
        this.items = [];
    };
    /**
     * @name populateItems
     * @param data
     */
    populateItems(data) {
        this.autocompleteItems = data.map(item => {
            return typeof item === 'string'
                ? {
                    [this.displayBy]: item,
                    [this.identifyBy]: item
                }
                : item;
        });
        return this;
    }
    /**
     * @name getItemsFromObservable
     * @param text
     */
    getItemsFromObservable = (text) => {
        this.setLoadingState(true);
        const subscribeFn = (data) => {
            // hide loading animation
            this.setLoadingState(false)
                // add items
                .populateItems(data);
            this.setItems(this.getMatchingItems(text));
            if (this.items.length) {
                this.dropdown.show(this.calculatePosition());
            }
            else {
                this.dropdown.hide();
            }
        };
        this.autocompleteObservable(text)
            .pipe(first())
            .subscribe(subscribeFn, () => this.setLoadingState(false));
    };
    /**
     * @name setLoadingState
     * @param state
     */
    setLoadingState(state) {
        this.tagInput.isLoading = state;
        return this;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.2", ngImport: i0, type: TagInputDropdown, deps: [{ token: i0.Injector }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.0.2", type: TagInputDropdown, selector: "tag-input-dropdown", inputs: { offset: "offset", focusFirstElement: "focusFirstElement", showDropdownIfEmpty: "showDropdownIfEmpty", autocompleteObservable: "autocompleteObservable", minimumTextLength: "minimumTextLength", limitItemsTo: "limitItemsTo", displayBy: "displayBy", identifyBy: "identifyBy", matchingFn: "matchingFn", appendToBody: "appendToBody", keepOpen: "keepOpen", dynamicUpdate: "dynamicUpdate", zIndex: "zIndex", autocompleteItems: "autocompleteItems" }, host: { listeners: { "window:scroll": "scrollListener()", "window:blur": "onWindowBlur()" } }, queries: [{ propertyName: "templates", predicate: TemplateRef }], viewQueries: [{ propertyName: "dropdown", first: true, predicate: Ng2Dropdown, descendants: true }], ngImport: i0, template: "<ng2-dropdown [dynamicUpdate]=\"dynamicUpdate\">\r\n    <ng2-dropdown-menu [focusFirstElement]=\"focusFirstElement\"\r\n                       [zIndex]=\"zIndex\"\r\n                       [appendToBody]=\"appendToBody\"\r\n                       [offset]=\"offset\">\r\n        <ng2-menu-item *ngFor=\"let item of items; let index = index; let last = last\"\r\n                       [value]=\"item\"\r\n                       [ngSwitch]=\"!!templates.length\">\r\n\r\n            <span *ngSwitchCase=\"false\"\r\n                  [innerHTML]=\"item[displayBy] | highlight : tagInput.inputForm.value.value\">\r\n            </span>\r\n\r\n            <ng-template *ngSwitchDefault\r\n                      [ngTemplateOutlet]=\"templates.first\"\r\n                      [ngTemplateOutletContext]=\"{ item: item, index: index, last: last }\">\r\n            </ng-template>\r\n        </ng2-menu-item>\r\n    </ng2-dropdown-menu>\r\n</ng2-dropdown>\r\n", dependencies: [{ kind: "directive", type: i1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: i1.NgSwitch, selector: "[ngSwitch]", inputs: ["ngSwitch"] }, { kind: "directive", type: i1.NgSwitchCase, selector: "[ngSwitchCase]", inputs: ["ngSwitchCase"] }, { kind: "directive", type: i1.NgSwitchDefault, selector: "[ngSwitchDefault]" }, { kind: "component", type: i2.Ng2MenuItem, selector: "ng2-menu-item", inputs: ["preventClose", "value"] }, { kind: "component", type: i2.Ng2DropdownMenu, selector: "ng2-dropdown-menu", inputs: ["width", "focusFirstElement", "offset", "appendToBody", "zIndex"] }, { kind: "component", type: i2.Ng2Dropdown, selector: "ng2-dropdown", inputs: ["dynamicUpdate"], outputs: ["onItemClicked", "onItemSelected", "onShow", "onHide"] }, { kind: "pipe", type: i3.HighlightPipe, name: "highlight" }] });
}
export { TagInputDropdown };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.2", ngImport: i0, type: TagInputDropdown, decorators: [{
            type: Component,
            args: [{ selector: 'tag-input-dropdown', template: "<ng2-dropdown [dynamicUpdate]=\"dynamicUpdate\">\r\n    <ng2-dropdown-menu [focusFirstElement]=\"focusFirstElement\"\r\n                       [zIndex]=\"zIndex\"\r\n                       [appendToBody]=\"appendToBody\"\r\n                       [offset]=\"offset\">\r\n        <ng2-menu-item *ngFor=\"let item of items; let index = index; let last = last\"\r\n                       [value]=\"item\"\r\n                       [ngSwitch]=\"!!templates.length\">\r\n\r\n            <span *ngSwitchCase=\"false\"\r\n                  [innerHTML]=\"item[displayBy] | highlight : tagInput.inputForm.value.value\">\r\n            </span>\r\n\r\n            <ng-template *ngSwitchDefault\r\n                      [ngTemplateOutlet]=\"templates.first\"\r\n                      [ngTemplateOutletContext]=\"{ item: item, index: index, last: last }\">\r\n            </ng-template>\r\n        </ng2-menu-item>\r\n    </ng2-dropdown-menu>\r\n</ng2-dropdown>\r\n" }]
        }], ctorParameters: function () { return [{ type: i0.Injector }]; }, propDecorators: { dropdown: [{
                type: ViewChild,
                args: [Ng2Dropdown]
            }], templates: [{
                type: ContentChildren,
                args: [TemplateRef]
            }], offset: [{
                type: Input
            }], focusFirstElement: [{
                type: Input
            }], showDropdownIfEmpty: [{
                type: Input
            }], autocompleteObservable: [{
                type: Input
            }], minimumTextLength: [{
                type: Input
            }], limitItemsTo: [{
                type: Input
            }], displayBy: [{
                type: Input
            }], identifyBy: [{
                type: Input
            }], matchingFn: [{
                type: Input
            }], appendToBody: [{
                type: Input
            }], keepOpen: [{
                type: Input
            }], dynamicUpdate: [{
                type: Input
            }], zIndex: [{
                type: Input
            }], autocompleteItems: [{
                type: Input
            }], scrollListener: [{
                type: HostListener,
                args: ['window:scroll']
            }], onWindowBlur: [{
                type: HostListener,
                args: ['window:blur']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLWlucHV0LWRyb3Bkb3duLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL21vZHVsZXMvY29tcG9uZW50cy9kcm9wZG93bi90YWctaW5wdXQtZHJvcGRvd24uY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vbW9kdWxlcy9jb21wb25lbnRzL2Ryb3Bkb3duL3RhZy1pbnB1dC1kcm9wZG93bi50ZW1wbGF0ZS5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCxTQUFTLEVBQ1QsZUFBZSxFQUVmLFlBQVksRUFFWixLQUFLLEVBRUwsV0FBVyxFQUNYLFNBQVMsRUFFVixNQUFNLGVBQWUsQ0FBQztBQUl2QixPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUVuRixPQUFPLEVBQUUsV0FBVyxFQUFlLE1BQU0sdUJBQXVCLENBQUM7QUFDakUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHdCQUF3QixDQUFDOzs7OztBQUczRCxNQUlhLGdCQUFnQjtJQWlJRTtJQWhJN0I7O09BRUc7SUFDNEIsUUFBUSxDQUFjO0lBRXJEOzs7T0FHRztJQUNrQyxTQUFTLENBQThCO0lBRTVFOztPQUVHO0lBQ2EsTUFBTSxHQUFXLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBRTFEOztPQUVHO0lBQ2EsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztJQUV4RTs7O09BR0c7SUFDYSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDO0lBRTVFOzs7T0FHRztJQUNhLHNCQUFzQixDQUFvQztJQUUxRTs7O09BR0c7SUFDYSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLGlC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QkFNVSxVQUFVO3NCQUF6QixLQUFLO2dCQU1VLFlBQVk7c0JBQTNCLEtBQUs7Z0JBTVUsUUFBUTtzQkFBdkIsS0FBSztnQkFLVSxhQUFhO3NCQUE1QixLQUFLO2dCQUtVLE1BQU07c0JBQXJCLEtBQUs7Z0JBOEJjLGlCQUFpQjtzQkFBcEMsS0FBSztnQkFvSkMsY0FBYztzQkFEcEIsWUFBWTt1QkFBQyxlQUFlO2dCQWF0QixZQUFZO3NCQURsQixZQUFZO3VCQUFDLGFBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIENvbXBvbmVudCxcclxuICBDb250ZW50Q2hpbGRyZW4sXHJcbiAgRXZlbnRFbWl0dGVyLFxyXG4gIEhvc3RMaXN0ZW5lcixcclxuICBJbmplY3RvcixcclxuICBJbnB1dCxcclxuICBRdWVyeUxpc3QsXHJcbiAgVGVtcGxhdGVSZWYsXHJcbiAgVmlld0NoaWxkLFxyXG4gIEFmdGVyVmlld0luaXRcclxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuXHJcbi8vIHJ4XHJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgZmlsdGVyLCBmaXJzdCwgZGVib3VuY2VUaW1lLCBkaXN0aW5jdFVudGlsQ2hhbmdlZCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuXHJcbmltcG9ydCB7IE5nMkRyb3Bkb3duLCBOZzJNZW51SXRlbSB9IGZyb20gJ25nMi1tYXRlcmlhbC1kcm9wZG93bic7XHJcbmltcG9ydCB7IGRlZmF1bHRzIH0gZnJvbSAnLi4vLi4vZGVmYXVsdHMnO1xyXG5pbXBvcnQgeyBUYWdJbnB1dENvbXBvbmVudCB9IGZyb20gJy4uL3RhZy1pbnB1dC90YWctaW5wdXQnO1xyXG5pbXBvcnQge1RhZ01vZGVsfSBmcm9tICcuLi8uLi9jb3JlL3RhZy1tb2RlbCc7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ3RhZy1pbnB1dC1kcm9wZG93bicsXHJcbiAgdGVtcGxhdGVVcmw6ICcuL3RhZy1pbnB1dC1kcm9wZG93bi50ZW1wbGF0ZS5odG1sJ1xyXG59KVxyXG5leHBvcnQgY2xhc3MgVGFnSW5wdXREcm9wZG93biBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQge1xyXG4gIC8qKlxyXG4gICAqIEBuYW1lIGRyb3Bkb3duXHJcbiAgICovXHJcbiAgQFZpZXdDaGlsZChOZzJEcm9wZG93bikgcHVibGljIGRyb3Bkb3duOiBOZzJEcm9wZG93bjtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgbWVudVRlbXBsYXRlXHJcbiAgICogQGRlc2MgcmVmZXJlbmNlIHRvIHRoZSB0ZW1wbGF0ZSBpZiBwcm92aWRlZCBieSB0aGUgdXNlclxyXG4gICAqL1xyXG4gIEBDb250ZW50Q2hpbGRyZW4oVGVtcGxhdGVSZWYpIHB1YmxpYyB0ZW1wbGF0ZXM6IFF1ZXJ5TGlzdDxUZW1wbGF0ZVJlZjxhbnk+PjtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgb2Zmc2V0XHJcbiAgICovXHJcbiAgQElucHV0KCkgcHVibGljIG9mZnNldDogc3RyaW5nID0gZGVmYXVsdHMuZHJvcGRvd24ub2Zmc2V0O1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBmb2N1c0ZpcnN0RWxlbWVudFxyXG4gICAqL1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBmb2N1c0ZpcnN0RWxlbWVudCA9IGRlZmF1bHRzLmRyb3Bkb3duLmZvY3VzRmlyc3RFbGVtZW50O1xyXG5cclxuICAvKipcclxuICAgKiAtIHNob3cgYXV0b2NvbXBsZXRlIGRyb3Bkb3duIGlmIHRoZSB2YWx1ZSBvZiBpbnB1dCBpcyBlbXB0eVxyXG4gICAqIEBuYW1lIHNob3dEcm9wZG93bklmRW1wdHlcclxuICAgKi9cclxuICBASW5wdXQoKSBwdWJsaWMgc2hvd0Ryb3Bkb3duSWZFbXB0eSA9IGRlZmF1bHRzLmRyb3Bkb3duLnNob3dEcm9wZG93bklmRW1wdHk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBkZXNjcmlwdGlvbiBvYnNlcnZhYmxlIHBhc3NlZCBhcyBpbnB1dCB3aGljaCBwb3B1bGF0ZXMgdGhlIGF1dG9jb21wbGV0ZSBpdGVtc1xyXG4gICAqIEBuYW1lIGF1dG9jb21wbGV0ZU9ic2VydmFibGVcclxuICAgKi9cclxuICBASW5wdXQoKSBwdWJsaWMgYXV0b2NvbXBsZXRlT2JzZXJ2YWJsZTogKHRleHQ6IHN0cmluZykgPT4gT2JzZXJ2YWJsZTxhbnk+O1xyXG5cclxuICAvKipcclxuICAgKiAtIGRlc2MgbWluaW11bSB0ZXh0IGxlbmd0aCBpbiBvcmRlciB0byBkaXNwbGF5IHRoZSBhdXRvY29tcGxldGUgZHJvcGRvd25cclxuICAgKiBAbmFtZSBtaW5pbXVtVGV4dExlbmd0aFxyXG4gICAqL1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBtaW5pbXVtVGV4dExlbmd0aCA9IGRlZmF1bHRzLmRyb3Bkb3duLm1pbmltdW1UZXh0TGVuZ3RoO1xyXG5cclxuICAvKipcclxuICAgKiAtIG51bWJlciBvZiBpdGVtcyB0byBkaXNwbGF5IGluIHRoZSBhdXRvY29tcGxldGUgZHJvcGRvd25cclxuICAgKiBAbmFtZSBsaW1pdEl0ZW1zVG9cclxuICAgKi9cclxuICBASW5wdXQoKSBwdWJsaWMgbGltaXRJdGVtc1RvOiBudW1iZXIgPSBkZWZhdWx0cy5kcm9wZG93bi5saW1pdEl0ZW1zVG87XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIGRpc3BsYXlCeVxyXG4gICAqL1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBkaXNwbGF5QnkgPSBkZWZhdWx0cy5kcm9wZG93bi5kaXNwbGF5Qnk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIGlkZW50aWZ5QnlcclxuICAgKi9cclxuICBASW5wdXQoKSBwdWJsaWMgaWRlbnRpZnlCeSA9IGRlZmF1bHRzLmRyb3Bkb3duLmlkZW50aWZ5Qnk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBkZXNjcmlwdGlvbiBhIGZ1bmN0aW9uIGEgZGV2ZWxvcGVyIGNhbiB1c2UgdG8gaW1wbGVtZW50IGN1c3RvbSBtYXRjaGluZyBmb3IgdGhlIGF1dG9jb21wbGV0ZVxyXG4gICAqIEBuYW1lIG1hdGNoaW5nRm5cclxuICAgKi9cclxuICBASW5wdXQoKSBwdWJsaWMgbWF0Y2hpbmdGbjogKHZhbHVlOiBzdHJpbmcsIHRhcmdldDogVGFnTW9kZWwpID0+IGJvb2xlYW4gPVxyXG4gICAgZGVmYXVsdHMuZHJvcGRvd24ubWF0Y2hpbmdGbjtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgYXBwZW5kVG9Cb2R5XHJcbiAgICovXHJcbiAgQElucHV0KCkgcHVibGljIGFwcGVuZFRvQm9keSA9IGRlZmF1bHRzLmRyb3Bkb3duLmFwcGVuZFRvQm9keTtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUga2VlcE9wZW5cclxuICAgKiBAZGVzY3JpcHRpb24gb3B0aW9uIHRvIGxlYXZlIGRyb3Bkb3duIG9wZW4gd2hlbiBhZGRpbmcgYSBuZXcgaXRlbVxyXG4gICAqL1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBrZWVwT3BlbiA9IGRlZmF1bHRzLmRyb3Bkb3duLmtlZXBPcGVuO1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBkeW5hbWljVXBkYXRlXHJcbiAgICovXHJcbiAgQElucHV0KCkgcHVibGljIGR5bmFtaWNVcGRhdGUgPSBkZWZhdWx0cy5kcm9wZG93bi5keW5hbWljVXBkYXRlO1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSB6SW5kZXhcclxuICAgKi9cclxuICBASW5wdXQoKSBwdWJsaWMgekluZGV4ID0gZGVmYXVsdHMuZHJvcGRvd24uekluZGV4O1xyXG5cclxuICAvKipcclxuICAgKiBsaXN0IG9mIGl0ZW1zIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIGlucHV0IChmb3IgYXV0b2NvbXBsZXRlKVxyXG4gICAqIEBuYW1lIGl0ZW1zXHJcbiAgICovXHJcbiAgcHVibGljIGl0ZW1zOiBUYWdNb2RlbFtdID0gW107XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIHRhZ0lucHV0XHJcbiAgICovXHJcbiAgcHVibGljIHRhZ0lucHV0OiBUYWdJbnB1dENvbXBvbmVudDtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgX2F1dG9jb21wbGV0ZUl0ZW1zXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfYXV0b2NvbXBsZXRlSXRlbXM6IFRhZ01vZGVsW10gPSBbXTtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgYXV0b2NvbXBsZXRlSXRlbXNcclxuICAgKiBAcGFyYW0gaXRlbXNcclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGF1dG9jb21wbGV0ZUl0ZW1zKGl0ZW1zOiBUYWdNb2RlbFtdKSB7XHJcbiAgICB0aGlzLl9hdXRvY29tcGxldGVJdGVtcyA9IGl0ZW1zO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgYXV0b2NvbXBsZXRlSXRlbXNcclxuICAgKiBAZGVzYyBhcnJheSBvZiBpdGVtcyB0aGF0IHdpbGwgcG9wdWxhdGUgdGhlIGF1dG9jb21wbGV0ZVxyXG4gICAqL1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBnZXQgYXV0b2NvbXBsZXRlSXRlbXMoKTogVGFnTW9kZWxbXSB7XHJcbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2F1dG9jb21wbGV0ZUl0ZW1zO1xyXG5cclxuICAgIGlmICghaXRlbXMpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpdGVtcy5tYXAoKGl0ZW06IFRhZ01vZGVsKSA9PiB7XHJcbiAgICAgIHJldHVybiB0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZydcclxuICAgICAgICA/IHtcclxuICAgICAgICAgICAgW3RoaXMuZGlzcGxheUJ5XTogaXRlbSxcclxuICAgICAgICAgICAgW3RoaXMuaWRlbnRpZnlCeV06IGl0ZW1cclxuICAgICAgICAgIH1cclxuICAgICAgICA6IGl0ZW07XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yKSB7XHJcbiAgICB0aGlzLnRhZ0lucHV0ID0gdGhpcy5pbmplY3Rvci5nZXQoVGFnSW5wdXRDb21wb25lbnQpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgbmdBZnRlcnZpZXdJbml0XHJcbiAgICovXHJcbiAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5vbkl0ZW1DbGlja2VkKCkuc3Vic2NyaWJlKChpdGVtOiBOZzJNZW51SXRlbSkgPT4ge1xyXG4gICAgICB0aGlzLnJlcXVlc3RBZGRpbmcoaXRlbSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyByZXNldCBpdGVtc01hdGNoaW5nIGFycmF5IHdoZW4gdGhlIGRyb3Bkb3duIGlzIGhpZGRlblxyXG4gICAgdGhpcy5vbkhpZGUoKS5zdWJzY3JpYmUodGhpcy5yZXNldEl0ZW1zKTtcclxuXHJcbiAgICBjb25zdCBERUJPVU5DRV9USU1FID0gMjAwO1xyXG4gICAgY29uc3QgS0VFUF9PUEVOID0gdGhpcy5rZWVwT3BlbjtcclxuXHJcbiAgICB0aGlzLnRhZ0lucHV0Lm9uVGV4dENoYW5nZVxyXG4gICAgICAuYXNPYnNlcnZhYmxlKClcclxuICAgICAgLnBpcGUoXHJcbiAgICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcclxuICAgICAgICBkZWJvdW5jZVRpbWUoREVCT1VOQ0VfVElNRSksXHJcbiAgICAgICAgZmlsdGVyKCh2YWx1ZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICBpZiAoS0VFUF9PUEVOID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9KVxyXG4gICAgICApXHJcbiAgICAgIC5zdWJzY3JpYmUodGhpcy5zaG93KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIHVwZGF0ZVBvc2l0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKCk6IHZvaWQge1xyXG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLnRhZ0lucHV0LmlucHV0Rm9ybS5nZXRFbGVtZW50UG9zaXRpb24oKTtcclxuXHJcbiAgICB0aGlzLmRyb3Bkb3duLm1lbnUudXBkYXRlUG9zaXRpb24ocG9zaXRpb24sIHRoaXMuZHluYW1pY1VwZGF0ZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBpc1Zpc2libGVcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGlzVmlzaWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmRyb3Bkb3duLm1lbnUuZHJvcGRvd25TdGF0ZS5tZW51U3RhdGUuaXNWaXNpYmxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgb25IaWRlXHJcbiAgICovXHJcbiAgcHVibGljIG9uSGlkZSgpOiBFdmVudEVtaXR0ZXI8TmcyRHJvcGRvd24+IHtcclxuICAgIHJldHVybiB0aGlzLmRyb3Bkb3duLm9uSGlkZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIG9uSXRlbUNsaWNrZWRcclxuICAgKi9cclxuICBwdWJsaWMgb25JdGVtQ2xpY2tlZCgpIHtcclxuICAgIHJldHVybiB0aGlzLmRyb3Bkb3duLm9uSXRlbUNsaWNrZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBzZWxlY3RlZEl0ZW1cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHNlbGVjdGVkSXRlbSgpOiBOZzJNZW51SXRlbSB7XHJcbiAgICByZXR1cm4gdGhpcy5kcm9wZG93bi5tZW51LmRyb3Bkb3duU3RhdGUuZHJvcGRvd25TdGF0ZS5zZWxlY3RlZEl0ZW07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBzdGF0ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgc3RhdGUoKTogYW55IHtcclxuICAgIHJldHVybiB0aGlzLmRyb3Bkb3duLm1lbnUuZHJvcGRvd25TdGF0ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQG5hbWUgc2hvd1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzaG93ID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgY29uc3QgbWF4SXRlbXNSZWFjaGVkID1cclxuICAgICAgdGhpcy50YWdJbnB1dC5pdGVtcy5sZW5ndGggPT09IHRoaXMudGFnSW5wdXQubWF4SXRlbXM7XHJcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0Rm9ybVZhbHVlKCk7XHJcbiAgICBjb25zdCBoYXNNaW5pbXVtVGV4dCA9IHZhbHVlLnRyaW0oKS5sZW5ndGggPj0gdGhpcy5taW5pbXVtVGV4dExlbmd0aDtcclxuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5jYWxjdWxhdGVQb3NpdGlvbigpO1xyXG4gICAgY29uc3QgaXRlbXMgPSB0aGlzLmdldE1hdGNoaW5nSXRlbXModmFsdWUpO1xyXG4gICAgY29uc3QgaGFzSXRlbXMgPSBpdGVtcy5sZW5ndGggPiAwO1xyXG4gICAgY29uc3QgaXNIaWRkZW4gPSB0aGlzLmlzVmlzaWJsZSA9PT0gZmFsc2U7XHJcbiAgICBjb25zdCBzaG93RHJvcGRvd25JZkVtcHR5ID0gdGhpcy5zaG93RHJvcGRvd25JZkVtcHR5ICYmIGhhc0l0ZW1zICYmICF2YWx1ZTtcclxuICAgIGNvbnN0IGlzRGlzYWJsZWQgPSB0aGlzLnRhZ0lucHV0LmRpc2FibGU7XHJcblxyXG4gICAgY29uc3Qgc2hvdWxkU2hvdyA9XHJcbiAgICAgIGlzSGlkZGVuICYmICgoaGFzSXRlbXMgJiYgaGFzTWluaW11bVRleHQpIHx8IHNob3dEcm9wZG93bklmRW1wdHkpO1xyXG4gICAgY29uc3Qgc2hvdWxkSGlkZSA9IHRoaXMuaXNWaXNpYmxlICYmICFoYXNJdGVtcztcclxuXHJcbiAgICBpZiAodGhpcy5hdXRvY29tcGxldGVPYnNlcnZhYmxlICYmIGhhc01pbmltdW1UZXh0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmdldEl0ZW1zRnJvbU9ic2VydmFibGUodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChcclxuICAgICAgKCF0aGlzLnNob3dEcm9wZG93bklmRW1wdHkgJiYgIXZhbHVlKSB8fFxyXG4gICAgICBtYXhJdGVtc1JlYWNoZWQgfHxcclxuICAgICAgaXNEaXNhYmxlZFxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRyb3Bkb3duLmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNldEl0ZW1zKGl0ZW1zKTtcclxuXHJcbiAgICBpZiAoc2hvdWxkU2hvdykge1xyXG4gICAgICB0aGlzLmRyb3Bkb3duLnNob3cocG9zaXRpb24pO1xyXG4gICAgfSBlbHNlIGlmIChzaG91bGRIaWRlKSB7XHJcbiAgICAgIHRoaXMuaGlkZSgpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIGhpZGVcclxuICAgKi9cclxuICBwdWJsaWMgaGlkZSgpOiB2b2lkIHtcclxuICAgIHRoaXMucmVzZXRJdGVtcygpO1xyXG4gICAgdGhpcy5kcm9wZG93bi5oaWRlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBzY3JvbGxMaXN0ZW5lclxyXG4gICAqL1xyXG4gIEBIb3N0TGlzdGVuZXIoJ3dpbmRvdzpzY3JvbGwnKVxyXG4gIHB1YmxpYyBzY3JvbGxMaXN0ZW5lcigpOiB2b2lkIHtcclxuICAgIGlmICghdGhpcy5pc1Zpc2libGUgfHwgIXRoaXMuZHluYW1pY1VwZGF0ZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgb25XaW5kb3dCbHVyXHJcbiAgICovXHJcbiAgQEhvc3RMaXN0ZW5lcignd2luZG93OmJsdXInKVxyXG4gIHB1YmxpYyBvbldpbmRvd0JsdXIoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRyb3Bkb3duLmhpZGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIGdldEZvcm1WYWx1ZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0Rm9ybVZhbHVlKCk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSB0aGlzLnRhZ0lucHV0LmZvcm1WYWx1ZTtcclxuICAgIHJldHVybiBmb3JtVmFsdWUgPyBmb3JtVmFsdWUudG9TdHJpbmcoKS50cmltKCkgOiAnJztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIGNhbGN1bGF0ZVBvc2l0aW9uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjYWxjdWxhdGVQb3NpdGlvbigpOiBDbGllbnRSZWN0IHtcclxuICAgIHJldHVybiB0aGlzLnRhZ0lucHV0LmlucHV0Rm9ybS5nZXRFbGVtZW50UG9zaXRpb24oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIHJlcXVlc3RBZGRpbmdcclxuICAgKiBAcGFyYW0gaXRlbSB7TmcyTWVudUl0ZW19XHJcbiAgICovXHJcbiAgcHJpdmF0ZSByZXF1ZXN0QWRkaW5nID0gYXN5bmMgKGl0ZW06IE5nMk1lbnVJdGVtKSA9PiB7XHJcbiAgICBjb25zdCB0YWcgPSB0aGlzLmNyZWF0ZVRhZ01vZGVsKGl0ZW0pO1xyXG4gICAgYXdhaXQgdGhpcy50YWdJbnB1dC5vbkFkZGluZ1JlcXVlc3RlZCh0cnVlLCB0YWcpLmNhdGNoKCgpID0+IHt9KTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBjcmVhdGVUYWdNb2RlbFxyXG4gICAqIEBwYXJhbSBpdGVtXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjcmVhdGVUYWdNb2RlbChpdGVtOiBOZzJNZW51SXRlbSk6IFRhZ01vZGVsIHtcclxuICAgIGNvbnN0IGRpc3BsYXkgPVxyXG4gICAgICB0eXBlb2YgaXRlbS52YWx1ZSA9PT0gJ3N0cmluZycgPyBpdGVtLnZhbHVlIDogaXRlbS52YWx1ZVt0aGlzLmRpc3BsYXlCeV07XHJcbiAgICBjb25zdCB2YWx1ZSA9XHJcbiAgICAgIHR5cGVvZiBpdGVtLnZhbHVlID09PSAnc3RyaW5nJyA/IGl0ZW0udmFsdWUgOiBpdGVtLnZhbHVlW3RoaXMuaWRlbnRpZnlCeV07XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uaXRlbS52YWx1ZSxcclxuICAgICAgW3RoaXMudGFnSW5wdXQuZGlzcGxheUJ5XTogZGlzcGxheSxcclxuICAgICAgW3RoaXMudGFnSW5wdXQuaWRlbnRpZnlCeV06IHZhbHVlXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdmFsdWUge3N0cmluZ31cclxuICAgKi9cclxuICBwcml2YXRlIGdldE1hdGNoaW5nSXRlbXModmFsdWU6IHN0cmluZyk6IFRhZ01vZGVsW10ge1xyXG4gICAgaWYgKCF2YWx1ZSAmJiAhdGhpcy5zaG93RHJvcGRvd25JZkVtcHR5KSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkdXBlc0FsbG93ZWQgPSB0aGlzLnRhZ0lucHV0LmFsbG93RHVwZXM7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuYXV0b2NvbXBsZXRlSXRlbXMuZmlsdGVyKChpdGVtOiBUYWdNb2RlbCkgPT4ge1xyXG4gICAgICBjb25zdCBoYXNWYWx1ZSA9IGR1cGVzQWxsb3dlZFxyXG4gICAgICAgID8gZmFsc2VcclxuICAgICAgICA6IHRoaXMudGFnSW5wdXQudGFncy5zb21lKHRhZyA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkZW50aWZ5QnkgPSB0aGlzLnRhZ0lucHV0LmlkZW50aWZ5Qnk7XHJcbiAgICAgICAgICAgIGNvbnN0IG1vZGVsID1cclxuICAgICAgICAgICAgICB0eXBlb2YgdGFnLm1vZGVsID09PSAnc3RyaW5nJyA/IHRhZy5tb2RlbCA6IHRhZy5tb2RlbFtpZGVudGlmeUJ5XTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtb2RlbCA9PT0gaXRlbVt0aGlzLmlkZW50aWZ5QnldO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5tYXRjaGluZ0ZuKHZhbHVlLCBpdGVtKSAmJiBoYXNWYWx1ZSA9PT0gZmFsc2U7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIHNldEl0ZW1zXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzZXRJdGVtcyhpdGVtczogVGFnTW9kZWxbXSk6IHZvaWQge1xyXG4gICAgdGhpcy5pdGVtcyA9IGl0ZW1zLnNsaWNlKDAsIHRoaXMubGltaXRJdGVtc1RvIHx8IGl0ZW1zLmxlbmd0aCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSByZXNldEl0ZW1zXHJcbiAgICovXHJcbiAgcHJpdmF0ZSByZXNldEl0ZW1zID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgdGhpcy5pdGVtcyA9IFtdO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIHBvcHVsYXRlSXRlbXNcclxuICAgKiBAcGFyYW0gZGF0YVxyXG4gICAqL1xyXG4gIHByaXZhdGUgcG9wdWxhdGVJdGVtcyhkYXRhOiBhbnkpOiBUYWdJbnB1dERyb3Bkb3duIHtcclxuICAgIHRoaXMuYXV0b2NvbXBsZXRlSXRlbXMgPSBkYXRhLm1hcChpdGVtID0+IHtcclxuICAgICAgcmV0dXJuIHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJ1xyXG4gICAgICAgID8ge1xyXG4gICAgICAgICAgICBbdGhpcy5kaXNwbGF5QnldOiBpdGVtLFxyXG4gICAgICAgICAgICBbdGhpcy5pZGVudGlmeUJ5XTogaXRlbVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIDogaXRlbTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgZ2V0SXRlbXNGcm9tT2JzZXJ2YWJsZVxyXG4gICAqIEBwYXJhbSB0ZXh0XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRJdGVtc0Zyb21PYnNlcnZhYmxlID0gKHRleHQ6IHN0cmluZyk6IHZvaWQgPT4ge1xyXG4gICAgdGhpcy5zZXRMb2FkaW5nU3RhdGUodHJ1ZSk7XHJcblxyXG4gICAgY29uc3Qgc3Vic2NyaWJlRm4gPSAoZGF0YTogYW55W10pID0+IHtcclxuICAgICAgLy8gaGlkZSBsb2FkaW5nIGFuaW1hdGlvblxyXG4gICAgICB0aGlzLnNldExvYWRpbmdTdGF0ZShmYWxzZSlcclxuICAgICAgICAvLyBhZGQgaXRlbXNcclxuICAgICAgICAucG9wdWxhdGVJdGVtcyhkYXRhKTtcclxuXHJcbiAgICAgIHRoaXMuc2V0SXRlbXModGhpcy5nZXRNYXRjaGluZ0l0ZW1zKHRleHQpKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLml0ZW1zLmxlbmd0aCkge1xyXG4gICAgICAgIHRoaXMuZHJvcGRvd24uc2hvdyh0aGlzLmNhbGN1bGF0ZVBvc2l0aW9uKCkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZHJvcGRvd24uaGlkZSgpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYXV0b2NvbXBsZXRlT2JzZXJ2YWJsZSh0ZXh0KVxyXG4gICAgICAucGlwZShmaXJzdCgpKVxyXG4gICAgICAuc3Vic2NyaWJlKHN1YnNjcmliZUZuLCAoKSA9PiB0aGlzLnNldExvYWRpbmdTdGF0ZShmYWxzZSkpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIHNldExvYWRpbmdTdGF0ZVxyXG4gICAqIEBwYXJhbSBzdGF0ZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgc2V0TG9hZGluZ1N0YXRlKHN0YXRlOiBib29sZWFuKTogVGFnSW5wdXREcm9wZG93biB7XHJcbiAgICB0aGlzLnRhZ0lucHV0LmlzTG9hZGluZyA9IHN0YXRlO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxufVxyXG4iLCI8bmcyLWRyb3Bkb3duIFtkeW5hbWljVXBkYXRlXT1cImR5bmFtaWNVcGRhdGVcIj5cclxuICAgIDxuZzItZHJvcGRvd24tbWVudSBbZm9jdXNGaXJzdEVsZW1lbnRdPVwiZm9jdXNGaXJzdEVsZW1lbnRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgIFt6SW5kZXhdPVwiekluZGV4XCJcclxuICAgICAgICAgICAgICAgICAgICAgICBbYXBwZW5kVG9Cb2R5XT1cImFwcGVuZFRvQm9keVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgW29mZnNldF09XCJvZmZzZXRcIj5cclxuICAgICAgICA8bmcyLW1lbnUtaXRlbSAqbmdGb3I9XCJsZXQgaXRlbSBvZiBpdGVtczsgbGV0IGluZGV4ID0gaW5kZXg7IGxldCBsYXN0ID0gbGFzdFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgW3ZhbHVlXT1cIml0ZW1cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgIFtuZ1N3aXRjaF09XCIhIXRlbXBsYXRlcy5sZW5ndGhcIj5cclxuXHJcbiAgICAgICAgICAgIDxzcGFuICpuZ1N3aXRjaENhc2U9XCJmYWxzZVwiXHJcbiAgICAgICAgICAgICAgICAgIFtpbm5lckhUTUxdPVwiaXRlbVtkaXNwbGF5QnldIHwgaGlnaGxpZ2h0IDogdGFnSW5wdXQuaW5wdXRGb3JtLnZhbHVlLnZhbHVlXCI+XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuXHJcbiAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSAqbmdTd2l0Y2hEZWZhdWx0XHJcbiAgICAgICAgICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldF09XCJ0ZW1wbGF0ZXMuZmlyc3RcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInsgaXRlbTogaXRlbSwgaW5kZXg6IGluZGV4LCBsYXN0OiBsYXN0IH1cIj5cclxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cclxuICAgICAgICA8L25nMi1tZW51LWl0ZW0+XHJcbiAgICA8L25nMi1kcm9wZG93bi1tZW51PlxyXG48L25nMi1kcm9wZG93bj5cclxuIl19