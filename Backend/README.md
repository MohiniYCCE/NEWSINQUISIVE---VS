# NewsInquisive Backend

The Flask backend extracts a news article from a URL, creates an AI-generated summary, and answers questions using only the extracted article text.

## Windows first-run note

On the first **Analyze** request, Hugging Face downloads the summarization and Q&A models. Flask's debug reloader can see those downloaded package/cache files as "changed" files and restart the backend while React is still waiting for `/analyze`. That produces errors such as `ECONNRESET`, `Proxy error: Could not proxy request /analyze`, or a frontend `500` message.

The backend is configured to run without Flask's reloader by default, so `python server.py` keeps a single stable process while models download. The default summarization model is `t5-small` to avoid multi-GB first-run downloads on typical local machines.

## Run the backend

```bash
cd Backend
pip install -r requirements.txt
python server.py
```

The API runs on `http://127.0.0.1:8000` by default. To verify it is alive, open `http://127.0.0.1:8000/health`.

First model download can take several minutes depending on your network. Keep the backend terminal open until the request finishes. If a Transformers model cannot load on your machine, the backend now falls back to extractive summarization/Q&A instead of returning a 503 for `/analyze`.

Optional model overrides:

```bash
SUMMARY_MODEL=t5-small QA_MODEL=deepset/roberta-base-squad2 python server.py
```

If you intentionally want Flask debug mode, use `FLASK_DEBUG=1 python server.py`; the code still disables the reloader to avoid Windows model-download restarts.
