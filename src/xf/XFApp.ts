import * as A from "../App";
import { AtomBridge } from "../core/AtomBridge";
import { NavigationService } from "../services/NavigationService";
import { AtomXFControl } from "./controls/AtomXFControl";
import XFNavigationService from "./services/XFNavigationService";

declare var bridge: any;

export default class XFApp extends A.App {

    private mRoot: AtomXFControl;
    public get root(): AtomXFControl {
        return this.mRoot;
    }

    public set root(v: AtomXFControl) {
        this.mRoot = v;
        bridge.setRoot(v.element);
    }

    constructor() {
        super();
        AtomBridge.instance = bridge;
        this.put(NavigationService, this.resolve(XFNavigationService));
    }

    protected onReady(f: () => any): void {
        const a = f();
        if (a && a.then && a.catch) {
            a.then((r) => {
                // do nothing
            });
            a.catch((e) => {
                // tslint:disable-next-line:no-console
                // console.error("XFApp.onReady");
                // tslint:disable-next-line:no-console
                console.error(typeof e === "string" ? e : JSON.stringify(e));
            });
        }
    }
}
