/*
 * INFO:
 *      - every handler should return Observable.from([BotMessage])
 */

import { of, from } from 'rxjs'
import { catchError, concatMap, delay, mergeMap, map, filter } from 'rxjs/operators'

import { BotMessage, InlineButton, InlineButtonsGroup, ReplyKeyboard, ReplyKeyboardButton } from './message'
import commands from './commands'
import storage from '../storage'
import { log, logLevel } from '../logger'
import token from '../token'
import InputParser from './inputParser'
import config from '../config'

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
            'Вас приветствует foreignwordsBot! Чтобы остановить меня введите /stop',
            null,
            new ReplyKeyboard([
                new ReplyKeyboardButton('/getcard'),
                new ReplyKeyboardButton('/addcard')
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

const updateCardCurrent = (userId, chatId) => {
    let word
    return storage.getItem(storageId(userId, chatId), 'foreignLine')
        .pipe(
            mergeMap(foreignLine => {
                if (!foreignLine || foreignLine.length < 1) {
                    return of(false)
                }
                [word] = foreignLine
                // [word, ] = foreignLine
                return storage.updateItems(storageId(userId, chatId), [
                    { fieldName: 'foreignWordCurrent', item: word },
                    { fieldName: 'foreignLine', item: foreignLine.slice(1) }])
            }),
            map(result => (result ? word : false))
        )
}

const cardGetCurrent = (userId, chatId) => storage.getItem(storageId(userId, chatId), 'foreignWordCurrent')
    .pipe(
        mergeMap(foreignWordCurrent => {
            if (!foreignWordCurrent) {
                return updateCardCurrent(userId, chatId)
            }
            return of(foreignWordCurrent)
        }),
        mergeMap(foreignWordCurrent => {
            if (!foreignWordCurrent) {
                lastCommands[storageId(userId, chatId)] = undefined
                return from([new BotMessage(userId, chatId, 'Нет карточек. Добавьте новые слова для изучения')])
            }
            lastCommands[storageId(userId, chatId)] = commands.CARD_GET_CURRENT
            return from([new BotMessage(userId, chatId, `${foreignWordCurrent}`, [
                new InlineButtonsGroup([new InlineButton('Не знаю', { word: foreignWordCurrent, cmd: commands.CARD_DONT_KNOW })])
            ])])
        })
    )

const cardUserAnswer = (userId, chatId, text) => storage.getItems(storageId(userId, chatId), ['foreignWordCurrent', 'words', 'foreignLine'])
    .pipe(mergeMap(foreignWordCurrentAndWordsAndForeignLine => {
        const { foreignWordCurrent, words, foreignLine } = foreignWordCurrentAndWordsAndForeignLine
        const currentWordData = words.foreign[foreignWordCurrent]
        let returnObservable = null
        const matchedTranslationIndex = currentWordData.translations.indexOf(text.trim(' '))
        if (matchedTranslationIndex > -1) {
            const newForeignLine = foreignLine.slice()
            newForeignLine.push(foreignWordCurrent)
            returnObservable = storage.updateItems(storageId(userId, chatId), [
                { fieldName: 'foreignWordCurrent', item: '' },
                { fieldName: 'foreignLine', item: newForeignLine }
            ])
                .pipe(map(() => {
                    lastCommands[storageId(userId, chatId)] = undefined
                    let otherTranslationsString = ''
                    if (currentWordData.translations.length > 1) {
                        otherTranslationsString = [
                            ...currentWordData.translations.slice(0, matchedTranslationIndex),
                            ...currentWordData.translations.slice(matchedTranslationIndex + 1)
                        ].join(', ')
                        otherTranslationsString = `\nА еще это: ${otherTranslationsString}`
                    }
                    return new BotMessage(userId, chatId, `Правильно!${otherTranslationsString}`)
                }))
        } else {
            lastCommands[storageId(userId, chatId)] = commands.CARD_GET_CURRENT
            returnObservable = of(new BotMessage(userId, chatId, 'Ответ неверный!'))
        }
        return returnObservable
    }))

const cardAdd = (userId, chatId) => {
    lastCommands[storageId(userId, chatId)] = commands.CARD_ADD
    return of(new BotMessage(userId, chatId, 'Введите слово или фразу для заучивания в формате: "Foreign language word - перевод1, перевод2, перевод3, ..."'))
}

const cardAddUserResponse = (userId, chatId, text) => {
    const wordAndTranslations = text.trim(' ').split('-')
    if (!wordAndTranslations || wordAndTranslations.length !== 2) {
        lastCommands[storageId(userId, chatId)] = commands.CARD_ADD
        return of(new BotMessage(userId, chatId, 'Неверный формат, повторите попытку'))
    }

    const word = wordAndTranslations[0].trim(' ')
    if (!word) {
        lastCommands[storageId(userId, chatId)] = commands.CARD_ADD
        return of(new BotMessage(userId, chatId, 'Введите не пустое слово'))
    }
    const translations = wordAndTranslations[1].split(',')
        .map(translation => translation.trim(' '))
    if (!translations || translations.length === 0) {
        lastCommands[storageId(userId, chatId)] = commands.CARD_ADD
        return of(new BotMessage(userId, chatId, 'Введите не пустой перевод'))
    }

    lastCommands[storageId(userId, chatId)] = commands.CARD_ADD_USER_RESPONSE
    return storage.getItems(storageId(userId, chatId), ['words', 'foreignLine'])
        .pipe(
            mergeMap(wordsAndForeignLine => {
                const { words: wordsObject, foreignLine } = wordsAndForeignLine
                const words = Object.assign({}, wordsObject)
                let { translation, foreign } = words
                if (!foreign) {
                    foreign = {}
                }
                if (!translation) {
                    translation = {}
                }
                if (!foreign[word]) {
                    words.foreign = Object.assign({}, foreign, { [`${word}`]: { translations: [] } })
                }

                const wordData = words.foreign[word]
                const translationsToAdd = translations
                    .filter(translationItem => wordData.translations.indexOf(translationItem) === -1)
                wordData.translations.push(...translationsToAdd)
                words.foreign[word] = wordData


                translationsToAdd.forEach(translationToAdd => {
                    if (!translation[translationToAdd]) {
                        words.translation = Object.assign({}, words.translation || {}, { [`${translationToAdd}`]: { foreigns: [] } })
                    }

                    const translationData = words.translation[translationToAdd]
                    if (translationData.foreigns.indexOf(word) === -1) {
                        translationData.foreigns.push(word)
                    }
                    words.translation[translationToAdd] = translationData
                })

                const foreignLineNew = (foreignLine || []).slice()
                const itemsToUpdate = [{ words }]
                if (foreignLineNew.indexOf(word) === -1)
                    itemsToUpdate.push({ foreignLine: [...foreignLineNew.slice(0, 10), word, ...foreignLineNew.slice(10)] })
                return storage.updateItemsByMeta(storageId(userId, chatId), itemsToUpdate)
            }),
            filter(updateResult => updateResult),
            map(() => new BotMessage(userId, chatId, 'Фраза получена и записана'))
        )
}

/*
 * USER ACTION HELPERS
 */
const cardUserAnswerDontKnow = (userId, chatId, word) => storage.getItems(storageId(userId, chatId), ['words', 'foreignLine', 'foreignWordCurrent'])
    .pipe(
        mergeMap(wordsAndForeignLineAndForeignWordCurrent => {
            const { words, foreignLine, foreignWordCurrent } = wordsAndForeignLineAndForeignWordCurrent
            const wordData = words.foreign[word]

            if (word === foreignWordCurrent) {
                const newForeignLine = [...foreignLine.slice(0, 10), word, ...foreignLine.slice(10)]
                return storage.updateItems(storageId(userId, chatId), [
                    { fieldName: 'foreignWordCurrent', item: '' },
                    { fieldName: 'foreignLine', item: newForeignLine }
                ]).pipe(map(() => wordData))
            }
            return of(wordData)
        }),
        map(wordData => new BotMessage(userId, chatId, `${word} = ${wordData.translations.toString()}`))
    )

/*
 * EXPORTS
 */
const mapUserMessageToBotMessages = message => { // eslint-disable-line complexity
    const {
        text, from: messageFrom, chat, id, user
    } = message
    const chatId = chat ? chat.id : messageFrom
    const {
        lastName, firstName, username
    } = user

    let messagesToUser
    if (!config.isProduction && !InputParser.isDeveloper(messageFrom)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined
        messagesToUser = botIsInDevelopmentToUser(messageFrom, chatId)
    } else if (InputParser.isStart(text)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined
        messagesToUser = start(messageFrom, chatId, `${firstName || ''} ${lastName || ''}`, username)
    } else if (InputParser.isStop(text)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined
        messagesToUser = stop(messageFrom, chatId)
    } else if (InputParser.isHelp(text)) {
        messagesToUser = help(messageFrom, chatId)
    } else if (InputParser.isToken(text)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined
        messagesToUser = tokenInit(messageFrom, chatId, text)
    } else if (InputParser.isCardGetCurrent(text)) {
        messagesToUser = cardGetCurrent(messageFrom, chatId, text)
    } else if (InputParser.isCardAdd(text)) {
        messagesToUser = cardAdd(messageFrom, chatId, text)
    } else if (InputParser.isCardUserAnswer(lastCommands[storageId(messageFrom, chatId)])) {
        messagesToUser = cardUserAnswer(messageFrom, chatId, text)
    } else if (InputParser.isCardAddUserResponse(lastCommands[storageId(messageFrom, chatId)])) {
        messagesToUser = cardAddUserResponse(messageFrom, chatId, text)
    }
    if (!messagesToUser) {
        messagesToUser = help(from, chatId)
    }

    return from(messagesToUser)
        .pipe(
            concatMap(msgToUser => of(msgToUser)
                .pipe(delay(10))),
            catchError(err => {
                log(JSON.stringify(message), logLevel.ERROR)
                log(`message: <${JSON.stringify(message)}>, Error: ${err}`, logLevel.ERROR)
            })
        )
}

export const mapUserActionToBotMessages = userAction => { // eslint-disable-line complexity
    const { message, data = {} } = userAction
    const { from: messageFrom, chat, id } = message
    const chatId = chat ? chat.id : messageFrom
    const callbackCommand = data.cmd || undefined
    let messagesToUser
    if (InputParser.isCardUserAnswerDontKnow(callbackCommand)) {
        messagesToUser = cardUserAnswerDontKnow(messageFrom, chatId, data.word)
    } else {
        log(
            `handlers.mapUserActionToBotMessages: can't find handler for user action callback query. userId=${messageFrom}, chatId=${chatId}, data=${JSON.stringify(data)}`, // eslint-disable-line max-len
            logLevel.ERROR
        )
        messagesToUser = errorToUser(messageFrom, chatId)
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

export default mapUserMessageToBotMessages
