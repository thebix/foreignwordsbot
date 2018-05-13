'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.getStartAndEndDates = exports.logEvent = exports.analyticsEventTypes = undefined;var _rxjs = require('rxjs');
var _history = require('./history');var _history2 = _interopRequireDefault(_history);
var _root = require('./jslib/root');var _root2 = _interopRequireDefault(_root);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var analyticsEventTypes = exports.analyticsEventTypes = {
    START: 'START',
    STOP: 'STOP',
    CARD_GET: 'CARD_GET',
    CARD_ANSWER_RIGHT: 'CARD_ANSWER_RIGHT',
    CARD_ANSWER_WRONG: 'CARD_ANSWER_WRONG',
    CARD_DONT_KNOW: 'CARD_DONT_KNOW',
    CARD_ADD: 'CARD_ADD',
    CARD_REMOVE: 'CARD_REMOVE' };


var logEvent = exports.logEvent = function logEvent(id, userId, historyEventType, foreignWord, userAnswer) {
    var subscription = new _rxjs.Subscription();
    subscription.add(_history2.default.add(
    new _history.HistoryItem(id, userId, historyEventType, foreignWord, userAnswer),
    userId)

    // TODO: subscribeOn
    .subscribe(function () {
    }, function () {
        // TODO: log error
        subscription.unsubscribe();
    }), function () {return subscription.unsubscribe();});
};

var getStartAndEndDates = exports.getStartAndEndDates = function getStartAndEndDates(datesString) {
    // getting the interval
    var dateEnd = void 0,
    dateStart = void 0,
    dateEndUser = void 0;
    if (!datesString) {// without params => just this month statistics
        dateEnd = _root2.default.time.getEndDate();
        dateStart = _root2.default.time.getMonthStartDate(dateEnd);
        dateEndUser = dateEnd;
    } else {
        var split = ('' + datesString.trim(' ')).split(' ');
        if (split.length === 1) {// date start - till - current date
            dateEnd = _root2.default.time.getEndDate();
            dateStart = _root2.default.time.getBack(split[0].trim(' '), dateEnd);
            dateEndUser = dateEnd;
        } else {// date start - till - date end
            var end = _root2.default.time.getBack(split[1].trim(' '));
            dateStart = _root2.default.time.getBack(split[0].trim(' '), end);
            dateEnd = _root2.default.time.getEndDate(end);
            dateEndUser = dateEnd;
        }
    }

    var intervalLength = _root2.default.time.daysBetween(dateStart, _root2.default.time.getChangedDateTime({ ticks: 1 }, dateEnd));

    return {
        dateStart: dateStart,
        dateEnd: dateEnd,
        dateEndUser: dateEndUser,
        intervalLength: intervalLength };

};