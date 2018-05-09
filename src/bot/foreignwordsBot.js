import { merge, of, from, asapScheduler } from 'rxjs'
import process from 'process'
import { catchError, mergeMap, switchMap, map, filter, subscribeOn } from 'rxjs/operators'
import { log, logLevel } from '../logger'
import config from '../config'
import token from '../token'
import Telegram from './telegram'
import mapUserMessageToBotMessages, { mapUserActionToBotMessages } from './handlers'
import storage, { archiveName } from '../storage'
import { IntervalTimerRx, timerTypes } from '../jslib/lib/timer'
import UserMessage from './message';

const telegram = new Telegram(config.isProduction ? token.botToken.prod : token.botToken.dev)
const wordsIntervalTimer = new IntervalTimerRx(timerTypes.SOON, 900)

const getWordsToAskObservable = () =>
    wordsIntervalTimer.timerEvent()
        .pipe(
            switchMap(() => storage.getStorageKeys()),
            switchMap(chatIds => from(chatIds)),
            filter(chatId => chatId !== archiveName),
            switchMap(chatId => storage.getItems(chatId, ['foreignWordCurrent', 'chat'])
                .pipe(
                    filter(foreignWordCurrentAndChat => {
                        const { foreignWordCurrent, chat } = foreignWordCurrentAndChat
                        return !foreignWordCurrent && chat.isActive === true
                    }),
                    map(() => chatId)
                )),
            map(chatId => UserMessage.createCommand(chatId, '/getcard'))
        )

const mapBotMessageToSendResult = message => {
    const sendOrEditResultObservable = message.messageIdToEdit
        ? telegram.botMessageEdit(message)
        : telegram.botMessage(message)
    return sendOrEditResultObservable
        .pipe(switchMap(sendOrEditResult => {
            const { statusCode, messageText } = sendOrEditResult
            const { chatId } = message
            if (statusCode === 403) {
                return storage.archive(chatId)
                    .pipe(map(() => {
                        log(`foreignwordsBot: chatId<${chatId}> forbidden error: <${messageText}>, message: <${JSON.stringify(message)}>, moving to archive`, logLevel.INFO) // eslint-disable-line max-len
                        return sendOrEditResult
                    }))
            }
            if (statusCode !== 200) {
                log(`foreignwordsBot: chatId<${chatId}> telegram send to user error: statusCode: <${statusCode}>, <${messageText}>, message: <${JSON.stringify(message)}>,`, logLevel.ERROR) // eslint-disable-line max-len
            }
            return of(sendOrEditResult)
        }))
}

export default () => {
    log('foreignwordsBot.startforeignwordsBot()', logLevel.INFO)
    log(`Process PID: <${process.pid}>`)
    const userTextObservalbe =
        merge(
            getWordsToAskObservable(),
            telegram.userText()
        ).pipe(
            subscribeOn(asapScheduler),
            mergeMap(mapUserMessageToBotMessages),
            mergeMap(mapBotMessageToSendResult)
        )
    const userActionsObservable = telegram.userActions()
        .pipe(
            subscribeOn(asapScheduler),
            mergeMap(mapUserActionToBotMessages),
            mergeMap(mapBotMessageToSendResult)
        )

    wordsIntervalTimer.start()
    return merge(userTextObservalbe, userActionsObservable)
        .pipe(catchError(err => {
            log(err, logLevel.ERROR)
        }))
}
