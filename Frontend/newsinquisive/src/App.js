import { useState } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [article, setArticle] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const analyzeArticle = async () => {
    const res = await axios.post("http://localhost:8000/analyze", {
      url: url
    });
    setArticle(res.data);
  };

  const askQuestion = async () => {
    const res = await axios.post("http://localhost:8000/question", {
      question: question,
      context: article.text
    });
    setAnswer(res.data.answer);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>NewsInquisive</h1>

      <input
        placeholder="Enter article URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={analyzeArticle}>Analyze</button>

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
          <button onClick={askQuestion}>Get Answer</button>

          {answer && <h4>Answer: {answer}</h4>}
        </>
      )}
    </div>
  );
}

export default App;
