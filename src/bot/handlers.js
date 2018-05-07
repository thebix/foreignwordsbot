/*
 * INFO:
 *      - every handler should return Observable.from([BotMessage])
 */

import { of, from } from 'rxjs'
import { catchError, concatMap, delay, mergeMap, switchMap } from 'rxjs/operators'

import { BotMessage, InlineButton, BotMessageEdit, InlineButtonsGroup, ReplyKeyboard, ReplyKeyboardButton } from './message'
import commands from './commands'
import storage from '../storage'
import { log, logLevel } from '../logger'
import token from '../token'
import InputParser from './inputParser'
import config from '../config'
import lib from '../jslib/root'

const lastCommands = {}

/*
 * ERRORS HANDERS
 */
const errorToUser = (userId, chatId) => [
    new BotMessage(
        userId, chatId,
        'При при обработке запроса произошла ошибка. Пожалуйста, начните заново'
    )]

const botIsInDevelopmentToUser = (userId, chatId) => {
    log(`handlers.botIsInDevelopmentToUser: userId="${userId}" is not in token.developers array.`, logLevel.ERROR)
    return from([
        new BotMessage(
            userId, chatId,
            `В данный момент бот находится в режиме разработки. \nВаш идентификатор в мессенджере - "${userId}". Сообщите свой идентификатор по контактам в описании бота, чтобы Вас добавили в группу разработчиков` // eslint-disable-line max-len
        )])
}

/*
 * COMMON METHODS
 */
export const dateTimeString = (date = new Date()) => `${date.toLocaleDateString()} ${(`0${date.getHours()}`).slice(-2)}:${(`0${date.getMinutes()}`).slice(-2)}:${(`0${date.getSeconds()}`).slice(-2)}` // eslint-disable-line max-len

const storageId = (userId, chatId) => `${chatId}`

const getWordsObservable = (userId, chatId) =>
    storage.getItem(storageId(userId, chatId), 'words')
        .pipe(switchMap(wordsObject => {
            if (wordsObject === false || wordsObject === undefined || wordsObject === null || wordsObject === '')
                return of(null)
            return of(wordsObject)
        }))

/*
 * HANDLERS
 */
/*
 * USER MESSAGE HELPERS
 */
const start = (userId, chatId, firstAndLastName, username) => storage.updateItem(storageId(userId, chatId), 'chat', {
    isActive: true,
    user: {
        name: firstAndLastName,
        username
    }
}).pipe(mergeMap(isStorageUpdated => {
    if (!isStorageUpdated) {
        log(`handlers.start: userId="${userId}" user storage wasn't updated / created.`, logLevel.ERROR)
        return from(errorToUser(userId, chatId))
    }
    return from([
        new BotMessage(
            userId, chatId,
            'Вас приветствует foreignwordsBot!',
            null,
            new ReplyKeyboard([
                new ReplyKeyboardButton('/start'),
                new ReplyKeyboardButton('/stop')
            ])
        )])
}))

const stop = (userId, chatId) => storage.updateItem(storageId(userId, chatId), 'chat', {
    isActive: false
}).pipe(mergeMap(isStorageUpdated => {
    if (!isStorageUpdated) {
        log(`handlers.stop: userId="${userId}" user storage wasn't updated.`, logLevel.ERROR)
        return from(errorToUser(userId, chatId))
    }
    return from([
        new BotMessage(
            userId, chatId,
            'С Вами прощается foreignwordsBot!',
            null,
            new ReplyKeyboard([
                new ReplyKeyboardButton('/start'),
                new ReplyKeyboardButton('/stop')
            ])
        )])
}))

const help = (userId, chatId) => from([
    new BotMessage(
        userId, chatId,
        'Помощь\nЗдесь Вы можете выучить наконец слова иностранного языка.'
    )])

const tokenInit = (userId, chatId, text) => {
    const tokenKey = text.split(' ')[1]
    if (Object.keys(token.initData).indexOf(tokenKey) === -1)
        return from([new BotMessage(userId, chatId, 'Токен не найден')])

    const initDataItems = token.initData[tokenKey]
    const dataItems = Object.keys(initDataItems)
        .map(key => ({
            fieldName: key,
            item: initDataItems[key]
        }))
    return storage.updateItems(storageId(userId, chatId), dataItems)
        .pipe(mergeMap(isStorageUpdated => (
            !isStorageUpdated
                ? from(errorToUser(userId, chatId))
                : from([new BotMessage(userId, chatId, 'Токен принят')])
        )))
}

/*
 * USER ACTION HELPERS
 */
// TODO: make user action handlers

/*
 * EXPORTS
 */
const mapUserMessageToBotMessages = message => { // eslint-disable-line complexity
    const {
        text, from: messageFrom, chat, id, user
    } = message
    const chatId = chat ? chat.id : messageFrom
    const { lastName, firstName, username } = user

    let messagesToUser
    if (!config.isProduction && !InputParser.isDeveloper(messageFrom)) {
        messagesToUser = botIsInDevelopmentToUser(messageFrom, chatId)
    } else if (InputParser.isStart(text)) {
        messagesToUser = start(messageFrom, chatId, `${firstName || ''} ${lastName || ''}`, username)
    } else if (InputParser.isStop(text)) {
        messagesToUser = stop(messageFrom, chatId)
    } else if (InputParser.isHelp(text))
        messagesToUser = help(messageFrom, chatId)
    else if (InputParser.isToken(text))
        messagesToUser = tokenInit(messageFrom, chatId, text)

    if (!messagesToUser) {
        messagesToUser = help(from, chatId)
    }

    return from(messagesToUser)
        .pipe(
            concatMap(msgToUser => of(msgToUser)
                .pipe(delay(10))),
            catchError(err => {
                log(err, logLevel.ERROR)
            })
        )
}

export const mapUserActionToBotMessages = userAction => { // eslint-disable-line complexity
    const { message, data = {} } = userAction
    const { from: messageFrom, chat, id } = message
    const chatId = chat ? chat.id : messageFrom
    const callbackCommand = data.cmd || undefined
    let messagesToUser
    log(
        `handlers.mapUserActionToBotMessages: can't find handler for user action callback query. userId=${messageFrom}, chatId=${chatId}, data=${JSON.stringify(data)}`, // eslint-disable-line max-len
        logLevel.ERROR
    )
    messagesToUser = errorToUser(messageFrom, chatId)

    return from(messagesToUser)
        .pipe(
            concatMap(msgToUser => of(msgToUser)
                .pipe(delay(10))),
            catchError(err => {
                log(err, logLevel.ERROR)
            })
        )
}

export default mapUserMessageToBotMessages
