var Viz = require('viz.js');

const NO_GRAPHQL_COLOR = 'lightgray'// '#ec8888'

export = function () {
    var models: string[] = [];
    var exts: string[] = [];

    this.db((db: FibApp.FibAppORM) => {
        var m: FibApp.FibAppORMModel;
        // var m1: FibApp.ExtendModelWrapper;
        var ks: string[];

        for (var name in db.models) {
            m = db.models[name];
            ks = [];
            for (var k in m.properties) {
                ks.push(`+ ${k} : ${m.properties[k].type}`);
            }

            var is_nographql = m.no_graphql

            models.push(`${m.model_name} [tooltip="${m.model_name}", ${is_nographql ? `fillcolor="${NO_GRAPHQL_COLOR}",` : ''} label="{${m.model_name}|${ks.join('\\l')}\\l}"];`);
            for (var e in m.associations) {
                var assoc_info = m.associations[e];
                var one = assoc_info.type === "hasOne" && !assoc_info.association.reversed;
                var extendsTo = assoc_info.type === "extendsTo";
                if (!extendsTo)
                    exts.push(`${m.model_name} -> ${assoc_info.association.model.model_name} [label=${e} ${one ? "arrowhead=empty" : "" }];`);
                else
                    exts.push(`${m.model_name} -> ${assoc_info.association.model.model_name} [label=${e} ${one ? "arrowhead=empty" : "" }];`);
            }
        }
    });

    var dot = `
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
