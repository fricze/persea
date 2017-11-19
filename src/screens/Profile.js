import { map } from 'ramda'
import h from 'react-hyperscript'
import elements from 'hyperscript-helpers'
const {
  h1, div, span,
} = elements(h)

const pairs = [
  ['profile_age_label', 'age'],
  ['profile_gender_label', 'gender'],
  ['profile_family_label', 'family'],
  ['profile_children_label', 'Children'],
  ['profile_info_label', 'aditional_info'],
  ['profile_housing_label', 'living_with'],
]

export const Profile = ({
  texts, activateProfile,
  active
}) => profile => div({
  key: profile.phonenumber,
  className: 'Profile' + ((active === profile.phonenumber) ? ' Active': ''),
  onClick() { activateProfile(profile) }
}, [
  h1(profile.name),
  div(map(
    pair => h('p', { key: pair[0] }, [
      span(texts[pair[0]] + ': '),
      span(profile[pair[1]])
    ]),
    pairs
  ))
])
