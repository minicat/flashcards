import Airtable from 'airtable';
import React from 'react';
import './flashcards.css';

const BASE_NAME = 'Vocab list';
const VIEW_NAME = 'Main list';

interface RecordFields {
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

type RecordMap = {[id: string]: RecordFields};

interface FlashcardAppProps {
  base: Airtable.Base;
}

interface FlashcardAppState {
  records?: RecordMap,
  currentTestSet?: string[],
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

  render() {
    return (
      <div className="main">
       hello
      </div>
    )
  }
}
