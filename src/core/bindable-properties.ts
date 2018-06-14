import { AtomBinder } from "./AtomBinder";
import { INotifyPropertyChanging } from "./types";

export function bindableProperty(target: any, key: string): any {
    // property value
    const iVal: any = target[key];

    const keyName: string = "_" + key;

    if (!target[keyName]) {
        target[keyName] = iVal;
    }

    // property getter
    const getter: () => any = function(): any {
        // console.log(`Get: ${key} => ${_val}`);
        return this[keyName];
    };

    // property setter
    const setter: (v: any) => void = function(newVal: any): void {
        // console.log(`Set: ${key} => ${newVal}`);
        const oldValue = this[keyName];
        // tslint:disable-next-line:triple-equals
        if (oldValue == newVal) {
            return;
        }

        const ce = this as INotifyPropertyChanging;
        if (ce.onPropertyChanging) {
            ce.onPropertyChanging(key, oldValue, newVal);
        }

        this[keyName] = newVal;

        AtomBinder.refreshValue(this, key);
    };

    // delete property
    if (delete target[key]) {

        // create new property with getter and setter
        Object.defineProperty(target, key, {
            get: getter,
            set: setter,
            enumerable: true,
            configurable: true
        });

    }
}
