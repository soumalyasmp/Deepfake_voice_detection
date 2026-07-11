import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioURL, setAudioURL] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);

  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setAudioFile(file);

    setAudioURL(URL.createObjectURL(file));

    setResult(null);

    setError("");
  };

  const detectAudio = async () => {
    if (!audioFile) {
      alert("Please select an audio file.");
      return;
    }

    const formData = new FormData();

    formData.append("audio", audioFile);

    try {
      setLoading(true);

      setError("");

      const response = await axios.post(
        "http://localhost:5000/detect",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(response.data);

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError("Detection failed.");
      }
    } catch (err) {
      console.log(err);

      if (err.response) {
        setError(err.response.data.message);
      } else {
        setError("Backend is not running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      <div className="card">

        <h1>🎤 Deepfake Voice Detection</h1>

        <p>
          Detect whether an uploaded voice recording is
          authentic or not
        </p>

        <input
          type="file"
          accept=".wav,.mp3,.flac"
          onChange={handleFileChange}
        />

        {audioURL && (
          <div className="audio-section">

            <h3>Selected Audio</h3>

            <audio controls src={audioURL}></audio>

          </div>
        )}

        <button
          onClick={detectAudio}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Detect Voice"}
        </button>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {result && (

          <div className="result-container">

            <h2>Detection Result</h2>

            <div
              className={
                result.prediction === "AUTHENTIC"
                  ? "prediction authentic"
                  : "prediction fake"
              }
            >
              {result.prediction === "AUTHENTIC"
                ? "✅ AUTHENTIC"
                : "🚨 AI GENERATED"}
            </div>



            

          </div>

        )}

      </div>

    </div>
  );
}

export default App;