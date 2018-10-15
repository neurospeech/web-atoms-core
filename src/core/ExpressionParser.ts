import { PathList } from "./types";

const viewModelParseWatchCache: {[key: string]: PathList[] } = {};

export function parsePath(f: any): PathList[] {
    let str: string = f.toString().trim();

    const key: string = str;

    const px1: PathList[] = viewModelParseWatchCache[key];
    if (px1) {
        return px1;
    }

    if (str.endsWith("}")) {
        str = str.substr(0, str.length - 1);
    }

    if (str.startsWith("function (")) {
        str = str.substr("function (".length);
    }

    if (str.startsWith("function(")) {
        str = str.substr("function(".length);
    }

    str = str.trim();

    const index: number = str.indexOf(")");

    const isThis: boolean = index === 0;

    const p: string = isThis ? "\\_this|this" : str.substr(0, index);

    str = str.substr(index + 1);

    const regExp: string = `(?:(${p})(?:(\\.[a-zA-Z_][a-zA-Z_0-9]*)+)\\s?(?:(\\(|\\=\\=\\=|\\=\\=|\\=)?))`;

    const re: RegExp = new RegExp(regExp, "gi");

    let path: string[] = [];

    const ms: any = str.replace(re, (m) => {
        // console.log(`m: ${m}`);
        let px: string = m;
        if (px.startsWith("this.")) {
            px = px.substr(5);
        } else if (px.startsWith("_this.")) {
            px = px.substr(6);
        } else {
            px = px.substr(p.length + 1);
        }
        // console.log(px);
        if (!path.find((y) => y === px)) {
            path.push(px);
        }

        path = path.filter( (f1) => f1.endsWith("==") || !(f1.endsWith("(") || f1.endsWith("=") ));

        path = path.map(
            (px2) => px2.endsWith("===") ? px2.substr(0, px2.length - 3) :
                ( px2.endsWith("==") ? px2.substr(0, px2.length - 2) : px2 ) );

        return m;
    });

    path = path.sort( (a, b) => b.localeCompare(a) );

    const rp: string[] = [];
    for (const rpitem of path) {
        if (rp.find( (x) => x.startsWith(rpitem) )) {
            continue;
        }
        rp.push(rpitem);
    }

    // console.log(`Watching: ${path.join(", ")}`);

    const pl = path.map( (p1) => p1.split("."));

    viewModelParseWatchCache[key] = pl;

    return pl;
}