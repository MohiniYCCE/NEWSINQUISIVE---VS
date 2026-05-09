import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

const fallbackSites = [
  { name: "Times of India", url: "https://timesofindia.indiatimes.com/" },
  { name: "News18", url: "https://www.news18.com/" },
  { name: "Economic Times", url: "https://economictimes.indiatimes.com/" },
  { name: "India.com", url: "https://www.india.com/" },
  { name: "Republic World", url: "https://www.republicworld.com/" }
];

function getErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.status === 500) {
    return "The backend returned an internal error. If this is the first Analyze click, wait for model downloads to finish, confirm the Flask server is still running, and try a direct article URL.";
  }

  if (error.response?.status === 503) {
    return "The AI model is still loading or failed to download. Keep the backend terminal open, wait a few minutes on first run, then retry.";
  }

  if (error.message === "Network Error") {
    return "Could not reach the backend server. Make sure the Flask API is running on port 8000.";
  }

  return error.message || "Something went wrong. Please try again.";
}

function speakText(text) {
  if (!window.speechSynthesis || !text) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function App() {
  const [url, setUrl] = useState("");
  const [article, setArticle] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [newsSites, setNewsSites] = useState(fallbackSites);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/news-sites`)
      .then((res) => setNewsSites(res.data.sites || fallbackSites))
      .catch(() => setNewsSites(fallbackSites));
  }, []);

  const analyzeArticle = async (event) => {
    event?.preventDefault();
    setError("");
    setAnswer(null);
    setArticle(null);
    setIsAnalyzing(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/analyze`, { url });
      setArticle(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const askQuestion = async (event) => {
    event?.preventDefault();
    if (!article?.text) {
      setError("Analyze an article before asking a question.");
      return;
    }

    setError("");
    setAnswer(null);
    setIsAsking(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/question`, {
        question,
        context: article.text
      });
      setAnswer(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">AI news reader</span>
          <h1>NewsInquisive</h1>
          <p>
            Paste a full article link to extract the story, create a cleaner factual summary,
            and ask questions that are answered from the article text. First AI use can take
            a few minutes while models download.
          </p>
        </div>
        <div className="hero-stats" aria-label="Application features">
          <div>
            <strong>3</strong>
            <span>Core tools</span>
          </div>
          <div>
            <strong>AI</strong>
            <span>Summary + Q&A</span>
          </div>
        </div>
      </section>

      <section className="layout-grid">
        <aside className="sidebar-card">
          <h2>Popular news websites</h2>
          <p>Use these as starting points, then paste a full article URL.</p>
          <div className="site-list">
            {newsSites.map((site) => (
              <button
                className="site-pill"
                key={site.url}
                type="button"
                onClick={() => setUrl(site.url)}
              >
                <span>{site.name}</span>
                <small>{site.url.replace(/^https?:\/\//, "")}</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="content-stack">
          <form className="search-card" onSubmit={analyzeArticle}>
            <label htmlFor="article-url">Article URL</label>
            <div className="input-row">
              <input
                id="article-url"
                placeholder="Enter article URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button className="primary-button" type="submit" disabled={isAnalyzing || !url.trim()}>
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            <p className="hint">Tip: Use a direct article page, not a news homepage. Keep the backend terminal open during the first model download.</p>
          </form>

          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}

          {isAnalyzing && (
            <section className="result-card skeleton-card" aria-live="polite">
              <div className="spinner" />
              <div>
                <h2>Reading the article...</h2>
                <p>Extracting text and generating a summary. The first run may take longer while AI models load.</p>
              </div>
            </section>
          )}

          {article && (
            <section className="result-card">
              <div className="article-header">
                <span className="tag">Analyzed article</span>
                <h2>{article.title}</h2>
                <div className="metadata">
                  <span>{article.wordCount} words</span>
                  <a href={article.sourceUrl} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                </div>
              </div>

              <div className="summary-box">
                <div className="section-title-row">
                  <h3>Summary</h3>
                  <button className="ghost-button" type="button" onClick={() => speakText(article.summary)}>
                    Speak summary
                  </button>
                </div>
                <p>{article.summary}</p>
              </div>

              <details className="article-details">
                <summary>Show extracted article text</summary>
                <p>{article.text}</p>
              </details>

              <form className="qa-card" onSubmit={askQuestion}>
                <label htmlFor="question">Ask a question about this article</label>
                <div className="input-row">
                  <input
                    id="question"
                    placeholder="Example: Which party is discussed in the article?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <button className="primary-button" type="submit" disabled={isAsking || !question.trim()}>
                    {isAsking ? "Getting answer..." : "Get Answer"}
                  </button>
                </div>
              </form>

              {answer && (
                <div className="answer-card">
                  <div className="section-title-row">
                    <h3>Answer</h3>
                    <button className="ghost-button" type="button" onClick={() => speakText(answer.answer)}>
                      Speak answer
                    </button>
                  </div>
                  <p className="answer-text">{answer.answer}</p>
                  <p className="confidence">Confidence: {Math.round((answer.confidence || 0) * 100)}%</p>
                  {answer.source && (
                    <blockquote>
                      <strong>Evidence:</strong> {answer.source}
                    </blockquote>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
