'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.RxFileSystem = undefined;var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}(); // Source: https://nodejs.org/api/fs.html

var _fs = require('fs');var _fs2 = _interopRequireDefault(_fs);
var _jsonfile = require('jsonfile');var _jsonfile2 = _interopRequireDefault(_jsonfile);
var _rwlock = require('rwlock');var _rwlock2 = _interopRequireDefault(_rwlock);
var _rxjs = require('rxjs');
var _operators = require('rxjs/operators');
var _fromPromise = require('rxjs/observable/fromPromise');
var _fastCsv = require('fast-csv');var _fastCsv2 = _interopRequireDefault(_fastCsv);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

var lock = new _rwlock2.default();var

FileSystem = function () {function FileSystem() {_classCallCheck(this, FileSystem);}_createClass(FileSystem, [{ key: 'readFile', value: function readFile(
        file) {
            return new Promise(function (resolve, reject) {
                lock.readLock(file, function (release) {
                    _fs2.default.readFile(file, function (err, data) {
                        release();
                        if (err) return reject(err);
                        return resolve(data);
                    });
                });
            });
        } }, { key: 'saveFile', value: function saveFile(
        file, data) {
            return new Promise(function (resolve, reject) {
                lock.writeLock(file, function (release) {
                    _fs2.default.writeFile(file, data, function (err) {
                        release();
                        if (err) return reject(err);
                        return resolve();
                    });
                });
            });
        } }, { key: 'appendFile', value: function appendFile(
        file, data) {
            return new Promise(function (resolve, reject) {
                lock.writeLock(file, function (release) {
                    _fs2.default.appendFile(file, data, function (err) {
                        release();
                        if (err) return reject(err);
                        return resolve();
                    });
                });
            });
        } }, { key: 'readJson', value: function readJson(
        file) {
            return new Promise(function (resolve, reject) {
                lock.readLock(file, function (release) {
                    _jsonfile2.default.readFile(file, function (err, data) {
                        release();
                        if (err) return reject(err);
                        return resolve(data);
                    });
                });
            });
        } }, { key: 'saveJson', value: function saveJson(
        file, data) {
            return new Promise(function (resolve, reject) {
                lock.writeLock(file, function (release) {
                    _jsonfile2.default.writeFile(file, data, function (err) {
                        release();
                        if (err) return reject(err);
                        return resolve();
                    });
                });
            });
        } }, { key: 'access', value: function access(
        path, mode) {
            return new Promise(function (resolve, reject) {
                lock.readLock(path, function (release) {
                    _fs2.default.access(path, mode, function (err) {
                        release();
                        if (err) reject(err);
                        resolve({ path: path, mode: mode });
                    });
                });
            });
        } }, { key: 'isExists', value: function isExists(
        path) {
            return this.access(path, _fs2.default.constants.F_OK);
        } }, { key: 'accessRead', value: function accessRead(
        path) {
            return this.access(path, _fs2.default.constants.R_OK);
        } }, { key: 'mkDir', value: function mkDir(
        path) {
            return new Promise(function (resolve, reject) {
                lock.writeLock(path, function (release) {
                    _fs2.default.mkdir(path, undefined, function (err) {
                        release();
                        if (err) return reject(err);
                        return resolve();
                    });
                });
            });
        } }, { key: 'readDir', value: function readDir(
        path) {
            return new Promise(function (resolve, reject) {
                lock.writeLock(path, function (release) {
                    _fs2.default.readdir(path, undefined, function (err, files) {
                        release();
                        if (err) return reject(err);
                        return resolve(files);
                    });
                });
            });
        } }]);return FileSystem;}();exports.default = FileSystem;var


RxFileSystem = exports.RxFileSystem = function () {
    function RxFileSystem() {_classCallCheck(this, RxFileSystem);
        this.filesystem = new FileSystem();
    }_createClass(RxFileSystem, [{ key: 'readFile', value: function readFile(
        file) {var scheduler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
            return (0, _fromPromise.fromPromise)(this.filesystem.readFile(file), scheduler);
        } }, { key: 'saveFile', value: function saveFile(
        file, data) {
            return (0, _fromPromise.fromPromise)(this.filesystem.saveFile(file, data));
        } }, { key: 'appendFile', value: function appendFile(
        file, data) {
            return (0, _fromPromise.fromPromise)(this.filesystem.appendFile(file, data));
        } }, { key: 'readJson', value: function readJson(
        file) {
            return (0, _fromPromise.fromPromise)(this.filesystem.readJson(file));
        } }, { key: 'saveJson', value: function saveJson(
        file, data) {
            return (0, _fromPromise.fromPromise)(this.filesystem.saveJson(file, data));
        } }, { key: 'createReadStream', value: function createReadStream(
        file) {
            return (0, _rxjs.of)(_fs2.default.createReadStream(file));
        } }, { key: 'access', value: function access(
        path, mode) {
            return (0, _fromPromise.fromPromise)(this.filesystem.access(path, mode));
        } }, { key: 'isExists', value: function isExists(
        path) {
            return this.access(path, _fs2.default.constants.F_OK).
            pipe(
            (0, _operators.mergeMap)(function () {return (0, _rxjs.of)(true);}),
            (0, _operators.catchError)(function () {return (0, _rxjs.of)(false);}));

        } }, { key: 'accessRead', value: function accessRead(
        path) {
            return this.access(path, _fs2.default.constants.R_OK);
        } }, { key: 'mkDir', value: function mkDir(
        path) {
            return (0, _fromPromise.fromPromise)(this.filesystem.mkDir(path));
        } }, { key: 'readDir', value: function readDir(
        path) {
            return (0, _fromPromise.fromPromise)(this.filesystem.readDir(path));
        }
        // options = {{ headers: true }} https://www.npmjs.com/package/fast-csv
    }, { key: 'readCsv', value: function readCsv(path) {var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            return _rxjs.Observable.create(function (observer) {
                _fastCsv2.default.
                fromPath(path, options).
                on('data', function (data) {
                    observer.next(data);
                }).
                on('end', function () {
                    observer.complete();
                });
            });
        } }, { key: 'saveCsv', value: function saveCsv(
        path, dataArray) {var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { rowDelimiter: ',' };
            return _rxjs.Observable.create(function (observer) {
                _fastCsv2.default.writeToPath(path, dataArray, options).
                on('finish', function () {
                    observer.next(true);
                    observer.complete();
                });
            });
        } }]);return RxFileSystem;}();