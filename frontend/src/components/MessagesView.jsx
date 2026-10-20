import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  X
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
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const searchInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const selectedConvIdRef = useRef(null);
  selectedConvIdRef.current = selectedConv?._id;

  const onConversationChangeRef = useRef(onConversationChange);
  useEffect(() => {
    onConversationChangeRef.current = onConversationChange;
  }, [onConversationChange]);

  const initializingTargetRef = useRef(false);
  const initializedTargetIdRef = useRef(null);

  // Stick the messages page by locking body/window scroll and managing active conversation state
  useEffect(() => {
    document.body.classList.add("messages-active");
    if (selectedConv) {
      document.body.classList.add("chat-active-conv");
    } else {
      document.body.classList.remove("chat-active-conv");
    }

    return () => {
      document.body.classList.remove("messages-active");
      document.body.classList.remove("chat-active-conv");
    };
  }, [selectedConv]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      if (smooth) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest" });
    }
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
        const convList = data || [];
        setConversations(convList);

        if (selectIdAfter) {
          const matched = convList.find((c) => c._id === selectIdAfter);
          if (matched) setSelectedConv(matched);
        } else if (!selectedConvIdRef.current && convList.length > 0) {
          if (activeConversationId) {
            const found = convList.find((c) => c._id === activeConversationId);
            if (found) {
              setSelectedConv(found);
              return;
            }
          }
          if (window.innerWidth > 768) {
            setSelectedConv(convList[0]);
            onConversationChangeRef.current?.(convList[0]._id);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  }, [token, currentUser, activeConversationId]);

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
        onConversationChangeRef.current?.(convId);
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
    const targetId = (initialTargetUser._id || initialTargetUser.id || "").toString();
    if (!targetId) return;

    if (initializingTargetRef.current || initializedTargetIdRef.current === targetId) {
      return;
    }

    try {
      initializingTargetRef.current = true;
      initializedTargetIdRef.current = targetId;

      const res = await fetch(apiUrl("/api/chat/conversations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: targetId,
          cropId: initialTargetCrop?._id || initialTargetCrop?.id || null
        })
      });
      if (res.ok) {
        const conv = await res.json();
        setSelectedConv(conv);
        onConversationChangeRef.current?.(conv._id);
        fetchConversations(conv._id);
      }
    } catch (err) {
      console.error("Init target chat error:", err);
    } finally {
      initializingTargetRef.current = false;
    }
  }, [token, initialTargetUser, initialTargetCrop, fetchConversations]);

  // Initial load
  useEffect(() => {
    fetchConversations();
    if (initialTargetUser) {
      initTargetChat();
    }
  }, [fetchConversations, initialTargetUser, initTargetChat]);

  // If activeConversationId passed from props, select it
  useEffect(() => {
    if (activeConversationId) {
      setSelectedConv((prev) => {
        if (prev?._id === activeConversationId) return prev;
        const found = conversations.find((c) => c._id === activeConversationId);
        return found || prev;
      });
    }
  }, [activeConversationId]);

  // Socket.IO real-time setup
  useEffect(() => {
    if (!token || !currentUser) return;
    const socket = connectChatSocket(token);

    if (socket) {
      setIsSocketConnected(socket.connected);

      const onConnect = () => setIsSocketConnected(true);
      const onDisconnect = () => setIsSocketConnected(false);

      const onNewMessage = (msg) => {
        if (!msg || !msg._id) return;
        const myId = (currentUser?.id || currentUser?._id || "").toString();

        // If message belongs to active conversation
        if (msg.conversation === selectedConvIdRef.current) {
          setMessages((prev) => {
            // 1. If message already exists by real _id, ignore
            if (prev.some((m) => m._id === msg._id)) return prev;

            // 2. If it's sent by current user, replace matching optimistic temp message
            const senderId = (msg.sender?._id || msg.sender?.id || msg.sender || "").toString();
            if (senderId === myId) {
              const tempIndex = prev.findIndex((m) => m.tempId && m.text === msg.text);
              if (tempIndex !== -1) {
                const next = [...prev];
                next[tempIndex] = msg;
                return next;
              }
            }

            // 3. Fallback deduplication: check if another message with exact same sender and text within 2s exists
            const duplicateIndex = prev.findIndex(
              (m) =>
                (m.sender?._id || m.sender)?.toString() === senderId &&
                m.text === msg.text &&
                Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 2000
            );
            if (duplicateIndex !== -1) {
              const next = [...prev];
              next[duplicateIndex] = msg;
              return next;
            }

            return [...prev, msg];
          });
          scrollToBottom(true);

          // Mark message read if received by current user
          const recId = (msg.recipient?._id || msg.recipient?.id || msg.recipient || "").toString();
          if (recId === myId) {
            socket.emit("mark_read", msg.conversation);
            if (onConversationChange) onConversationChange(msg.conversation);
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
    setSelectedConv({ ...conv, unreadCount: 0 });
    setConversations((prev) =>
      prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
    );
    const socket = getChatSocket();
    if (socket && socket.connected) {
      socket.emit("mark_read", conv._id);
    }
    onConversationChangeRef.current?.(conv._id);
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

  // Send message - Instant, optimistic, zero-delay, and strictly non-duplicated
  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === "string" ? customText : inputText;
    if (!textToSend.trim() || !selectedConv || sending) return;

    const trimmedText = textToSend.trim();
    const currentUserId = (currentUser?.id || currentUser?._id || "").toString();
    const otherParticipant = getOtherParticipant(selectedConv);

    // 1. Immediately clear input so the user can begin typing the next message with ZERO delay
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus({ preventScroll: true });
    }
    setErrorNotice("");

    // 2. Immediately add optimistic message to UI for instant feedback
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const optimisticMessage = {
      _id: tempId,
      tempId,
      conversation: selectedConv._id,
      sender: {
        _id: currentUserId,
        name: currentUser.name || "You",
        role: currentUser.role,
        avatar: currentUser.avatar
      },
      recipient: otherParticipant?._id || otherParticipant?.id,
      text: trimmedText,
      read: false,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom(true);

    // Immediately update sidebar preview
    setConversations((prev) =>
      prev.map((c) =>
        c._id === selectedConv._id
          ? {
              ...c,
              lastMessage: trimmedText,
              lastSender: currentUserId,
              updatedAt: new Date().toISOString()
            }
          : c
      )
    );

    // 3. Deliver via REST API (single reliable write to MongoDB, triggers server-side socket broadcast)
    try {
      setSending(true);
      const res = await fetch(apiUrl(`/api/chat/conversations/${selectedConv._id}/messages`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: trimmedText,
          cropId: selectedConv.crop?._id || selectedConv.crop || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        const serverMsg = data.message;
        // Reconcile optimistic message with confirmed server message
        setMessages((prev) => {
          if (prev.some((m) => m._id === serverMsg._id)) {
            // Already received via socket event
            return prev.filter((m) => m._id !== tempId);
          }
          return prev.map((m) => (m._id === tempId ? serverMsg : m));
        });
        // Ensure conversation is in sidebar with latest message
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === selectedConv._id);
          if (!exists) {
            return [
              {
                ...selectedConv,
                lastMessage: trimmedText,
                lastMessageAt: new Date().toISOString(),
                lastSender: currentUserId,
                updatedAt: new Date().toISOString()
              },
              ...prev
            ];
          }
          return prev.map((c) =>
            c._id === selectedConv._id
              ? {
                  ...c,
                  lastMessage: trimmedText,
                  lastMessageAt: new Date().toISOString(),
                  lastSender: currentUserId,
                  updatedAt: new Date().toISOString()
                }
              : c
          );
        });
        onConversationChangeRef.current?.(selectedConv._id);
      } else {
        const errData = await res.json();
        setErrorNotice(errData.message || "Failed to deliver message.");
        // Revert failed optimistic message
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    } catch (err) {
      console.error("Send message error:", err);
      setErrorNotice("Could not deliver message. Please check connection.");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Handle input typing without page shift
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  // Keyboard Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Deduplicate conversations so each unique person only has ONE section/entry
  const uniqueConversations = useMemo(() => {
    const personMap = new Map();
    const sorted = [...conversations].sort((a, b) => {
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      const timeA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    for (const conv of sorted) {
      const other = getOtherParticipant(conv);
      const otherId = (other?._id || other?.id || other || "").toString();

      if (!otherId) {
        if (!personMap.has(conv._id)) personMap.set(conv._id, { ...conv });
        continue;
      }

      if (!personMap.has(otherId)) {
        personMap.set(otherId, { ...conv, otherParticipantId: otherId });
      } else {
        const existing = personMap.get(otherId);
        if (conv.unreadCount) {
          existing.unreadCount = (existing.unreadCount || 0) + conv.unreadCount;
        }
      }
    }

    return Array.from(personMap.values());
  }, [conversations, currentUser]);

  // Filter deduplicated conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return uniqueConversations;
    const q = searchQuery.toLowerCase();
    return uniqueConversations.filter((c) => {
      const other = getOtherParticipant(c);
      const otherName = (other?.name || "").toLowerCase();
      const otherRole = (other?.role || "").toLowerCase();
      const lastMsg = (c.lastMessage || "").toLowerCase();
      return otherName.includes(q) || otherRole.includes(q) || lastMsg.includes(q);
    });
  }, [uniqueConversations, searchQuery]);

  const otherUser = getOtherParticipant(selectedConv);

  const handleExitSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

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
              <div className="sidebar-action-buttons">
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
            </div>

            {/* Search Input Box with Back & Clear button */}
            <div className={`messages-search-box ${isSearchActive || searchQuery ? "active" : ""}`}>
              {isSearchActive || searchQuery ? (
                <button
                  type="button"
                  className="search-back-btn"
                  onClick={handleExitSearch}
                  title="Back from search"
                  aria-label="Back from search"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <Search size={16} className="search-icon" aria-hidden="true" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchActive(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("chat.searchPlaceholder") || "Search by farmer, buyer, or crop..."}
                className={`messages-search-input ${isSearchActive || searchQuery ? "with-back-btn" : ""}`}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleClearSearch}
                  title="Clear search text"
                  aria-label="Clear"
                >
                  <X size={15} />
                </button>
              ) : isSearchActive ? (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleExitSearch}
                  title="Cancel search"
                  aria-label="Cancel"
                >
                  <X size={15} />
                </button>
              ) : null}
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
                const isSelected =
                  selectedConv?._id === conv._id ||
                  (otherUser && other && (otherUser._id || otherUser.id) === (other._id || other.id));
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
                        <div className="conv-user-info-group">
                          <span className="conv-user-name">
                            {other?.name || "AgroConnect User"}
                          </span>
                          <span className={`conv-role-tag ${other?.role === "Farmer" ? "role-farmer" : "role-buyer"}`}>
                            {other?.role === "Farmer" ? (t("nav.roleFarmer") || "Farmer") : (t("nav.roleBuyer") || "Buyer")}
                          </span>
                        </div>
                        <span className="conv-timestamp">
                          {formatTime(conv.lastMessageAt || conv.updatedAt)}
                        </span>
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

                    {otherUser?.location && (
                      <div className="chat-header-subrow">
                        <span className="chat-header-location">
                          <MapPin size={12} /> {otherUser.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {/* MESSAGES SCROLL CONTAINER */}
              <div className="chat-messages-scroll-area" ref={messagesContainerRef}>

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
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={t("chat.typeMessage") || "Type a Message..."}
                    className="composer-textarea"
                  />
                  <button
                    type="button"
                    className="btn-composer-send"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
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
