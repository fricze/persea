import { Component } from 'react'
import './App.css'
import h from 'react-hyperscript'
import {
    toPairs, pathOr, range, contains, equals,
    and, map, identity
} from 'ramda'
import elements from 'hyperscript-helpers'
import {
    q$, nextTx
} from './data-processing/rx-datascript'
import { datascript, mori, helpers } from 'datascript-mori'
import { report$, tx$ } from './db'
import { data$ as scenariosData$ } from './ScenariosData'
import ChooseLanguage from './screens/ChooseLanguage'
import ChooseProfile from './screens/ChooseProfile'
import {
    YesNoQuestion, OpenQuestion, Chat, FinalQuestion
} from './screens/Question'
import Research from './screens/Research'
import { filter } from 'rxjs/operators/filter'
import { map as rxMap } from 'rxjs/operators/map'
import { mapTo } from 'rxjs/operators/mapTo'
import { take, toArray } from 'rxjs/operators'
import { shareReplay } from 'rxjs/operators/shareReplay'
import { mergeMap } from 'rxjs/operators/mergeMap'
import { pluck } from 'rxjs/operators/pluck'
import { catchError } from 'rxjs/operators/catchError'
import { tap } from 'rxjs/operators/tap'
import { combineLatest } from 'rxjs/observable/combineLatest'
import textsEn from './data-sources/persea_en.json'
import textsPl from './data-sources/persea_pl.json'
import textsCs from './data-sources/persea_cs.json'

const profilesPl = toPairs(require('./data-sources/pl_profile.json'))
const profilesEn = toPairs(require('./data-sources/en_profile.json'))
const profilesCz = toPairs(require('./data-sources/cs_profile.json'))

const langs = {
    PL: textsPl,
    EN: textsEn,
    CZ: textsCs,
}

const profilesObj = {
    CZ: profilesCz,
    EN: profilesEn,
    PL: profilesPl,
}

const { vector, parse, toJs } = mori
const {
    DB_ID, DB_ADD, TX_DATA, TX_META, DB_AFTER, DB_BEFORE,
    DB_UNIQUE, DB_UNIQUE_IDENTITY, DB_CARDINALITY,
    DB_CARDINALITY_MANY
} = helpers

nextTx(tx$, vector(vector(DB_ADD, -1, `__holder`, `system`)))

const { h1, h2, p, div } = elements(h)

const toJsTransformers = [
    rxMap(x => toJs(x)),
    filter(x => x && x[0] && x[0][0]),
    rxMap(x => x[0][0]),
]

const lang$ = q$(
    report$,
    parse(`[:find ?l
            :where [_ "app/lang" ?l]]`)
).pipe(
    ...toJsTransformers
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
    ...toJsTransformers
)

const lektaChat$ = q$(
    report$,
    parse(`[:find ?c
            :where [_ "lekta/chat" ?c]]`)
).pipe(
    ...toJsTransformers
)

const lektaResult$ = q$(
  report$,
  parse(`[:find ?r
            :where [_ "lekta/result" ?r]]`)
).pipe(
  ...toJsTransformers
)

const lektaStartData$ = q$(
  report$,
  parse(`[:find ?r
            :where [_ "lekta/startData" ?r]]`)
).pipe(
  ...toJsTransformers
)

const finalAnswer$ = q$(
    report$,
    parse(`[:find ?c
            :where [_ "scenario/final-answer" ?c]]`)
).pipe(
    ...toJsTransformers
)

const answers$ = q$(
    report$,
    parse(`[:find ?q ?a
            :where [?e "answered/id" ?q]
                   [?e "answered/answer" ?a]]`)
).pipe(
    rxMap(x => toJs(x)),
    filter(x => x && x[0] && x[0][0]),
)

const profileData$ = q$(
    report$,
    parse(`[:find ?d
            :where [_ "app/profile" ?d]]`)
).pipe(
    ...toJsTransformers
)

const lastQuestionKeys = [
    'last_question_text',
    'last_question_answerA',
    'last_question_answerB',
    'last_question_answerC',
    'last_question_answerD',
    'last_question_answerE',
    'last_question_answerF',
    'thank_you_text',
]

class App extends Component {
    stateFromStream(source$, key) {
        source$.subscribe(value => this.setState({
            [key]: value
        }))
    }

    componentWillMount() {
        this.stateFromStream(lang$, 'lang')
        this.stateFromStream(lektaChat$, 'lektaChat')

        personData$.subscribe(x => this.setState({ person: x }))

        const profiles$ = combineLatest(
            personData$, lang$,
            (person, language) => [ person, language ]
        ).map(
            ([ person, language ]) => {
                const profiles = profilesObj[language]
                const chosenGender = person['person/gender']
                const chosenAge = Number(person['person/age'])

                const acceptedAge = range(
                    chosenAge - 6,
                    chosenAge + 6)

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

        const randomScenarioName$ = combineLatest(
            scenariosData$,
            profileData$,
            (scenarios, profile) => [ scenarios, profile ]
        ).pipe(
            take(1),
            rxMap(([ scenarios, profile ]) => profile.posibble_scenarios[
                Math.floor(Math.random() * profile.posibble_scenarios.length)
            ]),
            shareReplay(1)
        )

        const chosenScenario$ = combineLatest(
            scenariosData$,
            randomScenarioName$,
            (scenarios, name) => scenarios.find(
                s => s['scenario/name'] === name
            )
        )

        chosenScenario$.subscribe(x => {
            this.setState({ scenario: x })
        })

      // {"Parameter":{"ParameterCategory":"terminal","ParameterType":"result","ParameterValue":{"Result":"will_pay"}}}

        /* lektaResult*/

        /* const finalUrl = 'http://persearesearch.com/final'*/
        const finalUrl = './final'

        const fetchPostFinal = map(postData => fetch(finalUrl, {
            method: "POST",
            body: JSON.stringify(postData),
        }).then((response) => ({
            response,
            success: response.ok
        })))

        const finalRequest$ = combineLatest(
            finalAnswer$,
            answers$,
            profileData$,
            personData$,
            chosenScenario$,
            lektaChat$,
            lektaResult$,
            lektaStartData$,
            lang$,
            (finalAnswer, answers, profile,
             person, scenario, lekta, result, startData, lang) => ({
                 finalAnswer, answers, profile, person,
                 scenario, lekta, result, startData, lang,
             })
        ).pipe(
            map(postData => ({
                lang: postData.lang,
                lekta: (postData.lekta),
                answers: JSON.stringify(postData.answers),
                person: JSON.stringify(postData.person),
                result: (postData.result),
                startData: postData.startData,
                finalAnswer: postData.finalAnswer,
                profileId: postData.profile.id,
                scenarioName: postData.scenario['scenario/name'],
            })),
            fetchPostFinal,
            mergeMap(identity),
            shareReplay(1),
        )

        this.stateFromStream(finalRequest$.pipe(
            pluck('success'),
            map(success => ({
                true: 'success',
                false: 'failure'
            })[success]),
        ), 'dataSaved')
    }

    state = {
        lang: null,
        scenario: { finished: false }
    }

    render() {
        const questions = this.state.scenario['scenario/questions'] ?
                          this.state.scenario['scenario/questions'] : []

        const scenarioFinished = pathOr(
            false, ['scenario/finished'], this.state.scenario
        )

        const lang = pathOr({}, [this.state.lang], langs)

        const {
            last_question_text,
            last_question_answerA,
            last_question_answerB,
            last_question_answerC,
            last_question_answerD,
            last_question_answerE,
            last_question_answerF,
        } = lang

        const { profiles } = this.state

        return h('div#app', [
            !this.state.lang && h(ChooseLanguage),

            ((!this.state.person && this.state.lang) &&
             h(Research, { texts: lang })),

            (!this.state.profile && this.state.person) &&
            h(ChooseProfile, { texts: lang, profiles }),

            (questions.length && this.state.profile) ? h(
                'div#Questions',
                [ h(YesNoQuestion, {
                    texts: lang,
                    question: questions[0],
                    scenario: this.state.scenario,
                    profile: this.state.profile
                }) ]
            ) : null,

            (!this.state.lektaChat && scenarioFinished) ? h(Chat, {
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

            this.state.lektaChat ?
            h(FinalQuestion, {
                dataSaved: this.state.dataSaved,
                texts: lang,
                scenario: this.state.scenario,
                person: this.state.person,
                profile: this.state.profile,
                lang: pathOr('English', [this.state.lang], {
                    EN: 'English',
                    PL: 'Polish',
                    CZ: 'Czech',
                }),
                lastQuestion: {
                    last_question_text,
                    last_question_answerA,
                    last_question_answerB,
                    last_question_answerC,
                    last_question_answerD,
                    last_question_answerE,
                    last_question_answerF,
                }
            }) : null,
        ])
    }
}

export default App;
