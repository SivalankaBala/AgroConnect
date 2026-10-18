import { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Send,
  ArrowLeft,
  RefreshCw,
  Store,
  User,
  Check,
  CheckCheck,
  AlertCircle,
  Sprout,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { apiUrl } from "../config/api";
import { connectChatSocket, getChatSocket } from "../services/socket";

export default function MessagesView({
  currentUser,
  activeConversationId = null,
  initialTargetUser = null,
  initialTargetCrop = null,
  onOpenProductDetails,
  onOpenFarmerProfile,
  onConversationChange
}) {
  const { t, language } = useLanguage();
  const token = sessionStorage.getItem("agroconnectToken");

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const selectedConvIdRef = useRef(null);

  selectedConvIdRef.current = selectedConv?._id;

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Fetch all conversations for the user
  const fetchConversations = useCallback(async (selectIdAfter = null) => {
    if (!token || !currentUser) return;
    try {
      const res = await fetch(apiUrl("/api/chat/conversations"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);

        if (selectIdAfter) {
          const matched = data.find((c) => c._id === selectIdAfter);
          if (matched) setSelectedConv(matched);
        }
      }
    } catch (err) {
      console.warn("Could not fetch conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  }, [token, currentUser]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (convId, isInitialLoad = false) => {
    if (!token || !convId) return;
    if (isInitialLoad) setLoadingMsgs(true);
    try {
      const res = await fetch(apiUrl(`/api/chat/conversations/${convId}/messages`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.conversation) {
          setSelectedConv((prev) => (prev ? { ...prev, ...data.conversation, unreadCount: 0 } : data.conversation));
        }
        // Also update unreadCount in conversations list
        setConversations((prev) =>
          prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.warn("Could not fetch messages:", err);
    } finally {
      if (isInitialLoad) setLoadingMsgs(false);
    }
  }, [token]);

  // Helper to get or create conversation with initial recipient / crop
  const initTargetChat = useCallback(async () => {
    if (!token || !initialTargetUser) return;
    try {
      const res = await fetch(apiUrl("/api/chat/conversations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: initialTargetUser._id || initialTargetUser.id,
          cropId: initialTargetCrop?._id || initialTargetCrop?.id || null
        })
      });
      if (res.ok) {
        const conv = await res.json();
        setSelectedConv(conv);
        if (onConversationChange) onConversationChange(conv._id);
        fetchConversations(conv._id);
      }
    } catch (err) {
      console.error("Init target chat error:", err);
    }
  }, [token, initialTargetUser, initialTargetCrop, onConversationChange, fetchConversations]);

  // Initial load
  useEffect(() => {
    fetchConversations();
    if (initialTargetUser) {
      initTargetChat();
    }
  }, [fetchConversations, initialTargetUser, initTargetChat]);

  // If activeConversationId passed from props, select it
  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      const found = conversations.find((c) => c._id === activeConversationId);
      if (found) {
        setSelectedConv(found);
      }
    }
  }, [activeConversationId, conversations]);

  // Socket.IO real-time setup
  useEffect(() => {
    if (!token || !currentUser) return;
    const socket = connectChatSocket(token);

    if (socket) {
      setIsSocketConnected(socket.connected);

      const onConnect = () => setIsSocketConnected(true);
      const onDisconnect = () => setIsSocketConnected(false);

      const onNewMessage = (msg) => {
        // If message belongs to active conversation
        if (msg.conversation === selectedConvIdRef.current) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom(true);

          // Mark message read if received by current user
          if (msg.recipient?._id === currentUser.id || msg.recipient === currentUser.id) {
            socket.emit("mark_read", msg.conversation);
          }
        }

        // Update last message in conversations list
        setConversations((prev) =>
          prev.map((c) => {
            if (c._id === msg.conversation) {
              const isCurrent = c._id === selectedConvIdRef.current;
              return {
                ...c,
                lastMessage: msg.text,
                lastSender: msg.sender,
                updatedAt: new Date().toISOString(),
                unreadCount: isCurrent ? 0 : (c.unreadCount || 0) + 1
              };
            }
            return c;
          })
        );
      };

      const onMessagesRead = ({ conversationId, readBy }) => {
        if (conversationId === selectedConvIdRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.sender?._id === currentUser.id || m.sender === currentUser.id ? { ...m, read: true } : m))
          );
        }
      };

      const onConvUpdated = () => {
        fetchConversations();
      };

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("new_message", onNewMessage);
      socket.on("messages_read", onMessagesRead);
      socket.on("conversation_updated", onConvUpdated);

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("new_message", onNewMessage);
        socket.off("messages_read", onMessagesRead);
        socket.off("conversation_updated", onConvUpdated);
      };
    }
  }, [token, currentUser, scrollToBottom, fetchConversations]);

  // Join/leave conversation room when selectedConv changes
  useEffect(() => {
    if (!selectedConv?._id) return;

    fetchMessages(selectedConv._id, true);

    const socket = getChatSocket();
    if (socket && socket.connected) {
      socket.emit("join_conversation", selectedConv._id);
      socket.emit("mark_read", selectedConv._id);
    }

    // Polling fallback every 6 seconds in case socket drops
    const pollInterval = setInterval(() => {
      fetchMessages(selectedConv._id, false);
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      if (socket && socket.connected) {
        socket.emit("leave_conversation", selectedConv._id);
      }
    };
  }, [selectedConv?._id, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  // Handle select conversation
  const handleSelectConv = (conv) => {
    setSelectedConv(conv);
    if (onConversationChange) onConversationChange(conv._id);
  };

  // Helper to find the other participant in conversation
  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find(
      (p) => (p._id || p.id || p).toString() !== (currentUser?.id || currentUser?._id).toString()
    );
  };

  // Format relative timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t("chat.justNow") || "Just now";
    if (diffMins < 60) return `${diffMins}m`;

    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return t("chat.yesterday") || "Yesterday";
    }

    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Send message
  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === "string" ? customText : inputText;
    if (!textToSend.trim() || sending || !selectedConv) return;

    setSending(true);
    setErrorNotice("");

    const payload = {
      text: textToSend.trim(),
      cropId: selectedConv.crop?._id || selectedConv.crop || null
    };

    try {
      const socket = getChatSocket();
      let sentViaSocket = false;

      // Try sending via socket first if connected
      if (socket && socket.connected) {
        socket.emit(
          "send_message",
          {
            conversationId: selectedConv._id,
            text: payload.text,
            cropId: payload.cropId
          },
          (response) => {
            if (response && response.success) {
              setInputText("");
            }
          }
        );
        sentViaSocket = true;
        setInputText("");
      }

      // If socket not connected or as verified fallback, call REST API
      if (!sentViaSocket) {
        const res = await fetch(apiUrl(`/api/chat/conversations/${selectedConv._id}/messages`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          setInputText("");
          setMessages((prev) => [...prev, data.message]);
          scrollToBottom(true);
        } else {
          const errData = await res.json();
          setErrorNotice(errData.message || "Failed to send message.");
        }
      }
    } catch (err) {
      console.error("Send message error:", err);
      setErrorNotice("Could not connect to send message. Please retry.");
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // Keyboard Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const other = getOtherParticipant(c);
    const q = searchQuery.toLowerCase();
    const otherName = (other?.name || "").toLowerCase();
    const cropName = (c.crop?.name || "").toLowerCase();
    const lastMsg = (c.lastMessage || "").toLowerCase();
    return otherName.includes(q) || cropName.includes(q) || lastMsg.includes(q);
  });

  const otherUser = getOtherParticipant(selectedConv);

  // Quick agricultural suggestion chips
  const quickReplies = [
    t("chat.quick1") || "Is this batch still available?",
    t("chat.quick2") || "What is your best wholesale bulk price?",
    t("chat.quick3") || "Can transportation to our mandal be arranged?",
    t("chat.quick4") || "Yes, freshly harvested stock is ready for inspection!"
  ];

  return (
    <div className="messages-page-wrapper">
      <div className="messages-layout-container">
        {/* SIDEBAR: CONVERSATIONS LIST */}
        <aside className={`messages-sidebar ${selectedConv ? "has-active-conv" : ""}`}>
          <div className="messages-sidebar-header">
            <div className="sidebar-title-row">
              <div className="sidebar-heading-group">
                <div className="sidebar-icon-pill">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="sidebar-main-title">{t("chat.title") || "Direct Messages"}</h2>
                  <span className="sidebar-subtitle">
                    {currentUser?.role === "Farmer" ? "Farmer Inquiries & Chats" : "Buyer & Farmer Orders"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-refresh-convs"
                onClick={() => fetchConversations()}
                title="Refresh conversations"
                aria-label="Refresh"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            {/* Search Input */}
            <div className="messages-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("chat.searchPlaceholder") || "Search by farmer, buyer, or crop..."}
                className="messages-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="messages-conv-list">
            {loadingConvs ? (
              <div className="conv-list-loading">
                <RefreshCw size={24} className="spin-icon" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="conv-list-empty">
                <div className="empty-chat-icon-box">
                  <Sprout size={32} />
                </div>
                <h3>{t("chat.noConversations") || "No conversations yet"}</h3>
                <p>
                  {currentUser?.role === "Farmer"
                    ? "Incoming buyer messages and enquiries will appear here."
                    : "Browse crops on the marketplace and click 'Chat with Farmer' to start connecting!"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isSelected = selectedConv?._id === conv._id;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <div
                    key={conv._id}
                    className={`conv-list-item ${isSelected ? "selected" : ""} ${hasUnread ? "has-unread" : ""}`}
                    onClick={() => handleSelectConv(conv)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="conv-avatar-box">
                      <div className="conv-avatar-circle">
                        {other?.role === "Farmer" ? "🧑‍🌾" : "🛒"}
                      </div>
                      {hasUnread && <span className="conv-unread-dot" />}
                    </div>

                    <div className="conv-card-content">
                      <div className="conv-top-row">
                        <span className="conv-user-name">
                          {other?.name || "AgroConnect User"}
                        </span>
                        <span className="conv-timestamp">
                          {formatTime(conv.lastMessageAt || conv.updatedAt)}
                        </span>
                      </div>

                      <div className="conv-meta-row">
                        <span className="conv-role-tag">
                          {t(`nav.role${other?.role}`) || other?.role || "User"}
                        </span>
                        {conv.crop && (
                          <span className="conv-crop-tag" title={conv.crop.name}>
                            🌾 {conv.crop.name}
                          </span>
                        )}
                        {other?.location && (
                          <span className="conv-location-tag">
                            📍 {other.location.split(",")[0]}
                          </span>
                        )}
                      </div>

                      <div className="conv-preview-row">
                        <span className={`conv-last-message ${hasUnread ? "unread" : ""}`}>
                          {conv.lastMessage || "No messages yet"}
                        </span>
                        {hasUnread && (
                          <span className="conv-unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* MAIN PANE: ACTIVE CONVERSATION CHAT WINDOW */}
        <main className={`messages-main-pane ${!selectedConv ? "no-conv-selected" : ""}`}>
          {!selectedConv ? (
            <div className="no-chat-selected-placeholder">
              <div className="placeholder-brand-art">
                <Sprout size={48} className="placeholder-sprout" />
              </div>
              <h2>{t("chat.selectConversation") || "Select a Conversation"}</h2>
              <p>
                {currentUser?.role === "Farmer"
                  ? "Choose a buyer message on the left to review enquiries, discuss quantities, and negotiate fair prices directly."
                  : "Connect directly with trusted Andhra Pradesh farmers. Ask about availability, bulk discounts, and transport options."}
              </p>
              <div className="chat-safety-pill">
                <ShieldCheck size={16} />
                <span>Zero middleman commission · Direct farmer trade · Verified listings</span>
              </div>
            </div>
          ) : (
            <div className="chat-window-layout">
              {/* CHAT HEADER */}
              <header className="chat-window-header">
                <div className="chat-header-left">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    className="btn-chat-mobile-back"
                    onClick={() => setSelectedConv(null)}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div
                    className="chat-header-avatar clickable"
                    onClick={() => {
                      if (otherUser?.role === "Farmer" && onOpenFarmerProfile) {
                        onOpenFarmerProfile(otherUser._id);
                      }
                    }}
                    title="View Profile"
                  >
                    {otherUser?.role === "Farmer" ? "🧑‍🌾" : "🛒"}
                  </div>

                  <div className="chat-header-info">
                    <div className="chat-header-name-row">
                      <h3
                        className="chat-recipient-name clickable"
                        onClick={() => {
                          if (otherUser?.role === "Farmer" && onOpenFarmerProfile) {
                            onOpenFarmerProfile(otherUser._id);
                          }
                        }}
                      >
                        {otherUser?.name || "User"}
                      </h3>
                      <span className="chat-role-badge">
                        {t(`nav.role${otherUser?.role}`) || otherUser?.role}
                      </span>
                    </div>

                    <div className="chat-header-subrow">
                      {otherUser?.location && (
                        <span className="chat-header-location">
                          <MapPin size={12} /> {otherUser.location}
                        </span>
                      )}
                      <span className="chat-status-indicator online">
                        <span className="status-dot-pulse" />
                        <span>{isSocketConnected ? t("chat.live") || "Live Chat" : t("chat.online") || "Connected"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Crop Association Chip */}
                {selectedConv.crop && (
                  <div
                    className="chat-crop-card-chip clickable"
                    onClick={() => onOpenProductDetails && onOpenProductDetails(selectedConv.crop)}
                    title="View crop listing"
                  >
                    <div className="crop-chip-icon">🌾</div>
                    <div className="crop-chip-details">
                      <span className="crop-chip-name">{selectedConv.crop.name}</span>
                      <span className="crop-chip-price">
                        ₹{selectedConv.crop.price}/{selectedConv.crop.unit || "kg"}
                      </span>
                    </div>
                    <ChevronRight size={14} className="crop-chip-chevron" />
                  </div>
                )}
              </header>

              {/* MESSAGES SCROLL CONTAINER */}
              <div className="chat-messages-scroll-area">
                {/* Crop Context Notification Banner */}
                {selectedConv.crop && (
                  <div className="chat-thread-crop-banner">
                    <Sprout size={16} className="crop-banner-icon" />
                    <span>
                      Direct discussion regarding <strong>{selectedConv.crop.name}</strong> • ₹{selectedConv.crop.price}/{selectedConv.crop.unit || "kg"}
                    </span>
                  </div>
                )}

                {loadingMsgs ? (
                  <div className="messages-loading-state">
                    <RefreshCw size={24} className="spin-icon" />
                    <span>Loading message history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="messages-empty-thread">
                    <div className="empty-thread-icon">💬</div>
                    <h4>Say hello to start the conversation!</h4>
                    <p>Discuss availability, pickup locations, quantity, and payment terms directly.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine =
                      (msg.sender?._id || msg.sender).toString() ===
                      (currentUser?.id || currentUser?._id).toString();

                    return (
                      <div
                        key={msg._id || index}
                        className={`message-bubble-wrapper ${isMine ? "mine" : "theirs"}`}
                      >
                        <div className="message-bubble-card">
                          {!isMine && (
                            <span className="message-sender-label">
                              {msg.sender?.name || otherUser?.name || "Participant"}
                            </span>
                          )}

                          <div className="message-text-content">{msg.text}</div>

                          <div className="message-time-status">
                            <span className="message-timestamp">
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                            {isMine && (
                              <span className="message-read-receipt" title={msg.read ? "Read" : "Delivered"}>
                                {msg.read ? (
                                  <CheckCheck size={14} className="receipt-read" />
                                ) : (
                                  <Check size={14} className="receipt-sent" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ERROR NOTICE */}
              {errorNotice && (
                <div className="chat-error-bar">
                  <AlertCircle size={15} />
                  <span>{errorNotice}</span>
                  <button type="button" onClick={() => setErrorNotice("")}>✕</button>
                </div>
              )}

              {/* QUICK REPLIES BAR */}
              <div className="chat-quick-replies-tray">
                <span className="quick-replies-label">
                  <Sparkles size={12} /> {t("chat.quickReplies") || "Suggestions:"}
                </span>
                <div className="quick-replies-scroll">
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quick-reply-chip"
                      onClick={() => handleSendMessage(reply)}
                      disabled={sending}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* COMPOSER / INPUT ROW */}
              <footer className="chat-composer-footer">
                <div className="composer-input-container">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("chat.typeMessage") || "Type a message in English, తెలుగు, हिन्दी..."}
                    className="composer-textarea"
                    disabled={sending}
                  />
                  <button
                    type="button"
                    className="btn-composer-send"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || sending}
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="composer-hint-row">
                  <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
                  <span className="encrypted-shield">
                    <ShieldCheck size={12} /> Private & direct
                  </span>
                </div>
              </footer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
