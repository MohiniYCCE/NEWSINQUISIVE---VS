from flask import Flask, request, jsonify
from flask_cors import CORS
from newspaper import Article
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# Use SMALL models (faster + stable)
summarizer = pipeline("summarization", model="t5-small")
qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.json
        url = data["url"]

        article = Article(url)
        article.download()
        article.parse()

        summary = summarizer(article.text[:1000])[0]["summary_text"]

        return jsonify({
            "title": article.title,
            "text": article.text,
            "summary": summary
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/question", methods=["POST"])
def question():
    data = request.json

    result = qa_pipeline(
        question=data["question"],
        context=data["context"]
    )

    return jsonify({"answer": result["answer"]})

if __name__ == "__main__":
    app.run(port=8000, debug=True)
