import { FibApp } from "../Typo/app";

const NO_GRAPHQL_COLOR = 'lightgray'// '#ec8888'

export = function () {
    const Viz = require('viz.js');

    const models: string[] = [];
    const exts: string[] = [];

    this.db((db: FibApp.FibAppORM) => {
        let m: FibApp.FibAppORMModel;
        let ks: string[];

        for (const name in db.models) {
            m = db.models[name];
            ks = [];
            for (const k in m.properties) {
                ks.push(`+ ${k} : ${m.properties[k].type}`);
            }

            const is_nographql = m.no_graphql

            models.push(`${m.model_name} [tooltip="${m.model_name}", ${is_nographql ? `fillcolor="${NO_GRAPHQL_COLOR}",` : ''} label="{${m.model_name}|${ks.join('\\l')}\\l}"];`);
            for (const e in m.associations) {
                const assoc_info = m.associations[e];
                const one = assoc_info.type === "hasOne" && !assoc_info.association.reversed;
                const extendsTo = assoc_info.type === "extendsTo";
                if (!extendsTo)
                    exts.push(`${m.model_name} -> ${assoc_info.association.model.model_name} [label=${e} ${one ? "arrowhead=empty" : "" }];`);
                else
                    exts.push(`${m.model_name} -> ${assoc_info.association.model.model_name} [label=${e} ${one ? "arrowhead=empty" : "" }];`);
            }
        }
    });

    const dot = `
digraph
{
rankdir=TB;
node [fontname="Helvetica,sans-Serif", fontsize=10, shape="record", style="filled", fillcolor="white"];
edge [fontname="Helvetica,sans-Serif", fontsize=10, style=dashed];
${models.join('\n')}
${exts.join('\n')}
}`;

    return Viz(dot, {
        "engine": "dot"
    });
}
