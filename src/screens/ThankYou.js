import './ThankYou.css'
import h from 'react-hyperscript'
import { path, compose, identity } from 'ramda'
import helpers from 'hyperscript-helpers'
import { map } from 'ramda'

const {
    h1, h2, h3, p, div, ul, li, span,
    label, button, input
} = helpers(h)

const ThankYou = ({ texts }) => div('#ThankYou', [
    p(texts.thank_you_text),
])

export default ThankYou
