import express from "express";
import {Application, Request, Response} from "express";

async function main(): Promise<void> {
    const app: Application = express();
    const port: number = +(process.env.PORT || 8002);

    app.get('/api/hello', async (req: Request, res: Response) => {
        res.send('hello world!');
    })

    await app.listen(port);
    console.log(`listening on port ${port}!`);
}

main();
