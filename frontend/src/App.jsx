import { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const BAR_HEIGHTS = [8,14,6,20,11,17,7,15,10,18,5,13,19,9,16,6,12,20,8,14,17,10];
const TRACE_BARS = 8;
const IDLE_TRACE = Array(TRACE_BARS).fill(6);

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioURL, setAudioURL] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);

  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
const [recordedBlob, setRecordedBlob] = useState(null);
const [mediaRecorder, setMediaRecorder] = useState(null);

const [traceHeights, setTraceHeights] = useState(IDLE_TRACE);
const audioCtxRef = useRef(null);
const analyserRef = useRef(null);
const rafRef = useRef(null);

const [dragActive, setDragActive] = useState(false);
const [history, setHistory] = useState([]);

const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setRecordedBlob(null);      // <-- Add this
    setAudioFile(file);

    setAudioURL(URL.createObjectURL(file));

    setResult(null);
    setError("");
};

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setRecordedBlob(null);      // <-- Add this
    setAudioFile(file);
    setAudioURL(URL.createObjectURL(file));
    setResult(null);
    setError("");
};

  const startRecording = async () => {

    setAudioFile(null);
    setRecordedBlob(null);
    setResult(null);
    setError("");


    const stream = await navigator.mediaDevices.getUserMedia({

        audio: true

    });

    const recorder = new MediaRecorder(stream);

    const chunks = [];

    recorder.ondataavailable = (e) => {

        chunks.push(e.data);

    };

    recorder.onstop = () => {

const blob = new Blob(chunks, {
    type: "audio/webm"
});

const file = new File(
    [blob],
    "recording.webm",
    {
        type: "audio/webm"
    }
);

setRecordedBlob(file);

setAudioURL(URL.createObjectURL(file));

    };

    recorder.start();

    setMediaRecorder(recorder);

    setRecording(true);

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 32;
    source.connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const step = Math.max(1, Math.floor(dataArray.length / TRACE_BARS));

    const updateTrace = () => {
      analyser.getByteFrequencyData(dataArray);
      const heights = Array.from({ length: TRACE_BARS }, (_, i) => {
        const v = dataArray[i * step] || 0;
        return Math.max(4, Math.min(16, (v / 255) * 16));
      });
      setTraceHeights(heights);
      rafRef.current = requestAnimationFrame(updateTrace);
    };
    updateTrace();

};
const stopRecording = () => {

    mediaRecorder.stop();

    mediaRecorder.stream.getTracks().forEach(track => track.stop());

    setRecording(false);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close();
    rafRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setTraceHeights(IDLE_TRACE);

};

  const detectAudio = async () => {
if (!audioFile && !recordedBlob) {
    alert("Please upload or record an audio.");
    return;
}
const formData = new FormData();
if (recordedBlob) {

    formData.append(
        "audio",
        recordedBlob
    );

}

else {

    formData.append(

        "audio",

        audioFile

    );

}

    try {
      setLoading(true);

      setError("");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/detect`,
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
        setHistory((prev) => [
          {
            id: Date.now(),
            name: recordedBlob ? recordedBlob.name : audioFile ? audioFile.name : "audio",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            prediction: response.data.prediction,
          },
          ...prev,
        ].slice(0, 6));
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

  const downloadReport = () => {
    if (!result) return;
    const name = recordedBlob ? recordedBlob.name : audioFile ? audioFile.name : "audio";
    const lines = [
      "Deepfake voice detection report",
      "--------------------------------",
      `File: ${name}`,
      `Result: ${result.prediction === "AUTHENTIC" ? "Authentic" : "AI generated"}`,
      `Generated: ${new Date().toLocaleString()}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "detection-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="app">
      <div className="panel">
        <div className="panel-inner">

          <div className="eyebrow-row">
            <span className="eyebrow">
              <span className={`dot ${recording ? "recording" : ""}`}></span>
              Audio forensics
            </span>
            <div className={`live-trace ${recording ? "recording" : ""}`}>
              {traceHeights.map((h, i) => (
                <span key={i} style={recording ? { height: h + "px" } : undefined}></span>
              ))}
            </div>
          </div>

          <h1>Deepfake voice detection</h1>
          <p className="subtitle">
            Detect whether an uploaded or recorded voice clip is authentic or AI generated.
          </p>

          <label
            className={`dropzone ${dragActive ? "drag" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".wav,.mp3,.flac"
              onChange={handleFileChange}
            />
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
            </svg>
            <div className="primary">Drop an audio file, or browse</div>
            <div className="secondary">WAV · MP3 · FLAC</div>
          </label>

          <div className="record-row">
            <span className="record-label">Or record live</span>
            {!recording ? (
              <button className="record-btn" onClick={startRecording}>
                Start recording
              </button>
            ) : (
              <button className="record-btn recording" onClick={stopRecording}>
                Stop recording
              </button>
            )}
          </div>

          {audioURL && (
            <div className="file-row visible">
              <div className="bars">
                {BAR_HEIGHTS.map((h, i) => (
                  <span key={i} style={{ height: h + "px" }}></span>
                ))}
              </div>
              <div className="file-meta">
                <div className="file-name">Selected audio</div>
                <div className="file-sub">Ready to analyze</div>
              </div>
            </div>
          )}

          {audioURL && (
            <audio className="audio-preview" controls src={audioURL}></audio>
          )}

          {loading ? (
            <div className="scan visible">
              <div className="scan-track"><div className="scan-line"></div></div>
              <span className="scan-label">Analyzing audio…</span>
            </div>
          ) : (
            <button className="analyze-btn" onClick={detectAudio}>
              Detect voice
            </button>
          )}

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {result && (
            <div className="result visible">
              <div className={`verdict ${result.prediction === "AUTHENTIC" ? "" : "synthetic"}`}>
                <div>
                  <div className="verdict-label">
                    {result.prediction === "AUTHENTIC" ? "Authentic" : "AI generated"}
                  </div>
                  <div className="verdict-desc">
                    {result.prediction === "AUTHENTIC"
                      ? "No synthetic artifacts detected"
                      : "Spectral artifacts consistent with AI generation"}
                  </div>
                </div>
              </div>
              <button className="report-btn" onClick={downloadReport}>
                Download report
              </button>
            </div>
          )}

          {history.length > 0 && (
            <div className="history">
              <div className="history-head">
                <span className="history-title">Recent checks</span>
                <button className="history-clear" onClick={clearHistory}>
                  Clear
                </button>
              </div>
              {history.map((h) => (
                <div className="history-row" key={h.id}>
                  <span className="history-name">{h.name}</span>
                  <span className="history-time">{h.time}</span>
                  <span
                    className={`history-badge ${h.prediction === "AUTHENTIC" ? "" : "synthetic"}`}
                  >
                    {h.prediction === "AUTHENTIC" ? "Authentic" : "AI generated"}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>

        <div className="footer">
          <span className="footer-title">Deepfake voice detection</span>
          <div className="footer-meta">
            <span>Developed by Anish Sarkar, Debanjali Sen, Soumalya Sinhamahapatra</span>
            <span>B.Tech Information Technology</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;