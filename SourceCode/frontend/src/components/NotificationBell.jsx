import { useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications.jsx';

const methodLabels = {
  manual: 'Manual',
  voice: 'Voice',
  scheduled: 'Schedule',
};

const methodLabelsVi = {
  manual: 'Thủ công',
  voice: 'Giọng nói',
  scheduled: 'Theo lịch',
};

const NotificationBell = ({ locale = 'vi-VN' }) => {
  const { notifications, unreadCount, markAllRead, clearNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all | manual | voice | scheduled
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const items = useMemo(() => notifications.slice(0, 50), [notifications]);
  const filteredItems = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.method === filter)),
    [items, filter],
  );

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const getMethodLabel = (method) => {
    const labels = locale === 'vi-VN' ? methodLabelsVi : methodLabels;
    return labels[method] || labels.manual;
  };

  return (
    <div className="notification-bell" style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((prev) => !prev);
          if (unreadCount > 0) {
            markAllRead();
          }
        }}
        style={{
          position: 'relative',
          background: '#f1f5f9',
          border: 'none',
          borderRadius: '999px',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1.25rem',
          color: '#0f172a',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0 6px',
              lineHeight: '16px',
              minWidth: '18px',
              textAlign: 'center',
            }}
          >
            {Math.min(unreadCount, 9)}
            {unreadCount > 9 ? '+' : ''}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notification-bell__dropdown"
          style={{
            position: 'absolute',
            top: '52px',
            right: 0,
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.18)',
            padding: '1rem',
            zIndex: 2000,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {locale === 'vi-VN' ? 'Thông báo' : 'Notifications'}
            </p>
            <button
              type="button"
              onClick={clearNotifications}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {locale === 'vi-VN' ? 'Xóa tất cả' : 'Clear all'}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.3rem',
              marginBottom: '0.75rem',
            }}
          >
            {['all', 'manual', 'voice', 'scheduled'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                style={{
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: filter === key ? '#0f172a' : '#e2e8f0',
                  background: filter === key ? '#0f172a' : '#ffffff',
                  color: filter === key ? '#ffffff' : '#0f172a',
                  padding: '0.3rem 0.4rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {locale === 'vi-VN'
                  ? key === 'all'
                    ? 'Tất cả'
                    : key === 'manual'
                      ? 'Thủ công'
                      : key === 'voice'
                        ? 'Giọng nói'
                        : 'Theo lịch'
                  : key === 'all'
                    ? 'All'
                    : key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          {(filter === 'all' ? items : filteredItems).length === 0 ? (
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              {locale === 'vi-VN' ? 'Chưa có thông báo nào' : 'No notifications yet'}
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', maxHeight: '320px', overflowY: 'auto' }}>
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    padding: '0.75rem 0',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: item.read ? 400 : 600, color: '#0f172a', fontSize: '0.95rem' }}>
                    {item.message}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                    {getMethodLabel(item.method)} • {item.amount ? `${item.amount}g` : '--'} • {formatDate(item.createdAt)}
                  </p>
                  {item.transcript && (
                    <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>
                      {locale === 'vi-VN' ? 'Lệnh:' : 'Command:'} "{item.transcript}"
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;


