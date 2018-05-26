'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();var _token = require('../token');var _token2 = _interopRequireDefault(_token);
var _commands = require('./commands');var _commands2 = _interopRequireDefault(_commands);
var _message = require('./message');function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}var

InputParser = function () {function InputParser() {_classCallCheck(this, InputParser);}_createClass(InputParser, null, [{ key: 'isDeveloper', value: function isDeveloper(
        id) {
            return _message.USER_ID_UNUSED === id ||
            _token2.default.developers &&
            _token2.default.developers.length > 0 &&
            _token2.default.developers.some(function (x) {return x === id;});
        } }, { key: 'isEcho', value: function isEcho()
        {
            return true;
        } }, { key: 'isStart', value: function isStart(
        text) {
            var pattern = /^\/start|старт/i;
            return text.match(pattern);
        } }, { key: 'isStop', value: function isStop(
        text) {
            var pattern = /^\/stop|стоп/i;
            return text.match(pattern);
        } }, { key: 'isHelp', value: function isHelp(
        text) {
            var pattern = /^\/help|помощь/i;
            return text.match(pattern);
        } }, { key: 'isToken', value: function isToken(
        text) {
            var pattern = /^\/token/i;
            return text.match(pattern);
        } }, { key: 'isCardGetCurrent', value: function isCardGetCurrent(
        text) {
            var pattern = /^\/getcard/i;
            return text.match(pattern);
        } }, { key: 'isCardUserAnswer', value: function isCardUserAnswer(
        lastCommand) {
            return lastCommand === _commands2.default.CARD_GET_CURRENT;
        } }, { key: 'isCardUserAnswerDontKnow', value: function isCardUserAnswerDontKnow(
        callbackCommand) {
            return callbackCommand === _commands2.default.CARD_DONT_KNOW;
        } }, { key: 'isCardAdd', value: function isCardAdd(
        text) {
            var pattern = /^\/addcard/i;
            return text.match(pattern);
        } }, { key: 'isCardAddUserResponse', value: function isCardAddUserResponse(
        lastCommand) {
            return lastCommand === _commands2.default.CARD_ADD;
        } }, { key: 'isCardGetList', value: function isCardGetList(
        text) {
            var pattern = /^\/getlist/i;
            return text.match(pattern);
        } }, { key: 'isCardRemove', value: function isCardRemove(
        text) {
            var pattern = /^\/remove/i;
            return text.match(pattern);
        } }, { key: 'isStats', value: function isStats(
        text) {
            var pattern = /^\/stat|stats/i;
            return text.match(pattern);
        } }, { key: 'isCardGetCurrentCallbackButton', value: function isCardGetCurrentCallbackButton(
        callbackCommand) {
            return callbackCommand === _commands2.default.CARD_GET_CURRENT;
        } }]);return InputParser;}();exports.default = InputParser;