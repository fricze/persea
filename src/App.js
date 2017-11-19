import React, { Component } from 'react'
import './App.css'
import h from 'react-hyperscript'
import {
    path, compose, identity, toPairs,
    merge, pathOr, range, contains, equals,
    and
} from 'ramda'
import elements from 'hyperscript-helpers'
import {
    q$, entity$, nextTx
} from './data-processing/rx-datascript'
import { datascript, mori, helpers } from 'datascript-mori'
import { report$, tx$ } from './db'
import { data$ as scenariosData$ } from './ScenariosData'
import ChooseLanguage from './screens/ChooseLanguage'
import ChooseProfile from './screens/ChooseProfile'
import { YesNoQuestion, OpenQuestion, Chat } from './screens/Question'
import Research from './screens/Research'
import { filter } from 'rxjs/operators/filter'
import { map as rxMap } from 'rxjs/operators/map'
import { tap } from 'rxjs/operators/tap'
import { combineLatest } from 'rxjs/observable/combineLatest'
import textsEn from './data-sources/persea_en.json'
import textsPl from './data-sources/persea_pl.json'
import textsCs from './data-sources/persea_cs.json'

const profilesPl = toPairs(require('./data-sources/pl_profiles.json'))

const langs = {
    PL: textsPl,
    EN: textsEn,
    CZ: textsCs,
}

const { vector, parse, toJs } = mori
const {
    DB_ID, DB_ADD, TX_DATA, TX_META, DB_AFTER, DB_BEFORE,
    DB_UNIQUE, DB_UNIQUE_IDENTITY, DB_CARDINALITY, DB_CARDINALITY_MANY
} = helpers

nextTx(tx$, vector(vector(DB_ADD, -1, `__holder`, `system`)))

const { h1, h2, p } = elements(h)

const lang$ = q$(
    report$,
    parse(`[:find ?l
            :where [_ "app/lang" ?l]]`)
).pipe(
    rxMap(x => toJs(x)),
    filter(x => x && x[0] && x[0][0]),
    rxMap(x => x[0][0]),
)

const formKeys = [
    'gender',
    'check',
    'country',
    'education',
    'age',
    'email',
].map(e => `person/${e}`)

const pullPerson = `
(pull ?e [${formKeys.map(e => `"${e}"`).join(' ')}])
`

const personData$ = q$(
    report$,
    parse(`[:find ${pullPerson}
            :where [?e "person/data" ?d]]`)
).pipe(
    rxMap(x => toJs(x)),
    filter(x => x && x[0] && x[0][0]),
    rxMap(x => x[0][0]),
)

const profileData$ = q$(
    report$,
    parse(`[:find ?d
            :where [_ "app/profile" ?d]]`)
).pipe(
    rxMap(x => toJs(x)),
    filter(x => x && x[0] && x[0][0]),
    rxMap(x => x[0][0]),
)

class App extends Component {
    componentWillMount() {
        lang$.subscribe(x => this.setState({ lang: x }))

        personData$.subscribe(x => this.setState({ person: x }))

        const profiles$ = personData$.map(
            person => {
                const profiles = profilesPl
                const chosenGender = person['person/gender']
                const chosenAge = Number(person['person/age'])

                const acceptedAge = range(chosenAge - 5, chosenAge + 5)

                const profilesData = profiles.filter(
                    ([ id, { age, gender } ]) => and(
                        equals(chosenGender, gender),
                        contains(Number(age), acceptedAge)
                    )
                )

                return profilesData
            }
        )

        profiles$.subscribe(x => this.setState({ profiles: x }))

        profileData$.subscribe(x => this.setState({ profile: x }))

        const chosenScenario$ = combineLatest(
            scenariosData$,
            profileData$,
            (scenarios, profile) => scenarios.find(
                s => s['scenario/name'] === profile.posibble_scenarios
            )
        )

        chosenScenario$.subscribe(x => {
            this.setState({ scenario: x })
        })
    }

    state = {
        lang: null,
        scenario: { finished: false }
    }

    render() {
        const questions = this.state.scenario['scenario/questions'] ?
                          this.state.scenario['scenario/questions'] : []

        const scenarioFinished = pathOr(false, ['scenario/finished'], this.state.scenario)

        const lang = pathOr({}, [this.state.lang], langs)

        const { profiles } = this.state

        return h('div#app', [
            !this.state.lang && h(ChooseLanguage),

            ((!this.state.person && this.state.lang) &&
             h(Research, { texts: lang })),

            (!this.state.profile && this.state.person) &&
            h(ChooseProfile, { texts: lang, profiles }),

            (questions.length && this.state.profile) ? h(
                'div#Questions',
                questions.map(question => h(YesNoQuestion, {
                    texts: lang,
                    question,
                    scenario: this.state.scenario,
                }))
            ) : null,

            scenarioFinished ? h(Chat, {
                texts: lang,
                scenario: this.state.scenario,
                person: this.state.person,
                profile: this.state.profile,
                lang: pathOr('English', [this.state.lang], {
                    EN: 'English',
                    PL: 'Polish',
                    CZ: 'Czech',
                })
            }) : null,
        ])
    }
}

export default App;
