import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../utils/api';

function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là AI tư vấn viên của KPhone. Tôi có thể giúp bạn tư vấn về sản phẩm, giá cả, chính sách bảo hành và nhiều điều khác. Hãy cho tôi biết bạn cần hỗ trợ gì nhé! 😊'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus vào input khi mở chatbox
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Thêm tin nhắn user vào danh sách
    const newUserMessage = {
      role: 'user',
      content: userMessage
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Tạo conversation history
      const conversationHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Gọi API
      const response = await chatWithAI({
        message: userMessage,
        conversationHistory: conversationHistory
      });

      if (response.success) {
        // Thêm phản hồi AI vào danh sách
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.message
        }]);
      } else {
        // Xử lý lỗi
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau. 😔'
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, tôi không thể kết nối đến server. Vui lòng thử lại sau. 😔'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Xử lý đóng/mở chatbox
  const toggleChatbox = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Button - Floating */}
      {!isOpen && (
        <button
          onClick={toggleChatbox}
          style={styles.chatButton}
          aria-label="Mở chatbox tư vấn"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z"
              fill="white"
            />
          </svg>
          <span style={styles.chatButtonText}>Chat tư vấn</span>
        </button>
      )}

      {/* Chatbox Window */}
      {isOpen && (
        <div style={styles.chatboxContainer}>
          <div style={styles.chatboxHeader}>
            <div style={styles.chatboxHeaderLeft}>
              <div style={styles.avatar}>🤖</div>
              <div>
                <div style={styles.chatboxTitle}>Chatbot tư vấn KPhone</div>
                <div style={styles.chatboxSubtitle}>Trả lời trong giây lát</div>
              </div>
            </div>
            <button
              onClick={toggleChatbox}
              style={styles.closeButton}
              aria-label="Đóng chatbox"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div style={styles.messagesContainer}>
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={index}
                  style={{
                    ...styles.message,
                    ...(isUser ? styles.userMessage : styles.assistantMessage)
                  }}
                >
                  <div style={isUser ? messageContentUser : messageContentAssistant}>
                    {message.content}
                  </div>
                </div>
              );
            })}
            
            {/* Loading indicator */}
            {isLoading && (
              <div style={styles.assistantMessage}>
                <div style={messageContentAssistant}>
                  <div style={styles.typingIndicator}>
                    <span style={{...styles.typingDot, animationDelay: '0s'}}></span>
                    <span style={{...styles.typingDot, animationDelay: '0.2s'}}></span>
                    <span style={{...styles.typingDot, animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={styles.inputContainer}>
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              style={styles.input}
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                ...styles.sendButton,
                ...((!inputMessage.trim() || isLoading) && styles.sendButtonDisabled)
              }}
              aria-label="Gửi tin nhắn"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        .typing-dot {
          animation: typing 1.4s infinite;
        }
      `}</style>
    </>
  );
}

const styles = {
  chatButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    padding: '8px',
  },
  chatButtonText: {
    fontSize: '10px',
    marginTop: '2px',
    fontWeight: '500',
  },
  chatboxContainer: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '380px',
    height: '600px',
    maxHeight: '80vh',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1001,
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
  },
  chatboxHeader: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '16px 16px 0 0',
  },
  chatboxHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  chatboxTitle: {
    fontSize: '16px',
    fontWeight: '600',
  },
  chatboxSubtitle: {
    fontSize: '12px',
    opacity: 0.9,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#f8f9fa',
  },
  message: {
    maxWidth: '80%',
    wordWrap: 'break-word',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  inputContainer: {
    display: 'flex',
    padding: '16px',
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0',
    gap: '8px',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'none',
    maxHeight: '100px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  typingIndicator: {
    display: 'flex',
    gap: '6px',
    padding: '8px 0',
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#999',
    display: 'inline-block',
  },
};

// Message content styles
const messageContentUser = {
  padding: '12px 16px',
  borderRadius: '12px',
  backgroundColor: '#007bff',
  color: 'white',
  fontSize: '14px',
  lineHeight: '1.5',
  borderBottomRightRadius: '4px',
};

const messageContentAssistant = {
  padding: '12px 16px',
  borderRadius: '12px',
  backgroundColor: 'white',
  color: '#333',
  fontSize: '14px',
  lineHeight: '1.5',
  borderBottomLeftRadius: '4px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
};

export default Chatbox;
