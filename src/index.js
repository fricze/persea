import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { state$ } from './state'

state$.subscribe(state => {
    ReactDOM.render(<App state={ state } state$={ state$ } />,
                    document.getElementById('root'));
})

registerServiceWorker();
