'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.mapUserActionToBotMessages = exports.dateTimeString = undefined;var _slicedToArray = function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();




var _rxjs = require('rxjs');
var _operators = require('rxjs/operators');

var _message = require('./message');
var _commands = require('./commands');var _commands2 = _interopRequireDefault(_commands);
var _storage = require('../storage');var _storage2 = _interopRequireDefault(_storage);
var _logger = require('../logger');
var _token = require('../token');var _token2 = _interopRequireDefault(_token);
var _inputParser = require('./inputParser');var _inputParser2 = _interopRequireDefault(_inputParser);
var _config = require('../config');var _config2 = _interopRequireDefault(_config);
var _analytics = require('../analytics');
var _history = require('../history');var _history2 = _interopRequireDefault(_history);
var _root = require('../jslib/root');var _root2 = _interopRequireDefault(_root);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {arr2[i] = arr[i];}return arr2;} else {return Array.from(arr);}}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;} /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   * INFO:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   *      - every handler should return Observable.from([BotMessage])
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   */var lastCommands = {};
/*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * ERRORS HANDERS
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             */
var errorToUser = function errorToUser(userId, chatId) {return [
    new _message.BotMessage(
    userId, chatId,
    'При при обработке запроса произошла ошибка. Пожалуйста, начните заново')];};


var botIsInDevelopmentToUser = function botIsInDevelopmentToUser(userId, chatId) {
    (0, _logger.log)('handlers.botIsInDevelopmentToUser: userId="' + userId + '" is not in token.developers array.', _logger.logLevel.ERROR);
    return (0, _rxjs.from)([
    new _message.BotMessage(
    userId, chatId, '\u0412 \u0434\u0430\u043D\u043D\u044B\u0439 \u043C\u043E\u043C\u0435\u043D\u0442 \u0431\u043E\u0442 \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u0432 \u0440\u0435\u0436\u0438\u043C\u0435 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0438. \n\u0412\u0430\u0448 \u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0432 \u043C\u0435\u0441\u0441\u0435\u043D\u0434\u0436\u0435\u0440\u0435 - "' +
    userId + '". \u0421\u043E\u043E\u0431\u0449\u0438\u0442\u0435 \u0441\u0432\u043E\u0439 \u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u043F\u043E \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0430\u043C \u0432 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0438 \u0431\u043E\u0442\u0430, \u0447\u0442\u043E\u0431\u044B \u0412\u0430\u0441 \u0434\u043E\u0431\u0430\u0432\u0438\u043B\u0438 \u0432 \u0433\u0440\u0443\u043F\u043F\u0443 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u043E\u0432' // eslint-disable-line max-len
    )]);
};

/*
    * COMMON METHODS
    */
var dateTimeString = exports.dateTimeString = function dateTimeString() {var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();return date.toLocaleDateString() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);}; // eslint-disable-line max-len

var storageId = function storageId(userId, chatId) {return '' + chatId;};

/*
                                                                           * HANDLERS
                                                                           */
/*
                                                                               * USER MESSAGE HELPERS
                                                                               */
var start = function start(userId, chatId, messageId, firstAndLastName, username) {return _storage2.default.updateItemsByMeta([{
        isActive: true,
        user: {
            name: firstAndLastName,
            username: username } }],

    storageId(userId, chatId)).
    pipe(
    (0, _operators.tap)(function () {return (0, _analytics.logEvent)(messageId, storageId(userId, chatId), _analytics.analyticsEventTypes.START);}),
    (0, _operators.mergeMap)(function (isStorageUpdated) {
        if (!isStorageUpdated) {
            (0, _logger.log)('handlers.start: userId="' + userId + '" state wasn\'t updated / created.', _logger.logLevel.ERROR);
            return (0, _rxjs.from)(errorToUser(userId, chatId));
        }
        return (0, _rxjs.from)([
        new _message.BotMessage(
        userId, chatId,
        'Вас приветствует foreignwordsBot! Чтобы остановить меня введите /stop',
        null,
        new _message.ReplyKeyboard([
        new _message.ReplyKeyboardButton('/getcard'),
        new _message.ReplyKeyboardButton('/addcard'),
        new _message.ReplyKeyboardButton('/getlist')]))]);


    }));};


var stop = function stop(userId, chatId, messageId) {return _storage2.default.archive(storageId(userId, chatId)).
    pipe(
    (0, _operators.tap)(function () {return (0, _analytics.logEvent)(messageId, storageId(userId, chatId), _analytics.analyticsEventTypes.STOP);}),
    (0, _operators.mergeMap)(function (isStateUpdated) {
        if (!isStateUpdated) {
            (0, _logger.log)('handlers.stop: userId="' + userId + '" state wasn\'t updated.', _logger.logLevel.ERROR);
            return (0, _rxjs.from)(errorToUser(userId, chatId));
        }
        return (0, _rxjs.from)([
        new _message.BotMessage(
        userId, chatId,
        'С Вами прощается foreignwordsBot!',
        null,
        new _message.ReplyKeyboard([
        new _message.ReplyKeyboardButton('/start'),
        new _message.ReplyKeyboardButton('/stop')]))]);


    }));};


var help = function help(userId, chatId) {return (0, _rxjs.from)([
    new _message.BotMessage(
    userId, chatId,
    'Помощь\nЗдесь Вы можете выучить наконец слова иностранного языка.')]);};


var tokenInit = function tokenInit(userId, chatId, text) {
    // return new BotMessage(userId, chatId, 'Токен принят')
    var tokenKey = text.split(' ')[1];
    if (Object.keys(_token2.default.initData).indexOf(tokenKey) === -1)
    return (0, _rxjs.from)([new _message.BotMessage(userId, chatId, 'Токен не найден')]);

    var initDataItems = _token2.default.initData[tokenKey];
    var dataItems = Object.keys(initDataItems).
    map(function (key) {return _defineProperty({},
        key, initDataItems[key]);});

    return _storage.storage.updateItemsByMeta(dataItems, storageId(userId, chatId)).
    pipe((0, _operators.mergeMap)(function (isStorageUpdated) {return (
            !isStorageUpdated ?
            (0, _rxjs.from)(errorToUser(userId, chatId)) :
            (0, _rxjs.from)([new _message.BotMessage(userId, chatId, 'Токен принят')]));}));

};

var updateCardCurrent = function updateCardCurrent(userId, chatId, messageId) {
    var word = void 0;
    return _storage.storage.getItem('foreignLine', storageId(userId, chatId)).
    pipe(
    (0, _operators.mergeMap)(function (foreignLine) {
        if (!foreignLine || foreignLine.length < 1) {
            return (0, _rxjs.of)(false);
        }var _foreignLine = _slicedToArray(
        foreignLine, 1);word = _foreignLine[0];
        (0, _analytics.logEvent)(messageId, storageId(userId, chatId), _analytics.analyticsEventTypes.CARD_GET, word);
        return _storage.storage.updateItemsByMeta([
        { foreignWordCurrent: word },
        { foreignLine: foreignLine.slice(1) }], storageId(userId, chatId));
    }),
    (0, _operators.map)(function (result) {return result ? word : false;}));

};

var cardGetCurrent = function cardGetCurrent(userId, chatId, messageId) {return _storage.storage.getItem('foreignWordCurrent', storageId(userId, chatId)).
    pipe(
    (0, _operators.mergeMap)(function (foreignWordCurrent) {
        if (!foreignWordCurrent) {
            return updateCardCurrent(userId, chatId, messageId);
        }
        return (0, _rxjs.of)(foreignWordCurrent);
    }),
    (0, _operators.mergeMap)(function (foreignWordCurrent) {
        if (!foreignWordCurrent) {
            lastCommands[storageId(userId, chatId)] = undefined;
            return (0, _rxjs.from)([new _message.BotMessage(userId, chatId, 'Нет карточек. Добавьте новые слова для изучения')]);
        }
        lastCommands[storageId(userId, chatId)] = _commands2.default.CARD_GET_CURRENT;
        return (0, _rxjs.from)([new _message.BotMessage(userId, chatId, '' + foreignWordCurrent, [
        new _message.InlineButtonsGroup([new _message.InlineButton('Не знаю', { word: foreignWordCurrent, cmd: _commands2.default.CARD_DONT_KNOW })])])]);

    }));};


var cardUserAnswer = function cardUserAnswer(userId, chatId, text, messageId) {return (
        _storage.storage.getItems(['foreignWordCurrent', 'words', 'foreignLine', 'rightAnswersCombos'], storageId(userId, chatId)).
        pipe((0, _operators.mergeMap)(function (foreignWordCurrentAndWordsAndForeignLineAndRightAnswersCombos) {var

            foreignWordCurrent =
            foreignWordCurrentAndWordsAndForeignLineAndRightAnswersCombos.foreignWordCurrent,words = foreignWordCurrentAndWordsAndForeignLineAndRightAnswersCombos.words,foreignLine = foreignWordCurrentAndWordsAndForeignLineAndRightAnswersCombos.foreignLine,_foreignWordCurrentAn = foreignWordCurrentAndWordsAndForeignLineAndRightAnswersCombos.rightAnswersCombos,rightAnswersCombos = _foreignWordCurrentAn === undefined ? {} : _foreignWordCurrentAn;
            var currentWordData = words.foreign[foreignWordCurrent];
            var returnObservable = null;
            var search = text.trim().toLowerCase();
            var matchedTranslationIndex = currentWordData.translations.map(function (item) {return item.toLowerCase();}).indexOf(search);
            if (matchedTranslationIndex > -1) {
                // right answer
                var wordCountBackIndex = (rightAnswersCombos[foreignWordCurrent] || 1) * 7;
                var newForeignLine = [].concat(_toConsumableArray(
                foreignLine.slice(0, wordCountBackIndex)), [
                foreignWordCurrent], _toConsumableArray(
                foreignLine.slice(wordCountBackIndex)));

                returnObservable = _storage.storage.updateItemsByMeta([
                { foreignWordCurrent: '' },
                { foreignLine: newForeignLine },
                { rightAnswersCombos: Object.assign({}, rightAnswersCombos, _defineProperty({}, foreignWordCurrent, (rightAnswersCombos[foreignWordCurrent] || 0) + 1)) // eslint-disable-line max-len
                }], storageId(userId, chatId)).
                pipe((0, _operators.map)(function () {
                    lastCommands[storageId(userId, chatId)] = undefined;
                    var otherTranslationsString = '';
                    if (currentWordData.translations.length > 1) {
                        otherTranslationsString = [].concat(_toConsumableArray(
                        currentWordData.translations.slice(0, matchedTranslationIndex)), _toConsumableArray(
                        currentWordData.translations.slice(matchedTranslationIndex + 1))).
                        join(', ');
                        otherTranslationsString = '\n\u0410 \u0435\u0449\u0435 \u044D\u0442\u043E: ' + otherTranslationsString;
                    }
                    (0, _analytics.logEvent)(messageId, storageId(userId, chatId), _analytics.analyticsEventTypes.CARD_ANSWER_RIGHT, foreignWordCurrent, search);
                    return new _message.BotMessage(userId, chatId, '\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E!' + otherTranslationsString);
                }));
            } else {
                lastCommands[storageId(userId, chatId)] = _commands2.default.CARD_GET_CURRENT;
                (0, _analytics.logEvent)(messageId, storageId(userId, chatId), _analytics.analyticsEventTypes.CARD_ANSWER_WRONG, foreignWordCurrent, search);
                returnObservable = _storage.storage.updateItem(
                'rightAnswersCombos',
                Object.assign({}, rightAnswersCombos, _defineProperty({}, foreignWordCurrent, 0)),
                storageId(userId, chatId)).
                pipe((0, _operators.mapTo)(new _message.BotMessage(userId, chatId, 'Ответ неверный!')));
            }
            return returnObservable;
        })));};

var cardAdd = function cardAdd(userId, chatId) {
    lastCommands[storageId(userId, chatId)] = _commands2.default.CARD_ADD;
    return (0, _rxjs.of)(new _message.BotMessage(
    userId, chatId,
    'Введите слово или фразу для заучивания в формате: "Foreign language word - перевод1, перевод2, перевод3, ..."'));

};

var cardAddUserResponse = function cardAddUserResponse(userId, chatId, text, messageId) {
    var wordAndTranslations = text.trim(' ').split('-');
    if (!wordAndTranslations || wordAndTranslations.length !== 2) {
        lastCommands[storageId(userId, chatId)] = _commands2.default.CARD_ADD;
        return (0, _rxjs.of)(new _message.BotMessage(userId, chatId, 'Неверный формат, повторите попытку'));
    }

    var word = wordAndTranslations[0].trim(' ');
    if (!word) {
        lastCommands[storageId(userId, chatId)] = _commands2.default.CARD_ADD;
        return (0, _rxjs.of)(new _message.BotMessage(userId, chatId, 'Введите не пустое слово'));
    }
    var translations = wordAndTranslations[1].split(',').
    map(function (translation) {return translation.trim(' ');});
    if (!translations || translations.length === 0) {
        lastCommands[storageId(userId, chatId)] = _commands2.default.CARD_ADD;
        return (0, _rxjs.of)(new _message.BotMessage(userId, chatId, 'Введите не пустой перевод'));
    }

    lastCommands[storageId(userId, chatId)] = _commands2.default.CARD_ADD_USER_RESPONSE;
    return _storage.storage.getItems(['words', 'foreignLine'], storageId(userId, chatId)).
    pipe(
    (0, _operators.mergeMap)(function (wordsAndForeignLine) {var _wordData$translation;var
        wordsObject = wordsAndForeignLine.words,foreignLine = wordsAndForeignLine.foreignLine;
        var words = Object.assign({}, wordsObject);var
        translation = words.translation,foreign = words.foreign;
        if (!foreign) {
            foreign = {};
        }
        if (!translation) {
            translation = {};
        }
        if (!foreign[word]) {
            words.foreign = Object.assign({}, foreign, _defineProperty({}, '' + word, { translations: [] }));
            (0, _analytics.logEvent)(messageId, storageId(userId, chatId), _analytics.analyticsEventTypes.CARD_ADD, word);
        }

        var wordData = words.foreign[word];
        var translationsToAdd = translations.
        filter(function (translationItem) {return wordData.translations.indexOf(translationItem) === -1;});
        (_wordData$translation = wordData.translations).push.apply(_wordData$translation, _toConsumableArray(translationsToAdd));
        words.foreign[word] = wordData;

        translationsToAdd.forEach(function (translationToAdd) {
            if (!translation[translationToAdd]) {
                words.translation = Object.assign({}, words.translation || {}, _defineProperty({}, '' + translationToAdd, { foreigns: [] }));
            }

            var translationData = words.translation[translationToAdd];
            if (translationData.foreigns.indexOf(word) === -1) {
                translationData.foreigns.push(word);
            }
            words.translation[translationToAdd] = translationData;
        });

        var foreignLineNew = (foreignLine || []).slice();
        var itemsToUpdate = [{ words: words }];
        if (foreignLineNew.indexOf(word) === -1)
        itemsToUpdate.push({ foreignLine: [].concat(_toConsumableArray(foreignLineNew.slice(0, 10)), [word], _toConsumableArray(foreignLineNew.slice(10))) });
        return _storage.storage.updateItemsByMeta(itemsToUpdate, storageId(userId, chatId));
    }),
    (0, _operators.filter)(function (updateResult) {return updateResult;}),
    (0, _operators.map)(function () {return new _message.BotMessage(userId, chatId, 'Фраза получена и записана');}));

};

var cardGetList = function cardGetList(userId, chatId) {return _storage.storage.getItem('words', storageId(userId, chatId)).
    pipe((0, _operators.map)(function (words) {
        lastCommands[storageId(userId, chatId)] = _commands2.default.CARD_GET_LIST;
        if (!words || !words.foreign || Object.keys(words.foreign).length === 0) {
            return new _message.BotMessage(userId, chatId, 'Нет карточек');
        }
        var allWords = Object.keys(words.foreign).
        map(function (wordKey) {return wordKey + ' - ' + words.foreign[wordKey].translations.join(', ');}).join('\n');
        return new _message.BotMessage(userId, chatId, allWords);
    }));};


var wordsRemoveForeignMutable = function wordsRemoveForeignMutable(words, word) {var
    foreign = words.foreign,translation = words.translation;

    foreign[word].translations.
    forEach(function (translationKey) {
        var wordIndex = translation[translationKey].foreigns.indexOf(word);
        if (wordIndex > -1)
        translation[translationKey].foreigns = [].concat(_toConsumableArray(
        translation[translationKey].foreigns.slice(0, wordIndex)), _toConsumableArray(
        translation[translationKey].foreigns.slice(wordIndex + 1)));

    });
    delete foreign[word];
};

var wordsRemoveTranslationMutable = function wordsRemoveTranslationMutable(words, wordTranslation) {var
    foreign = words.foreign,translation = words.translation;

    translation[wordTranslation].foreigns.
    forEach(function (foreignKey) {
        var wordIndex = foreign[foreignKey].translations.indexOf(wordTranslation);
        if (wordIndex > -1)
        foreign[foreignKey].translations = [].concat(_toConsumableArray(
        foreign[foreignKey].translations.slice(0, wordIndex)), _toConsumableArray(
        foreign[foreignKey].translations.slice(wordIndex + 1)));

    });
    delete translation[wordTranslation];
};

var wordsRemove = function wordsRemove(userId, chatId, text, messageId) {
    var word = text.slice(text.indexOf(' ') + 1).trim(' ');
    return _storage.storage.getItems(['words', 'foreignLine', 'foreignWordCurrent'], storageId(userId, chatId)).
    pipe(
    (0, _operators.map)(function (wordsAndForeignLineAndForeignWordCurrent) {var
        words = wordsAndForeignLineAndForeignWordCurrent.words,foreignLine = wordsAndForeignLineAndForeignWordCurrent.foreignLine,foreignWordCurrent = wordsAndForeignLineAndForeignWordCurrent.foreignWordCurrent;
        lastCommands[storageId(userId, chatId)] = _commands2.default.CARD_REMOVE;var _Object$assign5 =
        Object.assign({}, words),foreign = _Object$assign5.foreign,translation = _Object$assign5.translation;
        var newForeignLine = void 0;
        var newForeignWordCurrent = void 0;
        if (Object.keys(foreign).indexOf(word) > -1) {
            wordsRemoveForeignMutable(words, word);
            var foreignLineWordIndex = foreignLine.indexOf(word);
            newForeignLine = [].concat(_toConsumableArray(foreignLine.slice(0, foreignLineWordIndex)), _toConsumableArray(foreignLine.slice(foreignLineWordIndex + 1)));
            if (foreignWordCurrent === word) {
                newForeignWordCurrent = '';
            }
            (0, _analytics.logEvent)(messageId, storageId(userId, chatId), _analytics.analyticsEventTypes.CARD_REMOVE, word);
        } else if (Object.keys(translation).indexOf(word) > -1)
        wordsRemoveTranslationMutable(words, word);else
        {
            return false;
        }
        return { words: words, newForeignLine: newForeignLine, newForeignWordCurrent: newForeignWordCurrent };
    }),
    (0, _operators.mergeMap)(function (_ref2) {var words = _ref2.words,newForeignLine = _ref2.newForeignLine,newForeignWordCurrent = _ref2.newForeignWordCurrent;
        if (!words)
        return (0, _rxjs.of)(words);
        var updateElements = [{ words: words }];
        if (newForeignLine) {
            updateElements.push({ foreignLine: newForeignLine });
        }
        if (newForeignWordCurrent === '') {
            updateElements.push({ foreignWordCurrent: newForeignWordCurrent });
        }
        return _storage.storage.updateItemsByMeta(updateElements, storageId(userId, chatId));
    }),
    (0, _operators.map)(function (isSuccess) {
        if (isSuccess)
        return new _message.BotMessage(userId, chatId, 'Слово было удалено');
        return new _message.BotMessage(userId, chatId, 'Слово не было найдено / удалено');
    }));

};

/*
    * Период: дата1 - дата2 (N дней)
    * Показано карточек: CARD_GET
    * Подсказок (неразгаданных карточек): CARD_DONT_KNOW
    * Верных ответов (разгаданных карточек): CARD_ANSWER_RIGHT
    * Неверных ответов (неудачных попыток ответить): CARD_ANSWER_WRONG
    * Добавлено новых карточек: CARD_ADD
    * Удалено карточек: CARD_REMOVE
    * ---
    * Сложные слова:
    *  [{word, wrongAnswersCount, dontknowCount}]
    *  filter: wrongAnswersCount + dontknowCount > 0 && (CARD_DONT_KNOW || CARD_ANSWER_WRONG)
    *  sort((i1, i2) => i1.wrongAnswersCount + i1.dontknowCount - (i2.wrongAnswersCount + i2.dontknowCount))
    *  Word1 - перевод1, перевод2, ...
    *  Word2 - перевод1, перевод2, ...
    */
var stats = function stats(userId, chatId, text) {
    var spaceIndex = text.indexOf(' ');var _getStartAndEndDates =





    (0, _analytics.getStartAndEndDates)(spaceIndex > -1 ? text.slice(spaceIndex + 1) : ''),dateStart = _getStartAndEndDates.dateStart,dateEnd = _getStartAndEndDates.dateEnd,dateEndUser = _getStartAndEndDates.dateEndUser,intervalLength = _getStartAndEndDates.intervalLength;

    var dateStartTicks = dateStart.getTime();
    var dateEndTicks = dateEnd.getTime();
    return (0, _rxjs.combineLatest)(
    _history2.default.getByFilter(function (historyItem) {
        var dateCreateTicks = new Date(historyItem.dateCreate);
        return dateCreateTicks > dateStartTicks &&
        dateCreateTicks < dateEndTicks && (

        historyItem.eventType === _analytics.analyticsEventTypes.CARD_GET ||
        historyItem.eventType === _analytics.analyticsEventTypes.CARD_ANSWER_RIGHT ||
        historyItem.eventType === _analytics.analyticsEventTypes.CARD_ANSWER_WRONG ||
        historyItem.eventType === _analytics.analyticsEventTypes.CARD_DONT_KNOW ||
        historyItem.eventType === _analytics.analyticsEventTypes.CARD_ADD ||
        historyItem.eventType === _analytics.analyticsEventTypes.CARD_REMOVE);

    }, storageId(userId, chatId)),
    _storage.storage.getItem('words', storageId(userId, chatId))).
    pipe((0, _operators.mergeMap)(function (_ref3) {var _ref4 = _slicedToArray(_ref3, 2),historyFiltered = _ref4[0],words = _ref4[1];
        var cardGetCount = historyFiltered.filter(function (historyItem) {return historyItem.eventType === _analytics.analyticsEventTypes.CARD_GET;}).length;
        var cardDontKnowCount = historyFiltered.filter(function (historyItem) {return historyItem.eventType === _analytics.analyticsEventTypes.CARD_DONT_KNOW;}).length;
        var cardAnswerRightCount = historyFiltered.filter(function (historyItem) {return historyItem.eventType === _analytics.analyticsEventTypes.CARD_ANSWER_RIGHT;}).length;
        var cartAnswerWrongCount = historyFiltered.filter(function (historyItem) {return historyItem.eventType === _analytics.analyticsEventTypes.CARD_ANSWER_WRONG;}).length;
        var cardAddCount = historyFiltered.filter(function (historyItem) {return historyItem.eventType === _analytics.analyticsEventTypes.CARD_ADD;}).length;
        var cardRemoveCount = historyFiltered.filter(function (historyItem) {return historyItem.eventType === _analytics.analyticsEventTypes.CARD_REMOVE;}).length;

        var headerMessage = '\u041F\u0435\u0440\u0438\u043E\u0434: ' +
        _root2.default.time.dateWeekdayString(dateStart) + ' - ' + _root2.default.time.dateWeekdayString(dateEndUser) + ', \u0434\u043D\u0435\u0439: ' + intervalLength + '\n* ' +
        cardGetCount + ' \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u043E\n* ' +
        cardAnswerRightCount + ' \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u0440\u0430\u0437\u0433\u0430\u0434\u0430\u043D\u043E (\u0432\u0435\u0440\u043D\u044B\u0445 \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E)\n* ' +
        cartAnswerWrongCount + ' \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0445 \u043E\u0442\u0432\u0435\u0442\u043E\u0432 (\u043D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0445 \u043F\u043E\u043F\u044B\u0442\u043E\u043A \u043E\u0442\u0432\u0435\u0442\u0438\u0442\u044C)\n* ' +
        cardDontKnowCount + ' \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043E\u043A \u0437\u0430\u043F\u0440\u043E\u0448\u0435\u043D\u043E (\u043D\u0435\u0440\u0430\u0437\u0433\u0430\u0434\u0430\u043D\u043D\u044B\u0445 \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A)\n* ' +
        cardAddCount + ' \u043D\u043E\u0432\u044B\u0445 \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E\n* ' +
        cardRemoveCount + ' \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u0443\u0434\u0430\u043B\u0435\u043D\u043E';
        var result = [new _message.BotMessage(userId, chatId, headerMessage)];
        if (cardGetCount !== 0 ||
        cardAnswerRightCount !== 0 ||
        cartAnswerWrongCount !== 0 ||
        cardDontKnowCount !== 0 ||
        cardAddCount !== 0 ||
        cardRemoveCount !== 0) {
            var historyWords = Array.from(new Set(historyFiltered.map(function (historyItem) {return historyItem.foreignWord;})));
            var wordsStats = historyWords.map(function (word) {return {
                    word: word,
                    translations: words.foreign[word].translations.join(', '),
                    wrongAnswersCount: historyFiltered.filter(function (historyItem) {return historyItem.eventType === _analytics.analyticsEventTypes.CARD_ANSWER_WRONG &&
                        historyItem.foreignWord === word;}).length,
                    dontknowCount: historyFiltered.filter(function (historyItem) {return historyItem.eventType === _analytics.analyticsEventTypes.CARD_DONT_KNOW &&
                        historyItem.foreignWord === word;}).length };});

            var hardWordsMessage = wordsStats.
            filter(function (wordStat) {return wordStat.wrongAnswersCount + wordStat.dontknowCount > 0;}).
            sort(function (i1, i2) {return i2.wrongAnswersCount + i2.dontknowCount - (i1.wrongAnswersCount + i1.dontknowCount);}).
            map(function (hardWord) {return hardWord.word + ' - ' + hardWord.translations;}).
            join('\n');
            if (hardWordsMessage.length > 0)
            result.push(new _message.BotMessage(userId, chatId, '\u0421\u043B\u043E\u0436\u043D\u044B\u0435 \u0441\u043B\u043E\u0432\u0430:\n' + hardWordsMessage));
        }
        return (0, _rxjs.from)(result);
    }));
};

/*
    * USER ACTION HELPERS
    */
var cardUserAnswerDontKnow = function cardUserAnswerDontKnow(userId, chatId, word, messageId) {return (
        _storage.storage.getItems(['words', 'foreignLine', 'foreignWordCurrent'], storageId(userId, chatId)).
        pipe(
        (0, _operators.mergeMap)(function (wordsAndForeignLineAndForeignWordCurrent) {
            (0, _analytics.logEvent)(messageId, storageId(userId, chatId), _analytics.analyticsEventTypes.CARD_DONT_KNOW, word);var
            words = wordsAndForeignLineAndForeignWordCurrent.words,foreignLine = wordsAndForeignLineAndForeignWordCurrent.foreignLine,foreignWordCurrent = wordsAndForeignLineAndForeignWordCurrent.foreignWordCurrent;
            var wordData = words.foreign[word];

            if (word === foreignWordCurrent) {
                var newForeignLine = [].concat(_toConsumableArray(foreignLine.slice(0, 4)), [word], _toConsumableArray(foreignLine.slice(4)));
                return _storage.storage.updateItems([
                { fieldName: 'foreignWordCurrent', item: '' },
                { fieldName: 'foreignLine', item: newForeignLine }],
                storageId(userId, chatId)).pipe((0, _operators.map)(function () {return wordData;}));
            }
            return (0, _rxjs.of)(wordData);
        }),
        (0, _operators.map)(function (wordData) {return new _message.BotMessage(userId, chatId, word + ' = ' + wordData.translations.toString());})));};


/*
                                                                                                                                                          * EXPORTS
                                                                                                                                                          */
var mapUserMessageToBotMessages = function mapUserMessageToBotMessages(message) {// eslint-disable-line complexity
    var
    text =
    message.text,messageFrom = message.from,chat = message.chat,user = message.user,messageId = message.id;
    var chatId = chat ? chat.id : messageFrom;var

    lastName =
    user.lastName,firstName = user.firstName,username = user.username;

    var messagesToUser = void 0;
    if (!_config2.default.isProduction && !_inputParser2.default.isDeveloper(messageFrom)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined;
        messagesToUser = botIsInDevelopmentToUser(messageFrom, chatId);
    } else if (_inputParser2.default.isStart(text)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined;
        messagesToUser = start(messageFrom, chatId, messageId, (firstName || '') + ' ' + (lastName || ''), username);
    } else if (_inputParser2.default.isStop(text)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined;
        messagesToUser = stop(messageFrom, chatId, messageId);
    } else if (_inputParser2.default.isHelp(text)) {
        messagesToUser = help(messageFrom, chatId);
    } else if (_inputParser2.default.isToken(text)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined;
        messagesToUser = tokenInit(messageFrom, chatId, text);
    } else if (_inputParser2.default.isCardGetCurrent(text)) {
        messagesToUser = cardGetCurrent(messageFrom, chatId, messageId);
    } else if (_inputParser2.default.isCardAdd(text)) {
        messagesToUser = cardAdd(messageFrom, chatId, text);
    } else if (_inputParser2.default.isCardGetList(text)) {
        messagesToUser = cardGetList(messageFrom, chatId);
    } else if (_inputParser2.default.isCardRemove(text)) {
        messagesToUser = wordsRemove(messageFrom, chatId, text, messageId);
    } else if (_inputParser2.default.isStats(text))
    messagesToUser = stats(_rxjs.from, chatId, text);else
    if (_inputParser2.default.isCardUserAnswer(lastCommands[storageId(messageFrom, chatId)])) {
        messagesToUser = cardUserAnswer(messageFrom, chatId, text, messageId);
    } else if (_inputParser2.default.isCardAddUserResponse(lastCommands[storageId(messageFrom, chatId)])) {
        messagesToUser = cardAddUserResponse(messageFrom, chatId, text, messageId);
    }
    if (!messagesToUser) {
        messagesToUser = help(_rxjs.from, chatId);
    }

    return (0, _rxjs.from)(messagesToUser).
    pipe(
    (0, _operators.concatMap)(function (msgToUser) {return (0, _rxjs.of)(msgToUser).
        pipe((0, _operators.delay)(10));}),
    (0, _operators.catchError)(function (err) {
        (0, _logger.log)('message: <' + JSON.stringify(message) + '>, Error: ' + err, _logger.logLevel.ERROR);
    }));

};

var mapUserActionToBotMessages = exports.mapUserActionToBotMessages = function mapUserActionToBotMessages(userAction) {// eslint-disable-line complexity
    var message = userAction.message,_userAction$data = userAction.data,data = _userAction$data === undefined ? {} : _userAction$data;var
    messageFrom = message.from,chat = message.chat,messageId = message.id;
    var chatId = chat ? chat.id : messageFrom;
    var callbackCommand = data.cmd || undefined;
    var messagesToUser = void 0;
    if (_inputParser2.default.isCardUserAnswerDontKnow(callbackCommand)) {
        messagesToUser = cardUserAnswerDontKnow(messageFrom, chatId, data.word, messageId);
    } else {
        (0, _logger.log)('handlers.mapUserActionToBotMessages: can\'t find handler for user action callback query. userId=' +
        messageFrom + ', chatId=' + chatId + ', data=' + JSON.stringify(data), // eslint-disable-line max-len
        _logger.logLevel.ERROR);

        messagesToUser = errorToUser(messageFrom, chatId);
    }

    return (0, _rxjs.from)(messagesToUser).
    pipe(
    (0, _operators.concatMap)(function (msgToUser) {return (0, _rxjs.of)(msgToUser).
        pipe((0, _operators.delay)(10));}),
    (0, _operators.catchError)(function (err) {
        (0, _logger.log)(err, _logger.logLevel.ERROR);
    }));

};exports.default =

mapUserMessageToBotMessages;