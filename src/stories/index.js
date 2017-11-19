import '../App.css'
import React from 'react'
import h from 'react-hyperscript'

import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { linkTo } from '@storybook/addon-links'

import { Button, Welcome } from '@storybook/react/demo'
import ChooseLanguage from '../screens/ChooseLanguage'
import Research from '../screens/Research'
import ChooseProfile from '../screens/ChooseProfile'
import { YesNoQuestion, OpenQuestion, Chat } from '../screens/Question'
import ThankYou from '../screens/ThankYou'
import MainScreen from '../screens/MainScreen'
import textsEn from '../data-sources/persea_en.json'
import textsCz from '../data-sources/persea_cs.json'

storiesOf('Welcome', module).add('to Storybook', () => h('h1', 'Welcome to Persea storybook'))

storiesOf('ChooseLanguage', module)
  .add('ChooseLanguage', () => h(MainScreen, [ h(ChooseLanguage) ]))

storiesOf('Research', module)
  .add('Research EN', () => h(MainScreen, [ h(Research, { texts: textsEn }) ]))
  .add('Research CZ', () => h(MainScreen, [ h(Research, { texts: textsCz }) ]))

storiesOf('ChooseProfile', module)
  .add('Choose Profile EN', () => h(MainScreen, [ h(ChooseProfile, { texts: textsEn }) ]))
  .add('Choose Profile CZ', () => h(MainScreen, [ h(ChooseProfile, { texts: textsCz }) ]))

storiesOf('Questions', module)
  .add('Yes/No Question', () => h(YesNoQuestion, { texts: textsEn }))
  .add('Open Question', () => h(OpenQuestion, { texts: textsEn }))
  .add('Chat', () => h(Chat, { texts: textsEn }))

storiesOf('Thanks', module)
  .add('Thank You', () => h(ThankYou, { texts: textsEn }))
