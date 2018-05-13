import { Subscription } from 'rxjs'
import history, { HistoryItem } from './history'

export const analyticsEventTypes = {
    START: 'START',
    STOP: 'STOP',
    CARD_GET: 'CARD_GET',
    CARD_ANSWER_RIGHT: 'CARD_ANSWER_RIGHT',
    CARD_ANSWER_WRONG: 'CARD_ANSWER_WRONG',
    CARD_DONT_KNOW: 'CARD_DONT_KNOW',
    CARD_ADD: 'CARD_ADD',
    CARD_REMOVE: 'CARD_REMOVE'
}

export const logEvent = (id, userId, historyEventType, foreignWord, userAnswer) => {
    const subscription = new Subscription()
    subscription.add(history.add(
        new HistoryItem(id, userId, historyEventType, foreignWord, userAnswer),
        userId
    )
        // TODO: subscribeOn
        .subscribe(() => {
        }, () => {
            // TODO: log error
            subscription.unsubscribe()
        }), () => subscription.unsubscribe())
}
