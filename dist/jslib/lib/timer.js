'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.IntervalTimerRx = exports.timerTypes = undefined;var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();var _rxjs = require('rxjs');
var _root = require('../root');var _root2 = _interopRequireDefault(_root);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

var timerTypes = exports.timerTypes = {
    NONE: 'NONE',
    MAIN: 'MAIN',
    MONTHLY: 'MONTHLY',
    WEEKLY: 'WEEKLY',
    DAILY: 'DAILY',
    SOON: 'SOON' };var


Timer = function () {
    function Timer(type, callback) {_classCallCheck(this, Timer);
        if (!type || type === timerTypes.NONE) {
            throw Object.create({ message: '\u0412 \u043A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0442\u0430\u0439\u043C\u0435\u0440\u0430 \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D \u0442\u0438\u043F. timerTypes = ' + type });
        }
        if (!callback || typeof callback !== 'function') {
            throw Object.create({ message: 'В конструктор таймера не передана колбэк функция' });
        }
        this.type = type; // тип таймера
        this.timerId = null; // выключение таймера по id
        this.callback = callback; // функция "триггер таймера"
        this.onTrigger = this.onTrigger.bind(this); // функция "триггер по интервалу"
        this.onCheckDateTime = this.onCheckDateTime.bind(this); // функция "триггер по дате"
        this.start = this.start.bind(this); // функция "старт таймера"
        this.isStopped = true; // Состояние таймера - выключен
    }_createClass(Timer, [{ key: 'onCheckDateTime', value: function onCheckDateTime()
        {
            if (this.isStopped)
            return;
            var dt = new Date();
            if (!this.dateTime || dt < this.dateTime) {
                if (this.timerId)
                clearInterval(this.timerId);
                var interval = this.dateTime.getTime() - dt.getTime();
                if (interval < 2000) interval = 2000;
                this.timerId = setTimeout(this.onCheckDateTime, interval);
                this.isStopped = false;
                return;
            }
            this.isStopped = true;
            this.callback(this.type);
        } }, { key: 'onTrigger', value: function onTrigger()
        {
            if (this.isStopped)
            return;
            this.isStopped = true;
            this.callback(this.type);
        } }, { key: 'start', value: function start(_ref)
        {var interval = _ref.interval,dateTime = _ref.dateTime;
            if (interval) {
                this.isStopped = false;
                this.timerId = setTimeout(this.onTrigger, interval * 1000);
            } else if (dateTime) {
                this.dateTime = dateTime;
                this.isStopped = false;
                var intrvl = this.dateTime.getTime() - new Date().getTime();
                if (intrvl < 2000) intrvl = 2000;
                this.timerId = setTimeout(this.onCheckDateTime, intrvl);
            }
        } }, { key: 'stop', value: function stop()
        {
            this.isStopped = true;
            if (this.timerId)
            clearInterval(this.timerId);
        } }]);return Timer;}();exports.default = Timer;var


IntervalTimerRx = exports.IntervalTimerRx = function () {
    function IntervalTimerRx(type) {var secondsDelay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;_classCallCheck(this, IntervalTimerRx);
        this.timerSubject = new _rxjs.Subject();
        this.type = type;
        this.secondsDelay = secondsDelay;
        this.timerCallback = this.timerCallback.bind(this);
        this.timer = new Timer(type, this.timerCallback);
    }_createClass(IntervalTimerRx, [{ key: 'timerEvent', value: function timerEvent()
        {
            return this.timerSubject.asObservable();
        } }, { key: 'start', value: function start()
        {
            var nextEmitDate = void 0;
            if (this.type === timerTypes.DAILY) {
                nextEmitDate = _root2.default.time.getChangedDateTime(
                { seconds: this.secondsDelay > 0 ? this.secondsDelay : 23 },
                _root2.default.time.getEndDate());

            } else if (this.type === timerTypes.WEEKLY) {
                nextEmitDate = _root2.default.time.getChangedDateTime(
                { seconds: this.secondsDelay > 0 ? this.secondsDelay : 23 },
                _root2.default.time.getMonday(new Date(), true));

            } else if (this.type === timerTypes.MONTHLY) {
                var dt = new Date();
                nextEmitDate = _root2.default.time.getChangedDateTime(
                { months: 1, seconds: this.secondsDelay > 0 ? this.secondsDelay : 23 },
                new Date(dt.getFullYear(), dt.getMonth(), 1));

            } else if (this.type === timerTypes.SOON) {
                nextEmitDate = _root2.default.time.getChangedDateTime({
                    seconds: this.secondsDelay > 0 ? this.secondsDelay : 1 });

            } else {
                throw Object.create({ message: 'timer: IntervalTimerRx: start: unknown type of timer, type: <' + this.type + '>' });
            }
            this.timer.start({ dateTime: nextEmitDate });
        } }, { key: 'stop', value: function stop()
        {
            this.timer.stop();
        } }, { key: 'timerCallback', value: function timerCallback(
        type) {
            this.timerSubject.next(type);
            this.start();
        } }]);return IntervalTimerRx;}();