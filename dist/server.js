'use strict';var _slicedToArray = function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();var _rxjs = require('rxjs');
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
compositeSubscription.add((0, _rxjs.combineLatest)(_storage2.default.isInitialized(), _storage.storage.isInitialized()).
pipe(
(0, _operators.filter)(function (_ref) {var _ref2 = _slicedToArray(_ref, 2),isStateInitizlized = _ref2[0],isStorageInitizlized = _ref2[1];return isStateInitizlized && isStorageInitizlized;}),
(0, _operators.mergeMap)(function () {return (0, _foreignwordsBot2.default)();})).

subscribe(
function () {},
function (error) {
    (0, _logger.log)('Unhandled exception: server.foreignwordsBot: error while handling userText / userActions. Error=' + (error && error.message ?
    error.message : JSON.stringify(error)), _logger.logLevel.ERROR);
    compositeSubscription.unsubscribe();
}));