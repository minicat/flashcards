import {generateQuizSet, RecordFields, RecordMap, QuizType} from './helpers';
import './flashcards.css';
import React from 'react';
import {Quiz} from './Quiz';

import loading_gif from './loading.gif';

interface FlashcardAppState {
    records?: RecordMap,
    currentQuizSet?: string[],
}

export class FlashcardApp extends React.Component<{}, FlashcardAppState> {
    constructor(props: {}) {
        super(props);
        this.fetchRecords();

        this.state = {};
    }

    fetchRecords = async () => {
        // TODO: can move this into a helper
        const rawRecords = await fetch('api/list');
        const rawRecordsList: Array<{id: string, fields: any}> = await rawRecords.json();

        const records: RecordMap = {};

        rawRecordsList.forEach(rawRecord => {
            const fields: any = rawRecord.fields;
            const id = rawRecord.id;
            // XXX: what's a nicer way to do this?
            const record: RecordFields = {
                id: id,
                english: fields["English"],
                pinyin: fields["Pinyin"],
                chinese: fields["Chinese"],
                notes: fields["Notes"],
                category: fields["Category"],
                sources: fields["Source(s)"],
                added: new Date(fields["Added"]),
                correct: fields["Correct"],
                attempts: fields["Attempts"],
                lastTested: fields["Last Tested"] ? new Date(fields["Last Tested"]) : undefined,
            };
            records[id] = record;
        })

        this.setState({records: records});
    }

    updateRecord = (id: string, isCorrect: boolean) => {
        fetch('api/log_attempt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id,
                isCorrect,
            }),
        })
    }

    startQuiz = (type: QuizType) => {
        this.setState({currentQuizSet: generateQuizSet(type, this.state.records!)});
    }

    renderQuizStartOptions = () => {
        // TODO: test categories?
        return (<div className="startOptions">
            <h3>What would you like to test?</h3>
            <div onClick={() => this.startQuiz(QuizType.ALL)}>All words</div>
            <div onClick={() => this.startQuiz(QuizType.QUICK)}>Quick revision</div>
            <div onClick={() => this.startQuiz(QuizType.WORST)}>Worst words</div>
            <div onClick={() => this.startQuiz(QuizType.LEAST_RECENT)}>Least recently tested words</div>
            <div onClick={() => this.startQuiz(QuizType.NEWEST)}>Newest words</div>
            <div onClick={() => this.startQuiz(QuizType.LEAST_TESTED)}>Least tested words</div>
            </div>
        )
    }

    completeQuiz = () => {
        // On completing a quiz, clear state and fetch records again to get updated stats
        // Note: We could theoretically just update the stats ourselves, but I think this is cleaner
        this.setState({records: undefined, currentQuizSet: undefined});
        this.fetchRecords();
    }

    render() {
        let contents = <img src={loading_gif} alt='Loading...' />
        if (this.state.records) {
            if (this.state.currentQuizSet) {
                contents = <Quiz
                    records={this.state.records}
                    quizSet={this.state.currentQuizSet}
                    completeQuiz={this.completeQuiz}
                    updateRecord={this.updateRecord}
                />;
            } else {
                contents = this.renderQuizStartOptions();
            }
        }
        return <div className='main'> {contents} </div>;
    }
}
