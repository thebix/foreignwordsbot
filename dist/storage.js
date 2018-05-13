'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.storage = undefined;var _get = function get(object, property, receiver) {if (object === null) object = Function.prototype;var desc = Object.getOwnPropertyDescriptor(object, property);if (desc === undefined) {var parent = Object.getPrototypeOf(object);if (parent === null) {return undefined;} else {return get(parent, property, receiver);}} else if ("value" in desc) {return desc.value;} else {var getter = desc.get;if (getter === undefined) {return undefined;}return getter.call(receiver);}};var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}(); // in memory sotrage.

var _rxjs = require('rxjs');
var _operators = require('rxjs/operators');
var _root = require('./jslib/root');var _root2 = _interopRequireDefault(_root);
var _logger = require('./logger');
var _config = require('./config');var _config2 = _interopRequireDefault(_config);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {arr2[i] = arr[i];}return arr2;} else {return Array.from(arr);}}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

// INFO: return Single / Maybe / etc if it's possible for rxjs
var
Storage = function () {
    function Storage(dirStorage) {var _this = this;var fileNameTemplate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'data-$[id].json';_classCallCheck(this, Storage);
        this.fileNameTemplate = fileNameTemplate;
        this.dirStorage = dirStorage;
        this.getFilePath = this.getFilePath.bind(this);
        this.getStorage = this.getStorage.bind(this);
        this.isTemplateWithId = this.fileNameTemplate.indexOf('$[id]') !== -1;
        this.storage = {};
        this.isFsLoadedBehaviorSubject = new _rxjs.BehaviorSubject(false);
        this.compositeSubscription = new _rxjs.Subscription();
        // load saved storage from fs
        // check if directory and file exists, if not - create
        this.compositeSubscription.add(_root2.default.fs.isExists(dirStorage).
        pipe(
        (0, _operators.switchMap)(function (isStorageDirExists) {
            if (isStorageDirExists !== true) {
                (0, _logger.log)('Storage:constructor: storage directory doesn\'t exists, creating. path: <' + dirStorage + '>', _logger.logLevel.INFO);
                return _root2.default.fs.mkDir(dirStorage).
                pipe((0, _operators.catchError)(function (error) {
                    throw new Error('Storage:constructor: can\'t create storage directory. path: <' + dirStorage + '>. error: <' + error + '>'); // eslint-disable-line max-len
                }));
            }
            return (0, _rxjs.of)(true);
        }),
        (0, _operators.switchMap)(function () {return _root2.default.fs.readDir(dirStorage);}),
        (0, _operators.switchMap)(function (fileNames) {
            if (_this.isTemplateWithId)
            return (0, _rxjs.from)(fileNames);
            (0, _logger.log)('Storage:constructor: since the fileNameTemplate <' + _this.fileNameTemplate + '> hasn\'t any parts to change, only one file with this name will be taken', _logger.logLevel.INFO); // eslint-disable-line max-len
            if (fileNames.indexOf(_this.fileNameTemplate) !== -1)
            return (0, _rxjs.of)(_this.fileNameTemplate);
            return _root2.default.fs.saveJson('' + _this.dirStorage + _this.fileNameTemplate, {}).
            pipe((0, _operators.mapTo)(_this.fileNameTemplate));
        }),
        (0, _operators.filter)(function (fileName) {
            if (!fileName)
            return false;
            if (_this.isTemplateWithId) {
                var regexString = _this.fileNameTemplate.split('$[id]').join('.+');
                var regex = new RegExp(regexString);
                return fileName.match(regex);
            }
            return true;
        }),
        (0, _operators.mergeMap)(function (fileName) {return (
                _root2.default.fs.readJson('' + _this.dirStorage + fileName).
                pipe((0, _operators.map)(function (fileStorage) {return { fileName: fileName, fileStorage: fileStorage };})));}),
        (0, _operators.tap)(function (fileNameAndStorage) {var
            fileName = fileNameAndStorage.fileName,fileStorage = fileNameAndStorage.fileStorage;
            if (_this.isTemplateWithId) {
                var fileTemplateParts = _this.fileNameTemplate.split('$[id]');
                var fileTemplateIdIndex = _this.fileNameTemplate.indexOf('$[id]');
                var fileTemplateAfterIdIndex = fileTemplateParts[1] ? fileName.indexOf(fileTemplateParts[1]) : undefined;
                var templateId = fileName.slice(fileTemplateIdIndex, fileTemplateAfterIdIndex);
                _this.storage[templateId] = fileStorage;
            } else {
                _this.storage = fileStorage;
            }
        }),
        (0, _operators.catchError)(function (error) {
            throw new Error('Storage:constructor: can\'t read storage file. error: <' + error + '>');
        })).

        subscribe(
        function () {},
        function (initError) {
            (0, _logger.log)(initError, _logger.logLevel.ERROR);
            _this.compositeSubscription.unsubscribe();
        },
        function () {
            _this.isFsLoadedBehaviorSubject.next(true);
            _this.compositeSubscription.unsubscribe();
        }));

    }_createClass(Storage, [{ key: 'isInitialized', value: function isInitialized()
        {
            return this.isFsLoadedBehaviorSubject.asObservable();
        }
        // TODO: make it private
    }, { key: 'getStorage', value: function getStorage(id) {
            if (id) {
                if (!this.storage[id])
                this.storage[id] = {};
                return this.storage[id];
            }
            if (!this.storage)
            this.storage = {};
            return this.storage;
        } }, { key: 'getKeys', value: function getKeys()
        {var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
            var storageById = this.getStorage(id);
            return (0, _rxjs.of)(Object.keys(storageById));
        } }, { key: 'getItem', value: function getItem(
        field) {var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
            return (0, _rxjs.of)(this.getStorage(id)[field]);
        } }, { key: 'getItems', value: function getItems()
        {var fieldsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
            var result = {};
            var storageById = this.getStorage(id);
            fieldsArray.forEach(function (field) {
                result[field] = storageById[field];
            });
            return (0, _rxjs.of)(result);
        } }, { key: 'updateItem', value: function updateItem(
        fieldName, item) {var _this2 = this;var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
            var storageById = this.getStorage(id);
            var field = fieldName || '0';
            storageById[field] = item;
            var oldValue = Object.assign({}, storageById[field]);
            return _root2.default.fs.saveJson(this.getFilePath(id), storageById).
            pipe(
            (0, _operators.map)(function () {return true;}),
            (0, _operators.catchError)(function (error) {
                (0, _logger.log)('Storage:updateItem: can\'t save to state file. path: <' + _this2.getFilePath(id) + '>, error:<' + error + '>', _logger.logLevel.ERROR);
                // rollback changes to fs storage to previous values on error
                storageById[field] = oldValue;
                return (0, _rxjs.of)(false);
            }));

        }
        // itemsArray = [{item}]
    }, { key: 'updateItemsByMeta', value: function updateItemsByMeta() {var itemsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
            var itemsToUpdate = [];
            itemsArray.forEach(function (itemToSave) {
                itemsToUpdate.push.apply(itemsToUpdate, _toConsumableArray(Object.keys(itemToSave).
                map(function (key) {return {
                        fieldName: key,
                        item: itemToSave[key] };})));

            });

            return this.updateItems(itemsToUpdate, id);
        }
        // itemsArray = [{fieldName, item}]
    }, { key: 'updateItems', value: function updateItems() {var _this3 = this;var itemsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
            var storageById = this.getStorage(id);
            var oldValues = {};
            itemsArray.forEach(function (itemToSave) {var
                fieldName = itemToSave.fieldName,item = itemToSave.item;
                var field = fieldName || '0';
                oldValues[field] = Object.assign({}, storageById[field]);
                storageById[field] = item;
            });
            return _root2.default.fs.saveJson(this.getFilePath(id), storageById).
            pipe(
            (0, _operators.map)(function () {return true;}),
            (0, _operators.catchError)(function (error) {
                (0, _logger.log)('Storage:updateItems: can\'t save to state file. path: <' + _this3.getFilePath(id) + '>, error:<' + error + '>', _logger.logLevel.ERROR);
                // rollback changes to fs storage to previous values on error
                itemsArray.forEach(function (itemToSave) {var
                    fieldName = itemToSave.fieldName;
                    var field = fieldName || '0';
                    storageById[field] = oldValues[field];
                });
                return (0, _rxjs.of)(false);
            }));

        } }, { key: 'removeItem', value: function removeItem(
        fieldName) {var _this4 = this;var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
            var storageById = this.getStorage(id);
            var field = fieldName || '0';
            var oldValue = Object.assign({}, storageById[field]);
            delete storageById[field];
            return _root2.default.fs.saveJson(this.getFilePath(id), storageById).
            pipe(
            (0, _operators.map)(function () {return true;}),
            (0, _operators.catchError)(function (error) {
                (0, _logger.log)('Storage:removeItem: can\'t save to state file. path: <' + _this4.getFilePath(id) + '>, error:<' + error + '>', _logger.logLevel.ERROR);
                // rollback changes to fs storage to previous values on error
                storageById[field] = oldValue;
                return (0, _rxjs.of)(false);
            }));

        } }, { key: 'getFilePath', value: function getFilePath()
        {var templateId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
            var file = templateId ? '' +
            this.fileNameTemplate.replace('$[id]', templateId) :
            this.fileNameTemplate;
            return '' + this.dirStorage + file;
        } }]);return Storage;}();


// TODO: maybe ItemsState
var ChatsState = function (_Storage) {_inherits(ChatsState, _Storage);
    function ChatsState(dirStorage) {_classCallCheck(this, ChatsState);return _possibleConstructorReturn(this, (ChatsState.__proto__ || Object.getPrototypeOf(ChatsState)).call(this,
        dirStorage, 'state.json'));
    }_createClass(ChatsState, [{ key: 'getItem', value: function getItem(
        field, stateId) {
            return _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'getItem', this).call(this, stateId).
            pipe((0, _operators.map)(function (chat) {return (
                    chat ? chat[field] : undefined);}));

        } }, { key: 'getItems', value: function getItems()
        {var fieldsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];var stateId = arguments[1];
            return _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'getItem', this).call(this, stateId).
            pipe((0, _operators.map)(function (chat) {
                var result = {};
                fieldsArray.forEach(function (field) {
                    result[field] = chat[field];
                });
                return result;
            }));
        } }, { key: 'updateItem', value: function updateItem(
        fieldName, item, stateId) {var _this6 = this;
            return _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'getItem', this).call(this, stateId).
            pipe((0, _operators.switchMap)(function (chat) {
                var chatNew = Object.assign({}, chat, _defineProperty({}, fieldName, item));
                return _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'updateItem', _this6).call(_this6, stateId, chatNew);
            }));
        }
        // itemsArray = [{item}]
    }, { key: 'updateItemsByMeta', value: function updateItemsByMeta() {var _this7 = this;var itemsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];var stateId = arguments[1];
            return _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'getItem', this).call(this, stateId).
            pipe((0, _operators.switchMap)(function (chat) {
                var chatNew = Object.assign({}, chat);
                itemsArray.forEach(function (itemToSave) {
                    Object.keys(itemToSave).
                    forEach(function (key) {
                        chatNew[key] = itemToSave[key];
                    });
                });
                return _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'updateItem', _this7).call(_this7, stateId, chatNew);
            }));
        }
        // itemsArray = [{fieldName, item}]
    }, { key: 'updateItems', value: function updateItems() {var _this8 = this;var itemsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];var stateId = arguments[1];
            return _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'getItem', this).call(this, stateId).
            pipe((0, _operators.switchMap)(function (chat) {
                var chatNew = Object.assign({}, chat);
                itemsArray.forEach(function (itemToSave) {var
                    fieldName = itemToSave.fieldName,item = itemToSave.item;
                    var field = fieldName || '0';
                    chatNew[field] = item;
                });
                return _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'updateItem', _this8).call(_this8, stateId, chatNew);
            }));
        } }, { key: 'removeItem', value: function removeItem(
        fieldName, stateId) {var _this9 = this;
            _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'getItem', this).call(this, stateId).
            pipe((0, _operators.switchMap)(function (chat) {
                var chatNew = Object.assign({}, chat);
                delete chatNew[fieldName];
                return _get(ChatsState.prototype.__proto__ || Object.getPrototypeOf(ChatsState.prototype), 'updateItem', _this9).call(_this9, stateId, chatNew);
            }));
        } }, { key: 'archive', value: function archive(
        stateId) {
            return this.updateItem('isActive', false, stateId);
        } }]);return ChatsState;}(Storage);


var state = new ChatsState(_config2.default.dirStorage);
var storage = exports.storage = new Storage(_config2.default.dirStorage + 'data/');exports.default =

state;