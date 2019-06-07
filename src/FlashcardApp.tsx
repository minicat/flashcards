import Airtable from 'airtable';
import {generateQuizSet, RecordFields, RecordMap, QuizType} from './helpers';
import './flashcards.css';
import React from 'react';
import loading from './loading.gif';

const BASE_NAME = 'Vocab list';
const VIEW_NAME = 'Main list';


interface QuizProps {
    records: RecordMap,
    quizSet: string[],
}

interface QuizState {
    index: number,
    showInfo: boolean,
    results: boolean[],
}

interface FlashcardAppProps {
    base: Airtable.Base;
}

interface FlashcardAppState {
    records?: RecordMap,
    currentQuizSet?: string[],
}

export class FlashcardApp extends React.Component<FlashcardAppProps, FlashcardAppState> {
    constructor(props: FlashcardAppProps) {
        super(props);
        this.fetchRecords();

        this.state = {};
    }

    fetchRecords = async () => {
        // TODO: can move this into a helper
        let rawRecords = await this.props.base(BASE_NAME).select({
            view: VIEW_NAME
        }).all();

        let records: RecordMap = {};

        rawRecords.forEach(rawRecord => {
            let fields: any = rawRecord.fields;
            // XXX: what's a nicer way to do this?
            let record: RecordFields = {
                english: fields["English"],
                pinyin: fields["Pinyin"],
                chinese: fields["Chinese"],
                category: fields["Category"],
                added: new Date(fields["Added"]),
                correct: fields["Correct"],
                attempts: fields["Attempts"],
                lastTested: fields["Last Tested"] ? new Date(fields["Last Tested"]) : undefined,
            };
            records[rawRecord.id as string] = record;
        })

        this.setState({records: records});
    }

    startQuiz = (quizSet: string[]) => {
        this.setState({currentQuizSet: quizSet});
    }

    renderQuizStartOptions = () => {
        // TODO: better styling
        return (<div className="startOptions">
            <h3>What would you like to test?</h3>
            <li onClick={() => this.startQuiz(Object.keys(this.state.records!))}>All words</li>
            <li>Quick revision</li>
            <li>Worst words</li>
            <li>Least recent words</li>
            </div>
        )
    }

    render() {
        let contents = <img src={loading} alt='Loading...' />
        if (this.state.records) {
            if (this.state.currentQuizSet) {
                contents = <Quiz records={this.state.records} quizSet={this.state.currentQuizSet} />;
            } else {
                contents = this.renderQuizStartOptions();
            }
        }
        return <div className='main'> {contents} </div>;
    }
}

class Quiz extends React.Component<QuizProps, QuizState> {
    constructor(props: QuizProps) {
        super(props);
        this.state = {
            index: 0,
            showInfo: false,
            results: [],
        }
    }
    render() {
        return <div> TODO: quiz </div>
    }
}
