import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  MessageSquare,
  X,
  Send,
  RefreshCw,
  ShieldCheck,
  CheckCheck,
  ArrowLeft
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
  const [showMobileChat, setShowMobileChat] = useState(Boolean(selectedConvId || targetRecipient));
  const messagesEndRef = useRef(null);
  const messagesStreamRef = useRef(null);

  useEffect(() => {
    if (selectedConvId || targetRecipient) {
      setShowMobileChat(true);
    }
  }, [selectedConvId, targetRecipient]);

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

  const uniqueConversations = useMemo(() => {
    const personMap = new Map();
    const sorted = [...conversations].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    for (const conv of sorted) {
      const partner = getOtherParticipant(conv);
      const partnerId = (partner?._id || partner?.id || partner || "").toString();

      if (!partnerId) {
        if (!personMap.has(conv._id)) personMap.set(conv._id, { ...conv });
        continue;
      }

      if (!personMap.has(partnerId)) {
        personMap.set(partnerId, { ...conv, otherParticipantId: partnerId });
      } else {
        const existing = personMap.get(partnerId);
        if (conv.unreadCount) {
          existing.unreadCount = (existing.unreadCount || 0) + conv.unreadCount;
        }
      }
    }

    return Array.from(personMap.values());
  }, [conversations, currentUser]);

  const selectedConversation = conversations.find((c) => c._id === selectedConvId);
  const activePartner = selectedConversation
    ? getOtherParticipant(selectedConversation)
    : targetRecipient;

  return (
    <div className="modal-backdrop-modern" onClick={onClose}>
      <div
        className="modal-window chat-modal-window"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-round" onClick={onClose} aria-label="Close chat">
          <X size={18} />
        </button>

        <div className={`chat-modal-layout ${selectedConvId || (targetRecipient && showMobileChat) ? "has-active-conv" : "no-active-conv"}`}>
          {/* SIDEBAR: CONVERSATION LIST */}
          <aside className="chat-sidebar">
            <div className="chat-sidebar-header">
              <div className="sidebar-title-row">
                <div className="sidebar-title-group">
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
            </div>

            <div className="chat-conv-list">
              {targetRecipient && !selectedConvId && (
                <div
                  className="conv-item active new-target"
                  onClick={() => setShowMobileChat(true)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="conv-avatar">🧑‍🌾</div>
                  <div className="conv-meta">
                    <div className="conv-name-row">
                      <div className="conv-user-info-group">
                        <strong className="conv-partner-name">{targetRecipient.name}</strong>
                        <span className="conv-role-tag">
                          {targetRecipient.role === "Farmer" ? (t("nav.roleFarmer") || "Farmer") : (t("nav.roleBuyer") || "Buyer")}
                        </span>
                      </div>
                    </div>
                    <span className="conv-preview">New conversation</span>
                  </div>
                </div>
              )}

              {uniqueConversations.length === 0 && !targetRecipient ? (
                <div className="chat-empty-sidebar">
                  <p>{t("chat.noConversations")}</p>
                  <small>{t("chat.noConversationsSub")}</small>
                </div>
              ) : (
                uniqueConversations.map((c) => {
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
                      onClick={() => {
                        setSelectedConvId(c._id);
                        setShowMobileChat(true);
                      }}
                    >
                      <div className="conv-avatar">
                        {partner?.role === "Farmer" ? "🧑‍🌾" : "🛒"}
                      </div>
                      <div className="conv-meta">
                        <div className="conv-name-row">
                          <div className="conv-user-info-group">
                            <strong className="conv-partner-name">{partner?.name || "User"}</strong>
                            <span className={`conv-role-tag ${partner?.role === "Farmer" ? "role-farmer" : "role-buyer"}`}>
                              {partner?.role === "Farmer" ? (t("nav.roleFarmer") || "Farmer") : (t("nav.roleBuyer") || "Buyer")}
                            </span>
                          </div>
                          <span className="conv-timestamp">{formatTime(c.lastMessageAt || c.updatedAt)}</span>
                          {hasUnread && <span className="unread-dot" />}
                        </div>
                        <span className="conv-last-msg">{c.lastMessage || "No messages yet"}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* MAIN CHAT PANE */}
          <section className="chat-main-pane">
            {selectedConvId || (targetRecipient && showMobileChat) ? (
              <>
                {/* ACTIVE CHAT HEADER */}
                <div className="chat-pane-header">
                  <button
                    type="button"
                    className="btn-chat-modal-back"
                    onClick={() => {
                      setSelectedConvId(null);
                      setShowMobileChat(false);
                    }}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>

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
                    placeholder={t("chat.typePlaceholder") || "Type a Message..."}
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
