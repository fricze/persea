import {
  connect
} from './data-processing/rx-datascript'
import { datascript, helpers } from 'datascript-mori'

const {
  DB_UNIQUE, DB_UNIQUE_IDENTITY, DB_CARDINALITY, DB_CARDINALITY_MANY
} = helpers
const { js: djs } = datascript

const db = djs.empty_db({
  'person/name': { [DB_UNIQUE]: DB_UNIQUE_IDENTITY },
  'scenario/questions': { [DB_CARDINALITY]: DB_CARDINALITY_MANY },
  'scenario/name': { [DB_UNIQUE]: DB_UNIQUE_IDENTITY },
  '__holder': {
    [DB_UNIQUE]: DB_UNIQUE_IDENTITY
  },
})

export const { report$, tx$ } = connect(db)

