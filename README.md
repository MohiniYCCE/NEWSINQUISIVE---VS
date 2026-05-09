# NewsInquisive

NewsInquisive is a Flask + React app that extracts a news article from a URL, creates an AI-generated summary, and answers questions using only the extracted article text.

## Run locally

### Backend

```bash
cd Backend
pip install -r requirements.txt
python server.py
```

Then verify `http://127.0.0.1:8000/health`.

### Frontend

```bash
cd Frontend/newsinquisive
npm install
npm start
```

The React development server proxies API requests to the Flask backend. Use a direct news article URL rather than a news homepage for best extraction, summary, and answer quality.

See [`Backend/README.md`](Backend/README.md) for Windows first-run model-download troubleshooting.
