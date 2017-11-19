import { Component } from 'react'
import './Research.css'
import h from 'react-hyperscript'
import { identity,
         T, always, cond, lte, gte, pathOr } from 'ramda'
import elements from 'hyperscript-helpers'
import { map } from 'ramda'
import {
  nextTx
} from '../data-processing/rx-datascript'
import { tx$ } from '../db'
import { mori, helpers } from 'datascript-mori'
import countries from 'world-countries'

const countriesList = countries.map(c => c.name.common)

const { vector } = mori
const {
    DB_ADD
} = helpers

const {
    input, label, select, option, button,
    h2, p, div, span, form
} = elements(h)

const setData = state => nextTx(tx$, vector(
    vector(DB_ADD, -1, `person/data`, true),

    vector(DB_ADD, -1, `person/gender`, state.gender),
    vector(DB_ADD, -1, `person/education`, state.education),
    vector(DB_ADD, -1, `person/check`, state.check),
    vector(DB_ADD, -1, `person/country`, state.country),
    vector(DB_ADD, -1, `person/age`, state.age),
    vector(DB_ADD, -1, `person/email`, state.email),
));

const formKeys = [
    'gender',
    'check',
    'country',
    'education',
    'age',
]

const state = { mounted: false }

class Research extends Component {
    state = {
        age: 18,
        education: 'no_education',
        country: countriesList[0],
        email: '',
        check: false,
        gender: 'female',
    }

    formTransformers = {
        age: cond([
            [lte(65), always(65)],
            [gte(18), always(18)],
            [T, identity]
        ])
    }

    handleChange(k, v) {
        this.setState({
            [k]: v
        })
    }

    normalizeState = debounce((k, v) => {
        if (!state.mounted) {
            state.mounted = true

            return
        }

        const transformer = pathOr(identity, [k], this.formTransformers)

        this.setState({
            [k]: transformer(v)
        })
    }, 500)

    allSet = () => formKeys.map(key => this.state[key])
                           .every(identity)

    render() {
        const { texts } = this.props

        return div('#Research', [
            h2(texts.research_h1),
            p(texts.research_info1),
            p(texts.research_info2),

            form({
                onSubmit: e => {
                    e.preventDefault()

                    if(!this.allSet()) {
                        this.setState({
                            formError: true
                        })

                        setTimeout(_ =>
                            this.setState({
                                formError: false
                            }), 2000)

                        return;
                    }

                    setData(this.state)
                }
            }, [
                label('.label-second', [
                    input({ type: 'checkbox', className: 'checkbox',
                            value: this.state.check,
                            onChange: ({ target }) => this
                                .handleChange('check', target.checked)
                    }), span(texts.agree_check)
                ]),

                label('.label-first', [ input({
                    type: 'number',
                    max: 65,
                    min: 18,
                    value: this.state.age,
                    onChange: e => {
                        this.normalizeState('age', e.target.value)

                        this.handleChange('age', e.target.value)
                    }
                }), span(texts.age_label) ]),

                label('.label-first', [
                    select({
                        value: this.state.gender, onChange: e => this.handleChange('gender', e.target.value)
                    }, map(x => option(x), texts.gender_options)),
                    span(texts.gender_label)
                ]),

                label('.label-first', [
                    select({
                        value: this.state.education, onChange: e => this.handleChange('education', e.target.value)
                    }, map(x => option(x), texts.education_options)
                    ),
                    span(texts.education_label)
                ]),


                label('.label-first', [
                    select({
                        value: this.state.country,
                        onChange: e => this.handleChange('country', e.target.value)
                    }, map(x => option(x), countriesList)
                    ),
                    span(texts.country_label)
                ]),

                label('.label-first', [ input({
                    type: 'text',
                    value: this.state.email, onChange: e => this.handleChange('email', e.target.value)
                }), span(texts.email_label) ]),

                button({ className: this.state.formError ? 'Error' : '' }, 'Start'),
            ]),
        ]) }
}

function debounce(fn, delay) {
    var timer = null
    return function () {
        var context = this, args = arguments
        clearTimeout(timer)
        timer = setTimeout(function () {
            fn.apply(context, args)
        }, delay)
    }
}

export default Research;
