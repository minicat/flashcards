import {RecordMap} from './helpers';
import React from 'react';
import * as _ from "lodash";

import done_gif from './done.gif';

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
    // Callback that logs the total correct/attempts of this quiz session
    // Separate to completeQuiz since completeQuiz isn't always called (e.g. if you leave the page before clicking back)
    logQuiz: (nCorrect: number, nIncorrect: number) => void,
}

interface QuizState {
    index: number,
    showInfo: boolean,
    results: boolean[],
}

export class Quiz extends React.Component<QuizProps, QuizState> {
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
        if (this.isDone()) {
            if (e.keyCode === 13 || e.keyCode === 66) {
                // Enter, B
                this.props.completeQuiz();
            }
        } else {
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
    };

    toggleInfo = () => {
        this.setState({showInfo: !this.state.showInfo});
    };

    grade = (isCorrect: boolean) => {
        this.props.updateRecord(this.quizItems[this.state.index].id, isCorrect);
        // if it was the last card, also log a session
        if (this.state.index + 1 === this.quizItems.length) {
            // this is a bit funky since we're doing it before the state update
            const nCorrect = this.state.results.filter(result => result).length + (isCorrect ? 1 : 0);
            this.props.logQuiz(nCorrect, this.quizItems.length - nCorrect);
        }
        this.setState({
            index: this.state.index + 1,
            showInfo: false,
            results: this.state.results.concat(isCorrect),
        })
    };

    isDone = () => {
        return this.state.index === this.quizItems.length;
    };

    renderOptions() {
        const detailText = (
            this.state.showInfo ?
            <><span>▴</span> Hide details</> :
            <><span>▾</span> Show details</>
        );
        return <div className="options">
                <div className="optionDetail option" onClick={this.toggleInfo}>{detailText}</div>
                <div className="optionCorrect option" onClick={() => {this.grade(true)}}><span>✓</span> Correct</div>
                <div className="optionIncorrect option" onClick={() => {this.grade(false)}}><span>✕</span> Incorrect</div>
        </div>
    }

    renderDone() {
        const correctSymbol = <div className="resultSymbol optionCorrect"><span>✓</span></div>;
        const incorrectSymbol = <div className="resultSymbol optionIncorrect"><span>✕</span></div>;

        return (
            <div>
                <div className="doneTopBar"><div className="optionReturn option" onClick={this.props.completeQuiz}><span>◂</span> Back</div></div>
                <img src={done_gif} alt='Complete!' />
                <div className="score">{`${this.state.results.filter(r => r === true).length} / ${this.props.quizSet.length} correct`}</div>
                <div className="results">{this.quizItems.map((item, i) => {
                    const record = this.props.records[item.id];
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
        if (this.isDone()) {
            return this.renderDone()
        }
        const currItem = this.quizItems[this.state.index];
        const currRecord = this.props.records[currItem.id];
        const chineseAndPinyin = `${currRecord.chinese} / ${currRecord.pinyin}`;
        const mainLine = currItem.testingEnglish ? currRecord.english : chineseAndPinyin;
        const secondLine = currItem.testingEnglish ? chineseAndPinyin : currRecord.english;
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
                        {secondLine}<br />
                        {currRecord.notes}
                    </div>
                )}
            </div>
        )
    }
}
