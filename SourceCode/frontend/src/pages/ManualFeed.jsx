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
    // Dừng listening nếu đang hoạt động
    if (micStatus === 'listening' && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    // Kiểm tra xem trình duyệt có hỗ trợ Web Speech API không
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setAckMessage('Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome hoặc Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setMicStatus('listening');
        setAckMessage('🎙️ Đang lắng nghe... Hãy nói lệnh, ví dụ: "cho ăn 200 gram"');
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setMicStatus('processing');
        setAckMessage(`Đã nghe: "${transcript}". Đang gửi lệnh...`);

        try {
          setLoading(true);
          const { data: feedData } = await FeedAPI.voice(transcript);
          setAckMessage(feedData.message || `Đã thực hiện lệnh: "${transcript}"`);
        } catch (err) {
          console.error('Voice feed error:', err);
          const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Gửi lệnh thất bại';
          setAckMessage(`❌ ${errorMsg}`);
        } finally {
          setLoading(false);
          setMicStatus('idle');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Lỗi nhận diện giọng nói';
        
        if (event.error === 'no-speech') {
          errorMessage = 'Không nghe thấy giọng nói. Vui lòng thử lại.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'Không thể truy cập microphone. Vui lòng kiểm tra quyền.';
        } else if (event.error === 'not-allowed') {
          errorMessage = 'Quyền truy cập microphone bị từ chối.';
        }
        
        setAckMessage(errorMessage);
        setMicStatus('idle');
      };

      recognition.onend = () => {
        if (micStatus === 'listening') {
          setMicStatus('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setAckMessage('Không thể khởi động nhận diện giọng nói.');
      setMicStatus('idle');
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
          <p>Nói lệnh như "cho ăn 200 gram"</p>
          <button
            className={`voice-button ${micStatus === 'listening' ? 'voice-button--listening' : ''}`}
            type="button"
            onClick={handleVoiceFeed}
            disabled={loading}
          >
            <span className="voice-button__dot" aria-hidden />
            <span className="voice-button__label">
              {micStatus === 'listening' ? 'Đang nghe...' : micStatus === 'processing' ? 'Đang xử lý...' : 'Nhấn để nói'}
            </span>
          </button>
          <small>Trình duyệt sẽ xin quyền sử dụng microphone.</small>
        </div>
      </section>
      {ackMessage && <p className="alert alert--info">{ackMessage}</p>}
    </div>
  );
};

export default ManualFeed;


