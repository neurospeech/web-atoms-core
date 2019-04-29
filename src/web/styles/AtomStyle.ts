import { App } from "../../App";
import { AtomBinder } from "../../core/AtomBinder";
import { ColorItem } from "../../core/Colors";
import { StringHelper } from "../../core/StringHelper";
import { IClassOf, INameValuePairs } from "../../core/types";
import WebImage from "../../core/WebImage";
import { TypeKey } from "../../di/TypeKey";
import { AtomControl } from "../controls/AtomControl";
import WebApp from "../WebApp";
import { AtomStyleSheet } from "./AtomStyleSheet";
import { IStyleDeclaration } from "./IStyleDeclaration";

export type StyleItem = AtomStyle;

const emptyPrototype = Object.getPrototypeOf({});
export interface IAtomStyle {
    name: string;
}

declare var UMD: {
    resolvePath(path: string): string;
};

export class AtomStyle
    implements IAtomStyle {

    private defaults: { [key: string]: AtomStyle} = {};

    private isBuilt: boolean = false;

    constructor(
        public styleSheet: AtomStyleSheet,
        public readonly parent: AtomStyle,
        public readonly name: string
    ) {
        this.init();
    }

    public getDefaultStyle(forKey: any): AtomStyle {
        return this.defaults[TypeKey.get(forKey)];
    }

    public createNamedStyle<T extends AtomStyle>(c: IClassOf<T>, name: string): T {
        const style = this[name] = new (c)(this.styleSheet, this, `${this.name}-${name}`);
        style.build();
        return style;
    }

    public createStyle<TC extends AtomControl, T extends AtomStyle>(tc: IClassOf<TC>, c: IClassOf<T>, name: string): T {

        this.defaults = this.defaults || {};

        const newStyle = new (c)(this.styleSheet, this, `${this.name}-${name}`);
        const key = TypeKey.get(tc);
        this.defaults[key] = newStyle;
        newStyle.build();
        return this[name] = newStyle;
    }

    public getBaseProperty<T>(tc: IClassOf<T>, name: string): any {
        let c = tc;
        do {
            c = Object.getPrototypeOf(c);
            if (!c) {
                throw new Error("No property descriptor found for " + name);
            }
            const pd = Object.getOwnPropertyDescriptor(c.prototype, name);
            if (!pd) {
                continue;
            }
            return pd.get.apply(this);
        } while (true);
    }

    public toStyle(pairs?: INameValuePairs): INameValuePairs {

        pairs = pairs || {};

        const self = this as any;

        for (const key in self) {
            if (/^(isBuilt|constructor|name|parent|styleSheet|defaults|theme|styleElement)$/.test(key)) {
                continue;
            }
            if (/^\_/.test(key)) {
                continue;
            }
            const element = self[key];
            // if it is nested style
            if (element instanceof AtomStyle) {
                pairs = element.toStyle(pairs);
                continue;
            }

            // if it is class
            const c = element as IStyleDeclaration;
            if (c && typeof c === "object") {
                if (emptyPrototype === Object.getPrototypeOf(c)) {
                    pairs = this.createStyleText(key, pairs, c);
                }
                continue;
            }
        }
        return pairs;
    }

    protected toFullName(n: string): string {
        return `${this.name}-${ StringHelper.fromCamelToHyphen(n)}`;
    }

    protected build(): void {
        if (this.isBuilt) {
            return;
        }
        this.isBuilt = true;
        this.styleSheet.pushUpdate();
        const self = this as any;
        for (const key in self) {
            if (/^(isBuilt|constructor|name|parent|styleSheet|defaults|theme|styleElement)$/.test(key)) {
                continue;
            }
            if (/^\_\$\_/.test(key)) {
                continue;
            }
            const element = self[key];
            if (element instanceof AtomStyle) {
                element.build();
                continue;
            }
            const c = element as IStyleDeclaration;
            if (c && typeof c === "object") {
                if (emptyPrototype === Object.getPrototypeOf(c)) {
                    const pv = AtomBinder.getPropertyDescriptor(this, key);
                    if (!pv.get) {
                        continue;
                    }
                    const fullName = this.toFullName(key);
                    const descriptor: PropertyDescriptor = {
                        get() {
                            return {
                                ... pv.get.apply(this),
                                className: fullName,
                                toString: () => fullName
                            };
                        }, configurable: true, enumerable: true
                    };
                    Object.defineProperty(this, key, descriptor);
                }
            }
        }
        this.isBuilt = true;
    }

    protected init(): void {
        // empty...
    }

    protected registerExternalStyleSheet(s: {
        href: string,
        integrity?: string,
        crossOrigin?: string
    }): void {
        const wa = this.styleSheet.app as WebApp;
        wa.installStyleSheet(s);
    }

    private createStyleText(name: string, pairs: INameValuePairs, styles: IStyleDeclaration): INameValuePairs {
        const styleList: any[] = [];
        for (const key in styles) {
            if (styles.hasOwnProperty(key)) {
                const element = styles[key];
                if (element === undefined || element === null || key === "className") {
                    continue;
                }
                const keyName = StringHelper.fromCamelToHyphen(key);
                if (key === "subclasses") {
                    for (const subclassKey in element) {
                        if (element.hasOwnProperty(subclassKey)) {
                            const ve = element[subclassKey];
                            pairs = this.createStyleText(`${name}${subclassKey}`, pairs, ve);
                        }
                    }
                } else {
                    if (element instanceof WebImage) {
                        styleList.push(`${keyName}: url(${element})`);
                    } else {
                        styleList.push(`${keyName}: ${element}`);
                    }
                }
            }
        }
        const cname = StringHelper.fromCamelToHyphen(name);

        const styleClassName = `${this.name}-${cname}`;
        pairs[styleClassName] = `{ ${styleList.join(";\r\n")} }`;
        // styles.className = styleClassName;
        // styles.toString = () => styleClassName;
        return pairs;
    }

}
