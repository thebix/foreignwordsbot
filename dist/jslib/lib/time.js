'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}} // INFO: в дальнейшем можно добавить конструктор (с часовым поясом, например)

var weekdays = {
    mo: 1,
    tu: 2,
    we: 3,
    th: 4,
    fr: 5,
    sa: 6,
    su: 0,
    unknown: 8 };var


Time = function () {function Time() {_classCallCheck(this, Time);}_createClass(Time, [{ key: 'getChangedDateTime', value: function getChangedDateTime()











        {var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { years: null, months: null, days: null, hours: null, minutes: null, seconds: null, ticks: null };var date = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Date();
            var dt = new Date(date);
            if (options.years != null)
            dt.setFullYear(dt.getFullYear() + options.years);
            if (options.months != null)
            dt.setMonth(dt.getMonth() + options.months);
            if (options.days != null)
            dt.setDate(dt.getDate() + options.days);
            if (options.hours != null)
            dt.setHours(dt.getHours() + options.hours);
            if (options.minutes != null)
            dt.setMinutes(dt.getMinutes() + options.minutes);
            if (options.seconds != null)
            dt.setSeconds(dt.getSeconds() + options.seconds);
            if (options.ticks != null) {
                dt.setTime(dt.getTime() + options.ticks);
            }
            return dt;
        } }, { key: 'setDateTime', value: function setDateTime()












        {var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { years: undefined, months: undefined, days: undefined, hours: undefined, minutes: undefined, seconds: undefined, ticks: undefined };var date = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Date();
            var dt = new Date(date);
            if (options.years !== undefined)
            dt.setFullYear(options.years);
            if (options.months !== undefined)
            dt.setMonth(options.months);
            if (options.days !== undefined)
            dt.setDate(options.days);
            if (options.hours !== undefined)
            dt.setHours(options.hours);
            if (options.minutes !== undefined)
            dt.setMinutes(options.minutes);
            if (options.seconds !== undefined)
            dt.setSeconds(options.seconds);
            if (options.ticks !== undefined) {
                dt.setTime(options.ticks);
            }
            return dt;
        }

        // 16.12.2017 | 16/12/2016 | 16.12.16 | 16/12 = 16/12/текущий год | 16 - текущий месяц
    }, { key: 'getDate', value: function getDate() {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
            if (Object.prototype.toString.call(date) === '[object Date]') return date;
            var d = '' + date;
            var split = d.split('.');
            if (!split || split.length === 1)
            split = d.split('/');
            var year = split.length === 3 ? split[2] : new Date().getFullYear();
            year = +year;
            if (year.toString().length < 4)
            year += 2000;
            if (year > new Date().getFullYear()) year -= 100;
            var month = split.length > 1 ? split[1] : new Date().getMonth() + 1;
            var day = parseInt(split[0], 10);
            if (isNaN(day))
            return null;
            return new Date(year, month - 1, day);
        }

        // 23 | 23:03 | 23:03:04
    }, { key: 'getTimeObj', value: function getTimeObj() {var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ''; // eslint-disable-line complexity
            var t = '' + time;
            var split = t.split(':');
            if (!split || split.length === 1)
            split = t.split('.');
            if (!split || split.length === 1)
            split = t.split('-');
            if (!split || split.length === 0) return null;
            var hours = +split[0];
            var minutes = void 0,
            seconds = void 0;
            if (isNaN(hours)) return null;
            if (split.length > 1) {
                minutes = +split[1];
                if (isNaN(minutes)) return null;
            }
            if (split.length > 2) {
                seconds = +split[2];
                if (isNaN(seconds)) return null;
            }
            return { hours: hours, minutes: minutes, seconds: seconds };
        }

        // 16.12.2017 23:23:00
    }, { key: 'getDateTime', value: function getDateTime() {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
            if (Object.prototype.toString.call(date) === '[object Date]') return date;
            var d = '' + date;
            var split = d.split(' ');
            if (!split) return null;
            var res = void 0;
            if (split.length === 1) {
                if (split.indexOf(':') > -1 || split.indexOf('-') > -1) {
                    var timeObj = this.getTimeObj(split[0]);
                    if (timeObj) {
                        res = this.setDateTime(timeObj);
                    }
                } else {
                    res = this.getDate(split[0]);
                }
            } else {
                var dateFromString = this.getDate(split[0]);
                var _timeObj = this.getTimeObj(split[1]);
                if (_timeObj)
                res = this.setDateTime(_timeObj, dateFromString);else

                res = dateFromString;
            }
            return res;
        } }, { key: 'getStartDate', value: function getStartDate()

        {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        } }, { key: 'getMonthStartDate', value: function getMonthStartDate()

        {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
            return new Date(date.getFullYear(), date.getMonth(), 1);
        } }, { key: 'getEndDate', value: function getEndDate()

        {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
        } }, { key: 'getMonthEndDate', value: function getMonthEndDate()

        {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
            return new Date(date.getFullYear(), date.getMonth() + 1, 0);
        } }, { key: 'dateTimeString', value: function dateTimeString()

        {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
            return this.dateString(date) + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
        } }, { key: 'dateString', value: function dateString()

        {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();var isFullYear = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            if (!date) return '';
            if (typeof date === 'string') return date;
            // сокращенная запись только для этого столетия
            var century = Math.floor(date.getFullYear() / 100) * 100;
            var yearDiff = isFullYear || century < 2000 ? 0 : 2000;
            return ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + (date.getFullYear() - yearDiff);
        } }, { key: 'getWeekday', value: function getWeekday(

        day) {// eslint-disable-line complexity
            if (day === null || day === undefined)
            return weekdays.unknown;
            var d = ('' + day).toLowerCase();
            if (d === '1' || d === 'пн' || d === 'mo') return weekdays.mo;
            if (d === '2' || d === 'вт' || d === 'tu') return weekdays.tu;
            if (d === '3' || d === 'ср' || d === 'we') return weekdays.we;
            if (d === '4' || d === 'чт' || d === 'th') return weekdays.th;
            if (d === '5' || d === 'пт' || d === 'fr') return weekdays.fr;
            if (d === '6' || d === 'сб' || d === 'sa') return weekdays.sa;
            if (d === '0' || d === 'вс' || d === 'su') return weekdays.su;
            return weekdays.unknown;
        } }, { key: 'dateWeekdayString', value: function dateWeekdayString()

        {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
            return this.weekdayString(date) + ' ' + this.dateString(date);
        } }, { key: 'weekdayString', value: function weekdayString()

        {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
            var weekday = this.getWeekday(date.getDay());
            switch (weekday) {
                case weekdays.mo:return 'Пн';
                case weekdays.tu:return 'Вт';
                case weekdays.we:return 'Ср';
                case weekdays.th:return 'Чт';
                case weekdays.fr:return 'Пт';
                case weekdays.sa:return 'Сб';
                case weekdays.su: // case zero problem
                default:return 'Вс';}

        }

        // TODO: not working on sunday without params
    }, { key: 'getMonday', value: function getMonday() {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();var next = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var d = new Date(date);
            var day = d.getDay();
            var diff = void 0;
            if (!next && diff === 1) {
                diff = 0;
            } else {
                // diff = 7 - day + (day === 0 ? -6 : 1)
                diff = 7 - day;
                if (day === 0) diff -= 6;else
                diff += 1;
            }
            return this.getStartDate(
            this.getChangedDateTime({ days: diff }, d));
        } }, { key: 'daysBetween', value: function daysBetween(

        d1, d2) {
            return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        }

        // search = mo | 16.12.2017 | 16.12 | 16
    }, { key: 'getBack', value: function getBack(search) {var after = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Date();
            // дата
            var date = this.getDate(search);
            if (date) {
                if (date.getTime() <= after.getTime())
                return date;
                var slashs = ('' + search).split('/').length;
                var dots = ('' + search).split('.').length;
                if (slashs === 2 || dots === 2)
                return this.getChangedDateTime({ years: -1 }, date);
                if (slashs === 1 || dots === 1)
                return this.getChangedDateTime({ months: -1 }, date);
            }
            // день недели
            var weekday = this.getWeekday(search);
            if (weekday !== weekdays.unknown) {
                var start = this.getWeekday(after.getDay());
                var diff = 0;
                if (start > weekday) {// искомый день на этой неделе
                    diff = weekday - start;
                } else if (start < weekday) {// искомый день на прошлой неделе
                    diff = 7 - start - weekday;
                    diff = weekday - start - 7;
                }
                var res = this.getChangedDateTime({ days: diff }, after);
                return new Date(res.getFullYear(), res.getMonth(), res.getDate());
            }
            return new Date();
        } }, { key: 'isDateSame', value: function isDateSame(

        d1, d2) {
            return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
        } }]);return Time;}();exports.default = Time;