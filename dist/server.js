'use strict';var _rxjs = require('rxjs');
var _operators = require('rxjs/operators');
var _nodeCleanup = require('node-cleanup');var _nodeCleanup2 = _interopRequireDefault(_nodeCleanup);
var _foreignwordsBot = require('./bot/foreignwordsBot');var _foreignwordsBot2 = _interopRequireDefault(_foreignwordsBot);
var _storage = require('./storage');var _storage2 = _interopRequireDefault(_storage);
var _logger = require('./logger');function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

(0, _logger.log)('Starting server', _logger.logLevel.INFO);

var compositeSubscription = new _rxjs.Subscription();

(0, _nodeCleanup2.default)(function (exitCode, signal) {
    (0, _logger.log)('server:nodeCleanup: clean. exitCode: <' + exitCode + '>, signal: <' + signal + '>', _logger.logLevel.INFO);
    compositeSubscription.unsubscribe();
});

// bot
compositeSubscription.add(_storage2.default.isInitialized().
pipe(
(0, _operators.filter)(function (isStorageInitizlized) {return isStorageInitizlized;}),
(0, _operators.mergeMap)(function () {return (0, _foreignwordsBot2.default)();})).

subscribe(
function () {},
function (error) {
    (0, _logger.log)('Unhandled exception: server.foreignwordsBot: error while handling userText / userActions. Error=' + (error && error.message ?
    error.message : JSON.stringify(error)), _logger.logLevel.ERROR);
    compositeSubscription.unsubscribe();
}));