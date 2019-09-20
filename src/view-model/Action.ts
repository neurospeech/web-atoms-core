import { App } from "../App";
import FormattedString from "../core/FormattedString";
import { NavigationService } from "../services/NavigationService";
import { AtomViewModel, Watch } from "./AtomViewModel";
import { registerInit } from "./baseTypes";

export interface IActionOptions {

    /**
     * Display success message after method successfully executes,
     * if method returns promise, success will display after promise
     * has finished, pass null to not display message.
     * @default 'Operation completed successfully'
     */
    success?: string | FormattedString;

    /**
     * Title for success message
     * @default Done
     */
    successTitle?: string;

    /**
     * Ask for confirmation before invoking this method
     * @default null
     */
    confirm?: string;

    /**
     * Title for confirm message
     * @default Confirm
     */
    confirmTitle?: string;

    /**
     * Validate the view model before execution and report to user
     * @default false
     */
    validate?: boolean | string | FormattedString;

    /**
     * Title for validation
     * @default Error
     */
    validateTitle?: string;
}

/**
 * Reports an alert to user when method is successful, or an error has occurred
 * or validation has failed. You can configure options to enable/disable certain
 * alerts.
 * @param reportOptions
 */
export default function Action(
    {
        success = "Operation completed successfully",
        successTitle = "Done",
        confirm = null,
        confirmTitle = null,
        validate = false,
        validateTitle = null
    }: IActionOptions = {}) {
    // tslint:disable-next-line: only-arrow-functions
    return function(target: AtomViewModel, key: string | symbol): void {
        registerInit(target, (vm) => {
            // tslint:disable-next-line: ban-types
            const oldMethod = vm[key] as Function;
            const app = vm.app as App;
            vm[key] = async () => {
                const ns = app.resolve(NavigationService) as NavigationService;
                try {

                    if (validate) {
                        if (!vm.isValid) {
                            const vMsg = typeof validate === "boolean"
                                ? "Please enter correct information"
                                : validate;
                            await ns.alert(vMsg, validateTitle || "Error");
                            return;
                        }
                    }

                    if (confirm) {
                        if (! await ns.confirm(confirm, confirmTitle || "Confirm")) {
                            return;
                        }
                    }

                    const pe = oldMethod.call(vm);
                    if (pe && pe.then) {
                        const result = await pe;
                        if (success) {
                            await ns.alert(success, successTitle);
                        }
                        return result;
                    }
                } catch (e) {
                    const s = "" + e;
                    if (/^(cancelled|canceled)$/i.test(s.trim())) {
                        // tslint:disable-next-line: no-console
                        console.warn(e);
                        return;
                    }
                    await ns.alert(s, "Error");
                }
            };
        });
    };
}
