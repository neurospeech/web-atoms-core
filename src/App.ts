import { AtomBinder } from "./core/AtomBinder";
import { AtomUri } from "./core/AtomUri";
import { AtomDisposable, IDisposable } from "./core/types";
import { RegisterSingleton } from "./di/RegisterSingleton";
import { ServiceProvider } from "./di/ServiceProvider";
import { BusyIndicatorService } from "./services/BusyIndicatorService";

export type AtomAction = (channel: string, data: any) => void;

class AtomHandler {

    public message: string;
    public list: AtomAction[];

    constructor(message: string) {
        this.message = message;
        this.list = new Array<AtomAction>();
    }

}

export class AtomMessageAction {
    public message: string;
    public action: AtomAction;

    constructor(msg: string, a: AtomAction) {
        this.message = msg;
        this.action = a;
    }
}

@RegisterSingleton
export class App extends ServiceProvider {

    private bag: any;

    private busyIndicators: IDisposable[] = [];
    private busyIndicatorService: BusyIndicatorService;

    private mUrl: AtomUri;
    public get url(): AtomUri {
        return this.mUrl;
    }

    public set url(v: AtomUri) {
        this.mUrl = v;
        AtomBinder.refreshValue(this, "url");
    }

    public get contextId(): string {
        return "none";
    }

    constructor() {
        super(null);
        this.bag = {};
        this.put(App, this);
        setTimeout(() => {
            this.onReady(() => {
                try {
                    this.main();
                } catch (e) {
                    // tslint:disable-next-line:no-console
                    console.error("timeout for onReady");
                    // tslint:disable-next-line:no-console
                    console.error(e);
                }
            });
        }, 5);

    }

    public createBusyIndicator(): IDisposable {
        this.busyIndicatorService = this.busyIndicatorService
            || this.resolve(BusyIndicatorService);
        return this.busyIndicatorService.createIndicator();
    }

    public syncUrl(): void {
        // must be implemented by platform specific app
    }

    /**
     * This method will run any asynchronous method
     * and it will display an error if it will fail
     * asynchronously
     *
     * @template T
     * @param {() => Promise<T>} tf
     * @memberof AtomDevice
     */
    public runAsync<T>(tf: () => Promise<T>): void {
        try {
            tf().then((): void => {
                // nothing
            }).catch((error) => {
                this.onError("runAsync");
                this.onError(error);
            });
        } catch (e) {
            this.onError("runAsync");
            this.onError(e);
        }
    }

    public onError: (m: any) => void = (error) => {
        // tslint:disable-next-line:no-console
        console.log(error);
    }

    /**
     * Broadcast given data to channel, only within the current window.
     *
     * @param {string} channel
     * @param {*} data
     * @returns
     * @memberof AtomDevice
     */
    public broadcast(channel: string, data: any): void {
        const ary: AtomHandler = this.bag[channel] as AtomHandler;
        if (!ary) {
            return;
        }
        for (const entry of ary.list) {
            entry.call(this, channel, data);
        }
    }

    /**
     * Subscribe for given channel with action that will be
     * executed when anyone will broadcast (this only works within the
     * current browser window)
     *
     * This method returns a disposable, when you call `.dispose()` it will
     * unsubscribe for current subscription
     *
     * @param {string} channel
     * @param {AtomAction} action
     * @returns {AtomDisposable} Disposable that supports removal of subscription
     * @memberof AtomDevice
     */
    public subscribe(channel: string, action: AtomAction): IDisposable {
        let ary: AtomHandler = this.bag[channel] as AtomHandler;
        if (!ary) {
            ary = new AtomHandler(channel);
            this.bag[channel] = ary;
        }
        ary.list.push(action);
        return new AtomDisposable(() => {
            ary.list = ary.list.filter((a) => a !== action);
            if (!ary.list.length) {
                this.bag[channel] = null;
            }
        });
    }

    public main(): void {
        // load app here..
    }

    // tslint:disable-next-line:no-empty
    protected onReady(f: () => any): void {
    }

}
