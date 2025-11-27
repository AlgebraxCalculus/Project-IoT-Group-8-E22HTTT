import { useEffect, useRef, useState } from 'react';
import { createMqttClient } from '../services/mqtt.js';
import { FeedAPI } from '../services/api.js';

const DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'petfeeder-feed-node-01';

const ManualFeed = () => {
  const [mqttStatus, setMqttStatus] = useState('offline');
  const [ackMessage, setAckMessage] = useState('');
  const [micStatus, setMicStatus] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('vi-VN'); // 'vi-VN' or 'en-US'
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
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setMicStatus('listening');
        if (language === 'vi-VN') {
          setAckMessage('🎙️ Đang lắng nghe... Nói "cho ăn" (mặc định 10g) hoặc "cho ăn 200 gram"');
        } else {
          setAckMessage('🎙️ Listening... Say "feed" (default 10g) or "feed 200 grams"');
        }
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript.trim();
        setMicStatus('processing');
        setAckMessage(`Đã nghe: "${transcript}". Đang gửi lệnh...`);

        // Validate trước khi gửi (chỉ cần trigger phrase, số lượng là optional)
        const lowerText = transcript.toLowerCase();
        // Check for Vietnamese trigger
        const hasViTrigger = lowerText.includes('cho ăn') || lowerText.includes('cho an');
        // Check for English trigger
        const hasEnTrigger = lowerText.includes('feed') || lowerText.includes('give food') || lowerText.includes('dispense');
        const hasTrigger = hasViTrigger || hasEnTrigger;

        if (!hasTrigger) {
          if (language === 'vi-VN') {
            setAckMessage(`⚠️ Đã nghe: "${transcript}". Không tìm thấy cụm kích hoạt. Vui lòng nói: "cho ăn" (mặc định 10g) hoặc "cho ăn 200 gram"`);
          } else {
            setAckMessage(`⚠️ Heard: "${transcript}". No trigger phrase found. Please say: "feed" (default 10g) or "feed 200 grams"`);
          }
          setMicStatus('idle');
          return;
        }
        
        // Nếu có số lượng trong transcript, hiển thị thông tin
        const hasAmount = /\d+\s*(gram|gr|g|grams)\b/i.test(transcript);
        if (hasAmount) {
          // Có số lượng cụ thể, sẽ dùng số lượng đó
        } else {
          // Không có số lượng, sẽ dùng mặc định 10g
          if (language === 'vi-VN') {
            setAckMessage(`Đã nghe: "${transcript}". Không có số lượng, sẽ cho ăn 10g mặc định. Đang gửi lệnh...`);
          } else {
            setAckMessage(`Heard: "${transcript}". No amount specified, will feed 10g by default. Sending command...`);
          }
        }

        try {
          setLoading(true);
          const { data: feedData } = await FeedAPI.voice(transcript);
          setAckMessage(`✅ ${feedData.message || `Đã thực hiện lệnh: "${transcript}"`}`);
        } catch (err) {
          console.error('Voice feed error:', err);
          const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Gửi lệnh thất bại';
          const parsedText = err.response?.data?.parsedText || transcript;
          setAckMessage(`❌ ${errorMsg}${parsedText ? ` (Đã nghe: "${parsedText}")` : ''}`);
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
          <p>Dispense 10g immediately.</p>
          <button className="btn btn--primary btn--lg" type="button" onClick={handleFeedNow} disabled={loading}>
            {loading ? 'Sending...' : 'Feed Now (10g)'}
          </button>
        </div>
        <div className="card">
          <h3>Feed by Voice</h3>
          <p>Say "cho ăn" (10g default) or "cho ăn 200 gram" / "feed" (10g) or "feed 200 grams"</p>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label htmlFor="language-select" style={{ fontSize: '0.9rem' }}>Language:</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={micStatus === 'listening' || micStatus === 'processing'}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #e0e7ff',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <option value="vi-VN">Tiếng Việt</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <button
            className={`voice-button ${micStatus === 'listening' ? 'voice-button--listening' : ''}`}
            type="button"
            onClick={handleVoiceFeed}
            disabled={loading}
          >
            <span className="voice-button__dot" aria-hidden />
            <span className="voice-button__label">
              {micStatus === 'listening' 
                ? (language === 'vi-VN' ? 'Đang nghe...' : 'Listening...')
                : micStatus === 'processing' 
                ? (language === 'vi-VN' ? 'Đang xử lý...' : 'Processing...')
                : (language === 'vi-VN' ? 'Nhấn để nói' : 'Click to speak')}
            </span>
          </button>
          <small>
            {language === 'vi-VN' 
              ? 'Trình duyệt sẽ xin quyền sử dụng microphone.'
              : 'Browser will ask for microphone permission.'}
          </small>
        </div>
      </section>
      {ackMessage && <p className="alert alert--info">{ackMessage}</p>}
    </div>
  );
};

export default ManualFeed;


