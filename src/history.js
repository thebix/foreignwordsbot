import { of, Subscription } from 'rxjs'
import { switchMap, catchError, map, first, reduce } from 'rxjs/operators'
import { log, logLevel } from './logger'
import config from './config'
import lib from './jslib/root'

export const historyEventTypes = {
    CARD_GET: 'CARD_GET',
    CARD_ANSWER: 'CARD_ANSWER',
    CARD_DONT_KNOW: 'CARD_DONT_KNOW',
    CARD_ADD: 'CARD_ADD',
    CARD_REMOVE: 'CARD_REMOVE'
}

export class HistoryItem {
    constructor(
        id,
        userId,
        eventType,
        foreignWord,
        translationAnswer,
        isRightAnswer,
        dateCreate = new Date(),
        dateEdit = new Date(),
        dateDelete = undefined
    ) {
        this.id = +id
        this.userId = userId
        this.eventType = eventType
        this.foreignWord = foreignWord
        this.translationAnswer = translationAnswer
        this.isRightAnswer = (isRightAnswer && isRightAnswer !== 'false')
        this.dateCreate = dateCreate
        this.dateEdit = dateEdit
        this.dateDelete = dateDelete
    }

    static fromArray(rowArray, header) {
        if (rowArray.length !== header.length)
            log(`HistoryItem: fromArray: row array items count doen't match the header: rowArray<${rowArray.toString()}>`, logLevel.ERROR)
        return new HistoryItem(...rowArray)
    }
}

class History {
    constructor(
        dirHistory, fileTemplate = 'hist-$[id].json', delimiter = ',',
        header = [
            'id', 'userId', 'eventType', 'foreignWord', 'translationAnswer', 'isRightAnswer', 'dateCreate', 'dateEdit', 'dateDelete']
    ) {
        this.path = dirHistory
        this.fileTemplate = fileTemplate
        this.readCsvOptions = { delimiter, trim: true }
        this.writeCsvOptions = { delimiter }
        this.header = header
        this.getFilePath = this.getFilePath.bind(this)
        this.compositeSubscription = new Subscription()
        lib.fs.isExists(dirHistory)
            .pipe(
                switchMap(isHistoryDirExists => {
                    if (isHistoryDirExists !== true) {
                        log(`History:constructor: history directory doesn't exists, creating. path: <${dirHistory}>`, logLevel.INFO)
                        return lib.fs.mkDir(dirHistory)
                            .pipe(catchError(error => {
                                log(`History:constructor: can't create history directory. path: <${dirHistory}>. error: <${error}>`, logLevel.ERROR) // eslint-disable-line max-len
                            }))
                    }
                    return of(true)
                }),
                catchError(error => {
                    log(`History:constructor: can't read history file. error: <${error}>`)
                })
            )
            .subscribe(
                () => { },
                initError => {
                    log(initError, logLevel.ERROR)
                    this.compositeSubscription.unsubscribe()
                },
                () => {
                    this.compositeSubscription.unsubscribe()
                }
            )
    }
    // TODO: make private
    getFilePath(templateId = null) {
        const file = templateId
            ? `${this.fileTemplate.replace('$[id]', templateId)}`
            : this.fileTemplate
        return `${this.path}${file}`
    }
    add(historyItem, templateId = null) {
        // TODO: lock on write
        const newRow = this.header.map(title => {
            if (historyItem[title] || historyItem[title] === null || historyItem[title] === false)
                return historyItem[title]
            return ''
        }).join(this.delimiter)
        return lib.fs.appendFile(this.getFilePath(templateId), `${newRow}\n`)
        // TODO: catch error
    }
    get(id, templateId = null) {
        return lib.fs.readCsv(this.getFilePath(templateId), this.readCsvOptions)
            .pipe(
                first(row => row[0] === `${id}`),
                map(row => HistoryItem.fromArray(row, this.header))
            )
        // TODO: catch error
    }
    getAll(templateId = null) {
        return lib.fs.readCsv(this.getFilePath(templateId), this.readCsvOptions)
            .pipe(
                map(row => HistoryItem.fromArray(row, this.header)),
                reduce((acc, value) => [...acc, value], [])
            )
        // TODO: catch error
    }
    update(id, newValue = {}, templateId = null) {
        return lib.fs.readCsv(this.getFilePath(templateId), this.readCsvOptions)
            .pipe(
                map(row => {
                    if (row[0] !== `${id}`)
                        return row
                    const rowNew = []
                    this.header.forEach((titleKey, index) => {
                        if (titleKey === 'dateEdit') {
                            rowNew[index] = new Date()
                        } else {
                            rowNew[index] = (newValue[titleKey] || newValue[titleKey] === false) ? newValue[titleKey] : row[index]
                        }
                    })
                    return rowNew
                }),
                reduce((acc, value) => [...acc, value], []),
                switchMap(csvToWrite => lib.fs.saveCsv(this.getFilePath(templateId), csvToWrite, this.writeCsvOptions))
            )
        // TODO: catch error
    }
}

const history = new History(`${config.dirStorage}history/`)
export default history
