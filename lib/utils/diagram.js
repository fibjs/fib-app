var Viz = require('viz.js');

module.exports = function () {
    var models = [];
    var exts = [];

    this.db(db => {
        var m, m1;
        var ks;

        for (var name in db.models) {
            m = db.models[name];
            ks = [];
            for (var k in m.properties) {
                ks.push(`+ ${k} : ${m.properties[k].type}`);
            }

            models.push(`${m.model_name} [tooltip="${m.model_name}", label="{${m.model_name}|${ks.join('\\l')}\\l}"];`);
            for (var e in m.extends) {
                m1 = m.extends[e];
                one = m1.type === "hasOne" && !m1.reversed;
                exts.push(`${m.model_name} -> ${m1.model.model_name} [label=${e} ${one?"arrowhead=empty":""}];`);
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