'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}} // https://core.telegram.org/bots/api#user

var USER_ID_UNUSED = exports.USER_ID_UNUSED = 'userId_unused';

/*
                                                                *   FROM USER
                                                                */var
UserMessage = function () {
    function UserMessage(msg) {_classCallCheck(this, UserMessage);
        this.id = msg.id;
        this.from = msg.from;
        this.text = msg.text;
        this.user = msg.user;
        this.chat = msg.chat;
    }_createClass(UserMessage, null, [{ key: 'createFromTelegramMessage', value: function createFromTelegramMessage(

        msg) {
            return new UserMessage({
                id: msg.message_id,
                from: msg.from.id,
                text: msg.text,
                user: {
                    id: msg.from.id,
                    firstName: msg.from.first_name,
                    lastName: msg.from.last_name,
                    username: msg.from.username },

                chat: {
                    id: msg.chat.id,
                    type: msg.chat.type,
                    title: msg.chat.title,
                    username: msg.chat.username,
                    firstName: msg.chat.first_name,
                    lastName: msg.chat.last_name,
                    allMembersAdmins: msg.chat.all_members_are_administrators } });


        } }, { key: 'createFromTelegramUserAction', value: function createFromTelegramUserAction(
        userAction) {
            // INFO: message.user = bot, from = user
            var message = userAction.message,from = userAction.from;
            return new UserMessage({
                id: message.message_id,
                from: from.id,
                text: message.text,
                user: {
                    id: from.id,
                    firstName: from.first_name,
                    lastName: from.last_name,
                    username: from.username },

                chat: {
                    id: message.chat.id,
                    type: message.chat.type,
                    title: message.chat.title,
                    username: message.chat.username,
                    firstName: message.chat.first_name,
                    lastName: message.chat.last_name,
                    allMembersAdmins: !!message.chat.all_members_are_administrators } });


        }
        // create command to handler to imitate user input
    }, { key: 'createCommand', value: function createCommand(chatId, text) {
            return new UserMessage({
                id: 'messageId_unused',
                from: USER_ID_UNUSED,
                text: text,
                user: {
                    id: USER_ID_UNUSED,
                    firstName: 'firstName_unused',
                    lastName: 'lastName_unused',
                    username: 'username_unused' },

                chat: {
                    id: chatId,
                    type: 'chatType_unused',
                    title: 'chatTitle_unused',
                    username: 'chatUsername_unused',
                    firstName: 'chatFirstName_unused',
                    lastName: 'chatLastName_unused',
                    allMembersAdmins: false } });


        } }]);return UserMessage;}();exports.default = UserMessage;var


UserAction = exports.UserAction = function () {
    function UserAction(_ref) {var data = _ref.data,message = _ref.message;_classCallCheck(this, UserAction);
        this.data = data;
        this.message = message;
    }_createClass(UserAction, null, [{ key: 'createFromTelegramUserAction', value: function createFromTelegramUserAction(

        userAction) {var
            data = userAction.data;
            return {
                data: data ? JSON.parse(data) : {},
                message: UserMessage.createFromTelegramUserAction(userAction) };

        } }]);return UserAction;}();


/*
                                      *  TO USER
                                      */
// https://core.telegram.org/bots/api#inlinekeyboardmarkup
var InlineButton = exports.InlineButton =
function InlineButton(text, callbackData) {_classCallCheck(this, InlineButton);
    this.text = text;
    this.callbackData = callbackData;
};var

InlineButtonsGroup = exports.InlineButtonsGroup =
function InlineButtonsGroup() {var inlineButtonsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];_classCallCheck(this, InlineButtonsGroup);
    this.inlineButtons = inlineButtonsArray;
};


// https://core.telegram.org/bots/api#replykeyboardmarkups
var ReplyKeyboard = exports.ReplyKeyboard =
function ReplyKeyboard() {var buttons = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];var resizeKeyboard = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;var oneTimeKeyboard = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;var selective = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;_classCallCheck(this, ReplyKeyboard);
    this.buttons = buttons;
    this.resizeKeyboard = resizeKeyboard;
    this.oneTimeKeyboard = oneTimeKeyboard;
    this.selective = selective;
};var

ReplyKeyboardButton = exports.ReplyKeyboardButton =
function ReplyKeyboardButton(text) {_classCallCheck(this, ReplyKeyboardButton);
    this.text = text;
};


// send or edit message from bot to user
var BotMessage =
// INFO: userId, chatId, text - reqired params
exports.BotMessage = function BotMessage(
userId,
chatId)



{var text = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';var inlineButtonsGroups = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;var replyKeyboard = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;_classCallCheck(this, BotMessage);
    this.userId = userId;
    this.chatId = chatId;
    this.text = text;
    this.inlineButtonsGroups = inlineButtonsGroups;
    this.replyKeyboard = replyKeyboard;
};var

BotMessageEdit = exports.BotMessageEdit = function (_BotMessage) {_inherits(BotMessageEdit, _BotMessage);
    function BotMessageEdit(messageIdToEdit, chatId, text, inlineButtons) {_classCallCheck(this, BotMessageEdit);var _this = _possibleConstructorReturn(this, (BotMessageEdit.__proto__ || Object.getPrototypeOf(BotMessageEdit)).call(this,
        'userId_not_needed', chatId, text, inlineButtons));
        _this.messageIdToEdit = messageIdToEdit;return _this;
    }return BotMessageEdit;}(BotMessage);var


BotMessageSendResult = exports.BotMessageSendResult = function () {
    function BotMessageSendResult(_ref2)

    {var chatId = _ref2.chatId,messageText = _ref2.messageText,statusCode = _ref2.statusCode,statusMessage = _ref2.statusMessage,ok = _ref2.ok,messageId = _ref2.messageId;_classCallCheck(this, BotMessageSendResult);
        this.chatId = chatId;
        this.messageId = messageId;
        this.messageText = messageText;
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        this.ok = ok;
    }_createClass(BotMessageSendResult, null, [{ key: 'createFromSuccess', value: function createFromSuccess(

        botMessageSendSuccess) {var
            messageId = botMessageSendSuccess.message_id,chat = botMessageSendSuccess.chat;var
            chatId = chat.id;
            return new BotMessageSendResult({
                chatId: chatId,
                messageId: messageId,
                statusCode: 200,
                statusMessage: 'ok',
                ok: true });

        } }, { key: 'createFromError', value: function createFromError(
        botMessageSendError) {var
            message = botMessageSendError.message;var _botMessageSendError$ =
            botMessageSendError.response,statusCode = _botMessageSendError$.statusCode,statusMessage = _botMessageSendError$.statusMessage,body = _botMessageSendError$.body;var
            ok = body.ok;
            return new BotMessageSendResult({
                messageText: message,
                statusCode: statusCode,
                statusMessage: statusMessage,
                ok: ok });

        } }]);return BotMessageSendResult;}();