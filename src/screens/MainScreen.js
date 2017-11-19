import './MainScreen.css'
import h from 'react-hyperscript'
import { path, compose, identity } from 'ramda'
import helpers from 'hyperscript-helpers'
import { map } from 'ramda'

const { div } = helpers(h)

const comp = (...fns) => compose(...fns, identity)

const MainScreen = (children) =>
      div('#MainScreen', children)

export default MainScreen;
