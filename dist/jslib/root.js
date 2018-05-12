'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _fs = require('./lib/fs');
var _time = require('./lib/time');var _time2 = _interopRequireDefault(_time);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var fs = new _fs.RxFileSystem();
var time = new _time2.default();exports.default =

{
    fs: fs,
    time: time };