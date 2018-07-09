Object.defineProperty(exports, "__esModule", { value: true });
var Viz = require('viz.js');
const NO_GRAPHQL_COLOR = 'lightgray'; // '#ec8888'
function default_1() {
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
            var is_nographql = m.no_graphql;
            models.push(`${m.model_name} [tooltip="${m.model_name}", ${is_nographql ? `fillcolor="${NO_GRAPHQL_COLOR}",` : ''} label="{${m.model_name}|${ks.join('\\l')}\\l}"];`);
            for (var e in m.extends) {
                m1 = m.extends[e];
                var one = m1.type === "hasOne" && !m1.reversed;
                exts.push(`${m.model_name} -> ${m1.model.model_name} [label=${e} ${one ? "arrowhead=empty" : ""}];`);
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
exports.default = default_1;
