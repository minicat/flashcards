import {generateQuizSet, RecordFields, RecordMap, QuizType} from './helpers';
import './flashcards.css';
import React from 'react';
import {Quiz} from './Quiz';

import loading_gif from './loading.gif';

interface FlashcardAppState {
    records?: RecordMap,
    currentQuizSet?: string[],
    shouldIncludeAesopOnlyVocab: 'on' | undefined,
}

export class FlashcardApp extends React.Component<{}, FlashcardAppState> {
    constructor(props: {}) {
        super(props);
        this.fetchRecords();

        this.state = {
            shouldIncludeAesopOnlyVocab: undefined,
        };
    }

    fetchRecords = async () => {
        // TODO: can move this into a helper
        const rawRecords = await fetch('api/list');
        const rawRecordsList: Array<{id: string, fields: any}> = await rawRecords.json();

        const records: RecordMap = {};

        rawRecordsList.forEach(rawRecord => {
            const fields: any = rawRecord.fields;
            const id = rawRecord.id;

            // filter empty records (in case there's WIP editing) & "not for flashcards" records
            if (!!fields["English"] && fields["Exclude from flashcards"] !== true) {
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
                    daysUntilNextTest: fields["Days until next test"],
                    // Only defined if Last Tested is defined, otherwise is #ERROR
                    nextTestDate: fields["Last Tested"] ? new Date(fields["Next test date"]) : undefined,
                    lastIncorrect: fields["Last Incorrect"] ? new Date(fields["Last Incorrect"]) : undefined,
                };
                records[id] = record;
            }
        });

        this.setState({records: records});
    };

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
    };

    logQuiz = (nCorrect: number, nIncorrect: number) => {
        fetch('api/log_quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nCorrect,
                nIncorrect,
            }),
        })
    };

    startQuiz = (type: QuizType) => {
        const allRecords = this.state.records!;
        let recordsToUse: RecordMap;
        
        if (this.state.shouldIncludeAesopOnlyVocab === 'on') {
            recordsToUse = allRecords;
        } else {
            // Filter them out based on sources
            recordsToUse = {}; 

            for (let recordId of Object.keys(allRecords)) {
                const record = allRecords[recordId];
                console.log(recordId, record)
                // Slightly hacky; fable-introduced vocab start with Aesop's Fables, whereas older vocab that were
                // tagged later have it at the end.
                // Be resilient to missing sources
                if (!record.sources || record.sources[0] !== "Aesop's Fables") {
                    recordsToUse[recordId] = record;
                }
            }
        }

        this.setState({currentQuizSet: generateQuizSet(type, recordsToUse)});
    };

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
                <div onClick={() => this.startQuiz(QuizType.UNLEARNED)}>Unlearned words</div>
                <div onClick={() => this.startQuiz(QuizType.REVISION)}>Due for revision</div>
                <p>
                    <input 
                        type="checkbox" 
                        id="aesopVocabCheckbox" 
                        name="aesopVocabCheckbox" 
                        value={this.state.shouldIncludeAesopOnlyVocab}
                        onClick={(e) => {
                            if (this.state.shouldIncludeAesopOnlyVocab) {
                            this.setState({shouldIncludeAesopOnlyVocab: undefined});
                            } else {
                            this.setState({shouldIncludeAesopOnlyVocab: 'on'});
                            }
                        }}
                    />
                    <label htmlFor="aesopVocabCheckbox">Include vocab learnt from Aesop's Fables</label>
                </p>
            </div>
        )
    };

    completeQuiz = () => {
        // On completing a quiz, clear state and fetch records again to get updated stats
        // Note: We could theoretically just update the stats ourselves, but I think this is cleaner
        this.setState({records: undefined, currentQuizSet: undefined});
        this.fetchRecords();
    };

    render() {
        let contents = <img src={loading_gif} alt='Loading...' />
        if (this.state.records) {
            if (this.state.currentQuizSet) {
                contents = <Quiz
                    records={this.state.records}
                    quizSet={this.state.currentQuizSet}
                    completeQuiz={this.completeQuiz}
                    updateRecord={this.updateRecord}
                    logQuiz={this.logQuiz}
                />;
            } else {
                contents = this.renderQuizStartOptions();
            }
        }
        return <div className='main'> {contents} </div>;
    }
}
