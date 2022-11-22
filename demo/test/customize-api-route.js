const test = require('test');
test.setup();

const http = require('http');
const util = require('util');

const { check_result } = require('../test/_utils');
const { useTestServer } = require('../test/support/spec_helper');

const mockData = {
    "init_people": [{
        "name": "Tom",
        "sex": "male",
        "age": 35
    }, {
        "name": "Alice",
        "sex": "female",
        "age": 32
    }, {
        "name": "Jack",
        "sex": "male",
        "age": 8
    }, {
        "name": "Lily",
        "sex": "female",
        "age": 4
    }],

    "newBaby": {
        "name": "Tomson",
        "sex": "male",
        "age": 0
    }
};

var StoneCity = {
    code: 'ST',
    name: 'Stone City'
}

const INIT = {
    'http-rest-get': false,
    'http-rest-post': false,
    'http-rest-put': false,
    'http-rest-delete': false,
    'http-rest-find': false,
    'http-rest-eput': false,
    'http-rest-epost': false,
    'http-rest-efind': false,
    'http-rest-eget': false,
    'http-rest-edel': false,
    'http-postfunc': false,
}

describe('customize api route', () => {
    const testedRouteTypes = { ...INIT }
    
    const { tappInfo, tSrvInfo, clientCtx, clients } = useTestServer({
        createAppArgs: [
            {
                customizeApiRoute: (ctx) => {
                    switch (ctx.routeType) {
                        case 'http-rest-get': {
                            return [ (req) => { testedRouteTypes['http-rest-get'] = true }, ctx.handler ]; }
                        case 'http-rest-post': {
                            return [ (req) => { testedRouteTypes['http-rest-post'] = true; }, ctx.handler ]; }
                        case 'http-rest-put': {
                            return [ (req) => { testedRouteTypes['http-rest-put'] = true; }, ctx.handler ]; }
                        case 'http-rest-delete': {
                            return [ (req) => { testedRouteTypes['http-rest-delete'] = true; }, ctx.handler ]; }
                        case 'http-rest-find': {
                            return [ (req) => { testedRouteTypes['http-rest-find'] = true; }, ctx.handler ]; }
                        case 'http-rest-eput': {
                            return [ (req) => { testedRouteTypes['http-rest-eput'] = true; }, ctx.handler ]; }
                        case 'http-rest-epost': {
                            return [ (req) => { testedRouteTypes['http-rest-epost'] = true; }, ctx.handler ]; }
                        case 'http-rest-efind': {
                            return [ (req) => { testedRouteTypes['http-rest-efind'] = true; }, ctx.handler ]; }
                        case 'http-rest-eget': {
                            return [ (req) => { testedRouteTypes['http-rest-eget'] = true; }, ctx.handler ]; }
                        case 'http-rest-edel': {
                            return [ (req) => { testedRouteTypes['http-rest-edel'] = true; }, ctx.handler ]; }
                        case 'http-postfunc': {
                            return [ (req) => { testedRouteTypes['http-postfunc'] = true; }, ctx.handler ]; }
                        default:
                            return ctx.handler;
                    }
                }
            },
            {}
        ]
    });

    let Tom = { id: null };
    let Alice = { id: null };
    let Jack = { id: null };
    let Lily = { id: null };

    let StoneCityId;
    function init_base () {
        StoneCityId = clients.city.create(StoneCity);

        var rep = http.post(`${tSrvInfo.appUrlBase}/people`, {
            json: mockData.init_people.map(x => {
                // x.city = StoneCity
                x.city_id = StoneCityId
                return x
            })
        });

        const result = rep.json();

        Tom.id = result[0].id;
        Alice.id = result[1].id;
        Jack.id = result[2].id;
        Lily.id = result[3].id;
    }

    function init_extend () {
        var rep = http.put(`${tSrvInfo.appUrlBase}/people/${Tom.id}/wife`, {
            json: {
                id: Alice.id
            }
        });
        assert.equal(rep.statusCode, 200)

        var rep = http.get(`${tSrvInfo.appUrlBase}/people/${Tom.id}`, {
            query: {
                keys: 'wife_id'
            }
        });
        check_result(rep.json(), {
            wife_id: Alice.id
        });

        var rep = http.put(`${tSrvInfo.appUrlBase}/people/${Alice.id}/husband`, {
            json: {
                id: Tom.id
            }
        });
        assert.equal(rep.statusCode, 200)

        function set_parents(id) {
            var rep = http.put(`${tSrvInfo.appUrlBase}/people/${id}/father`, {
                json: {
                    id: Tom.id
                }
            });
            assert.equal(rep.statusCode, 200)

            var rep = http.put(`${tSrvInfo.appUrlBase}/people/${id}/mother`, {
                json: {
                    id: Alice.id
                }
            });
            assert.equal(rep.statusCode, 200)
        }

        set_parents(Jack.id);
        set_parents(Lily.id);

        function add_childs(id) {
            var rep = http.put(`${tSrvInfo.appUrlBase}/people/${id}/childs`, {
                json: {
                    id: Jack.id
                }
            });
            assert.equal(rep.statusCode, 200)

            var rep = http.put(`${tSrvInfo.appUrlBase}/people/${id}/childs`, {
                json: {
                    id: Lily.id
                }
            });
            assert.equal(rep.statusCode, 200)
        }

        add_childs(Tom.id);
        add_childs(Alice.id);
    }

    before(() => {
        tappInfo.utils.dropModelsSync();

        clientCtx.switchUser('admin');

        assert.deepEqual(testedRouteTypes, INIT);
    });

    describe('assert on init', () => {
        it('init base', () => {
            assert.equal(testedRouteTypes['http-rest-post'], false);
            assert.equal(testedRouteTypes['http-rest-put'], false);
            assert.equal(testedRouteTypes['http-rest-delete'], false);
            init_base();

            assert.equal(testedRouteTypes['http-rest-post'], true);
            assert.equal(testedRouteTypes['http-rest-put'], false);
            assert.equal(testedRouteTypes['http-rest-delete'], false);
        });
    
        it('init extend', () => {
            assert.equal(testedRouteTypes['http-rest-eput'], false);
            assert.equal(testedRouteTypes['http-rest-epost'], false);
            assert.equal(testedRouteTypes['http-rest-edel'], false);
            init_extend();

            assert.equal(testedRouteTypes['http-rest-eput'], true);
            assert.equal(testedRouteTypes['http-rest-epost'], false);
            assert.equal(testedRouteTypes['http-rest-edel'], false);
        });
    });

    it('http-rest-get', () => {
        clients.people.get(Tom.id);
        
        assert.equal(testedRouteTypes['http-rest-get'], true);
    });
    
    it('http-rest-find', () => {
        assert.equal(testedRouteTypes['http-rest-find'], false);

        clients.people.find();
        
        assert.equal(testedRouteTypes['http-rest-find'], true);
    });

    it('http-rest-put', () => {
        assert.equal(testedRouteTypes['http-rest-put'], false);

        var _Tom = clients.people.get(Tom.id);
        clients.people.update(Tom.id, {
            age: _Tom.age
        });
        
        assert.equal(testedRouteTypes['http-rest-put'], true);
    });

    it('http-rest-delete', () => {
        assert.equal(testedRouteTypes['http-rest-delete'], false);

        var _Tom = clients.people.get(Tom.id);
        clients.people.delete(_Tom.id);
        
        assert.equal(testedRouteTypes['http-rest-delete'], true);

        // add it back
        var id = clients.people.create(util.omit(_Tom, 'id'));
        clients.people.update(id, { id: Tom.id });
    });

    it('http-rest-edel / http-rest-eput', () => {
        // divorce
        assert.equal(testedRouteTypes['http-rest-edel'], false);
        clients.people.unlink(Tom.id, 'wife', Alice.id);
        assert.equal(testedRouteTypes['http-rest-edel'], true);

        // then remarried
        assert.equal(testedRouteTypes['http-rest-eput'], true);
        clients.people.link(Tom.id, 'wife', Alice.id);
        assert.equal(testedRouteTypes['http-rest-eput'], true);
    });

    it('http-rest-epost', () => {
        // they has new child
        assert.equal(testedRouteTypes['http-rest-epost'], false);
        const TomsonId = clients.people.createExt(Tom.id, 'childs', {
            ...mockData.newBaby,
            city_id: StoneCityId
        });
        assert.equal(testedRouteTypes['http-rest-epost'], true);

        assert.exist(TomsonId);
    });
})

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
