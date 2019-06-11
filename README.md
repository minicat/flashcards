# flashcards
Simple flashcard web app for me to test Chinese vocab. Backed by Airtable!

I have an Airtable base that stores each of my vocab words as a record, and this is a React app that talks to it to get all of the records, and also writes back the results for tracking.

## Screenshots
![Main page](https://raw.githubusercontent.com/minicat/flashcards/screenshots/screenshots/main_page.png)
![During the quiz](https://raw.githubusercontent.com/minicat/flashcards/screenshots/screenshots/quiz.png)
![Quiz results](https://raw.githubusercontent.com/minicat/flashcards/screenshots/screenshots/results.png)

## TODOs
- Quiz by category
- Option to test both ways on each item during quiz
- Track practice streaks across days
- Display/track directional (English -> Chinese, Chinese -> English) correctness separately
- ✨ productionise ✨ - backend that also handles the Airtable calls, so the API token isn't leaked (currently the app just calls it from the frontend)
