import Airtable from 'airtable';
import bodyParser from "body-parser";
import express from "express";
import {Application, Request, Response} from "express";

// Airtable base, table and view that stores flashcard info
const BASE_ID = 'appz6ksxJMtsLEs7R';
const TABLE_NAME = 'Vocab list';
// const TABLE_NAME = 'Vocab list (Test data)';
const VIEW_NAME = 'Main list';

// TODO: use real spaced repetition
function getDaysUntil(prevDaysUntil: number, isCorrect: boolean) {
    if (!isCorrect || prevDaysUntil === 0) {
        return 1;
    }
    if (prevDaysUntil >= 64) {
        return 64;
    }
    return prevDaysUntil * 2;
}

async function main(): Promise<void> {
    const app: Application = express();
    const port: number = +(process.env.PORT || 8002);
    const base: Airtable.Base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(BASE_ID);

    app.use(bodyParser.urlencoded());
    app.use(bodyParser.json());


    if (process.env.NODE_ENV === 'production') {
        app.use(express.static('../client/build'));
    }

    app.get('/api/hello', async (req: Request, res: Response) => {
        res.send('hello world!');
    })

    app.get('/api/list', async (req: Request, res: Response) => {
       let rawRecords = await base(TABLE_NAME).select({
            view: VIEW_NAME
        }).all();

       res.json(rawRecords.map(rawRecord => ({
           id: rawRecord.id,
           fields: rawRecord.fields,
       })));
    })

    app.post('/api/log_attempt', async (req: Request, res: Response) => {
        // return value of find is incorrectly typed as an array of records: workaround
        const record = await base(TABLE_NAME).find(req.body.id) as any;
        const currDate = new Date();
        const currDateFormatted = `${currDate.getFullYear()}-${currDate.getMonth() + 1}-${currDate.getDate()}`;

        const daysUntil = getDaysUntil(record.fields["Days until next test"] || 0, req.body.isCorrect);

        await base(TABLE_NAME).update(
            req.body.id,
            {
                "Correct": (record.fields["Correct"] || 0) + (req.body.isCorrect ? 1 : 0),
                "Attempts": (record.fields["Attempts"] || 0) + 1,
                "Last Tested": currDateFormatted,
                ...(req.body.isCorrect ? {} : {"Last Incorrect": currDateFormatted}),
                "Days until next test": daysUntil,
            }
        ).catch(
            (reason) => console.log('update rejected: ' + reason)
        )
        res.sendStatus(200);
    })

    await app.listen(port);
    console.log(`listening on port ${port}!`);
}

main();
