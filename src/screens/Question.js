import ReactDOM from 'react-dom'
import { Component } from 'react'
import './Question.css'
import h from 'react-hyperscript'
import elements from 'hyperscript-helpers'
import {
    nextTx
} from '../data-processing/rx-datascript'
import { mori, helpers } from 'datascript-mori'
import { tx$ } from '../db'
import { Profile } from './Profile'
import { ThankYouSuccess, ThankYouFailure } from './ThankYou'
import { propOr } from 'ramda'
import { retry } from 'rxjs/operators/retry'
import { mergeMap } from 'rxjs/operators/mergeMap'
import { of } from 'rxjs/observable/of'

const { DB_ADD } = helpers
const { vector, toClj } = mori

const {
    h3, p, div, span,
    label, button, input, form
} = elements(h)

/* class YourProfileHeader extends Component {
 *     constructor(props) {
 *         super(props);
 *         this.el = document.createElement('div');
 *     }
 * 
 *     componentDidMount() {
 *         this.Question = document.querySelector('.Question')
 * 
 *         this.Question.appendChild(this.el)
 *     }
 * 
 *     componentWillUnmount() {
 *         this.Question.removeChild(this.el)
 *     }
 * 
 *     render() {
 *         return ReactDOM.createPortal(
 *             h3(this.props.texts.your_profile_header),
 *             this.el,
 *         )
 *     }
 * }*/

const YourProfileHeader = ({ texts }) => h3(texts.your_profile_header)

const YourProfile = ({ texts, profile }) => div('#YourProfile', [
    h(YourProfileHeader, { texts }),
    Profile({
        texts, activateProfile: () => void 0,
        active: false
    })(profile),
    p([
        span({ className: 'ProfileInfoLabel' }, texts.profile_verif_name_label + ': '),
        span(texts.profile_verif_name_value),
    ]),
    p([
        span({ className: 'ProfileInfoLabel' }, texts.profile_verif_city_label + ': '),
        span(texts.profile_verif_city_value),
    ])
])

const YourFinSituation = ({ texts, scenario }) => div('#YourFinSituation', [
    h3(texts.financial_situation_header),
    div('.Row', [ label(texts.account_balance_label + ': '),
                  span(scenario['scenario/starting_amount'] + ' ' + texts.currency_shortcut) ]),
    div('.Row', [ label(texts.planned_expenditure_label + ': '),
                  span(scenario['scenario/planed_expenditure'] + ' ' + texts.currency_shortcut) ]),
])

const transactAmount = (
    name, questions, amount, finished,
    question, answer
) => nextTx(tx$, vector(
    vector(DB_ADD, vector('scenario/name', name),
           'scenario/questions', questions),
    vector(DB_ADD, vector('scenario/name', name),
           'scenario/starting_amount', amount),
    vector(DB_ADD, vector('scenario/name', name),
           'scenario/finished', finished),

    vector(DB_ADD, -1, 'answered/id', question),
    vector(DB_ADD, -1, 'answered/answer', answer),
))

const transactFinalAnswer = (answer) =>
    nextTx(tx$, vector(
        vector(DB_ADD, -1, 'scenario/final-answer', answer),
    ))

const YesNoQuestionContent = ({ question, scenario }) => {
    const amount = scenario["scenario/starting_amount"]

    const _questions = scenario['scenario/questions'].map(
        x => x['question/question_id']
    ).slice(1)

    const questions = toClj(_questions)

    const finished = !_questions.length

    return div('#YesNoQuestion', [
        p(question['question/question_text']),
        button({
            onClick: () => transactAmount(
                scenario['scenario/name'], questions,
                amount + Number(question['question/answerA_action']),
                finished, question['question/question_id'], 'A'
            )
        }, question['question/answerA_text']),
        button({
            onClick: () => transactAmount(
                scenario['scenario/name'], questions,
                amount + Number(question['question/answerB_action']),
                finished, question['question/question_id'], 'B'
            )
        }, question['question/answerB_text']),
    ])
}

const LastQuestionContent = ({ lastQuestion, scenario }) => {
    const answers = [
        'last_question_answerA',
        'last_question_answerB',
        'last_question_answerC',
        'last_question_answerD',
        'last_question_answerE',
        'last_question_answerF',
    ]

    return div('#YesNoQuestion', [
        p(lastQuestion.last_question_text),
    ].concat(answers.map(
        answerKey => button({
            onClick: () => transactFinalAnswer(
                answerKey.split('_')[2]
            )
        }, lastQuestion[answerKey])
    )))
}

const OpenQuestionContent = ({ question, texts }) =>
    div('#OpenQuestion', [
        p('This is question with open answer (money amount)'),
        label([
            span(texts.amount_label),
            input({ type: 'number', className: 'Money' }),
            span(texts.currency_shortcut),
        ]),
    ])

const YesNoQuestion = ({ texts, question, scenario, profile }) =>
    div('.Question', [
        YourProfile({ texts, profile }),
        YourFinSituation({ texts, scenario }),
        YesNoQuestionContent({ question, scenario }),
    ])

const thankYouScreen = {
    success: ThankYouSuccess,
    failure: ThankYouFailure
}

const FinalQuestion = ({
    texts, question, scenario, profile,
    lastQuestion, dataSaved
}) =>
    div('.Question', [
        YourProfile({ texts, profile }),
        YourFinSituation({ texts, scenario }),
        LastQuestionContent({ lastQuestion, scenario }),
        propOr(div, dataSaved, thankYouScreen)({ texts }),
    ])

const OpenQuestion = ({ texts, scenario }) =>
    div('.Question', [
        YourProfile({ texts }),
        YourFinSituation({ texts, scenario }),
        OpenQuestionContent({ texts }),
    ])

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function stripXML(str) {
    if (!str) {
        return ''
    }

    str = str.toString()
    return str.replace(/<[^>]*>/g, '')
}

class ChatContent extends Component {
    state = {
        text: ''
    }

    setText(text) {
        this.setState({ text })
    }

    constructor(props) {
        super(props);
        this.focusTextInput = this.focusTextInput.bind(this);
    }

    focusTextInput() {
        if (!this.textInput) {
            return
        }
        this.textInput.focus();
    }

    render() {
        const { texts, lekta, sendToChat } = this.props

        setTimeout(_ => {
            this.focusTextInput()
        })

        return form('#Chat', {
            onSubmit: e => {
                e.preventDefault()

                if (!this.state.text) {
                    return
                }

                this.setState({
                    text: ''
                })

                setTimeout(_ => {
                    this.focusTextInput()
                })

                sendToChat(this.state.text)
            }
        }, lekta.chat.map(
            ({ answer, type }) => div({
                className: 'ChatAnswer ' + capitalizeFirstLetter(type)
            }, stripXML(answer))
        ).concat([
            label([
                input({
                    ref: (input) => this.textInput = input,
                    type: 'text', value: this.state.text,
                    onChange: e => this.setText(e.target.value)
                }),
                button(texts.send_button)
            ])
        ]))
    }
}

const lektaUrl = `http://aragorn.ratel.io:3781/dialogues`

const techniques = [
    'pt0', 'pt1', 'pt2', 'pt3', 'pt4', 'pt5',
    'pt6', 'pt7', 'pt8', 'pt9', 'pt10', 'pt11', 'pt12',
    'pt13', 'pt14', 'pt15', 'pt16', 'pt17', 'pt18', 'pt19',
    'pt20', 'pt21', 'pt22', 'pt23', 'pt24', 'pt25', 'pt26',
    'pt27', 'pt28', 'pt29', 'pt30', 'pt31', 'pt32', 'pt33',
    'pt34', 'pt35', 'pt36', 'pt37', 'pt38', 'pt39', 'pt40',
    'pt41', 'pt42', 'pt43', 'pt44', 'pt45', 'pt46', 'pt47',
    'pt48', 'pt49', 'pt50', 'pt51', 'pt52', 'pt53', 'pt54',
    'pt55', 'pt56', 'pt57', 'pt58', 'pt59', 'pt60', 'pt61',
    'pt62', 'pt63', 'pt64', 'pt65', 'pt66', 'pt67', 'pt68',
    'pt69', 'pt70', 'pt71', 'pt72', 'pt73', 'pt74', 'pt75',
    'pt76', 'pt77', 'pt78', 'pt79', 'pt80', 'pt81', 'pt82',
    'pt83', 'pt84', 'pt85', 'pt86', 'pt87', 'pt88', 'pt89',
    'pt90', 'pt91', 'pt92', 'pt93', 'pt94', 'pt95', 'pt96',
    'pt97', 'pt98', 'pt99'
]

const lektaData = (lang, phoneNumber) => {
    const randomTechnique = techniques[Math.floor(Math.random() * techniques.length)]

    return {
        "language": lang,
        "interface": "Written",
        "operation": "Fluency",
        "context": `{ "InputContextData": { "DebtorPhoneNumber": "${phoneNumber}",
        "SystemNLGStyle": "polite",
        "PersuasiveStrategy": "waiter",
        "PersuasiveTechniques": "${randomTechnique}" }}`
    }
}

class Chat extends Component {
    state = {
        lekta: {
            chat: [],
            closed: false
        }
    }

    sendToChat(text) {
        this.setState({
            lekta: {
                id: this.state.lekta.id,
                chat: this.state.lekta.chat.concat([{
                    type: 'user',
                    answer: text
                }])
            }
        })

        return fetch(`${ lektaUrl }/${this.state.lekta.id}`, {
            method: 'post',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "input": text,
            })
        }).then(res => res.json())
          .catch(x => ({}))
          .then(data => {
              const { answer, closed } = data

              this.setState({
                  lekta: {
                      id: this.state.lekta.id,
                      chat: this.state.lekta.chat.concat([{
                          type: 'lekta',
                          answer
                      }]),
                      closed
                  }
              })

              if (!closed) {
                  return;
              }

              nextTx(tx$, vector(
                  vector(DB_ADD, -1, `lekta/chat`,
                         JSON.stringify(this.state.lekta.chat)),
                  vector(DB_ADD, -1, 'lekta/result',
                         JSON.stringify(data.Parameter.ParameterValue))
              ))
          })
    }

    componentWillMount() {
        const {
            profile, lang
        } = this.props

        const data = lektaData(lang, profile["phonenumber"])

        of(lektaUrl)
            .pipe(
                mergeMap(url => fetch(lektaUrl, {
                    method: 'post',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })),
                retry(3),
                mergeMap(res => res.json()),
            )
            .subscribe(({
                id, answer
            }) => {
                this.setState({
                    lekta: {
                        id,
                        chat: this.state.lekta.chat.concat([{
                            type: 'lekta',
                            answer
                        }])
                    }
                })
            })
    }

    render() {
        const {
            texts, scenario,
            profile
        } = this.props

        return div('.Question', [
            YourProfile({ texts, profile }),
            YourFinSituation({ texts, scenario }),
            h(ChatContent, {
                texts, lekta: this.state.lekta,
                sendToChat: this.sendToChat.bind(this)
            }),
        ])
    }
}

export { YesNoQuestion, OpenQuestion, Chat, FinalQuestion }
