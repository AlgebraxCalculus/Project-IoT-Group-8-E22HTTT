import { useEffect, useRef, useState } from 'react';
import { createMqttClient } from '../services/mqtt.js';
import api, { FeedAPI } from '../services/api.js';

const DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'petfeeder-feed-node-01';

const ManualFeed = () => {
  const [mqttStatus, setMqttStatus] = useState('offline');
  const [ackMessage, setAckMessage] = useState('');
  const [micStatus, setMicStatus] = useState('idle');
  const [loading, setLoading] = useState(false);
  const clientRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
    // Nếu đang ghi âm thì dừng lại và gửi audio đi xử lý
    if (micStatus === 'listening' && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setMicStatus('processing');
      setAckMessage('⏳ Đang xử lý âm thanh...');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAckMessage('Trình duyệt không hỗ trợ ghi âm. Vui lòng dùng Chrome hoặc Edge.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await sendAudioToSpeechModule(audioBlob);
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setMicStatus('listening');
      setAckMessage('🎙️ Đang ghi âm... hãy nói lệnh, ví dụ: "cho ăn 200 gram".');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setAckMessage('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
      setMicStatus('idle');
    }
  };

  const sendAudioToSpeechModule = async (audioBlob) => {
    try {
      setLoading(true);
      setAckMessage('📤 Đang gửi audio tới dịch vụ nhận diện giọng nói...');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('languageCode', 'vi-VN');

      const response = await api.post('/api/speech-to-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || 'Speech-to-Text service error');
      }

      const transcript = data.text || data.transcription;

      if (!transcript) {
        setAckMessage('Không nhận diện được câu lệnh. Vui lòng thử lại.');
        setMicStatus('idle');
        return;
      }

      // Kiểm tra nhanh xem transcript có vẻ là lệnh cho ăn không
      const lower = transcript.toLowerCase();
      const normalized = lower
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Trường hợp đặc biệt: câu rất ngắn "chao an"/"chao anh" => coi là lệnh cho ăn
      const isShortChaoAn = /^chao an[h\.\!\?]*$/.test(normalized);

      const isFeedLike =
        isShortChaoAn ||
        // các cụm "cho ăn" / "cho an"
        lower.includes('cho ăn') ||
        normalized.includes('cho an') ||
        // "cho 50 gram", "cho 100g", có số + đơn vị
        /cho\s+\d+/.test(normalized) ||
        lower.includes('gram') ||
        /\d+\s*(g|gr|gram|kg)\b/.test(normalized) ||
        // tiếng Anh
        lower.includes('feed');

      if (!isFeedLike) {
        setAckMessage(`Đã nghe: "${transcript}". Đây không giống lệnh cho ăn, nên sẽ không gửi tới máy cho ăn.`);
        setMicStatus('idle');
        return;
      }

      setAckMessage(`Đã nghe: "${transcript}". Đang gửi lệnh cho ăn...`);

      try {
        const { data: feedData } = await FeedAPI.voice(transcript);
        setAckMessage(feedData.message || `Đã thực hiện lệnh: "${transcript}"`);
      } catch (err) {
        console.error('Voice feed error:', err);
        setAckMessage(err.response?.data?.message || 'Gửi lệnh cho ăn từ giọng nói thất bại.');
      }
    } catch (error) {
      console.error('Speech module error:', error);
      setAckMessage(`Lỗi dịch vụ nhận diện giọng nói: ${error.message}`);
    } finally {
      setMicStatus('idle');
      setLoading(false);
    }
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


