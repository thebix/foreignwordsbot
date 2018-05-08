'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();var _nodeTelegramBotApi = require('node-telegram-bot-api');var _nodeTelegramBotApi2 = _interopRequireDefault(_nodeTelegramBotApi);
var _rxjs = require('rxjs');
var _operators = require('rxjs/operators');
var _fromPromise = require('rxjs/observable/fromPromise');

var _logger = require('../logger');
var _message = require('./message');var _message2 = _interopRequireDefault(_message);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

var botMessageOptions = function botMessageOptions()




{var inlineButtonsGroups = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;var replyKeyboard = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;var editMessageId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;var editMessageChatId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
    var options = {
        message_id: editMessageId,
        chat_id: editMessageChatId,
        reply_markup: {} };

    if (inlineButtonsGroups && Array.isArray(inlineButtonsGroups)) {
        options.reply_markup.inline_keyboard =
        inlineButtonsGroups.map(function (inlineButtonsGroup) {return (
                inlineButtonsGroup.inlineButtons.
                map(function (inlineButton) {return {
                        text: inlineButton.text,
                        callback_data: JSON.stringify(inlineButton.callbackData) };}));});

    }
    if (replyKeyboard && replyKeyboard.buttons && Array.isArray(replyKeyboard.buttons)) {var _replyKeyboard$button =





        replyKeyboard.buttons,buttons = _replyKeyboard$button === undefined ? [] : _replyKeyboard$button,_replyKeyboard$resize = replyKeyboard.resizeKeyboard,resizeKeyboard = _replyKeyboard$resize === undefined ? false : _replyKeyboard$resize,_replyKeyboard$oneTim = replyKeyboard.oneTimeKeyboard,oneTimeKeyboard = _replyKeyboard$oneTim === undefined ? false : _replyKeyboard$oneTim,_replyKeyboard$select = replyKeyboard.selective,selective = _replyKeyboard$select === undefined ? false : _replyKeyboard$select;

        options.reply_markup.resize_keyboard = resizeKeyboard;
        options.reply_markup.one_time_keyboard = oneTimeKeyboard;
        options.reply_markup.selective = selective;
        options.reply_markup.keyboard =
        buttons.map(function (item) {return [{
                text: item.text }];});

    }
    return options;
};var

Telegram = function () {
    function Telegram(token) {_classCallCheck(this, Telegram);
        if (!token) {
            (0, _logger.log)('Telegram: You should provide a telegram bot token', _logger.logLevel.ERROR);
            throw new Error('Telegram: You should provide a telegram bot token');
        }
        this.bot = new _nodeTelegramBotApi2.default(token, { polling: true, webHook: false });
    }_createClass(Telegram, [{ key: 'userText', value: function userText()
        {
            return (0, _rxjs.fromEvent)(this.bot, 'text').
            pipe((0, _operators.map)(function (msg) {return _message2.default.createFromTelegramMessage(msg[0]);}));
        } }, { key: 'userActions', value: function userActions()
        {var _this = this;
            return (0, _rxjs.fromEvent)(this.bot, 'callback_query').
            pipe(
            (0, _operators.tap)(function (userAction) {return _this.bot.answerCallbackQuery(userAction.id, {
                    text: 'Команда получена',
                    show_alert: false });}),

            (0, _operators.map)(function (userAction) {return _message.UserAction.createFromTelegramUserAction(userAction);}));

        } }, { key: 'botMessage', value: function botMessage(_ref)


        {var chatId = _ref.chatId,text = _ref.text,inlineButtonsGroups = _ref.inlineButtonsGroups,replyKeyboard = _ref.replyKeyboard;
            return (0, _fromPromise.fromPromise)(this.bot.sendMessage(
            chatId, text + ' \uD83E\uDD16',
            botMessageOptions(inlineButtonsGroups, replyKeyboard))).

            pipe(
            (0, _operators.map)(function (botMessageSendSuccess) {return _message.BotMessageSendResult.createFromSuccess(botMessageSendSuccess);}),
            (0, _operators.catchError)(function (botMessageSendError) {return (0, _rxjs.of)(_message.BotMessageSendResult.createFromError(botMessageSendError));}));

        } }, { key: 'botMessageEdit', value: function botMessageEdit(_ref2)


        {var chatId = _ref2.chatId,text = _ref2.text,inlineButtonsGroups = _ref2.inlineButtonsGroups,messageIdToEdit = _ref2.messageIdToEdit;
            return (0, _fromPromise.fromPromise)(this.bot.editMessageText(
            text + ' \uD83E\uDD16',
            botMessageOptions(inlineButtonsGroups, undefined, messageIdToEdit, chatId))).

            pipe(
            (0, _operators.map)(function (botMessageSendSuccess) {return _message.BotMessageSendResult.createFromSuccess(botMessageSendSuccess);}),
            (0, _operators.catchError)(function (botMessageSendError) {return (0, _rxjs.of)(_message.BotMessageSendResult.createFromError(botMessageSendError));}));

        } }, { key: 'chatInfo', value: function chatInfo(
        chatId) {
            return (0, _fromPromise.fromPromise)(this.bot.getChat(chatId));
        } }]);return Telegram;}();exports.default = Telegram;