'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _token2 = require('./token');var _token3 = _interopRequireDefault(_token2);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var isProduction = process.env.NODE_ENV === 'production';exports.default =

{
    isProduction: isProduction,
    log: isProduction ? 'INFO' : 'DEBUG',
    developers: _token3.default.developers,
    dirStorage: __dirname + '/state/',
    fileState: __dirname + '/state/state.json' };