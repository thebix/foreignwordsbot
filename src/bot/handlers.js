/*
 * INFO:
 *      - every handler should return Observable.from([BotMessage])
 */

import { of, from, combineLatest, empty } from 'rxjs'
import { catchError, concatMap, delay, mergeMap, map, filter, tap } from 'rxjs/operators'

import { BotMessage, InlineButton, InlineButtonsGroup, ReplyKeyboard, ReplyKeyboardButton } from './message'
import commands from './commands'
import state, { storage } from '../storage'
import { log, logLevel } from '../logger'
import token from '../token'
import InputParser from './inputParser'
import config from '../config'
import { analyticsEventTypes, logEvent, getStartAndEndDates } from '../analytics'
import history from '../history';
import lib from '../jslib/root'

const lastCommands = {}

const USER_ANSWER_RIGHT_MULTIPLIER = 7
const USER_ANSWER_RIGHT_MAX_COUNT = 10

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
const start = (userId, chatId, messageId, firstAndLastName, username) => {
    lastCommands[storageId(userId, chatId)] = commands.START
    return state.updateItemsByMeta([{
        isActive: true,
        user: {
            name: firstAndLastName,
            username
        }
    }], storageId(userId, chatId))
        .pipe(
            tap(() => logEvent(messageId, storageId(userId, chatId), analyticsEventTypes.START)),
            mergeMap(isStorageUpdated => {
                if (!isStorageUpdated) {
                    log(`handlers.start: userId="${userId}" state wasn't updated / created.`, logLevel.ERROR)
                    return from(errorToUser(userId, chatId))
                }
                return from([
                    new BotMessage(
                        userId, chatId,
                        'Вас приветствует foreignwordsBot! Чтобы остановить меня введите /stop',
                        null,
                        new ReplyKeyboard([
                            new ReplyKeyboardButton('/getcard'),
                            new ReplyKeyboardButton('/addcard'),
                            new ReplyKeyboardButton('/getlist')
                        ])
                    )])
            })
        )
}

const stop = (userId, chatId, messageId) => {
    lastCommands[storageId(userId, chatId)] = undefined
    return state.archive(storageId(userId, chatId))
        .pipe(
            tap(() => logEvent(messageId, storageId(userId, chatId), analyticsEventTypes.STOP)),
            mergeMap(isStateUpdated => {
                if (!isStateUpdated) {
                    log(`handlers.stop: userId="${userId}" state wasn't updated.`, logLevel.ERROR)
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
            })
        )
}

const help = (userId, chatId) => {
    lastCommands[storageId(userId, chatId)] = commands.HELP
    return from([
        new BotMessage(
            userId, chatId,
            'Помощь\nЗдесь Вы можете выучить наконец слова иностранного языка.'
        )])
}

const tokenInit = (userId, chatId, text) => {
    // return new BotMessage(userId, chatId, 'Токен принят')
    const tokenKey = text.split(' ')[1]
    if (Object.keys(token.initData).indexOf(tokenKey) === -1)
        return from([new BotMessage(userId, chatId, 'Токен не найден')])

    const initDataItems = token.initData[tokenKey]
    const dataItems = Object.keys(initDataItems)
        .map(key => ({
            [key]: initDataItems[key]
        }))
    return storage.updateItemsByMeta(dataItems, storageId(userId, chatId))
        .pipe(mergeMap(isStorageUpdated => (
            !isStorageUpdated
                ? from(errorToUser(userId, chatId))
                : from([new BotMessage(userId, chatId, 'Токен принят')])
        )))
}

const updateCardCurrent = (userId, chatId, messageId) => {
    let word
    return storage.getItem('foreignLine', storageId(userId, chatId))
        .pipe(
            mergeMap(foreignLine => {
                if (!foreignLine || foreignLine.length < 1) {
                    return of(false)
                }
                [word] = foreignLine
                logEvent(messageId, storageId(userId, chatId), analyticsEventTypes.CARD_GET, word)
                return storage.updateItemsByMeta([
                    { foreignWordCurrent: word },
                    { foreignLine: foreignLine.slice(1) }], storageId(userId, chatId))
            }),
            map(result => (result ? word : false))
        )
}

const cardGetCurrent = (userId, chatId, messageId) => {
    // we souldn't show the new card on timer if card was already shown
    const lastCommand = lastCommands[storageId(userId, chatId)]
    if (messageId === -1 &&
        (lastCommand === commands.CARD_GET_CURRENT || lastCommand === commands.CARD_ADD))
        return empty()
    lastCommands[storageId(userId, chatId)] = commands.CARD_GET_CURRENT
    return storage.getItem('foreignWordCurrent', storageId(userId, chatId))
        .pipe(
            mergeMap(foreignWordCurrent => {
                if (!foreignWordCurrent) {
                    return updateCardCurrent(userId, chatId, messageId)
                }
                return of(foreignWordCurrent)
            }),
            mergeMap(foreignWordCurrent => {
                if (!foreignWordCurrent) {
                    lastCommands[storageId(userId, chatId)] = undefined
                    return from([new BotMessage(userId, chatId, 'Нет карточек. Добавьте новые слова для изучения')])
                }
                return from([new BotMessage(userId, chatId, `${foreignWordCurrent}`, [
                    new InlineButtonsGroup([new InlineButton('Не знаю', { word: foreignWordCurrent, cmd: commands.CARD_DONT_KNOW })])
                ])])
            })
        )
}

const cardUserAnswer = (userId, chatId, text, messageId) =>
    storage.getItems(['foreignWordCurrent', 'words', 'foreignLine', 'rightAnswersCombos'], storageId(userId, chatId))
        .pipe(mergeMap(foreignWordCurrentAndWordsAndForeignLineAndRightAnswersCombos => {
            const {
                foreignWordCurrent, words, foreignLine, rightAnswersCombos = {}
            } = foreignWordCurrentAndWordsAndForeignLineAndRightAnswersCombos
            const currentWordData = words.foreign[foreignWordCurrent]
            let returnObservable = null
            const search = text.trim().toLowerCase()
            const matchedTranslationIndex = currentWordData.translations.map(item => item.toLowerCase()).indexOf(search)
            if (matchedTranslationIndex > -1) {
                // right answer
                const wordCountBackIndex = (rightAnswersCombos[foreignWordCurrent] || 1) * USER_ANSWER_RIGHT_MULTIPLIER
                const newForeignLine = [
                    ...foreignLine.slice(0, wordCountBackIndex),
                    foreignWordCurrent,
                    ...foreignLine.slice(wordCountBackIndex)
                ]
                const rightAnswersCombo = rightAnswersCombos[foreignWordCurrent] < USER_ANSWER_RIGHT_MAX_COUNT
                    ? (rightAnswersCombos[foreignWordCurrent] || 0) + 1 : USER_ANSWER_RIGHT_MAX_COUNT
                returnObservable = storage.updateItemsByMeta([
                    { foreignWordCurrent: '' },
                    { foreignLine: newForeignLine },
                    { rightAnswersCombos: Object.assign({}, rightAnswersCombos, { [foreignWordCurrent]: rightAnswersCombo }) } // eslint-disable-line max-len
                ], storageId(userId, chatId))
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
                        logEvent(messageId, storageId(userId, chatId), analyticsEventTypes.CARD_ANSWER_RIGHT, foreignWordCurrent, search)
                        return new BotMessage(userId, chatId, `Правильно!${otherTranslationsString}`, [
                            new InlineButtonsGroup([new InlineButton('Еще', { cmd: commands.CARD_GET_CURRENT })])
                        ])
                    }))
            } else {
                lastCommands[storageId(userId, chatId)] = commands.CARD_GET_CURRENT
                logEvent(messageId, storageId(userId, chatId), analyticsEventTypes.CARD_ANSWER_WRONG, foreignWordCurrent, search)
                returnObservable = of(new BotMessage(userId, chatId, 'Ответ неверный!'))
            }
            return returnObservable
        }))

const cardAdd = (userId, chatId) => {
    lastCommands[storageId(userId, chatId)] = commands.CARD_ADD
    return of(new BotMessage(
        userId, chatId,
        'Введите слово или фразу для заучивания в формате: "Foreign language word - перевод1, перевод2, перевод3, ..."'
    ))
}

const cardAddUserResponse = (userId, chatId, text, messageId) => {
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
    return storage.getItems(['words', 'foreignLine'], storageId(userId, chatId))
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
                    logEvent(messageId, storageId(userId, chatId), analyticsEventTypes.CARD_ADD, word)
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
                return storage.updateItemsByMeta(itemsToUpdate, storageId(userId, chatId))
            }),
            filter(updateResult => updateResult),
            map(() => new BotMessage(userId, chatId, 'Фраза получена и записана'))
        )
}

const cardGetList = (userId, chatId) => {
    lastCommands[storageId(userId, chatId)] = commands.CARD_GET_LIST
    return storage.getItem('words', storageId(userId, chatId))
        .pipe(map(words => {
            if (!words || !words.foreign || Object.keys(words.foreign).length === 0) {
                return new BotMessage(userId, chatId, 'Нет карточек')
            }
            const allWords = Object.keys(words.foreign)
                .map(wordKey => `* ${wordKey} - ${words.foreign[wordKey].translations.join(', ')}`).join('\n')
            return new BotMessage(userId, chatId, allWords)
        }))
}


const wordsRemoveForeignMutable = (words, word) => {
    const { foreign, translation } = words

    foreign[word].translations
        .forEach(translationKey => {
            const wordIndex = translation[translationKey].foreigns.indexOf(word)
            if (wordIndex > -1)
                translation[translationKey].foreigns = [
                    ...translation[translationKey].foreigns.slice(0, wordIndex),
                    ...translation[translationKey].foreigns.slice(wordIndex + 1)
                ]
        })
    delete foreign[word]
}

const wordsRemoveTranslationMutable = (words, wordTranslation) => {
    const { foreign, translation } = words

    translation[wordTranslation].foreigns
        .forEach(foreignKey => {
            const wordIndex = foreign[foreignKey].translations.indexOf(wordTranslation)
            if (wordIndex > -1)
                foreign[foreignKey].translations = [
                    ...foreign[foreignKey].translations.slice(0, wordIndex),
                    ...foreign[foreignKey].translations.slice(wordIndex + 1)
                ]
        })
    delete translation[wordTranslation]
}

const wordsRemove = (userId, chatId, text, messageId) => {
    lastCommands[storageId(userId, chatId)] = commands.CARD_REMOVE
    const word = text.slice(text.indexOf(' ') + 1).trim(' ')
    return storage.getItems(['words', 'foreignLine', 'foreignWordCurrent'], storageId(userId, chatId))
        .pipe(
            map(wordsAndForeignLineAndForeignWordCurrent => {
                const { words, foreignLine, foreignWordCurrent } = wordsAndForeignLineAndForeignWordCurrent
                const { foreign, translation } = Object.assign({}, words)
                let newForeignLine
                let newForeignWordCurrent
                if (Object.keys(foreign).indexOf(word) > -1) {
                    wordsRemoveForeignMutable(words, word)
                    const foreignLineWordIndex = foreignLine.indexOf(word)
                    newForeignLine = [...foreignLine.slice(0, foreignLineWordIndex), ...foreignLine.slice(foreignLineWordIndex + 1)]
                    if (foreignWordCurrent === word) {
                        newForeignWordCurrent = ''
                    }
                    logEvent(messageId, storageId(userId, chatId), analyticsEventTypes.CARD_REMOVE, word)
                } else if (Object.keys(translation).indexOf(word) > -1)
                    wordsRemoveTranslationMutable(words, word)
                else {
                    return false
                }
                return { words, newForeignLine, newForeignWordCurrent }
            }),
            mergeMap(({ words, newForeignLine, newForeignWordCurrent }) => {
                if (!words)
                    return of(words)
                const updateElements = [{ words }]
                if (newForeignLine) {
                    updateElements.push({ foreignLine: newForeignLine })
                }
                if (newForeignWordCurrent === '') {
                    updateElements.push({ foreignWordCurrent: newForeignWordCurrent })
                }
                return storage.updateItemsByMeta(updateElements, storageId(userId, chatId))
            }),
            map(isSuccess => {
                if (isSuccess)
                    return new BotMessage(userId, chatId, 'Слово было удалено')
                return new BotMessage(userId, chatId, 'Слово не было найдено / удалено')
            })
        )
}

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
const stats = (userId, chatId, text) => {
    lastCommands[storageId(userId, chatId)] = commands.STAT
    const spaceIndex = text.indexOf(' ')
    const {
        dateStart,
        dateEnd,
        dateEndUser,
        intervalLength
    } = getStartAndEndDates(spaceIndex > -1 ? text.slice(spaceIndex + 1) : '')

    const dateStartTicks = dateStart.getTime()
    const dateEndTicks = dateEnd.getTime()
    return combineLatest(
        history.getByFilter(historyItem => {
            const dateCreateTicks = new Date(historyItem.dateCreate)
            return dateCreateTicks > dateStartTicks
                && dateCreateTicks < dateEndTicks
                && (
                    historyItem.eventType === analyticsEventTypes.CARD_GET
                    || historyItem.eventType === analyticsEventTypes.CARD_ANSWER_RIGHT
                    || historyItem.eventType === analyticsEventTypes.CARD_ANSWER_WRONG
                    || historyItem.eventType === analyticsEventTypes.CARD_DONT_KNOW
                    || historyItem.eventType === analyticsEventTypes.CARD_ADD
                    || historyItem.eventType === analyticsEventTypes.CARD_REMOVE
                )
        }, storageId(userId, chatId)),
        storage.getItem('words', storageId(userId, chatId))
    ).pipe(mergeMap(([historyFiltered, words]) => {
        const cardGetCount = historyFiltered.filter(historyItem => historyItem.eventType === analyticsEventTypes.CARD_GET).length
        const cardDontKnowCount = historyFiltered.filter(historyItem => historyItem.eventType === analyticsEventTypes.CARD_DONT_KNOW).length
        const cardAnswerRightCount = historyFiltered.filter(historyItem => historyItem.eventType === analyticsEventTypes.CARD_ANSWER_RIGHT).length
        const cartAnswerWrongCount = historyFiltered.filter(historyItem => historyItem.eventType === analyticsEventTypes.CARD_ANSWER_WRONG).length
        const cardAddCount = historyFiltered.filter(historyItem => historyItem.eventType === analyticsEventTypes.CARD_ADD).length
        const cardRemoveCount = historyFiltered.filter(historyItem => historyItem.eventType === analyticsEventTypes.CARD_REMOVE).length

        const headerMessage =
            `Период: ${lib.time.dateWeekdayString(dateStart)} - ${lib.time.dateWeekdayString(dateEndUser)}, дней: ${intervalLength}
* ${cardGetCount} карточек показано
* ${cardAnswerRightCount} (${Math.round(cardAnswerRightCount * 100 * 100 / cardGetCount) / 100}%) карточек разгадано (верных ответов получено)
* ${cardDontKnowCount} (${Math.round(cardDontKnowCount * 100 * 100 / cardGetCount) / 100}%) подсказок запрошено (неразгаданных карточек)
* ${cartAnswerWrongCount} неверных ответов (неудачных попыток ответить)
* ${Object.keys(words.foreign).length} оригинальных карточек всего
* ${cardAddCount} новых карточек добавлено
* ${cardRemoveCount} карточек удалено`
        const result = [new BotMessage(userId, chatId, headerMessage)]
        if (cardGetCount !== 0
            || cardAnswerRightCount !== 0
            || cartAnswerWrongCount !== 0
            || cardDontKnowCount !== 0
            || cardAddCount !== 0
            || cardRemoveCount !== 0) {
            const historyWords = Array.from(new Set(historyFiltered.map(historyItem => historyItem.foreignWord)))
            const wordsStats = historyWords.map(word => {
                const translationsText = (words && words.foreign && words.foreign[word] && words.foreign[word].translations)
                    ? words.foreign[word].translations.join(', ')
                    : ''
                return {
                    word,
                    translations: translationsText,
                    wrongAnswersCount: historyFiltered && historyFiltered.length >= 0
                        ? historyFiltered.filter(historyItem => historyItem.eventType === analyticsEventTypes.CARD_ANSWER_WRONG
                            && historyItem.foreignWord === word).length
                        : 0,
                    dontknowCount: historyFiltered && historyFiltered.length >= 0
                        ? historyFiltered.filter(historyItem => historyItem.eventType === analyticsEventTypes.CARD_DONT_KNOW
                            && historyItem.foreignWord === word).length
                        : 0
                }
            })
            const hardWordsMessage = wordsStats
                .filter(wordStat => wordStat.wrongAnswersCount + wordStat.dontknowCount > 0)
                .sort((i1, i2) => i2.wrongAnswersCount + i2.dontknowCount - (i1.wrongAnswersCount + i1.dontknowCount))
                .map(hardWord => `* ${hardWord.word} - ${hardWord.translations}`)
                .join('\n')
            if (hardWordsMessage.length > 0)
                result.push(new BotMessage(userId, chatId, `Сложные слова:\n${hardWordsMessage}`))
        }
        return from(result)
    }))
}

/*
 * USER ACTION HELPERS
 */
const cardUserAnswerDontKnow = (userId, chatId, word, messageId) => {
    lastCommands[storageId(userId, chatId)] = commands.CARD_DONT_KNOW
    return storage.getItems(['words', 'foreignLine', 'foreignWordCurrent'], storageId(userId, chatId))
        .pipe(
            mergeMap(wordsAndForeignLineAndForeignWordCurrent => {
                logEvent(messageId, storageId(userId, chatId), analyticsEventTypes.CARD_DONT_KNOW, word)
                const { words, foreignLine, foreignWordCurrent } = wordsAndForeignLineAndForeignWordCurrent
                const wordData = words.foreign[word]

                if (word === foreignWordCurrent) {
                    const newForeignLine = [...foreignLine.slice(0, 4), word, ...foreignLine.slice(4)]
                    return storage.updateItems([
                        { fieldName: 'foreignWordCurrent', item: '' },
                        { fieldName: 'foreignLine', item: newForeignLine }
                    ], storageId(userId, chatId)).pipe(map(() => wordData))
                }
                return of(wordData)
            }),
            map(wordData => new BotMessage(userId, chatId, `${word} = ${wordData.translations.join(', ')}`, [
                new InlineButtonsGroup([new InlineButton('Еще', { cmd: commands.CARD_GET_CURRENT })])
            ]))
        )
}

/*
 * EXPORTS
 */
const mapUserMessageToBotMessages = message => { // eslint-disable-line complexity
    const {
        text, from: messageFrom, chat, user, id: messageId
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
        messagesToUser = start(messageFrom, chatId, messageId, `${firstName || ''} ${lastName || ''}`, username)
    } else if (InputParser.isStop(text)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined
        messagesToUser = stop(messageFrom, chatId, messageId)
    } else if (InputParser.isHelp(text)) {
        messagesToUser = help(messageFrom, chatId)
    } else if (InputParser.isToken(text)) {
        lastCommands[storageId(messageFrom, chatId)] = undefined
        messagesToUser = tokenInit(messageFrom, chatId, text)
    } else if (InputParser.isCardGetCurrent(text)) {
        messagesToUser = cardGetCurrent(messageFrom, chatId, messageId)
    } else if (InputParser.isCardAdd(text)) {
        messagesToUser = cardAdd(messageFrom, chatId, text)
    } else if (InputParser.isCardGetList(text)) {
        messagesToUser = cardGetList(messageFrom, chatId)
    } else if (InputParser.isCardRemove(text)) {
        messagesToUser = wordsRemove(messageFrom, chatId, text, messageId)
    } else if (InputParser.isStats(text))
        messagesToUser = stats(from, chatId, text)
    else if (InputParser.isCardUserAnswer(lastCommands[storageId(messageFrom, chatId)])) {
        messagesToUser = cardUserAnswer(messageFrom, chatId, text, messageId)
    } else if (InputParser.isCardAddUserResponse(lastCommands[storageId(messageFrom, chatId)])) {
        messagesToUser = cardAddUserResponse(messageFrom, chatId, text, messageId)
    }
    if (!messagesToUser) {
        messagesToUser = help(from, chatId)
    }

    return from(messagesToUser)
        .pipe(
            concatMap(msgToUser => of(msgToUser)
                .pipe(delay(10))),
            catchError(err => {
                log(`message: <${JSON.stringify(message)}>, Error: ${err}`, logLevel.ERROR)
            })
        )
}

export const mapUserActionToBotMessages = userAction => { // eslint-disable-line complexity
    const { message, data = {} } = userAction
    const { from: messageFrom, chat, id: messageId } = message
    const chatId = chat ? chat.id : messageFrom
    const callbackCommand = data.cmd || undefined
    let messagesToUser
    if (InputParser.isCardUserAnswerDontKnow(callbackCommand)) {
        messagesToUser = cardUserAnswerDontKnow(messageFrom, chatId, data.word, messageId)
    } else if (InputParser.isCardGetCurrentCallbackButton(callbackCommand)) {
        messagesToUser = cardGetCurrent(messageFrom, chatId, messageId)
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
