import { useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

function getErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.message === "Network Error") {
    return "Could not reach the backend server. Make sure the Flask API is running on port 8000.";
  }

  return error.message || "Something went wrong. Please try again.";
}

function App() {
  const [url, setUrl] = useState("");
  const [article, setArticle] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const analyzeArticle = async () => {
    setError("");
    setAnswer("");
    setArticle(null);
    setIsAnalyzing(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/analyze`, {
        url: url
      });
      setArticle(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const askQuestion = async () => {
    if (!article?.text) {
      setError("Analyze an article before asking a question.");
      return;
    }

    setError("");
    setAnswer("");
    setIsAsking(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/question`, {
        question: question,
        context: article.text
      });
      setAnswer(res.data.answer);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>NewsInquisive</h1>

      <input
        placeholder="Enter article URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={analyzeArticle} disabled={isAnalyzing || !url.trim()}>
        {isAnalyzing ? "Analyzing..." : "Analyze"}
      </button>

      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      {article && (
        <>
          <h2>{article.title}</h2>
          <h3>Summary</h3>
          <p>{article.summary}</p>

          <input
            placeholder="Ask a question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button onClick={askQuestion} disabled={isAsking || !question.trim()}>
            {isAsking ? "Getting answer..." : "Get Answer"}
          </button>

          {answer && <h4>Answer: {answer}</h4>}
        </>
      )}
    </div>
  );
}

export default App;
