'use strict';var _root = require('./root');var _root2 = _interopRequireDefault(_root);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var isProduction = process.env.NODE_ENV === 'production';

console.log('Start server ' + (isProduction ? '<Production>' : '<Debug>'));

console.log(_root2.default.time.dateTimeString());