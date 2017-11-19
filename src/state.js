import { ReplaySubject } from 'rxjs/ReplaySubject'
import {
    nextTx, q$, entity$
} from './data-processing/rx-datascript'
import { datascript, mori, helpers } from 'datascript-mori'
import 'rxjs/add/operator/skipWhile'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/publishReplay'

import { report$, tx$ } from './db'

const { DB_ID, DB_ADD, TX_DATA, TX_META, DB_AFTER, DB_BEFORE,
        DB_UNIQUE, DB_UNIQUE_IDENTITY } = helpers
const { vector, parse, get, first, hashMap, map, find, nth, reduce, toJs } = mori
const { js: djs } = datascript

const ivanAdultEntity$ =
    entity$(report$, vector(`person/name`, `Ivan`)) // make entity stream
        .skipWhile(
            Ivan => get(Ivan, `age`) < 18
        ) // skip all entity with age < 18
        .publishReplay(10)

export const response$ = q$(
    report$,
    parse(`[:find (pull ?e ["person/name" "age"]) :where [?e "person/name"]]`)
)

/* parse(`[:find ?n ?a :where [?e "name" ?n] [?e "age" ?a]]`)*/

/* response$.subscribe(
 *     x => {
 *         console.log('response')
 *         console.log(toJs(x))
 *     }
 * )
 * */
const names$ = q$(report$, parse(`[:find [?n ...] :where [?e "name" ?n]]`))
// make results of the query stream

// subscribes
/* names$.subscribe(
 *     names => console.log(toJs(names))
 * )*/

export const state$ = new ReplaySubject(10)

ivanAdultEntity$.subscribe(
    Ivan => {
        console.log(`Ivan age ${get(Ivan, 'age')} years`)
    })

// Add some tx
nextTx(tx$, vector(
    vector(DB_ADD, 1, `person/name`, `Ivan`),
    vector(DB_ADD, 1, `age`, 17)
))

nextTx(tx$, vector(
    vector(DB_ADD, 1, `age`, 18)
))

nextTx(tx$, vector(
    vector(DB_ADD, 1, `age`, 19)
))

nextTx(tx$, vector(
    hashMap(
        DB_ID, 2,
        "person/name", "Igor",
        "age", 35
    )
))


state$.next({
    text: 'state is awesome'
})

// export const state = {
//   text: 'state is awesome'
// }

