import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { state$ } from './state'
import {
    connect, nextTx, q$, entity$
} from './data-processing/rx-datascript'
import { datascript, mori, helpers } from 'datascript-mori'
import { report$, tx$ } from './db'

const { vector, parse, get, first, hashMap, map, find, nth, reduce, toJs } = mori

/* report$.subscribe(x => console.log('report$...'))*/

/* state$.subscribe(x => {
 *     console.log('state')
 *     console.log(x)
 * })*/

state$.subscribe(state => {
    ReactDOM.render(<App state={ state } state$={ state$ } />,
                    document.getElementById('root'));
})

registerServiceWorker();
