# flashcards
Simple flashcard web app for me to test Chinese vocab. Backed by Airtable!

I have an Airtable base that stores each of my vocab words as a record. `/client` contains the frontend React app. `/src` contains an Express server that talks to Airtable to query and update records (and serves the client).

## Screenshots
![Main page](https://raw.githubusercontent.com/minicat/flashcards/screenshots/screenshots/main_page.png)
![During the quiz](https://raw.githubusercontent.com/minicat/flashcards/screenshots/screenshots/quiz.png)
![Quiz results](https://raw.githubusercontent.com/minicat/flashcards/screenshots/screenshots/results.png)

## TODOs
- Quiz by category
- Option to choose test direction (English -> Chinese, Chinese -> English, both ways)
- Track practice streaks across days
- Display/track directional (English -> Chinese, Chinese -> English) correctness separately
- Toggle to enable/disable recording stats
- Option to set quiz size
