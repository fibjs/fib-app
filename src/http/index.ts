import { err_info, fill_error } from '../utils/err_info';

import _base = require('./base');
import _extend = require('./extend');
import _function = require('./function');
import _view = require('./view');

import { bind as bind_filter_request, parse_req_resource_and_hdlr_type } from '../utils/filter_request'
import { run_graphql, is_graphql_request } from '../utils/graphql';
import { run_batch } from '../utils/batch-request';


export function bind (app: FibApp.FibAppClass) {
    // bind it firstly
    bind_filter_request(app)

    const api = app.api = {} as FibApp.FibAppInternalApis;
    const viewApi = app.viewApi = {} as FibApp.FibAppInternalViewApis;
    _base.setup(app);
    _extend.setup(app);
    _function.setup(app);
    _view.setup(app);

    const apiPathPrefix = app.__opts.apiPathPrefix
    const viewPathPrefix = app.__opts.viewPathPrefix
    const graphQLPathPrefix = app.__opts.graphQLPathPrefix
    const batchPathPrefix = app.__opts.batchPathPrefix

    const enableFilterApiCollection = apiPathPrefix === viewPathPrefix
    const filterApiCollection = enableFilterApiCollection ? select_api_collection : () => app.api
    
    function setupApiRoute () {
        /* api base :start */
        app.post(`${apiPathPrefix}/:classname`, (req: FibApp.FibAppHttpRequest, classname: string) => app.filterRequest(req, classname, api.post));
        app.get(`${apiPathPrefix}/:classname/:id`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, filterApiCollection(req, app).get));
        app.put(`${apiPathPrefix}/:classname/:id`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, api.put));
        app.del(`${apiPathPrefix}/:classname/:id`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, api.del));
        app.get(`${apiPathPrefix}/:classname`, (req: FibApp.FibAppHttpRequest, classname: string) => app.filterRequest(req, classname, filterApiCollection(req, app).find));
        /* api base :end */

        /* api extend :start */
        app.put(`${apiPathPrefix}/:classname/:id/:extend`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, api.elink));
        app.put(`${apiPathPrefix}/:classname/:id/:extend/:rid`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid) => app.filterRequest(req, classname, id, extend, rid, api.eput));
        app.post(`${apiPathPrefix}/:classname/:id/:extend`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, api.epost));
        app.get(`${apiPathPrefix}/:classname/:id/:extend`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, filterApiCollection(req, app).efind));
        app.get(`${apiPathPrefix}/:classname/:id/:extend/:rid`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid) => app.filterRequest(req, classname, id, extend, rid, filterApiCollection(req, app).eget));
        app.del(`${apiPathPrefix}/:classname/:id/:extend/:rid`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid) => app.filterRequest(req, classname, id, extend, rid, api.edel));
        /* api extend :end */

        app.post(`${apiPathPrefix}/:classname/:func`, (req: FibApp.FibAppHttpRequest, classname: string, func: string) => {
            app.filterRequest(req, classname, api.functionHandler(classname, func));
        });
    }

    function setupViewRoute () {
        /* when `apiPathPrefix === viewPathPrefix`, you don't need set it because it's settled above */
        if (!enableFilterApiCollection) {
            /* view base :start */
            app.get(`${viewPathPrefix}/:classname/:id`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, viewApi.get));
            app.get(`${viewPathPrefix}/:classname`, (req: FibApp.FibAppHttpRequest, classname: string) => app.filterRequest(req, classname, viewApi.find));
            /* view base :end */
            /* view extend :start */
            app.get(`${viewPathPrefix}/:classname/:id/:extend`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, viewApi.efind));
            app.get(`${viewPathPrefix}/:classname/:id/:extend/:rid`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid) => app.filterRequest(req, classname, id, extend, rid, viewApi.eget));
            /* view extend :end */
        }
    }

    if (!apiPathPrefix && viewPathPrefix) {
        setupViewRoute()
        setupApiRoute()
    } else {
        setupApiRoute()
        setupViewRoute()
    }

    /* setup graphql :start */
    const mergeRootAndGraphqlRoot = !graphQLPathPrefix || graphQLPathPrefix === '/'
    if (!mergeRootAndGraphqlRoot)
        app.post(graphQLPathPrefix, (req: FibApp.FibAppHttpRequest) => {
            if (!is_graphql_request(req))
                return fill_error(req, err_info(4000005))
        
            run_graphql(app, req)
        })
    /* setup graphql :end */

    /* setup batch task :end */
    const mergeRootAndBatchRoot = !batchPathPrefix || batchPathPrefix === '/'
    if (!mergeRootAndBatchRoot)
        app.post(batchPathPrefix, (req: FibApp.FibAppHttpRequest) => run_batch(app, req))
    /* setup batch task :end */
    

    /* finally, root setup */
    app.post('/', (req: FibApp.FibAppHttpRequest) => {
        if (is_graphql_request(req))
            return mergeRootAndGraphqlRoot && run_graphql(app, req);

        mergeRootAndBatchRoot && run_batch(app, req)
    });
};

function select_api_collection (req: FibApp.FibAppHttpRequest, app: FibApp.FibAppClass): FibApp.FibAppHttpApiCollectionType {
    switch (parse_req_resource_and_hdlr_type(req).requestedResultType) {
        case 'css':
        case 'js':
        case 'html':
            return app.viewApi
        case 'json':
            return app.api
    }
}
