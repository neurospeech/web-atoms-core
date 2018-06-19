import { bindableProperty } from "../core/bindable-properties";
import { IDisposable, IRect } from "../core/types";
import { AtomControl } from "./AtomControl";
import { AtomGridView } from "./AtomGridView";

/**
 * Grid Splitter can only be added inside a Grid
 */
export class AtomGridSplitter extends AtomControl {

    @bindableProperty
    public direction: "vertical" | "horizontal" = "vertical";

    @bindableProperty
    public dragging: boolean = false;

    protected create(): void {
        this.bind(this.element, "styleCursor", [["direction"]], false,
            (v) => v === "vertical" ? "ew-resize" : "ns-resize");

        this.bind(this.element, "styleBackgroundColor", [["dragging"]], false,
            (v) => v  ? "blue" : "lightgray");
        const style = this.element.style;
        style.position = "absolute";
        style.left = style.top = style.bottom = style.right = "0";

        this.bindEvent(this.element, "mousedown", (e: MouseEvent) => {

            e.preventDefault();

            this.dragging = true;

            const parent = this.parent as AtomGridView;

            const isVertical = this.direction === "vertical";

            const disposables: IDisposable[] = [];

            const rect: IRect = { x: e.clientX, y: e.clientY };

            const cell = ((this.element as any).cell as string)
                .split(",").map( (s) => s.trim().split(":").map( (st) => parseInt(st.trim(), 10) ) );

            disposables.push(this.bindEvent(this.element, "mousemove", (me: MouseEvent) => {
                // do drag....
                const { clientX, clientY } = me;

                const dx = clientX - rect.x;
                const dy = clientY - rect.y;

                if (isVertical) {
                    parent.resize("column", cell[0][0], dx);
                } else {
                    parent.resize("row", cell[1][0], dy);
                }

                // rect.x = clientX;
                // rect.y = clientY;

            }));

            disposables.push(this.bindEvent(this.element, "mouseup", (mup) => {
                // stop
                this.dragging = false;
                for (const iterator of disposables) {
                    iterator.dispose();
                }
            }));

        });
    }
}
