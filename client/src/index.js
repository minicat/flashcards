import Airtable from 'airtable';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {FlashcardApp} from './FlashcardApp';
let base = new Airtable({apiKey: process.env.REACT_APP_AIRTABLE_API_KEY}).base('appz6ksxJMtsLEs7R');

ReactDOM.render(<FlashcardApp base={base} />, document.getElementById('root'));
