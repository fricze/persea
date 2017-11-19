import React, { Component } from 'react'
import './ChooseProfile.css'
import h from 'react-hyperscript'
import { path, compose, identity, map, toPairs, range } from 'ramda'
import elements from 'hyperscript-helpers'
import { mori, helpers } from 'datascript-mori'
import {
    q$, entity$, nextTx
} from '../data-processing/rx-datascript'
import { report$, tx$ } from '../db'
import { Profile } from './Profile'

const { vector, parse, toJs } = mori
const {
    DB_ADD
} = helpers

const {
    input, label, select, option, button,
    h1, h2, p, div, ul, li, span, form
} = elements(h)

const comp = (...fns) => compose(...fns, identity)

const textFromState = comp(p, path(['text']))

const Labeled = (a = 'Label', b) => h('label', a, [
    b
])

const Profiles = ({
    profiles, texts, activateProfile, active
}) => {
    profiles = map(a => a[1], profiles)

    return map(
        Profile({
            texts, activateProfile,
            active
        }),
        profiles
    )
}

const profileKeys = [
    `profile/phonenumber`,
    `profile/name`,
    `profile/gender`,
    `profile/age`,
    `profile/family_status`,
    `profile/living_with`,
    `profile/Children`,
    `profile/aditional_info`,
    `profile/posibble_scenarios`,
]

const setProfile = profile => {
    nextTx(tx$, vector(
        vector(DB_ADD, vector(`__holder`, `system`), "app/profile", profile),

        vector(DB_ADD, -1, `profile/phonenumber`, profile.phonenumber),
        vector(DB_ADD, -1, `profile/name`, profile.name),
        vector(DB_ADD, -1, `profile/gender`, profile.gender),
        vector(DB_ADD, -1, `profile/age`, profile.age),
        vector(DB_ADD, -1, `profile/family_status`, profile.family_status),
        vector(DB_ADD, -1, `profile/living_with`, profile.living_with),
        vector(DB_ADD, -1, `profile/Children`, profile.Children),
        vector(DB_ADD, -1, `profile/aditional_info`, profile.aditional_info),
        vector(DB_ADD, -1, `profile/posibble_scenarios`,
               profile.posibble_scenarios),
    ))
}

class ChooseProfile extends Component {
    state = {}

    activateProfile = (profile) => this.setState({
        profile,
        active: profile.phonenumber,
    })

    componentWillMount() {
        this.setState({
            randomProfiles: range(1, 4).reduce(({ chosen, profiles }, el) => {
                const index = Math.floor(Math.random()*profiles.length)
                const randElement = profiles[index]

                return {
                    chosen: chosen.concat([ randElement ]),
                    profiles: profiles.filter((_, i) => i !== index)
                }
            }, { chosen: [], profiles: this.props.profiles }).chosen
        })
    }

    render() {
        const { texts, profiles } = this.props
        const { active } = this.state
        const { activateProfile } = this

        return div('#ChooseProfile', [
            h2(texts.choose_profile_h1),
            p('.InfoText', texts.choose_profile_text),
            div('.Profiles', Profiles({
                profiles: this.state.randomProfiles, texts,
                activateProfile, active
            })),
            div('.ChooseProfileButton', [
                div('.Container', [
                    button({
                        onClick: () => this.state.profile &&
                                     setProfile(this.state.profile)
                    }, texts.continue_button)
                ])
            ])
        ])
    }
}

export default ChooseProfile
