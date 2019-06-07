export interface RecordFields {
  // id: string, need this?
  english: string,
  pinyin: string,
  chinese: string,
  category: string,
  added: Date,
  correct: number,
  attempts: number,
  lastTested?: Date,
}

export type RecordMap = {[id: string]: RecordFields};

export const enum QuizType {
    ALL,
    QUICK,
    WORST,
    LEAST_RECENT
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
        recordKeys.sort((a, b) => {
            let aCorrectRatio = records[a].correct / records[a].attempts;
            let bCorrectRatio = records[b].correct / records[b].attempts;
            // sort lowest correct ratio to the front
            return aCorrectRatio - bCorrectRatio;
        })
    } else {
        // QuizType.LEAST_RECENT
        const currentTime = (new Date()).getTime();
        const howLongAgo = (record: RecordFields) => {
            const lastTested = record.lastTested ? record.lastTested.getTime() : 0;
            return currentTime - lastTested;
        }
        recordKeys.sort((a, b) => {
            // sort highest time ago to the front
            return howLongAgo(records[b]) - howLongAgo(records[a]);
        })
    }
    return recordKeys.slice(0, DEFAULT_QUIZ_SIZE);
}
