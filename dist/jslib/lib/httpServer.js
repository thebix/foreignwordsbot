'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}(); // Source: https://nodejs.org/api/http.html
// Source: https://github.com/JosephMoniz/rx-http-server
// Source: https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/fromevent.md

var _http = require('http');var _http2 = _interopRequireDefault(_http);
var _Rx = require('rxjs/Rx');var _Rx2 = _interopRequireDefault(_Rx);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}var

HttpServer = function () {
    function HttpServer() {var port = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 80;_classCallCheck(this, HttpServer);
        this.port = port;
        if (port) {
            this.server = _http2.default.createServer();
            this.server.listen(port);
        }
    }_createClass(HttpServer, [{ key: 'checkContinues', get: function get()



        {
            if (!this.port || this.port === 0) {
                console.error('HttpServer not initialized');
                return _Rx2.default.Observable.empty();
            }
            return _Rx2.default.Observable.fromEvent(this.server, 'checkContinue', function (request, response) {return (
                    Object.create({ request: request, response: response }));});
        } }, { key: 'clientErrors', get: function get()
        {
            if (!this.port || this.port === 0) {
                console.error('HttpServer not initialized');
                return _Rx2.default.Observable.empty();
            }
            return _Rx2.default.Observable.fromEvent(this.server, 'clientError', function (request, socket) {
                // https://nodejs.org/api/http.html#http_event_clienterror
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
                return { request: request, socket: socket };
            });
        } }, { key: 'closes', get: function get()
        {
            if (!this.port || this.port === 0) {
                console.error('HttpServer not initialized');
                return _Rx2.default.Observable.empty();
            }
            return _Rx2.default.Observable.fromEvent(this.server, 'close', function () {return 'close';});
        } }, { key: 'requests', get: function get()
        {
            if (!this.port || this.port === 0) {
                console.error('HttpServer not initialized');
                return _Rx2.default.Observable.empty();
            }
            return _Rx2.default.Observable.fromEvent(this.server, 'request', function (request, response) {return (
                    Object.create({ request: request, response: response }));});
        } }, { key: 'upgrades', get: function get()
        {
            if (!this.port || this.port === 0) {
                console.error('HttpServer not initialized');
                return _Rx2.default.Observable.empty();
            }
            return _Rx2.default.Observable.fromEvent(this.server, 'checkContinue', function (request, socket, head) {return (
                    Object.create({ request: request, socket: socket, head: head }));});
        } }], [{ key: 'createEmpty', value: function createEmpty() {return new HttpServer(0);} }]);return HttpServer;}();exports.default = HttpServer;