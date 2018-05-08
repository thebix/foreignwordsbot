// in memory sotrage.

import { BehaviorSubject, Subscription, of } from 'rxjs'
import { switchMap, catchError, map, tap } from 'rxjs/operators'
import lib from './jslib/root'
import config from './config';
import { log, logLevel } from './logger';

export const archiveName = 'storage_archive'

const compositeSubscription = new Subscription()

// INFO: return Single / Maybe / etc if it's possible for rxjs

class Storage {
    constructor() {
        this.storage = {}
        this.isFsLoadedBehaviorSubject = new BehaviorSubject(false)
        // load saved storage from fs
        // check if directory and file exists, if not - create
        compositeSubscription.add(lib.fs.isExists(config.dirStorage)
            .pipe(
                switchMap(isStorageDirExists => {
                    if (isStorageDirExists !== true) {
                        log(`Storage:constructor: storage directory doesn't exists, creating. path: <${config.dirStorage}>`, logLevel.INFO)
                        return lib.fs.mkDir(config.dirStorage)
                            .pipe(
                                switchMap(() => lib.fs.isExists(config.fileState)),
                                catchError(error => {
                                    throw new Error(`Storage:constructor: can't create storage directory. path: <${config.dirStorage}>. error: <${error}>`) // eslint-disable-line max-len
                                })
                            )
                    }
                    return lib.fs.isExists(config.fileState)
                }),
                switchMap(isStateFileExists => {
                    if (isStateFileExists !== true) {
                        log(`Storage:constructor: state file doesn't exists, creating. path: <${config.fileState}>`, logLevel.INFO)
                        return lib.fs.saveJson(config.fileState, {})
                            .pipe(
                                map(() => true),
                                catchError(error => {
                                    throw new Error(`Storage:constructor: can't create state file. path: <${config.fileState}>. error: <${error}>`)
                                })
                            )
                    }
                    return of(true)
                }),
                switchMap(isStorageDirAndStateFileExists => {
                    if (isStorageDirAndStateFileExists)
                        return lib.fs.readJson(config.fileState)
                            .pipe(
                                tap(fileStorage => {
                                    this.storage = fileStorage
                                }),
                                map(() => true),
                                catchError(error => {
                                    throw new Error(`Storage:constructor: can't read state file. path: <${config.fileState}>. error: <${error}>`)
                                })
                            )
                    return of(false)
                })
            )
            .subscribe(
                initResult => {
                    this.isFsLoadedBehaviorSubject.next(initResult)
                    compositeSubscription.unsubscribe()
                },
                initError => {
                    log(initError, logLevel.ERROR)
                    compositeSubscription.unsubscribe()
                }
            ))
    }
    isInitialized() {
        return this.isFsLoadedBehaviorSubject.asObservable()
    }
    getStorageKeys() {
        return of(Object.keys(this.storage))
    }
    getItem(id, field) {
        if (!this.storage[id] || !this.storage[id][field])
            return of(null)
        return of(this.storage[id][field])
    }
    getItems(id, fieldsArray = []) {
        const result = {}
        fieldsArray.forEach(field => {
            result[field] = this.storage[id] && this.storage[id][field]
                ? this.storage[id][field] : null
        })
        return of(result)
    }
    updateItem(id, fieldName, item) {
        const field = fieldName || '0'
        if (!this.storage[id])
            this.storage[id] = {}
        this.storage[id][field] = item
        const oldValue = Object.assign({}, this.storage[id][field])
        return lib.fs.saveJson(config.fileState, this.storage)
            .pipe(
                map(() => true),
                catchError(error => {
                    log(`Storage:updateItem: can't save to state file. path: <${config.fileState}>, error:<${error}>`, logLevel.ERROR)
                    // rollback changes to fs storage to previous values on error
                    this.storage[id][field] = oldValue
                    return of(false)
                })
            )
    }
    updateItemsByMeta(id, itemsArray = []) {
        const itemsToUpdate = []
        itemsArray.forEach(itemToSave => {
            itemsToUpdate.push(...Object.keys(itemToSave)
                .map(key => ({
                    fieldName: key,
                    item: itemToSave[key]
                })))
        })

        return this.updateItems(id, itemsToUpdate)
    }
    // itemsArray = [{fieldName, item}]
    updateItems(id, itemsArray = []) {
        if (!this.storage[id])
            this.storage[id] = {}
        const oldValues = {}
        itemsArray.forEach(itemToSave => {
            const { fieldName, item } = itemToSave
            const field = fieldName || '0'
            oldValues[field] = Object.assign({}, this.storage[id][field])
            this.storage[id][field] = item
        })
        return lib.fs.saveJson(config.fileState, this.storage)
            .pipe(
                map(() => true),
                catchError(error => {
                    log(`Storage:updateItems: can't save to state file. path: <${config.fileState}>, error:<${error}>`, logLevel.ERROR)
                    // rollback changes to fs storage to previous values on error
                    itemsArray.forEach(itemToSave => {
                        const { fieldName } = itemToSave
                        const field = fieldName || '0'
                        this.storage[id][field] = oldValues[field]
                    })
                    return of(false)
                })
            )
    }
    removeItem(id, fieldName) {
        const field = fieldName || '0'
        if (this.storage[id]) {
            const oldValue = Object.assign({}, this.storage[id][field])
            delete this.storage[id][field]
            return lib.fs.saveJson(config.fileState, this.storage)
                .pipe(
                    map(() => true),
                    catchError(error => {
                        log(`Storage:removeItem: can't save to state file. path: <${config.fileState}>, error:<${error}>`, logLevel.ERROR)
                        // rollback changes to fs storage to previous values on error
                        this.storage[id][field] = oldValue
                        return of(false)
                    })
                )
        }
        return of(true)
    }
    archive(id) {
        const archive = this.storage[archiveName] || {}
        if (id !== archiveName && this.storage[id]) {
            archive[id] = this.storage[id]
            this.storage[archiveName] = archive
            delete this.storage[id]
            return lib.fs.saveJson(config.fileState, this.storage)
                .pipe(
                    map(() => true),
                    catchError(error => {
                        log(`Storage:archive: can't save to state file. path: <${config.fileState}>, error:<${error}>`, logLevel.ERROR)
                        // rollback changes to fs storage to previous values on error
                        this.storage[id] = archive[id]
                        delete this.storage[archiveName][id]
                        return of(false)
                    })
                )
        }
        return of(true)
    }
}

const storage = new Storage()

export default storage
