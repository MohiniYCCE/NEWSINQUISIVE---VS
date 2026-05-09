# NewsInquisive

NewsInquisive is a Flask + React app that extracts a news article from a URL, creates an AI-generated summary, and answers questions using only the extracted article text.


## Windows one-click start

After extracting the ZIP on Windows, double-click `start_windows.bat` from the project root. It opens the backend and frontend in separate Command Prompt windows. The first run installs Python/npm dependencies and can take several minutes.

If you prefer separate windows manually:

1. Double-click `run_backend_windows.bat` and wait until `http://127.0.0.1:8000` is shown.
2. Double-click `run_frontend_windows.bat` and open `http://localhost:3000`.

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
