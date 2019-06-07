export interface RecordFields {
  id: string,
  english: string,
  pinyin: string,
  chinese: string,
  notes: string,
  category: string,
  added: Date,
  correct: number,
  attempts: number,
  lastTested?: Date,
}

export type RecordMap = {[id: string]: RecordFields};

export enum QuizType {
    ALL,
    QUICK,
    WORST,
    LEAST_RECENT,
    NEWEST
}

// For all types except ALL, how many records to test
const DEFAULT_QUIZ_SIZE = 20;

export function generateQuizSet(type: QuizType, records: RecordMap): string[] {
    let recordKeys = Object.keys(records);
    if (type === QuizType.ALL) {
        return recordKeys;
    } else if (type === QuizType.QUICK) {
        // powered by stackoverflow
        recordKeys.sort(() => 0.5 - Math.random());
    } else if (type === QuizType.WORST) {
        // TODO: Should untested words be treated as 100% correct instead of 100% wrong?
        const ratio = (record: RecordFields) => {
            return record.attempts === 0 ? 0 : record.correct / record.attempts;
        }
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
        }

        recordKeys.sort((a, b) => {
            // sort highest time ago to the front
            return howLongAgo(records[b], currentTime) - howLongAgo(records[a], currentTime);
        })
    } else {
        // QuizType.NEWEST
        recordKeys.sort((a, b) => {
            // sort highest time to the front (newest)
            return records[b].added.getTime() - records[a].added.getTime();
        })
    }
    return recordKeys.slice(0, DEFAULT_QUIZ_SIZE);
}
