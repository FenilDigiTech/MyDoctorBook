import React, { useState } from 'react';
import API from '../services/api';
import { Mic, MicOff, Save, Copy, Check, Sparkles } from 'lucide-react';

export default function VoiceNoteRecorder({ onSaveNote }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en-US'); // 'en-US', 'hi-IN', 'gu-IN'
  const [copied, setCopied] = useState(false);

  let recognition = null;

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome or Edge.');
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;
    try {
      const res = await API.post('/ai/voice-to-text', { transcript, language });
      if (onSaveNote) {
        onSaveNote(res.data.formattedNote);
      }
      setTranscript('');
      alert('Voice Note formatted and saved successfully into patient history!');
    } catch (err) {
      console.error('Error saving voice note:', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-3xl border border-purple-500/30 text-white space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-extrabold">AI Doctor Voice Notes Transcriber</h3>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <label className="font-bold text-slate-300">Dictation Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2.5 py-1 bg-slate-800 border border-purple-500/40 rounded-xl text-white font-bold"
          >
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi (हिंदी)</option>
            <option value="gu-IN">Gujarati (ગુજરાતી)</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Click Start Dictation and speak prescription notes, symptoms, or instructions..."
          className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />

        {isRecording && (
          <span className="absolute top-3 right-3 text-red-400 font-extrabold text-[10px] uppercase animate-pulse flex items-center gap-1 bg-red-950 px-2 py-0.5 rounded-full border border-red-800">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Recording Voice...
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-2 transition-all shadow-md ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{isRecording ? 'Stop Recording' : 'Start Dictation (Voice-to-Text)'}</span>
        </button>

        <div className="flex items-center space-x-2">
          {transcript && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            type="button"
            disabled={!transcript.trim()}
            onClick={handleSave}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save to Patient History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
