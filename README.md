# NewsInquisive

NewsInquisive is a Flask + React app that extracts a news article from a URL, creates an AI-generated summary, and answers questions using only the extracted article text.

## Why the app could reset locally on Windows

On the first **Analyze** request, Hugging Face downloads the summarization and Q&A models. Flask's debug reloader can see those downloaded package/cache files as "changed" files and restart the backend while React is still waiting for `/analyze`. That produces errors such as `ECONNRESET`, `Proxy error: Could not proxy request /analyze`, or a frontend `500` message.

The backend is configured to run without Flask's reloader by default, so `python server.py` should keep a single stable process while models download.

## Backend

```bash
cd Backend
pip install -r requirements.txt
python server.py
```

The API runs on `http://127.0.0.1:8000` by default. To verify it is alive, open `http://127.0.0.1:8000/health`.

First model download can take several minutes depending on your network. Keep the backend terminal open until the request finishes.

Optional model overrides:

```bash
SUMMARY_MODEL=sshleifer/distilbart-cnn-12-6 QA_MODEL=deepset/roberta-base-squad2 python server.py
```

If you intentionally want Flask debug mode, use `FLASK_DEBUG=1 python server.py`; the code still disables the reloader to avoid Windows model-download restarts.

## Frontend

```bash
cd Frontend/newsinquisive
npm install
npm start
```

The React development server proxies API requests to the Flask backend. Use a direct news article URL rather than a news homepage for best extraction, summary, and answer quality.
