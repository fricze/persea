import './ChooseLanguage.css'
import h from 'react-hyperscript'
import { path, compose, identity } from 'ramda'
import elements from 'hyperscript-helpers'
import { map } from 'ramda'
import { mori, helpers } from 'datascript-mori'
import {
  q$, entity$, nextTx
} from '../data-processing/rx-datascript'
import { report$, tx$ } from '../db'

const { vector, parse, toJs } = mori
const {
    DB_ADD
} = helpers

const { h1, h2, p, div, ul, li, span } = elements(h)

const comp = (...fns) => compose(...fns, identity)

const textFromState = comp(p, path(['text']))

const Languages = [
    'EN',
    'PL',
    'CZ',
]

const setLang = (lang) => nextTx(tx$, vector(
    vector(DB_ADD, vector(`__holder`, `system`), "app/lang", lang)
));

/* setTimeout(_ => {
 *     setLang('PL')
 * })
 * */

const ChooseLanguage = ({ state, state$ }) =>
    div('#ChooseLanguage', [
        h1('Choose your language - wybierz język - vyber jazyk'),
        h2('(native if possible – ojczysty jeśli to możliwe – matersky pokud mozno)'),
        ul(map(lang => li({ onClick: setLang.bind(null, lang) },
                          [ span(lang) ]), Languages))
    ])

export default ChooseLanguage;
