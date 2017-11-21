import { toPairs, merge } from 'ramda'
import {
    q$, nextTx
} from './data-processing/rx-datascript'
import { mori, helpers } from 'datascript-mori'
import { report$, tx$ } from './db'
import Papa from 'papaparse'
import { combineLatest } from 'rxjs/observable/combineLatest'
import { filter } from 'rxjs/operators/filter'
import { tap } from 'rxjs/operators/tap'
import { map as rxMap } from 'rxjs/operators/map'

const { vector, concat, apply, parse, get, first, hashMap, map, find, nth, reduce, toJs, toClj, into } = mori
const { DB_ID, DB_ADD, TX_DATA, TX_META, DB_AFTER, DB_BEFORE,
        DB_UNIQUE, DB_UNIQUE_IDENTITY } = helpers

const url = './questions.csv'

const scenarios = require('./data-sources/scenarios.json')
const myRequest = new Request(url)

const questionHeads = [
    "question_id", "question_text", "answerA_text", "answerA_action",
    "answerA_flag", "answerB_text", "answerB_action", "answerB_flag"
].map(e => `question/${e}`)

fetch(myRequest)
 .then((response) => response.text())
 .then(x => Papa.parse(x).data)
 .then(([ heads, ...content ]) => content
     .map((e) => e.map((e, i) => ([heads[i], e]))))
 .then(questions =>
     nextTx(tx$, toClj(questions.map((questions, idx) => questions.map(
         ([ name, value ]) => [ DB_ADD, -idx - 1, `question/${name}`, value ]
     )).reduce((acc, el) => acc.concat(el), []))))

const pullQ = `
(pull ?e [${questionHeads.map(e => `"${e}"`).join(' ')}])
`

const questions$ = q$(
    report$,
    parse(`[:find ${pullQ}
            :where [?e "question/question_id"]]`)
)

const scenarioHeads = [
    'name',
    'planed_expenditure',
    'questions',
    'starting_amount',
    'finished',
].map(e => `scenario/${e}`)

const scenariosTrans = scenarios.map((scenario, idx) => {
    return toPairs(scenario).map(([ name, value ]) => {
        return [ DB_ADD, (-idx - 1), `scenario/${name}`, value ]
    })
}).reduce((acc, el) => acc.concat(el), [])

nextTx(tx$, toClj(scenariosTrans))

const pullS = `
(pull ?e [${scenarioHeads.map(e => `"${e}"`).join(' ')} "question/question_id"])
`

const scenariosPull = `[:find ${pullS}
                       :where [?e "scenario/name"] ]`

const scenarios$ = q$(
    report$,
    parse(scenariosPull)
).pipe(
    rxMap(x => toJs(x)),
    tap()
)

export const data$ = combineLatest(
    questions$,
    scenarios$,
    (q, s) => [ toJs(q), s, ])
    .pipe(
        filter(([ q, s ]) => q.length && s.length),
        rxMap(arr => arr
            .map(e => e
                .map(x => x[0]))),
        rxMap(([ qs, s ]) => s.map(e => merge(e, {
            'scenario/questions': e['scenario/questions'][0].map(
                qId => qs.find(q =>
                    String(q['question/question_id']) === String(qId))
            )
        }))),
    )
