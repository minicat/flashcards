import * as _ from "lodash";

export interface RecordFields {
    id: string,
    english: string,
    pinyin: string,
    chinese: string,
    notes: string,
    category: string,
    sources: Array<string>,
    added: Date,
    correct: number,
    attempts: number,
    lastTested?: Date,
    daysUntilNextTest: number,
    nextTestDate?: Date,
    lastIncorrect?: Date,
}

export type RecordMap = {[id: string]: RecordFields};

export enum QuizType {
    ALL,
    QUICK,
    WORST,
    LEAST_RECENT,
    NEWEST,
    LEAST_TESTED,
    UNLEARNED,
    REVISION,
}

// For all types except ALL, how many records to test
const DEFAULT_QUIZ_SIZE = 20;

export function generateQuizSet(type: QuizType, records: RecordMap): string[] {
    // Always shuffle to introduce randomness within the tied cases
    // Note: QuizType.QUICK has no extra handling apart from this initial shuffle
    let recordKeys = _.shuffle(Object.keys(records));
    if (type === QuizType.ALL) {
        return recordKeys;
    } else if (type === QuizType.WORST) {
        // TODO: Should untested words be treated as 100% correct instead of 100% wrong?
        const ratio = (record: RecordFields) => {
            return record.attempts === 0 ? 0 : record.correct / record.attempts;
        };
        recordKeys.sort((a, b) => {
            // sort lowest correct ratio to the front
            return ratio(records[a]) - ratio(records[b]);
        })
    } else if (type === QuizType.LEAST_RECENT) {
        // Since sometimes lastTested is not defined (never tested) we can't compare directly
        // TODO: Should we treat undefined lastTested as today instead?
        // (Right now, it treats them as the oldest)
        const currentTime = (new Date()).getTime();
        const howLongAgo = (record: RecordFields, currentTime: number) => {
            const lastTested = record.lastTested ? record.lastTested.getTime() : 0;
            return currentTime - lastTested;
        };

        recordKeys.sort((a, b) => {
            // sort highest time ago to the front
            return howLongAgo(records[b], currentTime) - howLongAgo(records[a], currentTime);
        })
    } else if (type === QuizType.NEWEST) {
        recordKeys.sort((a, b) => {
            // sort highest time to the front (newest)
            return records[b].added.getTime() - records[a].added.getTime();
        })
    } else if (type === QuizType.LEAST_TESTED) {
        recordKeys.sort((a, b) => {
            return records[a].attempts - records[b].attempts;
        })
    } else if (type === QuizType.UNLEARNED) {
        // TODO: technically unlearned/revision could yield 0 words, add a fallback
        // Heuristic: "learned" words have a minimum number of corrects and a minimum correctness percentage.
        // However, decrease the correctness percentage required at higher amounts otherwise some words will never be learned.
        // TODO: improve this heuristic in the future
        recordKeys = recordKeys.filter(recordKey => {
            const record = records[recordKey];
            const ratio = record.correct / record.attempts;
            return (record.correct < 10 || ratio < 0.75) || (record.correct > 15 && ratio > 0.6);
        });
    } else if (type === QuizType.REVISION) {
        // Words due for revision as per nextTestDate
        recordKeys = recordKeys.filter(recordKey => {
            const record = records[recordKey];
            // Treat untested words (no nextTestDate) as due.
            return record.nextTestDate === undefined || record.nextTestDate <= new Date();
        });
    }
    return recordKeys.slice(0, DEFAULT_QUIZ_SIZE);
}
