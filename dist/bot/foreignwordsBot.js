'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _rxjs = require('rxjs');
var _operators = require('rxjs/operators');
var _logger = require('../logger');
var _config = require('../config');var _config2 = _interopRequireDefault(_config);
var _token = require('../token');var _token2 = _interopRequireDefault(_token);
var _telegram = require('./telegram');var _telegram2 = _interopRequireDefault(_telegram);
var _handlers = require('./handlers');var _handlers2 = _interopRequireDefault(_handlers);
var _storage = require('../storage');var _storage2 = _interopRequireDefault(_storage);
var _timer = require('../jslib/lib/timer');
var _message = require('./message');var _message2 = _interopRequireDefault(_message);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var telegram = new _telegram2.default(_config2.default.isProduction ? _token2.default.botToken.prod : _token2.default.botToken.dev);
var wordsIntervalTimer = new _timer.IntervalTimerRx(_timer.timerTypes.SOON, 900);

var getWordsToAskObservable = function getWordsToAskObservable() {return (
        wordsIntervalTimer.timerEvent().
        pipe(
        (0, _operators.switchMap)(function () {return _storage2.default.getStorageKeys();}),
        (0, _operators.switchMap)(function (chatIds) {return (0, _rxjs.from)(chatIds);}),
        (0, _operators.filter)(function (chatId) {return chatId !== _storage.archiveName;}),
        (0, _operators.switchMap)(function (chatId) {return _storage2.default.getItem(chatId, 'foreignWordCurrent').
            pipe(
            (0, _operators.filter)(function (foreignWordCurrent) {return !foreignWordCurrent;}),
            (0, _operators.map)(function () {return chatId;}));}),

        (0, _operators.map)(function (chatId) {return _message2.default.createCommand(chatId, '/getcard');})));};


var mapBotMessageToSendResult = function mapBotMessageToSendResult(message) {
    var sendOrEditResultObservable = message.messageIdToEdit ?
    telegram.botMessageEdit(message) :
    telegram.botMessage(message);
    return sendOrEditResultObservable.
    pipe((0, _operators.switchMap)(function (sendOrEditResult) {var
        statusCode = sendOrEditResult.statusCode,messageText = sendOrEditResult.messageText;var
        chatId = message.chatId;
        if (statusCode === 403) {
            return _storage2.default.archive(chatId).
            pipe((0, _operators.map)(function () {
                (0, _logger.log)('foreignwordsBot: chatId<' + chatId + '> forbidden error: <' + messageText + '>, message: <' + JSON.stringify(message) + '>, moving to archive', _logger.logLevel.INFO); // eslint-disable-line max-len
                return sendOrEditResult;
            }));
        }
        if (statusCode !== 200) {
            (0, _logger.log)('foreignwordsBot: chatId<' + chatId + '> telegram send to user error: statusCode: <' + statusCode + '>, <' + messageText + '>, message: <' + JSON.stringify(message) + '>,', _logger.logLevel.ERROR); // eslint-disable-line max-len
        }
        return (0, _rxjs.of)(sendOrEditResult);
    }));
};exports.default =

function () {
    (0, _logger.log)('foreignwordsBot.startforeignwordsBot()', _logger.logLevel.INFO);
    var userTextObservalbe =
    (0, _rxjs.merge)(
    getWordsToAskObservable(),
    telegram.userText()).
    pipe(
    // TODO: fix it: observeOn(Scheduler.asap),
    (0, _operators.mergeMap)(_handlers2.default),
    (0, _operators.mergeMap)(mapBotMessageToSendResult));

    var userActionsObservable = telegram.userActions().
    pipe(
    // TODO: fix it: observeOn(Scheduler.asap),
    (0, _operators.mergeMap)(_handlers.mapUserActionToBotMessages),
    (0, _operators.mergeMap)(mapBotMessageToSendResult));


    wordsIntervalTimer.start();
    return (0, _rxjs.merge)(userTextObservalbe, userActionsObservable).
    pipe((0, _operators.catchError)(function (err) {
        (0, _logger.log)(err, _logger.logLevel.ERROR);
    }));
};