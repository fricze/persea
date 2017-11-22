import './ChooseLanguage.css'
import h from 'react-hyperscript'
import elements from 'hyperscript-helpers'
import { map } from 'ramda'
import { mori, helpers } from 'datascript-mori'
import {
  nextTx
} from '../data-processing/rx-datascript'
import { tx$ } from '../db'

const { vector } = mori
const {
    DB_ADD
} = helpers

const { h1, h2, div, ul, li, span } = elements(h)

const Languages = [
    'EN',
    'PL',
    'CZ',
]

const setLang = (lang) => nextTx(tx$, vector(
    vector(DB_ADD, vector(`__holder`, `system`), "app/lang", lang)
));

const ChooseLanguage = ({ state, state$ }) =>
    div('#ChooseLanguage', [
        h1('Choose your language - wybierz język - vyber si jazyk'),
        h2('(native if possible – ojczysty jeśli to możliwe – mateřský pokud možno)'),
        ul(map(lang => li({ onClick: setLang.bind(null, lang) },
                          [ span(lang) ]), Languages))
    ])

export default ChooseLanguage;
