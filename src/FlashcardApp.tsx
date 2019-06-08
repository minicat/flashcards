import Airtable from 'airtable';
import {generateQuizSet, RecordFields, RecordMap, QuizType} from './helpers';
import './flashcards.css';
import * as _ from "lodash";
import React from 'react';

import loading_gif from './loading.gif';
import done_gif from './done.gif';

const TABLE_NAME = 'Vocab list';
// const TABLE_NAME = 'Vocab list (Test data)';
const VIEW_NAME = 'Main list';


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
        let rawRecords = await this.props.base(TABLE_NAME).select({
            view: VIEW_NAME
        }).all();

        let records: RecordMap = {};

        rawRecords.forEach(rawRecord => {
            let fields: any = rawRecord.fields;
            let id = rawRecord.id as string;
            // XXX: what's a nicer way to do this?
            let record: RecordFields = {
                id: id,
                english: fields["English"],
                pinyin: fields["Pinyin"],
                chinese: fields["Chinese"],
                notes: fields["Notes"],
                category: fields["Category"],
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
        const record = this.state.records![id];
        const currDate = new Date();
        // @ts-ignore: airtable typescript definitions don't have this yet
        this.props.base(TABLE_NAME).update(id, {
            "Correct": record.correct + (isCorrect ? 1 : 0),
            "Attempts": record.attempts + 1,
            "Last Tested": `${currDate.getMonth()}/${currDate.getDate()}/${currDate.getUTCFullYear()}`,
        });
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

interface QuizItem {
    id: string,
    // true -> showing english on flashcard. false -> showing chinese
    testingEnglish: boolean,
}

interface QuizProps {
    records: RecordMap,
    quizSet: string[],
    // Callback to let the parent component know the quiz is done.
    completeQuiz: () => void,
    // Callback that updates the correct/attempts info of a record
    updateRecord: (id: string, isCorrect: boolean) => void,
}

interface QuizState {
    index: number,
    showInfo: boolean,
    results: boolean[],
}

class Quiz extends React.Component<QuizProps, QuizState> {
    quizItems: QuizItem[];

    constructor(props: QuizProps) {
        super(props);
        // TODO: improve this. we may want to test both ways on each item
        this.quizItems = _.shuffle(props.quizSet.map(id => {
            return {id: id, testingEnglish: Math.random() >= 0.5}
        }));
        this.state = {
            index: 0,
            showInfo: false,
            results: [],
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.onKeydown);
    }
    componentWillUnmount() {
        document.removeEventListener("keydown", this.onKeydown);
    }

    onKeydown = (e: KeyboardEvent) => {
        if (e.keyCode === 49 || e.keyCode === 74) {
            // 1, J
            this.toggleInfo();
        } else if (e.keyCode === 50 || e.keyCode === 75) {
            // 2, K
            this.grade(true);
        } else if (e.keyCode === 51 || e.keyCode === 76) {
            // 3, L
            this.grade(false);
        }
    }

    toggleInfo = () => {
        this.setState({showInfo: !this.state.showInfo});
    }

    grade = (isCorrect: boolean) => {
        this.props.updateRecord(this.quizItems[this.state.index].id, isCorrect);
        this.setState({
            index: this.state.index + 1,
            showInfo: false,
            results: this.state.results.concat(isCorrect),
        })
    }

    renderOptions() {
        const detailText = (
            this.state.showInfo ?
            <div><span>▴</span> Hide details</div> :
            <div><span>▾</span> Show details</div>
        );
        return <div className="options">
                <div className="optionDetail option" onClick={this.toggleInfo}>{detailText}</div>
                <div className="optionCorrect option" onClick={() => {this.grade(true)}}><span>✓</span> Correct</div>
                <div className="optionIncorrect option" onClick={() => {this.grade(false)}}><span>✕</span> Incorrect</div>
        </div>
    }

    renderDone() {
        const correctSymbol = <div className="resultSymbol optionCorrect"><span>✓</span></div>
        const incorrectSymbol = <div className="resultSymbol optionIncorrect"><span>✕</span></div>

        return (
            <div>
                <div className="doneTopBar"><div className="optionReturn option" onClick={this.props.completeQuiz}><span>◂</span> Back</div></div>
                <img src={done_gif} alt='Complete!' />
                <div className="score">{`${this.state.results.filter(r => r === true).length} / ${this.props.quizSet.length} correct`}</div>
                <div className="results">{this.quizItems.map((item, i) => {
                    const record = this.props.records[item.id]
                    return (
                        <div className="resultRow" key={i}>
                            {this.state.results[i] ? correctSymbol : incorrectSymbol}
                            <div className="resultCell">{record.english}</div>
                            <div className="resultCell">{record.pinyin}</div>
                            <div className="resultChinese">{record.chinese}</div>
                        </div>
                    )
                })}</div>
             </div>
        )
    }

    render() {
        if (this.state.index === this.quizItems.length) {
            return this.renderDone()
        }
        const currItem = this.quizItems[this.state.index];
        const currRecord = this.props.records[currItem.id]
        const mainLine = currItem.testingEnglish ? currRecord.english : currRecord.pinyin;
        const secondLine = currItem.testingEnglish ? currRecord.pinyin : currRecord.english;
        return (
            <div className="quiz">
                <div className="progress">
                    {`${this.state.index + 1} / ${this.props.quizSet.length}`}
                </div>
                <div className="flashcard">
                    {mainLine}
                </div>
                {this.renderOptions()}
                {this.state.showInfo && (
                    <div className="info">
                        {secondLine} / {currRecord.chinese}<br />
                        {currRecord.notes}
                    </div>
                )}
            </div>
        )
    }
}
