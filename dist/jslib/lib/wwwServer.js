'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.WwwResponse = exports.mimeTypes = undefined;var _extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();var _url = require('url');var _url2 = _interopRequireDefault(_url);
var _path = require('path');var _path2 = _interopRequireDefault(_path);
var _rxjs = require('rxjs');

var _httpServer = require('./httpServer');var _httpServer2 = _interopRequireDefault(_httpServer);
var _root = require('../root');var _root2 = _interopRequireDefault(_root);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

var NODE_PROCESS_PATH = process.cwd();

var mimeTypes = exports.mimeTypes = {
    html: 'text/html',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    js: 'text/javascript',
    json: 'application/json',
    css: 'text/css',
    text: 'text/plain'


    /*
                        * headData = [{ 'Access-Control-Allow-Origin': '*' }]
                        */ };var
WwwResponse = exports.WwwResponse =
function WwwResponse(_ref)





{var _ref$httpCode = _ref.httpCode,httpCode = _ref$httpCode === undefined ? 404 : _ref$httpCode,_ref$contentType = _ref.contentType,contentType = _ref$contentType === undefined ? 'text/plain' : _ref$contentType,_ref$filePath = _ref.filePath,filePath = _ref$filePath === undefined ? '' : _ref$filePath,_ref$data = _ref.data,data = _ref$data === undefined ? undefined : _ref$data,_ref$headData = _ref.headData,headData = _ref$headData === undefined ? [] : _ref$headData;_classCallCheck(this, WwwResponse);
    this.httpCode = httpCode;
    this.contentType = contentType;
    this.filePath = filePath;
    this.data = data;
    this.headData = headData;
};


var handleFileDefault = function handleFileDefault(filename) {return (
        _root2.default.fs.accessRead(filename).
        map(function (isExists) {
            if (!isExists) {
                return new WwwResponse({
                    httpCode: 404,
                    filePath: filename,
                    contentType: mimeTypes.text,
                    data: '404 not found' });

            }

            var mimeType = mimeTypes[_path2.default.extname(filename).split('.')[1]];
            return new WwwResponse({
                filePath: filename,
                httpCode: 200,
                contentType: mimeType });

        }));};

/*
                * handleApi = {
                *      'api_url1': (body) => Observable.of(new WwwResponse()),
                *      'api_url2': (body) => Observable.of(new WwwResponse()),
                * }
                * handleFileOverride = filename => Observable.of(new WwwResponse())
                */var
WwwServer = function () {
    function WwwServer(_ref2)





    {var _ref2$port = _ref2.port,port = _ref2$port === undefined ? 80 : _ref2$port,_ref2$wwwRoot = _ref2.wwwRoot,wwwRoot = _ref2$wwwRoot === undefined ? './wwwroot_dev' : _ref2$wwwRoot,_ref2$index = _ref2.index,index = _ref2$index === undefined ? 'index.html' : _ref2$index,_ref2$handleApi = _ref2.handleApi,handleApi = _ref2$handleApi === undefined ? undefined : _ref2$handleApi,_ref2$handleFileOverr = _ref2.handleFileOverride,handleFileOverride = _ref2$handleFileOverr === undefined ? undefined : _ref2$handleFileOverr;_classCallCheck(this, WwwServer);
        this.port = port;
        this.wwwRoot = wwwRoot;
        this.index = index;
        this.apiUrls = handleApi ? Object.keys(handleApi) : [];
        this.handleApi = handleApi || {};
        this.handleFile = handleFileOverride || handleFileDefault;
        this.httpServer = new _httpServer2.default(port);
    }_createClass(WwwServer, [{ key: 'response', get: function get()

        {
            var wwwRoot = this.wwwRoot;
            var index = this.index;
            var api = this.apiUrls;
            var handleApi = this.handleApi;
            var handleFile = this.handleFile;

            var requestsObservable = this.httpServer.requests.share();

            var apiRequestObservable =
            requestsObservable.
            filter(function (data) {
                var uri = _url2.default.parse(data.request.url).pathname;
                return api && api.indexOf(uri) !== -1;
            });

            var fileRequestsObservable =
            requestsObservable.
            filter(function (data) {
                var uri = _url2.default.parse(data.request.url).pathname;
                return !api || api.indexOf(uri) === -1;
            });

            var apiResponseObservable =
            apiRequestObservable.
            flatMap(function (data) {return (
                    _rxjs.Observable.merge(
                    _rxjs.Observable.fromEvent(data.request, 'data').
                    map(function (bodyBytes) {return Object.create({
                            body: bodyBytes ? JSON.parse(bodyBytes.toString()) : {},
                            data: data });}),

                    _rxjs.Observable.fromEvent(data.request, 'end').
                    map(function () {return Object.create({
                            body: {},
                            data: data });})).

                    take(1));}).

            flatMap(function (bodyAndData) {var
                body = bodyAndData.body,data = bodyAndData.data;
                var uri = _url2.default.parse(data.request.url).pathname;
                var apiHandlerObservable = handleApi[uri];
                return apiHandlerObservable({ body: body, method: data.request.method }).
                map(function (apiResponse) {return Object.create({ data: data, apiResponse: apiResponse });});
            }).
            flatMap(function (wwwData) {var
                data = wwwData.data,apiResponse = wwwData.apiResponse;
                data.response.writeHead(apiResponse.httpCode, _extends({
                    'Content-Type': apiResponse.contentType },
                apiResponse.headData));

                data.response.end(apiResponse.data);
                return _rxjs.Observable.of(true);
            });

            var fileResponseObservable =
            fileRequestsObservable.
            flatMap(function (data) {
                var uri = _url2.default.parse(data.request.url).pathname;
                var filename = _path2.default.join(NODE_PROCESS_PATH, wwwRoot, uri !== '/' ? uri : index);
                return handleFile(filename).
                map(function (wwwResponse) {return Object.create({ data: data, wwwResponse: wwwResponse });});
            }).
            flatMap(function (wwwData) {var
                data = wwwData.data,wwwResponse = wwwData.wwwResponse;
                if (wwwResponse.httpCode === 404) {
                    console.log('not exists: ' + wwwResponse.filePath);
                    data.response.writeHead(wwwResponse.httpCode, _extends({
                        'Content-Type': wwwResponse.contentType },
                    wwwResponse.headData));

                    data.response.end(wwwResponse.data);
                    return _rxjs.Observable.of(false);
                }
                data.response.writeHead(wwwResponse.httpCode, _extends({
                    'Content-Type': wwwResponse.contentType },
                wwwResponse.headData));

                return _root2.default.fs.createReadStream(wwwResponse.filePath).
                map(function (fileStream) {
                    fileStream.pipe(data.response);
                    return true;
                });
                // INFO: not working
                // .catch(() => Object.create({
                //     data,
                //     status: RESPONSE_STATUS.CANT_CREATE_READ_STREAM
                // }))
            });

            return _rxjs.Observable.merge(
            apiResponseObservable,
            fileResponseObservable);

        } }]);return WwwServer;}();exports.default = WwwServer;