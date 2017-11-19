import React, { Component } from 'react'
import './Question.css'
import h from 'react-hyperscript'
import { path, compose, identity } from 'ramda'
import elements from 'hyperscript-helpers'
import { map } from 'ramda'
import {
    nextTx, q$, entity$
} from '../data-processing/rx-datascript'
import { datascript, mori, helpers } from 'datascript-mori'
import { report$, tx$ } from '../db'

const { DB_ID, DB_ADD } = helpers
const { vector, toClj } = mori

const {
    h1, h2, h3, p, div, ul, li, span,
    label, button, input, form
} = elements(h)

const YourProfile = ({ texts }) => div('#YourProfile', [
    h3(texts.your_profile_header),
])

const YourFinSituation = ({ texts, scenario }) => div('#YourFinSituation', [
    h3(texts.financial_situation_header),
    div('.Row', [ label(texts.account_balance_label + ': '), span(scenario['scenario/starting_amount']) ]),
    div('.Row', [ label(texts.planned_expenditure_label + ': '), span(scenario['scenario/planed_expenditure']) ]),
])

const transaction = (name, questions, amount, finished) => nextTx(tx$, vector(
    vector(DB_ADD, vector('scenario/name', name), 'scenario/questions', questions),
    vector(DB_ADD, vector('scenario/name', name), 'scenario/starting_amount', amount),
    vector(DB_ADD, vector('scenario/name', name), 'scenario/finished', finished),
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
            onClick: () => transaction(
                scenario['scenario/name'], questions,
                amount + Number(question['question/answerA_action']),
                finished
            )
        }, question['question/answerA_text']),
        button({
            onClick: () => transaction(
                scenario['scenario/name'], questions,
                amount + Number(question['question/answerB_action']),
                finished
            )
        }, question['question/answerB_text']),
    ])
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

const questionHeads = [
    "question_id", "question_text", "answerA_text",
    "answerA_action", "answerA_flag", "answerB_text",
    "answerB_action", "answerB_flag"
].map(e => `question/${e}`)

const YesNoQuestion = ({ texts, question, scenario }) =>
    div('.Question', [
        YourProfile({ texts }),
        YourFinSituation({ texts, scenario }),
        YesNoQuestionContent({ question, scenario }),
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

const lektaData = (lang, phoneNumber) => ({
    /* "English"*/
    "language": lang,
    "interface": "Written",
    "operation": "Fluency",
    "context": `{ \"InputContextData\" : { \"DebtorPhoneNumber\" : \"${phoneNumber}\",
  		 \"SystemNLGStyle\" : \"polite\",
	  	 \"PersuasiveStrategy\" :  \"waiter\",
	  	 \"PersuasiveTechniques\" :\"joke\" }}`
})

class Chat extends Component {
    state = {
        lekta: {
            chat: []
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

        fetch(`${ lektaUrl }/${this.state.lekta.id}`, {
            method: 'post',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "input": text,
            })
        }).then(res => res.json())
          .then(({
              answer
          }) => {
              return this.setState({
                  lekta: {
                      id: this.state.lekta.id,
                      chat: this.state.lekta.chat.concat([{
                          type: 'lekta',
                          answer
                      }])
                  }
              })
          })
    }

    componentWillMount() {
        const {
            texts, scenario,
            person, profile, lang
        } = this.props

        const data = lektaData(lang, profile["phonenumber"])

        fetch(lektaUrl, {
            method: 'post',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(res => res.json())
          .then(({
              id, answer
          }) => this.setState({
              lekta: {
                  id,
                  chat: this.state.lekta.chat.concat([{
                      type: 'lekta',
                      answer
                  }])
              }
          }))
    }

    render() {
        const {
            texts, scenario,
            person, profile, lang
        } = this.props

        return div('.Question', [
            YourProfile({ texts }),
            YourFinSituation({ texts, scenario }),
            h(ChatContent, {
                texts, lekta: this.state.lekta,
                sendToChat: this.sendToChat.bind(this)
            }),
        ])
    }
}


export { YesNoQuestion, OpenQuestion, Chat }
