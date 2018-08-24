import { AtomDisposable, IDisposable } from "../core/types";
import { RegisterSingleton } from "../di/RegisterSingleton";

@RegisterSingleton
export class BusyIndicatorService {

    public createIndicator(): IDisposable {
        return AtomDisposable.empty;
    }

}
