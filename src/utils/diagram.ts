import { FibApp } from "../Typo/app";

const NO_GRAPHQL_COLOR = 'lightgray'// '#ec8888'

export = function () {
    const util = require('util');
    const Viz = require('viz.js');
    const { Module, render } = require('viz.js/lite.render.js');

    const models: string[] = [];
    const exts: string[] = [];

    this.db((db: FibApp.FibAppORM) => {
        let m: FibApp.FibAppORMModel;
        let ks: string[];

        for (const name in db.models) {
            m = db.models[name];
            ks = [];
            for (const k in m.properties) {
                var ps;

                if (m.properties[k].comment)
                    ps = `+ ${m.properties[k].comment}(${k}) : ${m.properties[k].type}`;
                else
                    ps = `+ ${k} : ${m.properties[k].type}`;
                ks.push(ps);
            }

            const is_nographql = m.no_graphql

            if(m.comment)
                models.push(`${m.model_name} [tooltip="${m.model_name}", ${is_nographql ? `fillcolor="${NO_GRAPHQL_COLOR}",` : ''} label="{${m.comment}(${m.model_name})|${ks.join('\\l')}\\l}"];`);
            else
                models.push(`${m.model_name} [tooltip="${m.model_name}", ${is_nographql ? `fillcolor="${NO_GRAPHQL_COLOR}",` : ''} label="{${m.model_name}|${ks.join('\\l')}\\l}"];`);
        
            for (const e in m.associations) {
                const assoc_info = m.associations[e];
                const one = assoc_info.type === "hasOne" && !assoc_info.association.reversed;
                const extendsTo = assoc_info.type === "extendsTo";

                var es = `${m.model_name} -> ${assoc_info.association.model.model_name} [label=${e}, arrowhead=`;
                es += extendsTo ? "diamond" : one ? "empty" : "oinv";
                es += "];";

                exts.push(es);
            }
        }
    });


    const dot = `
digraph
{
node [fontname="Helvetica,sans-Serif", fontsize=10, shape="record", style="filled", fillcolor="white"];
edge [fontname="Helvetica,sans-Serif", fontsize=10, dir=both, arrowsize=0.8, arrowtail=odot];

${models.join('\n')}
${exts.join('\n')}
}`;

    let viz = new Viz({ Module, render });
    viz.renderStringSync = util.sync(viz.renderString, true);

    return viz.renderStringSync(dot);
}
