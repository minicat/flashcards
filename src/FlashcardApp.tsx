import React from 'react';
import './flashcards.css';

interface RecordFields {
  // id: string, need this?
  english: string,
  pinyin: string,
  chinese: string,
  category: string,
  added: Date,
  correct: number,
  attempts: number,
  lastAttempt?: Date,
}

interface FlashcardAppState {
  records: {[id: string]: RecordFields},
  currentTestSet?: string[],
}

export class FlashcardApp extends React.Component<{}, FlashcardAppState> {
  render() {
    return (
      <div className="main">
        stuff
      </div>
    )
  }
}
