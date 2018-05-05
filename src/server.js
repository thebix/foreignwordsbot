import { Subscription } from 'rxjs'
import { filter, mergeMap } from 'rxjs/operators'
import nodeCleanup from 'node-cleanup'
import foreignwordsBot from './bot/foreignwordsBot'
import storage from './storage'
import { log, logLevel } from './logger'

log('Starting server', logLevel.INFO)

const compositeSubscription = new Subscription()

nodeCleanup((exitCode, signal) => {
    log(`server:nodeCleanup: clean. exitCode: <${exitCode}>, signal: <${signal}>`, logLevel.INFO)
    compositeSubscription.unsubscribe()
})

// bot
compositeSubscription.add(storage.isInitialized()
    .pipe(
        filter(isStorageInitizlized => isStorageInitizlized),
        mergeMap(() => foreignwordsBot())
    )
    .subscribe(
        () => { },
        error => {
            log(`Unhandled exception: server.foreignwordsBot: error while handling userText / userActions. Error=${error && error.message
                ? error.message : JSON.stringify(error)}`, logLevel.ERROR)
            compositeSubscription.unsubscribe()
        }
    ))
