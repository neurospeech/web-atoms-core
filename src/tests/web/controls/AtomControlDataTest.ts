import Assert from "@web-atoms/unit-test/dist/Assert";
import Test from "@web-atoms/unit-test/dist/Test";
import AtomWebTest from "../../../unit/AtomWebTest";
import { AtomControl } from "../../../web/controls/AtomControl";

export class AtomControlDataTest extends AtomWebTest {

    @Test
    public async data(): Promise<any> {

        const root = new AtomControl(this.app);

        const child = new AtomControl(this.app);

        const a = {};

        root.data = a;

        root.append(child);

        Assert.equals(a, child.data);

    }

    @Test
    public async dataInherited(): Promise<any> {

        const root = new AtomControl(this.app);

        const child = new AtomControl(this.app);

        const a = {};

        root.append(child);

        root.data = a;

        Assert.equals(a, child.data);

    }

    @Test
    public async dataUndefined(): Promise<any> {

        const root = new AtomControl(this.app);

        Assert.isUndefined(root.data);

    }

}
