'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.HistoryItem = undefined;var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();var _rxjs = require('rxjs');
var _operators = require('rxjs/operators');
var _logger = require('./logger');
var _config = require('./config');var _config2 = _interopRequireDefault(_config);
var _root = require('./jslib/root');var _root2 = _interopRequireDefault(_root);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {arr2[i] = arr[i];}return arr2;} else {return Array.from(arr);}}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}var

HistoryItem = exports.HistoryItem = function () {
    function HistoryItem(
    id,
    userId,
    eventType)





    {var foreignWord = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';var translation = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';var dateCreate = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : new Date();var dateEdit = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : undefined;var dateDelete = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : undefined;_classCallCheck(this, HistoryItem);
        this.id = +id;
        this.userId = userId;
        this.eventType = eventType;
        this.foreignWord = foreignWord;
        this.translation = translation;
        this.dateCreate = dateCreate;
        this.dateEdit = dateEdit;
        this.dateDelete = dateDelete;
    }_createClass(HistoryItem, null, [{ key: 'fromArray', value: function fromArray(

        rowArray, header) {
            if (rowArray.length !== header.length)
            (0, _logger.log)('HistoryItem: fromArray: row array items count doen\'t match the header: rowArray<' + rowArray.toString() + '>', _logger.logLevel.ERROR);
            return new (Function.prototype.bind.apply(HistoryItem, [null].concat(_toConsumableArray(rowArray))))();
        } }]);return HistoryItem;}();var


History = function () {
    function History(
    dirHistory)


    {var fileTemplate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'hist-$[id].csv';var _this = this;var delimiter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ',';var header = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ['id', 'userId', 'eventType', 'foreignWord', 'translation', 'dateCreate', 'dateEdit', 'dateDelete'];_classCallCheck(this, History);
        this.path = dirHistory;
        this.fileTemplate = fileTemplate;
        this.readCsvOptions = { delimiter: delimiter, trim: true };
        this.writeCsvOptions = { delimiter: delimiter };
        this.header = header;
        this.getFilePath = this.getFilePath.bind(this);
        this.compositeSubscription = new _rxjs.Subscription();
        _root2.default.fs.isExists(dirHistory).
        pipe(
        (0, _operators.switchMap)(function (isHistoryDirExists) {
            if (isHistoryDirExists !== true) {
                (0, _logger.log)('History:constructor: history directory doesn\'t exists, creating. path: <' + dirHistory + '>', _logger.logLevel.INFO);
                return _root2.default.fs.mkDir(dirHistory).
                pipe((0, _operators.catchError)(function (error) {
                    (0, _logger.log)('History:constructor: can\'t create history directory. path: <' + dirHistory + '>. error: <' + error + '>', _logger.logLevel.ERROR); // eslint-disable-line max-len
                }));
            }
            return (0, _rxjs.of)(true);
        }),
        (0, _operators.catchError)(function (error) {
            (0, _logger.log)('History:constructor: can\'t read history file. error: <' + error + '>');
        })).

        subscribe(
        function () {},
        function (initError) {
            (0, _logger.log)(initError, _logger.logLevel.ERROR);
            _this.compositeSubscription.unsubscribe();
        },
        function () {
            _this.compositeSubscription.unsubscribe();
        });

    }
    // TODO: make private
    _createClass(History, [{ key: 'getFilePath', value: function getFilePath() {var templateId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
            var file = templateId ? '' +
            this.fileTemplate.replace('$[id]', templateId) :
            this.fileTemplate;
            return '' + this.path + file;
        } }, { key: 'add', value: function add(
        historyItem) {var templateId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
            // TODO: lock on write
            var newRow = this.header.map(function (title) {
                if (historyItem[title] || historyItem[title] === null || historyItem[title] === false)
                return historyItem[title];
                return '';
            }).join(this.delimiter);
            return _root2.default.fs.appendFile(this.getFilePath(templateId), newRow + '\n').
            pipe(
            (0, _operators.mapTo)(true),
            // TODO: log error
            (0, _operators.catchError)(function () {return (0, _rxjs.of)(false);}));

        } }, { key: 'get', value: function get(
        id) {var _this2 = this;var templateId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
            return _root2.default.fs.readCsv(this.getFilePath(templateId), this.readCsvOptions).
            pipe(
            (0, _operators.first)(function (row) {return row[0] === '' + id;}),
            (0, _operators.map)(function (row) {return HistoryItem.fromArray(row, _this2.header);}));

            // TODO: catch error
        } }, { key: 'getAll', value: function getAll()
        {var _this3 = this;var templateId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
            return _root2.default.fs.readCsv(this.getFilePath(templateId), this.readCsvOptions).
            pipe(
            (0, _operators.map)(function (row) {return HistoryItem.fromArray(row, _this3.header);}),
            (0, _operators.reduce)(function (acc, value) {return [].concat(_toConsumableArray(acc), [value]);}, []));

            // TODO: catch error
        }
        // const filterFuncntion = row => { return true }
    }, { key: 'getByFilter', value: function getByFilter(filterFuncntion) {var _this4 = this;var templateId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
            return _root2.default.fs.readCsv(this.getFilePath(templateId), this.readCsvOptions).
            pipe(
            (0, _operators.map)(function (row) {return HistoryItem.fromArray(row, _this4.header);}),
            (0, _operators.filter)(filterFuncntion),
            (0, _operators.reduce)(function (acc, value) {return [].concat(_toConsumableArray(acc), [value]);}, []));

        } }, { key: 'update', value: function update(
        id) {var _this5 = this;var newValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};var templateId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            return _root2.default.fs.readCsv(this.getFilePath(templateId), this.readCsvOptions).
            pipe(
            (0, _operators.map)(function (row) {
                if (row[0] !== '' + id)
                return row;
                var rowNew = [];
                _this5.header.forEach(function (titleKey, index) {
                    if (titleKey === 'dateEdit') {
                        rowNew[index] = new Date();
                    } else {
                        rowNew[index] = newValue[titleKey] || newValue[titleKey] === false ? newValue[titleKey] : row[index];
                    }
                });
                return rowNew;
            }),
            (0, _operators.reduce)(function (acc, value) {return [].concat(_toConsumableArray(acc), [value]);}, []),
            (0, _operators.switchMap)(function (csvToWrite) {return _root2.default.fs.saveCsv(_this5.getFilePath(templateId), csvToWrite, _this5.writeCsvOptions);}));

            // TODO: catch error
        } }]);return History;}();


var history = new History(_config2.default.dirStorage + 'history/');exports.default =
history;