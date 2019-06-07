import Airtable from 'airtable';
import {generateQuizSet, RecordFields, RecordMap, QuizType} from './helpers';
import './flashcards.css';
import React from 'react';
import loading from './loading.gif';

const BASE_NAME = 'Vocab list';
// const BASE_NAME = 'Vocab list (Test data)';
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
        let rawRecords = await this.props.base(BASE_NAME).select({
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

        // temp
        this.setState({currentQuizSet: ['recr38eQVkquZniXZ', 'recQrKm8RnLR6uQ4M']});
    }

    startQuiz = (type: QuizType) => {
        this.setState({currentQuizSet: generateQuizSet(type, this.state.records!)});
    }

    renderQuizStartOptions = () => {
        // TODO: better styling
        // TODO: test categories?
        return (<div className="startOptions">
            <h3>What would you like to test?</h3>
            <li onClick={() => this.startQuiz(QuizType.ALL)}>All words</li>
            <li onClick={() => this.startQuiz(QuizType.QUICK)}>Quick revision</li>
            <li onClick={() => this.startQuiz(QuizType.WORST)}>Worst words</li>
            <li onClick={() => this.startQuiz(QuizType.LEAST_RECENT)}>Least recent words</li>
            <li onClick={() => this.startQuiz(QuizType.NEWEST)}>Newest words</li>
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

interface QuizItem {
    id: string,
    // true -> showing english on flashcard. false -> showing chinese
    testingEnglish: boolean,
}

interface QuizProps {
    records: RecordMap,
    quizSet: string[],
}

interface QuizState {
    index: number,
    showInfo: boolean,
    quizItems: QuizItem[];
    results: boolean[],
}

class Quiz extends React.Component<QuizProps, QuizState> {
    constructor(props: QuizProps) {
        super(props);
        this.state = {
            index: 0,
            showInfo: false,
            results: [],
            // TODO: improve this. we may want to test both ways on each item
            quizItems: props.quizSet.map(id => {return {
                id: id, testingEnglish: Math.random() >= 0.5
            }}).sort(() => 0.5 - Math.random())
        }
    }

    renderOptions() {
        const detailText = (
            this.state.showInfo ?
            <div><span>▴</span> Hide details</div> :
            <div><span>▾</span> Show details</div>
        );
        return <div className="options">
                <div className="optionDetail option">{detailText}</div>
                <div className="optionCorrect option"><span>✓</span> Correct</div>
                <div className="optionIncorrect option"><span>✕</span> Incorrect</div>
        </div>
    }

    render() {
        if (this.state.index === this.state.quizItems.length) {
            // TODO: render nice results, way to go back, etc
            return <div>Done!</div>
        }
        const currItem = this.state.quizItems[this.state.index];
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
