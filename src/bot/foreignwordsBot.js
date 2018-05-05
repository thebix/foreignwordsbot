import { merge, of } from 'rxjs'
import { catchError, mergeMap, switchMap, map } from 'rxjs/operators'
import { log, logLevel } from '../logger'
import config from '../config'
import token from '../token'
import Telegram from './telegram'
import mapUserMessageToBotMessages, { mapUserActionToBotMessages } from './handlers'
import storage from '../storage'

const telegram = new Telegram(config.isProduction ? token.botToken.prod : token.botToken.dev)

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
    const userTextObservalbe =
        telegram.userText()
            .pipe(
                // TODO: fix it: observeOn(Scheduler.asap),
                mergeMap(mapUserMessageToBotMessages),
                mergeMap(mapBotMessageToSendResult)
            )
    const userActionsObservable = telegram.userActions()
        .pipe(
            // TODO: fix it: observeOn(Scheduler.asap),
            mergeMap(mapUserActionToBotMessages),
            mergeMap(mapBotMessageToSendResult)
        )
    return merge(userTextObservalbe, userActionsObservable)
        .pipe(catchError(err => {
            log(err, logLevel.ERROR)
        }))
}
