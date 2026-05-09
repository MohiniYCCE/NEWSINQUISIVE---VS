import os
import re
from functools import lru_cache
from urllib.parse import urlparse

from flask import Flask, jsonify, request
from flask_cors import CORS
from newspaper import Article, Config
from transformers import pipeline

app = Flask(__name__)
CORS(app)

SUMMARY_MODEL = os.getenv("SUMMARY_MODEL", "facebook/bart-large-cnn")
QA_MODEL = os.getenv("QA_MODEL", "deepset/roberta-base-squad2")
MIN_ANSWER_SCORE = float(os.getenv("MIN_ANSWER_SCORE", "0.08"))
MAX_SUMMARY_INPUT_CHARS = int(os.getenv("MAX_SUMMARY_INPUT_CHARS", "3500"))
MAX_QA_CONTEXT_CHARS = int(os.getenv("MAX_QA_CONTEXT_CHARS", "2600"))

NEWS_SITES = [
    {"name": "Times of India", "url": "https://timesofindia.indiatimes.com/"},
    {"name": "News18", "url": "https://www.news18.com/"},
    {"name": "Economic Times", "url": "https://economictimes.indiatimes.com/"},
    {"name": "India.com", "url": "https://www.india.com/"},
    {"name": "Republic World", "url": "https://www.republicworld.com/"},
]


def clean_text(text):
    """Normalize article text while preserving readable sentence spacing."""
    text = re.sub(r"\s+", " ", text or "").strip()
    return text


def validate_url(url):
    parsed = urlparse((url or "").strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Enter a valid article URL beginning with http:// or https://.")
    return parsed.geturl()


def sentence_split(text):
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", text) if part.strip()]


def chunk_text(text, max_chars):
    chunks = []
    current = []
    current_len = 0

    for sentence in sentence_split(text):
        sentence_len = len(sentence) + 1
        if current and current_len + sentence_len > max_chars:
            chunks.append(" ".join(current))
            current = []
            current_len = 0
        current.append(sentence)
        current_len += sentence_len

    if current:
        chunks.append(" ".join(current))

    return chunks or ([text[:max_chars]] if text else [])


def keyword_overlap_score(question, chunk):
    stop_words = {
        "the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "on",
        "for", "and", "or", "about", "which", "what", "who", "when", "where", "why",
        "how", "does", "do", "did", "this", "that", "article", "news",
    }
    question_terms = {
        word for word in re.findall(r"[a-zA-Z0-9]+", question.lower()) if word not in stop_words
    }
    chunk_terms = set(re.findall(r"[a-zA-Z0-9]+", chunk.lower()))
    return len(question_terms & chunk_terms)


@lru_cache(maxsize=1)
def get_summarizer():
    return pipeline("summarization", model=SUMMARY_MODEL)


@lru_cache(maxsize=1)
def get_question_answerer():
    return pipeline("question-answering", model=QA_MODEL)


def retrieve_article(url):
    config = Config()
    config.browser_user_agent = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
    config.request_timeout = 15

    article = Article(url, config=config)
    article.download()
    article.parse()

    title = clean_text(article.title)
    text = clean_text(article.text)

    if not text or len(text) < 200:
        raise ValueError("Could not extract enough article text from this URL. Try another full article link.")

    return title, text


def generate_summary(article_text):
    summarizer = get_summarizer()
    source_chunks = chunk_text(article_text, MAX_SUMMARY_INPUT_CHARS)
    chunk_summaries = []

    for chunk in source_chunks[:4]:
        max_len = 170 if len(source_chunks) == 1 else 120
        min_len = 55 if len(chunk) > 900 else 25
        result = summarizer(
            chunk,
            max_length=max_len,
            min_length=min_len,
            do_sample=False,
            truncation=True,
        )[0]["summary_text"]
        chunk_summaries.append(clean_text(result))

    summary = " ".join(chunk_summaries)
    if len(chunk_summaries) > 1:
        summary = summarizer(
            summary,
            max_length=180,
            min_length=70,
            do_sample=False,
            truncation=True,
        )[0]["summary_text"]

    return clean_text(summary)


def best_source_sentence(answer, context):
    answer_lower = clean_text(answer).lower()
    for sentence in sentence_split(context):
        if answer_lower and answer_lower in sentence.lower():
            return sentence
    return ""


def answer_question(question, context):
    qa_pipeline = get_question_answerer()
    candidates = chunk_text(context, MAX_QA_CONTEXT_CHARS)
    ranked_candidates = sorted(
        candidates,
        key=lambda chunk: keyword_overlap_score(question, chunk),
        reverse=True,
    )[:5]

    best_result = None
    best_context = ""
    for chunk in ranked_candidates:
        result = qa_pipeline(question=question, context=chunk)
        if best_result is None or result.get("score", 0) > best_result.get("score", 0):
            best_result = result
            best_context = chunk

    if not best_result or best_result.get("score", 0) < MIN_ANSWER_SCORE or not clean_text(best_result.get("answer")):
        return {
            "answer": "I could not find a reliable answer in the article text.",
            "confidence": best_result.get("score", 0) if best_result else 0,
            "source": "",
        }

    answer = clean_text(best_result["answer"])
    return {
        "answer": answer,
        "confidence": best_result.get("score", 0),
        "source": best_source_sentence(answer, best_context),
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "summary_model": SUMMARY_MODEL, "qa_model": QA_MODEL})


@app.route("/news-sites", methods=["GET"])
def news_sites():
    return jsonify({"sites": NEWS_SITES})


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json(silent=True) or {}
        url = validate_url(data.get("url", ""))
        article_title, article_text = retrieve_article(url)
        summary = generate_summary(article_text)

        return jsonify({
            "title": article_title,
            "text": article_text,
            "summary": summary,
            "sourceUrl": url,
            "wordCount": len(article_text.split()),
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/question", methods=["POST"])
def question():
    try:
        data = request.get_json(silent=True) or {}
        question_text = clean_text(data.get("question", ""))
        context = clean_text(data.get("context", ""))

        if not question_text:
            raise ValueError("Please enter a question.")
        if not context:
            raise ValueError("Analyze an article before asking a question.")

        return jsonify(answer_question(question_text, context))

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=8000, debug=True)
