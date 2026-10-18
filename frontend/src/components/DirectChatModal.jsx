import { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  X,
  Send,
  RefreshCw,
  Store,
  ShieldCheck,
  CheckCheck,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../config/api";

export function DirectChatModal({
  currentUser,
  targetRecipient,
  targetCrop,
  onClose,
  onRequestLogin
}) {
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesStreamRef = useRef(null);

  const token = sessionStorage.getItem("agroconnectToken");

  const scrollToBottom = () => {
    if (messagesStreamRef.current) {
      messagesStreamRef.current.scrollTo({
        top: messagesStreamRef.current.scrollHeight,
        behavior: "smooth"
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(apiUrl("/api/chat/conversations"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);

        // If targetRecipient passed, check if a conversation already exists
        if (targetRecipient && !selectedConvId) {
          const matching = data.find((c) =>
            c.participants.some((p) => p._id === targetRecipient._id || p._id === targetRecipient.id)
          );
          if (matching) {
            setSelectedConvId(matching._id);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [token, targetRecipient, selectedConvId]);

  const fetchMessages = useCallback(async (convId) => {
    if (!token || !convId) return;
    try {
      const res = await fetch(apiUrl(`/api/chat/messages/${convId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMessages(data.messages || []);
      }
    } catch (err) {
      console.warn("Could not fetch messages:", err);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !currentUser) {
      setLoading(false);
      return;
    }
    fetchConversations();
  }, [token, currentUser, fetchConversations]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
      const interval = setInterval(() => {
        fetchMessages(selectedConvId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedConvId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    if (!token || !currentUser) {
      onRequestLogin();
      return;
    }

    try {
      setSending(true);
      setError("");

      const payload = {
        text: inputText.trim(),
        conversationId: selectedConvId || undefined,
        recipientId: targetRecipient ? (targetRecipient._id || targetRecipient.id) : undefined,
        cropId: targetCrop ? (targetCrop._id || targetCrop.id) : undefined
      };

      const res = await fetch(apiUrl("/api/chat/messages"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to send message.");
      }

      const data = await res.json();
      setInputText("");
      if (!selectedConvId && data.conversationId) {
        setSelectedConvId(data.conversationId);
      }
      setActiveMessages((prev) => [...prev, data.message]);
      fetchConversations();
    } catch (err) {
      setError(err.message || "Could not deliver message.");
    } finally {
      setSending(false);
    }
  }

  function getOtherParticipant(conv) {
    if (!conv?.participants || !currentUser) return null;
    return conv.participants.find(
      (p) => p._id !== currentUser.id && p._id !== currentUser._id
    ) || conv.participants[0];
  }

  function formatTime(timestamp) {
    if (!timestamp) return "";
    try {
      const locale = language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
      return new Date(timestamp).toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }

  if (!currentUser) {
    return (
      <div className="modal-backdrop-modern" onClick={onClose}>
        <div className="modal-window" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-round" onClick={onClose}><X size={18} /></button>
          <div className="modal-inner-scroll" style={{ textAlign: "center", padding: "40px 24px" }}>
            <MessageSquare size={44} style={{ color: "var(--emerald-600)", margin: "0 auto 16px" }} />
            <h2>{t("chat.title")}</h2>
            <p style={{ margin: "12px 0 24px" }}>{t("chat.subtitle")}</p>
            <button
              className="btn-modal-submit green"
              onClick={() => {
                onClose();
                onRequestLogin();
              }}
            >
              {t("nav.logIn")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedConversation = conversations.find((c) => c._id === selectedConvId);
  const activePartner = selectedConversation
    ? getOtherParticipant(selectedConversation)
    : targetRecipient;

  return (
    <div className="modal-backdrop-modern" onClick={onClose}>
      <div
        className={`modal-window chat-modal-window ${isFullScreen ? "fullscreen-modal" : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-top-actions">
          <button
            type="button"
            className="modal-action-round"
            onClick={() => setIsFullScreen((prev) => !prev)}
            title={isFullScreen ? "Restore Size" : "Full Screen Chat"}
            aria-label="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button className="modal-close-round" onClick={onClose} aria-label="Close chat">
            <X size={18} />
          </button>
        </div>

        <div className="chat-modal-layout">
          {/* SIDEBAR: CONVERSATION LIST */}
          <aside className="chat-sidebar">
            <div className="chat-sidebar-header">
              <div className="sidebar-title-row">
                <MessageSquare size={18} className="chat-icon" />
                <h3>{t("chat.conversationsTitle")}</h3>
              </div>
              <button
                className="chat-refresh-mini"
                onClick={fetchConversations}
                title="Refresh messages"
              >
                <RefreshCw size={14} className={loading ? "spinner-icon" : ""} />
              </button>
            </div>

            <div className="chat-conv-list">
              {targetRecipient && !selectedConvId && (
                <div className="conv-item active new-target">
                  <div className="conv-avatar">🧑‍🌾</div>
                  <div className="conv-meta">
                    <strong>{targetRecipient.name}</strong>
                    <span className="conv-preview">New conversation</span>
                  </div>
                </div>
              )}

              {conversations.length === 0 && !targetRecipient ? (
                <div className="chat-empty-sidebar">
                  <p>{t("chat.noConversations")}</p>
                  <small>{t("chat.noConversationsSub")}</small>
                </div>
              ) : (
                conversations.map((c) => {
                  const partner = getOtherParticipant(c);
                  const isSelected = c._id === selectedConvId;
                  const hasUnread = (c.unreadBy || []).some(
                    (id) => id === currentUser.id || id === currentUser._id
                  );

                  return (
                    <button
                      key={c._id}
                      type="button"
                      className={`conv-item ${isSelected ? "active" : ""} ${hasUnread ? "unread" : ""}`}
                      onClick={() => setSelectedConvId(c._id)}
                    >
                      <div className="conv-avatar">
                        {partner?.role === "Farmer" ? "🧑‍🌾" : "🛒"}
                      </div>
                      <div className="conv-meta">
                        <div className="conv-name-row">
                          <strong className="conv-partner-name">{partner?.name || "User"}</strong>
                          {hasUnread && <span className="unread-dot" />}
                        </div>
                        <span className="conv-last-msg">{c.lastMessage || "..."}</span>
                        {c.crop && (
                          <span className="conv-crop-tag">🌾 {c.crop.name}</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* MAIN CHAT PANE */}
          <section className="chat-main-pane">
            {activePartner || selectedConvId ? (
              <>
                {/* ACTIVE CHAT HEADER */}
                <div className="chat-pane-header">
                  <div className="partner-details">
                    <div className="partner-avatar-circle">
                      {activePartner?.role === "Farmer" ? "🧑‍🌾" : "🛒"}
                    </div>
                    <div>
                      <div className="partner-name-badge">
                        <h4>{activePartner?.name || "Participant"}</h4>
                        <span className="partner-role-pill">
                          {activePartner?.role ? (t(`nav.role${activePartner.role}`) || activePartner.role) : ""}
                        </span>
                      </div>
                      {activePartner?.location && (
                        <span className="partner-loc">📍 {activePartner.location}</span>
                      )}
                    </div>
                  </div>

                  {(selectedConversation?.crop || targetCrop) && (
                    <div className="chat-crop-pill">
                      <Store size={14} />
                      <span>
                        {t("chat.aboutCrop", {
                          crop: selectedConversation?.crop?.name || targetCrop?.name
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* MESSAGES STREAM */}
                <div className="chat-messages-stream" ref={messagesStreamRef}>
                  <div className="chat-security-ribbon">
                    <ShieldCheck size={14} />
                    <span>{t("chat.dealSafety")}</span>
                  </div>

                  {activeMessages.map((msg, index) => {
                    const senderId = typeof msg.sender === "object" ? msg.sender?._id : msg.sender;
                    const isMine = senderId === currentUser.id || senderId === currentUser._id;

                    return (
                      <div
                        key={msg._id || index}
                        className={`message-bubble-row ${isMine ? "mine" : "theirs"}`}
                      >
                        <div className="message-bubble">
                          <p>{msg.text}</p>
                          <div className="message-meta-row">
                            <span className="message-time">{formatTime(msg.createdAt)}</span>
                            {isMine && (
                              <CheckCheck
                                size={13}
                                className={`read-icon ${msg.read ? "read" : ""}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* ERROR NOTIFICATION */}
                {error && <div className="chat-error-bar">{error}</div>}

                {/* MESSAGE INPUT FORM */}
                <form className="chat-input-row" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder={t("chat.typePlaceholder")}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!inputText.trim() || sending}
                    aria-label="Send message"
                  >
                    <Send size={16} />
                    <span>{t("chat.sendBtn")}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-none-selected">
                <MessageSquare size={48} className="empty-bubble-icon" />
                <h3>{t("chat.title")}</h3>
                <p>{t("chat.selectConversation")}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default DirectChatModal;
