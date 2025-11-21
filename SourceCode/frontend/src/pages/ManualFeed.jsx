import { useEffect, useRef, useState } from 'react';
import { createMqttClient } from '../services/mqtt.js';
import { FeedAPI } from '../services/api.js';

const DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'petfeeder-feed-node-01';

const ManualFeed = () => {
  const [mqttStatus, setMqttStatus] = useState('offline');
  const [ackMessage, setAckMessage] = useState('');
  const [micStatus, setMicStatus] = useState('idle');
  const [loading, setLoading] = useState(false);
  const clientRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechDetectedRef = useRef(false);

  useEffect(() => {
    const client = createMqttClient({
      deviceId: DEVICE_ID,
      onAck: (payload) => setAckMessage(payload.message || JSON.stringify(payload)),
      onStatusChange: (status) => setMqttStatus(status),
    });
    clientRef.current = client;
    return () => client?.end(true);
  }, []);

  const handleFeedNow = async () => {
    setLoading(true);
    setAckMessage('Sending feed command...');
    try {
      const { data } = await FeedAPI.manual();
      setAckMessage(data.message || 'Feed command sent successfully!');
    } catch (err) {
      setAckMessage(err.response?.data?.message || 'Failed to send feed command');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceFeed = async () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setAckMessage('Speech recognition not supported in this browser.');
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setMicStatus('idle');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setMicStatus('listening');
    setAckMessage('Listening... say "feed now"');
    speechDetectedRef.current = false;
    recognition.start();

    recognition.onresult = async (event) => {
      speechDetectedRef.current = true;
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (transcript.includes('feed') || transcript.includes('start')) {
        setLoading(true);
        setAckMessage(`Voice command accepted: "${transcript}". Sending...`);
        try {
          const { data } = await FeedAPI.voice(transcript);
          setAckMessage(data.message || `Voice command executed: "${transcript}"`);
        } catch (err) {
          setAckMessage(err.response?.data?.message || 'Failed to execute voice command');
        } finally {
          setLoading(false);
        }
      } else {
        setAckMessage(`Heard "${transcript}". Say "feed now" to dispense.`);
      }
      recognition.stop();
    };

    recognition.onerror = (event) => {
      setAckMessage(`Mic error: ${event.error}`);
      setMicStatus('idle');
      speechDetectedRef.current = false;
    };

    recognition.onend = () => {
      setMicStatus('idle');
      if (!speechDetectedRef.current) {
        setAckMessage('Did not catch any speech. Please try again closer to the mic.');
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Feed Now</h2>
          <p>Instant feeding or via voice command</p>
        </div>
        <p className="badge">MQTT: {mqttStatus}</p>
      </div>
      <section className="grid grid--2">
        <div className="card">
          <h3>Manual Feed</h3>
          <p>Dispense a single portion immediately.</p>
          <button className="btn btn--primary btn--lg" type="button" onClick={handleFeedNow} disabled={loading}>
            {loading ? 'Sending...' : 'Feed Now'}
          </button>
        </div>
        <div className="card">
          <h3>Feed by Voice</h3>
          <p>Use your microphone and say “feed now”.</p>
          <button
            className={`voice-button ${micStatus === 'listening' ? 'voice-button--listening' : ''}`}
            type="button"
            onClick={handleVoiceFeed}
          >
            <span className="voice-button__dot" aria-hidden />
            <span className="voice-button__label">
              {micStatus === 'listening' ? 'Listening…' : 'Hold to Speak'}
            </span>
          </button>
          <small>Browser will ask for microphone permission.</small>
        </div>
      </section>
      {ackMessage && <p className="alert alert--info">{ackMessage}</p>}
    </div>
  );
};

export default ManualFeed;


