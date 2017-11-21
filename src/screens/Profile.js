import './Profile.css'
import { map } from 'ramda'
import h from 'react-hyperscript'
import elements from 'hyperscript-helpers'
import {
  prop, props, compose,
  find, identity
} from 'ramda'
const {
  h1, div, span,
} = elements(h)

const pairs = [
  ['profile_age_label', prop('age')],
  ['profile_gender_label',
   (profile, texts) => texts.gender_options.find(
     option => option.value === profile.gender
   ).label
  ],
  ['profile_family_label', prop('family_status')],
  ['profile_children_label',
   compose(find(identity), props([ 'Children', 'children' ]))
  ],
  ['profile_info_label', prop('aditional_info')],
  ['profile_housing_label', prop('living_with')],
]

export const Profile = ({
  texts, activateProfile,
  active
}) => profile => {
  return div({
    key: profile.phonenumber,
    className: 'Profile' + ((active === profile.phonenumber) ? ' Active': ''),
    onClick() { activateProfile(profile) }
  }, [
    h1(profile.name),
    div(map(
      pair => h('p', { key: pair[0] }, [
        span({ className: 'ProfileInfoLabel' }, texts[pair[0]] + ': '),
        span({}, pair[1](profile, texts))
      ]),
      pairs
    ))
  ])
}
