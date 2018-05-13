import { Subscription } from 'rxjs'
import history, { HistoryItem } from './history'
import lib from './jslib/root'

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

export const getStartAndEndDates = datesString => {
    // getting the interval
    let dateEnd,
        dateStart,
        dateEndUser
    if (!datesString) { // without params => just this month statistics
        dateEnd = lib.time.getEndDate()
        dateStart = lib.time.getMonthStartDate(dateEnd)
        dateEndUser = dateEnd
    } else {
        const split = (`${datesString.trim(' ')}`).split(' ')
        if (split.length === 1) { // date start - till - current date
            dateEnd = lib.time.getEndDate()
            dateStart = lib.time.getBack(split[0].trim(' '), dateEnd)
            dateEndUser = dateEnd
        } else { // date start - till - date end
            const end = lib.time.getBack(split[1].trim(' '))
            dateStart = lib.time.getBack(split[0].trim(' '), end)
            dateEnd = lib.time.getEndDate(end)
            dateEndUser = dateEnd
        }
    }

    const intervalLength = lib.time.daysBetween(dateStart, lib.time.getChangedDateTime({ ticks: 1 }, dateEnd))

    return {
        dateStart,
        dateEnd,
        dateEndUser,
        intervalLength
    }
}
