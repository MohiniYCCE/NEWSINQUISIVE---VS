# NewsInquisive

NewsInquisive is a Flask + React app that extracts a news article from a URL, creates an AI-generated summary, and answers questions using only the extracted article text.

## Backend

```bash
cd Backend
pip install -r requirements.txt
python server.py
```

The API runs on `http://127.0.0.1:8000` by default.

Optional model overrides:

```bash
SUMMARY_MODEL=facebook/bart-large-cnn QA_MODEL=deepset/roberta-base-squad2 python server.py
```

## Frontend

```bash
cd Frontend/newsinquisive
npm install
npm start
```

The React development server proxies API requests to the Flask backend.
