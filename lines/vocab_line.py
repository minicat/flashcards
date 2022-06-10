import requests
import sys

# outputs formatted vocab words (sans filtered) to stdout
# pipenv install
# pipenv run python vocab_line.py http://list.endpoint/

FILTERED_RECORD_IDS = {'recdm5NrGhiPnvtTw', 'recvxjbdshhsePNp3'}

vocab_list = requests.get(sys.argv[1]).json()

for record in vocab_list:
    if record['id'] not in FILTERED_RECORD_IDS:
        english = record['fields']['English']
        pinyin = record['fields']['Pinyin']
        chinese = record['fields']['Chinese']
        formatted_vocab = u'{} / {} / {} '.format(pinyin, chinese, english)
        # chinese chars are double width
        n_dashes = 60 - len(formatted_vocab) - len(chinese)
        print('{}{}'.format(formatted_vocab, '-'*n_dashes))
