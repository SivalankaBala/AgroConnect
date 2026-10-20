import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Home,
  Sprout,
  Search,
  MapPin,
  User,
  Mail,
  ShoppingCart,
  Tractor,
  ArrowRight,
  Check,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  MessageSquare,
  AlertCircle,
  Info,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Layers,
  Store,
  Scale,
  Eye,
  LogOut,
  Sun,
  Moon,
  Menu,
  Bell,
  XCircle,
  Camera,
  Upload,
  ChevronDown,
  TrendingUp,
  Package,
  CheckCheck,
  Settings
} from "lucide-react";
import "./App.css";
import { useLanguage } from "./context/LanguageContext";
import { translations } from "./i18n/translations";
import SplashScreen from "./components/SplashScreen";
import WeatherModal from "./components/WeatherModal";
import DirectChatModal from "./components/DirectChatModal";
import FarmerProfileModal from "./components/FarmerProfileModal";
import BuyerDirectoryModal from "./components/BuyerDirectoryModal";
import ProductDetailsModal from "./components/ProductDetailsModal";
import UserProfileModal from "./components/UserProfileModal";
import MobileBottomNav from "./components/MobileBottomNav";
import MobileHeaderMenu from "./components/MobileHeaderMenu";
import LocationSelector from "./components/LocationSelector";
import MessagesView from "./components/MessagesView";
import SidebarNav from "./components/SidebarNav";
import { UserAvatar, AgroConnectBrandLogoSvg } from "./components/UserAvatarLogo";
import { connectChatSocket, getChatSocket } from "./services/socket";
import { apiUrl } from "./config/api";

const PRESET_LOCATIONS = ["All", "Bhimavaram", "Anakapalli", "Kakinada", "Rajahmundry", "East Godavari"];

function getCropPhotoUrl(crop) {
  if (crop?.image && typeof crop.image === "string" && (crop.image.startsWith("http") || crop.image.startsWith("data:") || crop.image.startsWith("/"))) {
    return crop.image;
  }
  const lower = ((crop?.name || "") + " " + (crop?.category || "")).toLowerCase();
  if (lower.includes("chilli") || lower.includes("mirchi") || lower.includes("మిరప") || lower.includes("మిర్చి") || lower.includes("मिर्च")) {
    return "/crops/chillies.svg";
  }
  if (lower.includes("carrot") || lower.includes("క్యారెట్") || lower.includes("गाजर")) {
    return "/crops/carrots.svg";
  }
  if (lower.includes("mustard") || lower.includes("ఆవాలు") || lower.includes("सरसों")) {
    return "/crops/mustard.svg";
  }
  if (lower.includes("wheat") || lower.includes("గోధుమ") || lower.includes("गेहूं")) {
    return "/crops/wheat.svg";
  }
  if (lower.includes("rice") || lower.includes("paddy") || lower.includes("వరి") || lower.includes("బియ్యం") || lower.includes("धान") || lower.includes("चावल")) {
    return "/crops/rice.svg";
  }
  if (lower.includes("tomato") || lower.includes("టమోటా") || lower.includes("టమాట") || lower.includes("टमाटर")) {
    return "/crops/tomatoes.svg";
  }
  if (lower.includes("maize") || lower.includes("corn") || lower.includes("మొక్కజొన్న") || lower.includes("मक्का")) {
    return "/crops/maize.svg";
  }
  if (lower.includes("groundnut") || lower.includes("peanut") || lower.includes("వేరుశనగ") || lower.includes("పల్లీ") || lower.includes("मूंगफली")) {
    return "/crops/groundnut.svg";
  }
  if (lower.includes("spice") || lower.includes("masala") || lower.includes("turmeric") || lower.includes("పసుపు") || lower.includes("हल्दी")) {
    return "/crops/chillies.svg";
  }
  if (lower.includes("veg") || lower.includes("కూరగాయలు") || lower.includes("సబ్జీ")) {
    return "/crops/carrots.svg";
  }
  return "/crops/default.svg";
}

function getCropVisualTheme(name = "", category = "") {
  const lower = name.toLowerCase();
  if (lower.includes("rice") || lower.includes("paddy") || lower.includes("వరి") || lower.includes("धान")) {
    return { emoji: "🌾", bgClass: "theme-grain" };
  }
  if (lower.includes("chilli") || lower.includes("mirchi") || lower.includes("మిరప") || lower.includes("మిర్చి") || lower.includes("मिर्च")) {
    return { emoji: "🌶️", bgClass: "theme-spice" };
  }
  if (lower.includes("maize") || lower.includes("corn") || lower.includes("మొక్కజొన్న") || lower.includes("मक्का")) {
    return { emoji: "🌽", bgClass: "theme-maize" };
  }
  if (lower.includes("tomato") || lower.includes("టమోటా") || lower.includes("टमाटर")) {
    return { emoji: "🍅", bgClass: "theme-veg" };
  }
  if (lower.includes("groundnut") || lower.includes("peanut") || lower.includes("వేరుశనగ") || lower.includes("मूंगफली")) {
    return { emoji: "🥜", bgClass: "theme-pulse" };
  }
  if (lower.includes("turmeric") || lower.includes("పసుపు") || lower.includes("हल्दी")) {
    return { emoji: "🫚", bgClass: "theme-turmeric" };
  }
  if (category === "Vegetables") {
    return { emoji: "🥬", bgClass: "theme-veg" };
  }
  if (category === "Spices") {
    return { emoji: "🌿", bgClass: "theme-spice" };
  }
  if (category === "Pulses & Nuts") {
    return { emoji: "🫘", bgClass: "theme-pulse" };
  }
  return { emoji: "🌱", bgClass: "theme-default" };
}

function formatEnquiryDate(dateStr, lang) {
  if (!dateStr) return "";
  try {
    const locale = lang === "te" ? "te-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(dateStr, lang) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return "Yesterday";
    return formatEnquiryDate(dateStr, lang);
  } catch {
    return dateStr;
  }
}

function playChatNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // browser audio autoplay restrictions ignored safely
  }
}

function App() {
  const { language, t } = useLanguage();

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cropsError, setCropsError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sortBy, setSortBy] = useState("featured"); // 'featured' | 'price-asc' | 'price-desc' | 'qty-desc'

  const [modal, setModal] = useState(""); // '' | 'listing' | 'editCrop' | 'login' | 'register' | 'enquiry' | 'dashboard' | 'buyerDashboard'
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [notice, setNotice] = useState(null); // { message: string, type: 'success' | 'info' | 'error' }

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("agroconnectUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Theme state - Default is white (light mode)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const explicit = localStorage.getItem("agroconnectThemeExplicit");
      if (explicit === "true") {
        return localStorage.getItem("agroconnectTheme") === "dark";
      }
      return false; // Default theme is white
    } catch {
      return false;
    }
  });

  const toggleTheme = (newMode) => {
    setDarkMode((prev) => {
      const updated = typeof newMode === "boolean" ? newMode : !prev;
      try {
        localStorage.setItem("agroconnectThemeExplicit", "true");
        localStorage.setItem("agroconnectTheme", updated ? "dark" : "light");
      } catch { }
      return updated;
    });
  };

  // Mobile top header hamburger drawer menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.setAttribute("data-theme", "dark");
        document.body.classList.add("dark-theme");
      } else {
        document.documentElement.removeAttribute("data-theme");
        document.body.classList.remove("dark-theme");
      }
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Crop creation form state
  const [listing, setListing] = useState({
    name: "",
    category: "Grains",
    price: "",
    unit: "kg",
    quantity: "",
    location: "",
    description: ""
  });

  // Crop editing state
  const [editingCrop, setEditingCrop] = useState(null);

  // Authentication form state
  const [account, setAccount] = useState({
    name: "",
    email: "",
    password: "",
    role: "Farmer"
  });
  const [authModalKey, setAuthModalKey] = useState(0);
  const [formReady, setFormReady] = useState(false);

  const openLoginModal = useCallback((role = "Buyer") => {
    setAccount({ name: "", email: "", password: "", role });
    setAuthModalKey((k) => k + 1);
    setFormReady(false);
    setModal("login");
  }, []);

  const openRegisterModal = useCallback((role = "Farmer") => {
    setAccount({ name: "", email: "", password: "", role });
    setAuthModalKey((k) => k + 1);
    setFormReady(false);
    setModal("register");
  }, []);

  const closeModal = useCallback(() => {
    setModal("");
    setAccount({ name: "", email: "", password: "", role: "Farmer" });
    setFormReady(false);
  }, []);

  // Ensure login/register credentials do not linger in state when auth modal is closed
  useEffect(() => {
    if (!modal) {
      setAccount({ name: "", email: "", password: "", role: "Farmer" });
      setFormReady(false);
    } else if (modal === "login" || modal === "register") {
      setAccount((prev) => ({ ...prev, email: "", password: "" }));
      const timer = setTimeout(() => {
        setFormReady(true);
        setAccount((prev) => ({ ...prev, email: "", password: "" }));
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [modal]);

  // Farmer Dashboard states
  const [dashboardListings, setDashboardListings] = useState([]);
  const [dashboardEnquiries, setDashboardEnquiries] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardTab, setDashboardTab] = useState("all"); // 'all' | 'listings' | 'enquiries' | 'orders' | 'sales-report'

  // Buyer Dashboard states
  const [buyerDashboardTab, setBuyerDashboardTab] = useState("all"); // 'all' | 'enquiries' | 'orders'
  const [buyerEnquiries, setBuyerEnquiries] = useState([]);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const [buyerError, setBuyerError] = useState("");
  const [buyerNotifications, setBuyerNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all"); // 'all' | 'unread'
  const notifDropdownRef = useRef(null);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  const filteredNotifications = useMemo(() => {
    if (!Array.isArray(buyerNotifications)) return [];
    if (notifFilter === "unread") {
      return buyerNotifications.filter((n) => !n.read);
    }
    return buyerNotifications;
  }, [buyerNotifications, notifFilter]);

  // Order action confirmation modal states
  const [orderConfirmModal, setOrderConfirmModal] = useState({
    isOpen: false,
    action: null,
    enquiry: null
  });
  const [processingOrderAction, setProcessingOrderAction] = useState(false);

  // Splash Screen State (shown briefly on initial session load)
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem("agroconnectSplashShown");
    } catch {
      return false;
    }
  });

  // New Modals State
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [chatCrop, setChatCrop] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatNotification, setChatNotification] = useState(null);
  const [activeChatConversationId, setActiveChatConversationId] = useState(null);

  const [farmerProfileModalOpen, setFarmerProfileModalOpen] = useState(false);
  const [activeFarmerId, setActiveFarmerId] = useState(null);

  const [buyerDirectoryModalOpen, setBuyerDirectoryModalOpen] = useState(false);

  const [productDetailsModalOpen, setProductDetailsModalOpen] = useState(false);
  const [productDetailsCrop, setProductDetailsCrop] = useState(null);

  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [userProfileTab, setUserProfileTab] = useState("overview"); // 'overview' | 'settings'

  // Mobile Bottom Navigation active item
  const [mobileNavActive, setMobileNavActive] = useState(() => {
    try {
      const stored = sessionStorage.getItem("agroconnectUser");
      const user = stored ? JSON.parse(stored) : null;
      const hash = window.location.hash.toLowerCase();
      if (!user) return "home";
      if (user.role === "Farmer") {
        if (hash === "#farmers") return "farmers";
        return "farmerDashboard";
      }
      if (user.role === "Buyer") {
        if (hash === "#buyer-dashboard") return "buyerDashboard";
        return "crops";
      }
    } catch {
      // ignore
    }
    return "home";
  });

  // Current view: 'home' | 'marketplace' | 'buyer-dashboard' | 'farmer-dashboard' | 'farmers'
  const [currentView, setCurrentView] = useState(() => {
    try {
      const stored = sessionStorage.getItem("agroconnectUser");
      const user = stored ? JSON.parse(stored) : null;
      const hash = window.location.hash.toLowerCase();

      if (!user) {
        if (hash === "#home" || hash === "#how-it-works") return "home";
        return "marketplace";
      }
      if (user.role === "Farmer") {
        if (hash === "#farmers") return "farmers";
        return "farmer-dashboard";
      }
      if (user.role === "Buyer") {
        if (hash === "#buyer-dashboard") return "buyer-dashboard";
        return "marketplace";
      }
    } catch {
      // ignore
    }
    return "marketplace";
  });

  // Farmer discovery data
  const [farmersList, setFarmersList] = useState([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [topFarmers, setTopFarmers] = useState([]);

  // Fetch farmers list from real backend
  const fetchFarmersList = useCallback(async () => {
    try {
      setFarmersLoading(true);
      const res = await fetch(apiUrl("/api/farmers"));
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setFarmersList(list);
        setTopFarmers(list.slice(0, 6));
      }
    } catch (err) {
      console.warn("Could not load farmers list:", err);
    } finally {
      setFarmersLoading(false);
    }
  }, []);

  // Fetch farmer's own dashboard listings and enquiries
  const fetchFarmerDashboardData = useCallback(async () => {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token) return;

    setDashboardLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [listingsRes, enquiriesRes] = await Promise.all([
        fetch(apiUrl("/api/crops/my-listings"), { headers }),
        fetch(apiUrl("/api/enquiries/farmer"), { headers })
      ]);

      if (listingsRes.ok && enquiriesRes.ok) {
        const [listings, enquiries] = await Promise.all([
          listingsRes.json(),
          enquiriesRes.json()
        ]);
        setDashboardListings(Array.isArray(listings) ? listings : []);
        setDashboardEnquiries(Array.isArray(enquiries) ? enquiries : []);
      }
    } catch (error) {
      console.warn("Failed to load farmer dashboard data:", error);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Fetch buyer's own submitted purchase enquiries
  const fetchBuyerEnquiries = useCallback(async () => {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token) return;

    setBuyerLoading(true);
    setBuyerError("");
    try {
      const res = await fetch(apiUrl("/api/enquiries/my-enquiries"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBuyerEnquiries(Array.isArray(data) ? data : []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Could not load your enquiries.");
      }
    } catch (err) {
      setBuyerError(err.message || "Failed to load enquiries.");
    } finally {
      setBuyerLoading(false);
    }
  }, []);

  // Fetch buyer notifications from database
  const fetchBuyerNotifications = useCallback(async () => {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token) return;

    try {
      setNotificationsLoading(true);
      const res = await fetch(apiUrl("/api/notifications"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBuyerNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadNotificationCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notifId) => {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token || !notifId) return;

    try {
      const res = await fetch(apiUrl(`/api/notifications/${notifId}/read`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBuyerNotifications((prev) =>
          prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
        );
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn("Failed to mark notification read:", err);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token) return;

    try {
      const res = await fetch(apiUrl("/api/notifications/read-all"), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBuyerNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadNotificationCount(0);
      }
    } catch (err) {
      console.warn("Failed to mark all notifications read:", err);
    }
  }, []);

  // Close notification dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setNotifDropdownOpen(false);
      }
    }
    if (notifDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notifDropdownOpen]);

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileDropdownOpen]);

  const handlePromptOrderAction = (enquiry, action) => {
    setOrderConfirmModal({
      isOpen: true,
      action,
      enquiry
    });
  };

  const executeOrderAction = async () => {
    if (!orderConfirmModal.enquiry || !orderConfirmModal.action) return;
    const { enquiry, action } = orderConfirmModal;
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token) {
      triggerNotice("Authentication required", "error");
      return;
    }

    setProcessingOrderAction(true);
    try {
      const res = await fetch(apiUrl(`/api/enquiries/${enquiry._id}/${action}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${action} order.`);
      }

      const newStatus = action === "confirm" ? "confirmed" : "rejected";
      setDashboardEnquiries((prev) =>
        prev.map((item) => (item._id === enquiry._id ? { ...item, status: newStatus } : item))
      );

      triggerNotice(
        action === "confirm"
          ? (t("farmerDashboard.orderConfirmedSuccess") || "Order confirmed successfully! The buyer has been notified.")
          : (t("farmerDashboard.orderRejectedSuccess") || "Order rejected. The buyer has been notified."),
        "success"
      );

      setOrderConfirmModal({ isOpen: false, action: null, enquiry: null });
    } catch (error) {
      console.error("Order action error:", error);
      triggerNotice(error.message || `Failed to process order action. Please try again.`, "error");
    } finally {
      setProcessingOrderAction(false);
    }
  };

  const goToMarketplace = useCallback(() => {
    setCurrentView("marketplace");
    setMobileNavActive("crops");
    if (window.location.hash !== "#marketplace") {
      window.location.hash = "marketplace";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goToFarmerDashboard = useCallback(() => {
    setCurrentView("farmer-dashboard");
    setDashboardTab("all");
    setMobileNavActive("farmerDashboard");
    if (window.location.hash !== "#farmer-dashboard") {
      window.location.hash = "farmer-dashboard";
    }
    fetchFarmerDashboardData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchFarmerDashboardData]);



  const resolveActiveUser = useCallback((userOverride) => {
    // If userOverride is a DOM or React event (e.g. from an onClick handler), ignore it
    if (
      userOverride &&
      (userOverride.nativeEvent ||
        typeof userOverride.preventDefault === "function" ||
        userOverride.target)
    ) {
      userOverride = undefined;
    }
    if (userOverride && typeof userOverride === "object" && userOverride.role) {
      return userOverride;
    }
    if (currentUserRef.current) return currentUserRef.current;
    if (currentUser) return currentUser;
    try {
      const stored = sessionStorage.getItem("agroconnectUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [currentUser]);

  const navigateToMarketplace = useCallback((userOverride) => {
    const activeUser = resolveActiveUser(userOverride);
    if (activeUser?.role === "Farmer") {
      triggerNotice(t("notices.buyerOnlyArea"), "info");
      goToFarmerDashboard();
      return;
    }
    goToMarketplace();
  }, [resolveActiveUser, t, goToFarmerDashboard, goToMarketplace]);

  const navigateToFarmerDashboard = useCallback((userOverride) => {
    const activeUser = resolveActiveUser(userOverride);
    if (!activeUser) {
      triggerNotice(t("notices.loginToAccess"), "info");
      openLoginModal("Farmer");
      return;
    }
    if (activeUser.role !== "Farmer") {
      triggerNotice(t("notices.farmerOnlyArea"), "info");
      goToMarketplace();
      return;
    }
    goToFarmerDashboard();
  }, [resolveActiveUser, t, goToFarmerDashboard, goToMarketplace, openLoginModal]);

  const navigateToHome = useCallback(() => {
    const activeUser = resolveActiveUser();
    if (activeUser?.role === "Buyer") {
      navigateToMarketplace(activeUser);
      return;
    }
    if (activeUser?.role === "Farmer") {
      navigateToFarmerDashboard(activeUser);
      return;
    }
    setCurrentView("home");
    setMobileNavActive("home");
    if (window.location.hash !== "#home") {
      window.location.hash = "home";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resolveActiveUser, navigateToMarketplace, navigateToFarmerDashboard]);

  const navigateToBuyerDashboard = useCallback((userOverride) => {
    const activeUser = resolveActiveUser(userOverride);
    if (!activeUser) {
      triggerNotice(t("notices.loginToAccess"), "info");
      openLoginModal("Buyer");
      return;
    }
    if (activeUser.role !== "Buyer") {
      triggerNotice(t("notices.buyerOnlyArea"), "info");
      if (activeUser.role === "Farmer") {
        goToFarmerDashboard();
      } else {
        goToMarketplace();
      }
      return;
    }
    setCurrentView("buyer-dashboard");
    setBuyerDashboardTab("all");
    setMobileNavActive("buyerDashboard");
    if (window.location.hash !== "#buyer-dashboard") {
      window.location.hash = "buyer-dashboard";
    }
    fetchBuyerEnquiries();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resolveActiveUser, t, goToFarmerDashboard, goToMarketplace, fetchBuyerEnquiries, openLoginModal]);

  const navigateToFarmerDiscovery = useCallback((userOverride) => {
    const activeUser = resolveActiveUser(userOverride);
    if (!activeUser || activeUser.role !== "Farmer") {
      triggerNotice(t("notices.farmerOnlyArea"), "info");
      if (activeUser?.role === "Buyer") goToMarketplace();
      else navigateToHome();
      return;
    }
    setCurrentView("farmers");
    setMobileNavActive("farmers");
    if (window.location.hash !== "#farmers") {
      window.location.hash = "farmers";
    }
    fetchFarmersList();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resolveActiveUser, t, fetchFarmersList, goToMarketplace, navigateToHome]);

  const navigateToMessages = useCallback((recipient = null, crop = null, conversationId = null) => {
    const activeUser = currentUserRef.current || currentUser;
    if (!activeUser) {
      triggerNotice(t("chat.loginRequired") || "Please sign in to view your messages.", "info");
      openLoginModal("Buyer");
      return;
    }
    setChatRecipient(recipient);
    setChatCrop(crop);
    if (conversationId) {
      setActiveChatConversationId(conversationId);
    }
    setChatNotification(null);
    setCurrentView("messages");
    setMobileNavActive("messages");
    if (window.location.hash !== "#messages") {
      window.location.hash = "messages";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentUser, openLoginModal, t]);

  const handleJoinRole = useCallback((role) => {
    openRegisterModal(role);
  }, [openRegisterModal]);

  const handleClearNotification = useCallback(async (notifId) => {
    const token = sessionStorage.getItem("agroconnectToken");
    setBuyerNotifications((prev) => prev.filter((n) => n._id !== notifId));
    setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    if (!token || !notifId) return;
    try {
      await fetch(apiUrl(`/api/notifications/${notifId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn("Failed to delete notification:", err);
    }
  }, []);

  const handleSidebarNavigate = useCallback((id) => {
    if (currentUser?.role === "Farmer") {
      if (id === "dashboard") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("all");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (id === "products") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("listings");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (id === "enquiries") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("enquiries");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (id === "orders") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("orders");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (id === "sales-report") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("sales-report");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (id === "messages") {
        navigateToMessages();
      } else if (id === "settings") {
        setUserProfileTab("settings");
        setUserProfileModalOpen(true);
      }
    } else {
      // Buyer Navigation
      if (id === "dashboard") {
        setCurrentView("buyer-dashboard");
        setBuyerDashboardTab("all");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (id === "enquiries") {
        setCurrentView("buyer-dashboard");
        setBuyerDashboardTab("enquiries");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (id === "orders") {
        setCurrentView("buyer-dashboard");
        setBuyerDashboardTab("orders");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (id === "purchases-report") {
        setCurrentView("buyer-dashboard");
        setBuyerDashboardTab("purchases-report");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (id === "marketplace") {
        navigateToMarketplace();
      } else if (id === "messages") {
        navigateToMessages();
      } else if (id === "settings") {
        setUserProfileTab("settings");
        setUserProfileModalOpen(true);
      }
    }
  }, [currentUser, navigateToMarketplace, navigateToMessages]);

  const handleNotificationClick = useCallback((notif) => {
    if (!notif) return;
    if (!notif.read && notif._id) {
      markNotificationAsRead(notif._id);
    }
    setNotifDropdownOpen(false);
    if (notif.type === "order_confirmed" || notif.type === "order_rejected" || notif.type === "enquiry") {
      if (currentUser?.role === "Buyer") {
        navigateToBuyerDashboard();
      } else {
        navigateToFarmerDashboard();
      }
    } else if (notif.conversationId) {
      navigateToMessages(null, null, notif.conversationId);
    }
  }, [currentUser, markNotificationAsRead, navigateToBuyerDashboard, navigateToFarmerDashboard, navigateToMessages]);


    const openListingModal = useCallback(() => {
    const token = sessionStorage.getItem("agroconnectToken");
    const activeUser = currentUserRef.current || currentUser;
    if (!token || !activeUser) {
      triggerNotice(t("notices.loginAsFarmerToList"), "info");
      openRegisterModal("Farmer");
      return;
    }

    if (activeUser.role !== "Farmer") {
      triggerNotice(t("notices.buyerCannotList"), "error");
      return;
    }

    setListing({
      name: "",
      category: "Grains",
      price: "",
      unit: "kg",
      quantity: "",
      location: "",
      description: "",
      image: ""
    });
    setModal("listing");
  }, [currentUser, t, openRegisterModal]);

  const handleCropImageUpload = (e, target = "listing") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      triggerNotice("Image file size should be less than 8MB", "error", "File Too Large");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 900;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        if (target === "edit") {
          setEditingCrop((prev) => (prev ? { ...prev, image: dataUrl } : prev));
        } else {
          setListing((prev) => ({ ...prev, image: dataUrl }));
        }
        triggerNotice("Crop photo attached successfully!", "success", "Photo Added");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Synchronize route and enforce role access on hash changes
  useEffect(() => {
    const syncRouteFromHash = () => {
      const hash = window.location.hash.toLowerCase();
      const activeUser = currentUserRef.current || currentUser || (() => {
        try {
          const stored = sessionStorage.getItem("agroconnectUser");
          return stored ? JSON.parse(stored) : null;
        } catch {
          return null;
        }
      })();

      if (!activeUser) {
        // GUEST RULES: only #home and #how-it-works permitted
        if (
          hash === "#messages" ||
          hash === "#marketplace" ||
          hash === "#buyer-dashboard" ||
          hash === "#farmer-dashboard" ||
          hash === "#list-crop" ||
          hash === "#farmers" ||
          hash === "#profile" ||
          hash === "#my-products" ||
          hash === "#products" ||
          hash === "#buyer-enquiries" ||
          hash === "#enquiries" ||
          hash === "#orders" ||
          hash === "#sales-report" ||
          hash === "#settings"
        ) {
          triggerNotice(t("chat.loginRequired") || t("notices.loginToExploreMarketplace"), "info");
          openLoginModal("Buyer");
          setCurrentView("home");
          setMobileNavActive("home");
          window.history.replaceState(null, "", "#home");
        } else {
          setCurrentView("home");
          setMobileNavActive("home");
        }
        return;
      }

      if (activeUser.role === "Buyer") {
        // BUYER RULES: #messages, #marketplace, #buyer-dashboard, #profile permitted
        if (hash === "#messages") {
          setCurrentView("messages");
          setMobileNavActive("messages");
          fetchUnreadChats();
        } else if (hash === "#buyer-dashboard") {
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab("all");
          setMobileNavActive("buyerDashboard");
          fetchBuyerEnquiries();
        } else if (hash === "#buyer-enquiries") {
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab("enquiries");
          setMobileNavActive("buyerDashboard");
          fetchBuyerEnquiries();
        } else if (hash === "#order-updates") {
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab("orders");
          setMobileNavActive("buyerDashboard");
          fetchBuyerEnquiries();
        } else if (hash === "#profile" || hash === "#settings") {
          setUserProfileTab(hash === "#settings" ? "settings" : "overview");
          setUserProfileModalOpen(true);
          setCurrentView("marketplace");
          setMobileNavActive("profile");
        } else if (
          hash === "#farmer-dashboard" ||
          hash === "#list-crop" ||
          hash === "#farmers" ||
          hash === "#my-products" ||
          hash === "#products" ||
          hash === "#orders" ||
          hash === "#sales-report"
        ) {
          triggerNotice(t("notices.farmerOnlyArea"), "info");
          setCurrentView("marketplace");
          setMobileNavActive("crops");
          window.history.replaceState(null, "", "#marketplace");
        } else {
          setCurrentView("marketplace");
          setMobileNavActive("crops");
          if (hash !== "#marketplace") {
            window.history.replaceState(null, "", "#marketplace");
          }
        }
        return;
      }

      if (activeUser.role === "Farmer") {
        // FARMER RULES: #messages, #farmer-dashboard, #farmers, #list-crop, #profile, #my-products, #buyer-enquiries, #orders, #sales-report, #settings permitted
        if (hash === "#messages") {
          setCurrentView("messages");
          setMobileNavActive("messages");
          fetchUnreadChats();
        } else if (hash === "#farmers") {
          setCurrentView("farmers");
          setMobileNavActive("farmers");
          fetchFarmersList();
        } else if (hash === "#list-crop") {
          setCurrentView("farmer-dashboard");
          setMobileNavActive("listCrop");
          openListingModal();
        } else if (hash === "#profile" || hash === "#settings") {
          setUserProfileTab(hash === "#settings" ? "settings" : "overview");
          setUserProfileModalOpen(true);
          setCurrentView("farmer-dashboard");
          setMobileNavActive("profile");
        } else if (hash === "#my-products" || hash === "#products") {
          setCurrentView("farmer-dashboard");
          setDashboardTab("listings");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
        } else if (hash === "#buyer-enquiries" || hash === "#enquiries") {
          setCurrentView("farmer-dashboard");
          setDashboardTab("enquiries");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
        } else if (hash === "#orders") {
          setCurrentView("farmer-dashboard");
          setDashboardTab("orders");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
        } else if (hash === "#sales-report") {
          setCurrentView("farmer-dashboard");
          setDashboardTab("sales-report");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
        } else if (hash === "#marketplace" || hash === "#buyer-dashboard") {
          triggerNotice(t("notices.buyerOnlyArea"), "info");
          setCurrentView("farmer-dashboard");
          setMobileNavActive("farmerDashboard");
          window.history.replaceState(null, "", "#farmer-dashboard");
        } else {
          setCurrentView("farmer-dashboard");
          setDashboardTab("all");
          setMobileNavActive("farmerDashboard");
          if (hash !== "#farmer-dashboard" && hash !== "#dashboard") {
            window.history.replaceState(null, "", "#farmer-dashboard");
          }
          fetchFarmerDashboardData();
        }
      }
    };

    syncRouteFromHash();
    window.addEventListener("hashchange", syncRouteFromHash);
    return () => window.removeEventListener("hashchange", syncRouteFromHash);
  }, [currentUser, t, fetchBuyerEnquiries, fetchFarmerDashboardData, fetchFarmersList, openListingModal, openLoginModal]);

  // Enquiry quick message templates
  const [enquiryMessage, setEnquiryMessage] = useState("");

  // Categories with localized labels
  const categories = useMemo(() => [
    { id: "All", label: t("categories.All"), icon: "🌾" },
    { id: "Grains", label: t("categories.Grains"), icon: "🍚" },
    { id: "Vegetables", label: t("categories.Vegetables"), icon: "🍅" },
    { id: "Spices", label: t("categories.Spices"), icon: "🌶️" },
    { id: "Pulses & Nuts", label: t("categories.Pulses & Nuts"), icon: "🥜" }
  ], [t]);

  // Localized crop suggestions
  const popularCropsSuggestions = useMemo(() => {
    return translations[language]?.cropSuggestions || translations.en.cropSuggestions;
  }, [language]);


  const fetchUnreadChats = useCallback(async () => {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token || !currentUser) {
      setUnreadChatCount(0);
      return;
    }
    try {
      const res = await fetch(apiUrl("/api/chat/unread-count"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadChatCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  const currentViewRef = useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  const activeChatConvRef = useRef(activeChatConversationId);
  useEffect(() => {
    activeChatConvRef.current = activeChatConversationId;
  }, [activeChatConversationId]);

  // Auto-dismiss floating chat notification after 7 seconds
  useEffect(() => {
    if (!chatNotification) return;
    const timer = setTimeout(() => {
      setChatNotification(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [chatNotification]);

  // If user opens the conversation that the notification belongs to, dismiss notification immediately
  useEffect(() => {
    if (
      chatNotification &&
      currentView === "messages" &&
      activeChatConversationId &&
      (chatNotification.conversationId || "").toString() === activeChatConversationId.toString()
    ) {
      setChatNotification(null);
    }
  }, [chatNotification, currentView, activeChatConversationId]);

  const handleOpenChatNotification = useCallback((notif) => {
    if (!notif) return;
    setChatNotification(null);
    navigateToMessages(null, null, notif.conversationId);
  }, [navigateToMessages]);

  // Global socket listener & reactive unread chats counter & notifications
  useEffect(() => {
    if (!currentUser) {
      setUnreadChatCount(0);
      setChatNotification(null);
      return;
    }

    const token = sessionStorage.getItem("agroconnectToken");
    if (!token) return;

    fetchUnreadChats();

    const socket = connectChatSocket(token);

    const notifiedMsgIds = new Set();
    const handleMessageArrival = (msg) => {
      fetchUnreadChats();
      if (!msg || !msg._id) return;
      if (notifiedMsgIds.has(msg._id)) return;
      notifiedMsgIds.add(msg._id);

      const recipientId = (msg.recipient?._id || msg.recipient?.id || msg.recipient || "").toString();
      const senderId = (msg.sender?._id || msg.sender?.id || msg.sender || "").toString();
      const myId = (currentUser?.id || currentUser?._id || "").toString();

      // Only notify if message was sent TO current user and NOT BY current user
      if (recipientId && myId && recipientId === myId && senderId !== myId) {
        // If user is currently looking at this active conversation in MessagesView, don't show toast
        const isCurrentlyViewingConv =
          currentViewRef.current === "messages" &&
          activeChatConvRef.current &&
          activeChatConvRef.current.toString() === (msg.conversation || "").toString();

        if (!isCurrentlyViewingConv) {
          playChatNotificationSound();
          const senderName = msg.sender?.name || t("chat.someone") || "Someone";
          const senderRole = msg.sender?.role || "User";
          const senderAvatar = msg.sender?.avatar || (senderRole === "Farmer" ? "🧑‍🌾" : "🛒");
          const textPreview = msg.text || "Sent a message";

          setChatNotification({
            id: msg._id || Date.now(),
            conversationId: msg.conversation,
            senderName,
            senderRole,
            senderAvatar,
            text: textPreview,
            crop: msg.crop?.name || null
          });
        }
      }
    };

    const handleUpdate = () => {
      fetchUnreadChats();
    };

    const handleNotificationArrival = (notif) => {
      fetchBuyerNotifications();
      fetchBuyerEnquiries();
      if (notif && notif.title) {
        triggerNotice(
          notif.message,
          notif.type === "order_confirmed" ? "success" : notif.type === "order_rejected" ? "error" : "info",
          notif.title
        );
      }
    };

    const handleOrderStatusUpdate = () => {
      fetchBuyerEnquiries();
      fetchFarmerDashboardData();
      if (currentUser?.role === "Buyer") {
        fetchBuyerNotifications();
      }
    };

    if (socket) {
      socket.on("new_message", handleMessageArrival);
      socket.on("message_notification", handleMessageArrival);
      socket.on("unread_count_updated", handleUpdate);
      socket.on("conversation_updated", handleUpdate);
      socket.on("messages_read", handleUpdate);
      socket.on("notification", handleNotificationArrival);
      socket.on("order_status_updated", handleOrderStatusUpdate);
    }

    const pollInterval = setInterval(() => {
      fetchUnreadChats();
      if (currentUser) {
        fetchBuyerNotifications();
      }
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.off("new_message", handleMessageArrival);
        socket.off("message_notification", handleMessageArrival);
        socket.off("unread_count_updated", handleUpdate);
        socket.off("conversation_updated", handleUpdate);
        socket.off("messages_read", handleUpdate);
        socket.off("notification", handleNotificationArrival);
        socket.off("order_status_updated", handleOrderStatusUpdate);
      }
    };
  }, [currentUser, fetchUnreadChats, t]);

  const handleConversationChange = useCallback((convId) => {
    setActiveChatConversationId(convId);
    setChatNotification((prev) => {
      if (prev && (prev.conversationId || "").toString() === (convId || "").toString()) {
        return null;
      }
      return prev;
    });
    fetchUnreadChats();
  }, [fetchUnreadChats]);

  const handleStartChat = useCallback((recipient, crop = null) => {
    if (!currentUser) {
      triggerNotice(t("chat.loginRequired") || "Please sign in to start chatting.", "info");
      openLoginModal("Buyer");
      return;
    }
    setProductDetailsModalOpen(false);
    setFarmerProfileModalOpen(false);
    setActiveFarmerId(null);
    navigateToMessages(recipient, crop);
  }, [currentUser, openLoginModal, t, navigateToMessages]);

  const handleOpenFarmerProfile = (farmerId) => {
    if (!farmerId) {
      if (topFarmers.length > 0) {
        setActiveFarmerId(topFarmers[0]._id);
        setFarmerProfileModalOpen(true);
      } else {
        triggerNotice("No farmer profile found", "info");
      }
      return;
    }
    setActiveFarmerId(farmerId);
    setFarmerProfileModalOpen(true);
  };

  const handleOpenProductDetails = (crop) => {
    setProductDetailsCrop(crop);
    setProductDetailsModalOpen(true);
  };

  const handleMobileNavClick = (tab) => {
    setMobileNavActive(tab);
    if (tab === "home") {
      navigateToHome();
    } else if (tab === "crops" || tab === "marketplace") {
      navigateToMarketplace();
    } else if (tab === "buyerDashboard") {
      navigateToBuyerDashboard();
    } else if (tab === "listCrop") {
      openListingModal();
    } else if (tab === "farmers") {
      navigateToFarmerDiscovery();
    } else if (tab === "farmerDashboard") {
      navigateToFarmerDashboard();
    } else if (tab === "messages") {
      navigateToMessages();
    } else if (tab === "profile") {
      if (currentUser) {
        setUserProfileModalOpen(true);
      } else {
        openLoginModal("Buyer");
      }
    }
  };

  // Auto-dismiss notice after 6 seconds
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => {
        setNotice(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  // Fetch crops & verify authentication on mount
  useEffect(() => {
    fetchCrops();
    verifyAuthSession();
    fetchFarmersList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user is authenticated, load their role dashboard data & notifications
  useEffect(() => {
    if (currentUser?.role === "Farmer") {
      fetchFarmerDashboardData();
      fetchBuyerNotifications();
    } else if (currentUser?.role === "Buyer") {
      fetchBuyerEnquiries();
      fetchBuyerNotifications();
    }
  }, [currentUser, fetchFarmerDashboardData, fetchBuyerEnquiries, fetchBuyerNotifications]);

  // Poll unread messages for logged in users
  useEffect(() => {
    if (currentUser) {
      fetchUnreadChats();
      const interval = setInterval(fetchUnreadChats, 12000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchUnreadChats]);

  function triggerNotice(message, type = "info", title = null) {
    setNotice({ message, type, title });
  }

  async function verifyAuthSession() {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token) return;

    try {
      const res = await fetch(apiUrl("/api/auth/me"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUserRef.current = data.user;
        setCurrentUser(data.user);
        sessionStorage.setItem("agroconnectUser", JSON.stringify(data.user));
      } else {
        sessionStorage.removeItem("agroconnectToken");
        sessionStorage.removeItem("agroconnectUser");
        currentUserRef.current = null;
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn("Session check failed or offline:", err);
    }
  }

  async function fetchCrops() {
    try {
      setLoading(true);
      setCropsError("");
      const res = await fetch(apiUrl("/api/crops"));
      if (!res.ok) throw new Error("Failed to fetch crops from server");
      const data = await res.json();
      setCrops(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Backend fetch error:", error);
      setCrops([]);
      setCropsError(t("marketplace.loadErrorDesc"));
    } finally {
      setLoading(false);
    }
  }

  const availableLocations = useMemo(() => {
    const seen = new Set(PRESET_LOCATIONS.map((l) => l.toLowerCase()));
    const extras = [];
    crops.forEach((crop) => {
      if (!crop.location) return;
      const clean = crop.location.trim().split(",")[0].trim();
      if (clean && !seen.has(clean.toLowerCase()) && !seen.has(crop.location.trim().toLowerCase())) {
        seen.add(clean.toLowerCase());
        extras.push(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    });
    return [...PRESET_LOCATIONS, ...extras];
  }, [crops]);

  const filteredCrops = useMemo(() => {
    let result = crops.filter((crop) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        `${crop.name} ${crop.location} ${crop.farmerName || ""} ${crop.category}`.toLowerCase().includes(query);

      const matchesCategory = category === "All" || crop.category === category;

      let matchesLocation = true;
      if (locationFilter && locationFilter !== "All") {
        if (!crop.location) {
          matchesLocation = false;
        } else {
          const normCrop = crop.location.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
          const normFilter = locationFilter.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
          matchesLocation =
            normCrop === normFilter ||
            normCrop.includes(normFilter) ||
            normFilter.includes(normCrop) ||
            normFilter.split(" ").filter(Boolean).every((word) => normCrop.includes(word));
        }
      }

      return matchesSearch && matchesCategory && matchesLocation;
    });

    if (sortBy === "price-asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "qty-desc") {
      result.sort((a, b) => Number(b.quantity) - Number(a.quantity));
    }

    return result;
  }, [crops, search, category, locationFilter, sortBy]);

  function handleLogout() {
    sessionStorage.removeItem("agroconnectToken");
    sessionStorage.removeItem("agroconnectUser");
    currentUserRef.current = null;
    setCurrentUser(null);
    setAccount({ name: "", email: "", password: "", role: "Farmer" });
    setDashboardListings([]);
    setDashboardEnquiries([]);
    setBuyerEnquiries([]);
    setBuyerError("");
    setBuyerNotifications([]);
    setUnreadNotificationCount(0);
    setOrderConfirmModal({ isOpen: false, action: null, enquiry: null });
    setProcessingOrderAction(false);
    setChatRecipient(null);
    setChatCrop(null);
    setUnreadChatCount(0);
    const socket = getChatSocket();
    if (socket) socket.disconnect();
    setEnquiryMessage("");
    setSelectedCrop(null);
    setEditingCrop(null);
    setListing({
      name: "",
      category: "Grains",
      price: "",
      unit: "kg",
      quantity: "",
      location: "",
      description: ""
    });
    setModal("");
    setUserProfileModalOpen(false);
    setFarmerProfileModalOpen(false);
    setBuyerDirectoryModalOpen(false);
    setProductDetailsModalOpen(false);
    setWeatherModalOpen(false);
    setChatModalOpen(false);
    setCurrentView("home");
    setMobileNavActive("home");
    setMobileMenuOpen(false);
    if (window.location.hash !== "#home") {
      window.location.hash = "home";
    }
    window.history.replaceState(null, "", "#home");
    window.scrollTo({ top: 0, behavior: "smooth" });
    triggerNotice(t("notices.loggedOut"), "success");
  }

  function showEnquiry(crop) {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token || !currentUser) {
      triggerNotice(t("notices.loginAsBuyerForEnquiry"), "info");
      openLoginModal("Buyer");
      return;
    }

    const isOwnCrop =
      crop.farmer === currentUser.id ||
      crop.farmer?._id === currentUser.id ||
      crop.farmer === currentUser._id;

    if (isOwnCrop) {
      triggerNotice(t("notices.ownCropNotice"), "info");
      navigateToFarmerDashboard();
      return;
    }

    setSelectedCrop(crop);
    setEnquiryMessage("");
    setModal("enquiry");
  }

  async function submitListing(event) {
    event.preventDefault();

    try {
      const token = sessionStorage.getItem("agroconnectToken");
      const payload = {
        name: listing.name.trim(),
        category: listing.category,
        price: Number(listing.price),
        unit: listing.unit,
        quantity: Number(listing.quantity),
        location: listing.location.trim(),
        farmerName: currentUser?.name || "Local Farmer",
        description: listing.description ? listing.description.trim() : "",
        image: listing.image || ""
      };

      const res = await fetch(apiUrl("/api/crops"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Could not publish crop listing");
      }

      await res.json();
      await fetchCrops();
      setListing({
        name: "",
        category: "Grains",
        price: "",
        unit: "kg",
        quantity: "",
        location: "",
        description: "",
        image: ""
      });
      setModal("");
      setSearch("");
      setCategory("All");
      triggerNotice(t("notices.cropPublished"), "success");
      fetchFarmerDashboardData();
      navigateToFarmerDashboard();
    } catch (error) {
      console.error("Save listing error:", error);
      triggerNotice(t("notices.saveCropFailed", { error: error.message }), "error");
    }
  }

  function openEditModal(crop) {
    setEditingCrop({
      _id: crop._id,
      name: crop.name,
      category: crop.category,
      price: crop.price,
      unit: crop.unit || "kg",
      quantity: crop.quantity,
      location: crop.location,
      description: crop.description || "",
      image: crop.image || ""
    });
    setModal("editCrop");
  }

  async function submitEditCrop(event) {
    event.preventDefault();
    if (!editingCrop?._id) return;

    try {
      const token = sessionStorage.getItem("agroconnectToken");
      const payload = {
        name: editingCrop.name.trim(),
        category: editingCrop.category,
        price: Number(editingCrop.price),
        unit: editingCrop.unit,
        quantity: Number(editingCrop.quantity),
        location: editingCrop.location.trim(),
        description: editingCrop.description ? editingCrop.description.trim() : "",
        image: editingCrop.image || ""
      };

      const res = await fetch(apiUrl(`/api/crops/${editingCrop._id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update crop listing.");
      }

      const updated = data.crop || { ...editingCrop, ...payload };

      setCrops((current) => current.map((c) => (c._id === updated._id ? updated : c)));
      setDashboardListings((current) => current.map((c) => (c._id === updated._id ? updated : c)));

      triggerNotice(t("notices.cropUpdated"), "success");
      setModal("");
      setEditingCrop(null);
      fetchFarmerDashboardData();
      navigateToFarmerDashboard();
    } catch (error) {
      triggerNotice(t("notices.updateCropFailed", { error: error.message }), "error");
    }
  }

  async function handleDeleteCrop(cropId, cropName) {
    if (!window.confirm(t("notices.confirmDelete", { name: cropName }))) {
      return;
    }

    try {
      const token = sessionStorage.getItem("agroconnectToken");
      const res = await fetch(apiUrl(`/api/crops/${cropId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete crop listing.");
      }

      setCrops((current) => current.filter((c) => c._id !== cropId));
      setDashboardListings((current) => current.filter((c) => c._id !== cropId));
      triggerNotice(t("notices.cropDeleted"), "info");
    } catch (error) {
      triggerNotice(t("notices.deleteCropFailed", { error: error.message }), "error");
    }
  }

  async function submitAccount(event) {
    event.preventDefault();

    const isRegister = modal === "register";
    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

    if (isRegister && account.password.length < 8) {
      triggerNotice(t("notices.passwordLength"), "error");
      return;
    }

    try {
      const payload = isRegister
        ? {
          name: account.name.trim(),
          email: account.email.trim().toLowerCase(),
          password: account.password,
          role: account.role
        }
        : {
          email: account.email.trim().toLowerCase(),
          password: account.password
        };

      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      sessionStorage.setItem("agroconnectToken", data.token);
      sessionStorage.setItem("agroconnectUser", JSON.stringify(data.user));
      currentUserRef.current = data.user;
      setCurrentUser(data.user);

      const translatedRole = t(`nav.role${data.user.role}`) || data.user.role;
      triggerNotice(
        t("notices.authWelcome", { name: data.user.name, role: translatedRole }),
        "success"
      );

      setModal("");
      setAccount({ name: "", email: "", password: "", role: "Farmer" });

      if (data.user.role === "Farmer") {
        goToFarmerDashboard();
      } else {
        goToMarketplace();
      }
    } catch (error) {
      triggerNotice(error.message || t("notices.authFailed"), "error");
      setAccount((prev) => ({ ...prev, password: "" }));
    }
  }

  async function submitEnquiry(event) {
    event.preventDefault();

    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      triggerNotice(t("notices.loginAsBuyerForEnquiry"), "info");
      openLoginModal("Buyer");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const buyerName = formData.get("buyerName").trim();
    const contact = formData.get("contact").trim();
    const quantity = formData.get("quantity").trim();
    const messageText = formData.get("message").trim();

    if (!selectedCrop?._id) {
      setModal("");
      return;
    }

    const buyerEmail = contact.includes("@") ? contact : currentUser.email;
    const fullMessage = `Requirement: ${quantity ? `${quantity} needed` : "Bulk purchase enquiry"}
Phone/Contact: ${contact}
Message: ${messageText}`;

    try {
      const res = await fetch(apiUrl("/api/enquiries"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          message: fullMessage,
          cropId: selectedCrop._id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not submit enquiry.");
      }

      triggerNotice(
        t("notices.enquirySent", { name: selectedCrop.farmerName || "Farmer" }),
        "success"
      );
      setModal("");
    } catch (error) {
      triggerNotice(t("notices.enquiryFailed", { error: error.message }), "error");
    }
  }

  async function openFarmerDashboard() {
    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      triggerNotice(t("notices.loginForFarmerDash"), "info");
      openLoginModal("Farmer");
      return;
    }

    if (currentUser.role !== "Farmer") {
      triggerNotice(t("notices.farmerDashExclusive"), "info");
      return;
    }

    navigateToFarmerDashboard();
  }

  async function openBuyerDashboard() {
    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      triggerNotice(t("notices.loginForBuyerDash"), "info");
      openLoginModal("Buyer");
      return;
    }

    if (currentUser.role !== "Buyer") {
      triggerNotice(t("notices.buyerOnlyArea"), "info");
      return;
    }

    navigateToBuyerDashboard();
  }

  async function updateEnquiryStatus(enquiryId, status) {
    const token = sessionStorage.getItem("agroconnectToken");

    try {
      const res = await fetch(apiUrl(`/api/enquiries/${enquiryId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not update status.");
      }

      setDashboardEnquiries((current) =>
        current.map((item) => (item._id === enquiryId ? { ...item, status } : item))
      );

      const statusTranslated = t(`statuses.${status}`) || status;
      triggerNotice(t("notices.statusUpdated", { status: statusTranslated }), "success");
    } catch (error) {
      triggerNotice(error.message || "Failed to update enquiry status.", "error");
    }
  }

  // Dashboard counter statistics
  const farmerPendingCount = dashboardEnquiries.filter((e) => e.status === "Pending").length;
  const farmerRespondedCount = dashboardEnquiries.filter((e) => e.status === "Responded").length;

  const confirmedOrders = useMemo(() => {
    return dashboardEnquiries.filter((e) => (e.status || "").toLowerCase() === "confirmed");
  }, [dashboardEnquiries]);

  const totalConfirmedSalesValue = useMemo(() => {
    return confirmedOrders.reduce((sum, ord) => {
      const price = Number(ord.crop?.price) || 0;
      const qty = Number(ord.quantity) || 1;
      return sum + (price * qty);
    }, 0);
  }, [confirmedOrders]);

  const hasDesktopSidebar =
    ((currentView === "farmer-dashboard" || currentView === "messages") && currentUser?.role === "Farmer") ||
    ((currentView === "buyer-dashboard" || currentView === "messages") && currentUser?.role === "Buyer");

  const buyerPendingCount = buyerEnquiries.filter((e) => e.status === "Pending").length;
  const buyerRespondedCount = buyerEnquiries.filter((e) => e.status === "Responded").length;
  const buyerClosedCount = buyerEnquiries.filter((e) => e.status === "Closed").length;

  const buyerConfirmedOrders = useMemo(() => {
    return buyerEnquiries.filter(
      (e) => (e.status || "").toLowerCase() === "confirmed"
    );
  }, [buyerEnquiries]);

  const buyerTotalSpent = useMemo(() => {
    return buyerConfirmedOrders.reduce((acc, order) => {
      const price = Number(order.crop?.price) || 0;
      const qty = Number(order.crop?.quantity) || 1;
      return acc + (price * qty);
    }, 0);
  }, [buyerConfirmedOrders]);

  // Live estimated batch value in crop creation
  const estimatedBatchValue =
    Number(listing.price) > 0 && Number(listing.quantity) > 0
      ? (Number(listing.price) * Number(listing.quantity)).toLocaleString("en-IN")
      : null;

  return (
    <div className={`agro-app ${hasDesktopSidebar ? "has-desktop-sidebar" : ""}`}>
      {/* GLOBAL TOAST NOTIFICATION - AWESOME & STRUCTURED */}
      {notice && (
        <aside className={`toast-banner toast-${notice.type || "info"}`} role="alert" aria-live="assertive">
          <div className="toast-accent-bar" />
          <div className="toast-body">
            <div className={`toast-icon-badge ${notice.type || "info"}`}>
              {notice.type === "success" && <CheckCircle2 size={20} />}
              {notice.type === "error" && <AlertCircle size={20} />}
              {(notice.type === "info" || !notice.type) && <Sparkles size={20} />}
            </div>
            <div className="toast-text-wrap">
              <div className="toast-title-line">
                <span className={`toast-badge-pill ${notice.type || "info"}`}>
                  {notice.type === "success" ? "SUCCESS" : notice.type === "error" ? "ATTENTION" : "NOTICE"}
                </span>
                <strong className="toast-title">
                  {notice.title || (notice.type === "success" ? (t("common.success") || "Success") : notice.type === "error" ? (t("common.error") || "Attention") : (t("common.info") || "Update"))}
                </strong>
              </div>
              <p className="toast-text">{notice.message}</p>
            </div>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => setNotice(null)}
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
          <div className="toast-timer-track">
            <div className="toast-timer-progress" />
          </div>
        </aside>
      )}

      {/* REAL-TIME IN-APP CHAT MESSAGE NOTIFICATION TOAST */}
      {chatNotification && (
        <aside
          className="chat-floating-notification"
          role="status"
          aria-live="polite"
          onClick={() => handleOpenChatNotification(chatNotification)}
        >
          <div className="notif-avatar-col">
            <div className="notif-avatar">
              {chatNotification.senderAvatar?.length === 2 || !chatNotification.senderAvatar ? (
                <span>{chatNotification.senderAvatar || "💬"}</span>
              ) : (
                <img src={chatNotification.senderAvatar} alt={chatNotification.senderName} />
              )}
            </div>
            <span className="notif-pulse-dot" />
          </div>
          <div className="notif-content-col">
            <div className="notif-header-line">
              <strong className="notif-sender-name">{chatNotification.senderName}</strong>
              <span className={`notif-role-badge ${chatNotification.senderRole?.toLowerCase()}`}>
                {t(`nav.role${chatNotification.senderRole}`) || chatNotification.senderRole}
              </span>
              <span className="notif-new-tag">{t("chat.newBadge") || "New"}</span>
            </div>
            <p className="notif-message-text">{chatNotification.text}</p>
            <span className="notif-tap-hint">{t("chat.clickToReply") || "Click to open chat"}</span>
          </div>
          <button
            type="button"
            className="notif-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setChatNotification(null);
            }}
            aria-label="Dismiss message notification"
          >
            <X size={15} />
          </button>
        </aside>
      )}

            {/* DESKTOP LEFT SIDEBAR NAVIGATION FOR FARMER & BUYER PORTALS */}
      {hasDesktopSidebar && (
        <SidebarNav
          currentUser={currentUser}
          currentView={currentView}
          dashboardTab={dashboardTab}
          buyerDashboardTab={buyerDashboardTab}
          farmerPendingCount={farmerPendingCount}
          confirmedOrdersCount={confirmedOrders.length}
          unreadNotificationCount={unreadNotificationCount}
          buyerPendingCount={buyerPendingCount}
          buyerConfirmedCount={buyerConfirmedOrders.length}
          farmerCropCount={dashboardListings.length}
          unreadChatCount={unreadChatCount}
          onNavigate={handleSidebarNavigate}
          onOpenSettings={() => {
            setUserProfileTab("settings");
            setUserProfileModalOpen(true);
            window.location.hash = "#settings";
          }}
          onLogout={handleLogout}
        />
      )}

      {/* SINGLE CLEAN NAVBAR (White/Cream bar, logo left, nav center, user & lang right) */}
      <nav className="main-navbar">
        <div className="navbar-container">


          <a
            className="brand-logo"
            href={!currentUser ? "#home" : currentUser.role === "Farmer" ? "#farmer-dashboard" : "#marketplace"}
            onClick={(e) => {
              e.preventDefault();
              if (!currentUser) navigateToHome();
              else if (currentUser.role === "Farmer") navigateToFarmerDashboard();
              else navigateToMarketplace();
            }}
          >
            <div className="brand-icon-box">
              <AgroConnectBrandLogoSvg size={28} />
            </div>
            <div className="brand-text">
              <span className="brand-title">{t("nav.brandTitle")}</span>
              <div className="brand-subtitle-marquee" title={t("nav.brandSubtitle")}>
                <div className="brand-cylinder-track">
                  <span className="brand-telugu brand-cylinder-item">
                    {t("nav.brandSubtitle")} <span className="brand-sep" aria-hidden="true">•</span>
                  </span>
                  <span className="brand-telugu brand-cylinder-item" aria-hidden="true">
                    {t("nav.brandSubtitle")} <span className="brand-sep">•</span>
                  </span>
                </div>
              </div>
            </div>

          </a>

          {/* Nav Center Links - STRICTLY ROLE-BASED */}
          <div className="nav-center-links">
            {!currentUser ? (
              // GUEST NAVBAR: Fresh Harvests, Home, How It Works
              <>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "marketplace" ? "active" : ""}`}
                  onClick={goToMarketplace}
                >
                  <Store size={16} />
                  <span>{t("nav.freshHarvests") || "Fresh Harvests"}</span>
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "home" && window.location.hash !== "#how-it-works" ? "active" : ""}`}
                  onClick={() => navigateToHome()}
                >
                  <Home size={16} />
                  <span>{t("nav.home") || "Home"}</span>
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${window.location.hash === "#how-it-works" ? "active" : ""}`}
                  onClick={() => {
                    if (currentView !== "home") {
                      setCurrentView("home");
                      setMobileNavActive("home");
                    }
                    setTimeout(() => {
                      const el = document.getElementById("how-it-works");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 50);
                    window.location.hash = "how-it-works";
                  }}
                >
                  <Layers size={16} />
                  <span>{t("nav.howItWorks") || "How It Works"}</span>
                </button>
              </>
            ) : currentUser.role === "Buyer" && currentView === "marketplace" ? (
              // BUYER ON MARKETPLACE (clean on dashboard):
              <>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "marketplace" ? "active" : ""}`}
                  onClick={() => navigateToMarketplace()}
                >
                  <Store size={16} />
                  <span>{t("nav.freshHarvests") || "Fresh Harvests"}</span>
                </button>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => navigateToBuyerDashboard()}
                >
                  <ShoppingCart size={16} />
                  <span>{t("nav.buyerDashboard") || "Buyer Dashboard"}</span>
                  {(buyerRespondedCount > 0 || unreadNotificationCount > 0) && (
                    <span className="badge-count-pulse">{buyerRespondedCount + unreadNotificationCount}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => navigateToMessages()}
                >
                  <MessageSquare size={16} />
                  <span>{t("nav.messages") || "Messages"}</span>
                  {unreadChatCount > 0 && <span className="badge-count-pulse">{unreadChatCount}</span>}
                </button>
              </>
            ) : null}
          </div>

          <div className="nav-actions">
            {/* Desktop Actions Cluster (visible on desktop > 768px, hidden on mobile) */}
            <div className="nav-actions-desktop">
              {currentUser ? (
                <div className="user-action-cluster">
                  {/* NOTIFICATION BELL WITH FLYOUT MENU */}
                  <div className="nav-notif-container" ref={notifDropdownRef}>
                    <button
                      type="button"
                      className={`btn-nav-notif-bell ${notifDropdownOpen ? "active" : ""}`}
                      onClick={() => {
                        setNotifDropdownOpen((prev) => !prev);
                        setProfileDropdownOpen(false);
                      }}
                      title="Notifications & Updates"
                      aria-label="Open notifications"
                      aria-expanded={notifDropdownOpen}
                    >
                      <Bell size={18} className="nav-notif-icon" />
                      {unreadNotificationCount > 0 && (
                        <span className="notif-badge-bubble">
                          {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                          <span className="notif-badge-ping" />
                        </span>
                      )}
                    </button>

                    {/* NOTIFICATION FLYOUT DROPDOWN */}
                    {notifDropdownOpen && (
                      <div className="notification-flyout-menu" role="menu">
                        <div className="notif-flyout-header">
                          <div className="notif-flyout-title-wrap">
                            <Bell size={16} className="flyout-header-icon" />
                            <h4 className="notif-flyout-title">Notifications</h4>
                            {unreadNotificationCount > 0 && (
                              <span className="notif-unread-pill">{unreadNotificationCount} new</span>
                            )}
                          </div>
                          {unreadNotificationCount > 0 && (
                            <button
                              type="button"
                              className="notif-mark-all-btn"
                              onClick={markAllNotificationsAsRead}
                            >
                              <CheckCheck size={14} />
                              <span>Mark all read</span>
                            </button>
                          )}
                        </div>

                        {/* Tabs for unread / all */}
                        <div className="notif-tabs-bar">
                          <button
                            type="button"
                            className={`notif-tab-item ${notifFilter === "all" ? "active" : ""}`}
                            onClick={() => setNotifFilter("all")}
                          >
                            All ({buyerNotifications.length})
                          </button>
                          <button
                            type="button"
                            className={`notif-tab-item ${notifFilter === "unread" ? "active" : ""}`}
                            onClick={() => setNotifFilter("unread")}
                          >
                            Unread ({unreadNotificationCount})
                          </button>
                        </div>

                        {/* Notification Items List */}
                        <div className="notif-flyout-list">
                          {filteredNotifications.length === 0 ? (
                            <div className="notif-empty-state">
                              <Sparkles size={24} className="notif-empty-icon" />
                              <p>No notifications yet</p>
                              <span>You're all caught up with orders & enquiries.</span>
                            </div>
                          ) : (
                            filteredNotifications.map((notif) => {
                              const isUnread = !notif.read;
                              return (
                                <div
                                  key={notif._id}
                                  className={`notif-item-card ${isUnread ? "unread" : "read"}`}
                                  onClick={() => handleNotificationClick(notif)}
                                >
                                  <div className="notif-card-icon-col">
                                    <div className={`notif-type-bubble ${notif.type || "general"}`}>
                                      {notif.type === "order_confirmed" ? (
                                        <CheckCircle2 size={16} />
                                      ) : notif.type === "order_rejected" ? (
                                        <X size={16} />
                                      ) : (
                                        <Bell size={16} />
                                      )}
                                    </div>
                                  </div>
                                  <div className="notif-card-content">
                                    <div className="notif-card-top-row">
                                      <h5 className="notif-item-title">{notif.title}</h5>
                                      <span className="notif-item-time">
                                        {formatRelativeTime(notif.createdAt, language)}
                                      </span>
                                    </div>
                                    <p className="notif-item-message">{notif.message}</p>
                                  </div>
                                  <div className="notif-card-actions">
                                    {isUnread && (
                                      <button
                                        type="button"
                                        className="btn-mark-single-read"
                                        title="Mark as read"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markNotificationAsRead(notif._id);
                                        }}
                                      >
                                        <Check size={14} />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="btn-delete-notif"
                                      title="Delete notification"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearNotification(notif._id);
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* USER PROFILE BUTTON WITH AVATAR & DROPDOWN */}
                  <div className="nav-profile-container" ref={profileDropdownRef}>
                    <button
                      type="button"
                      className={`user-profile-badge clickable ${profileDropdownOpen ? "dropdown-open" : ""}`}
                      onClick={() => {
                        setProfileDropdownOpen((prev) => !prev);
                        setNotifDropdownOpen(false);
                      }}
                      aria-label="User profile menu"
                      aria-expanded={profileDropdownOpen}
                    >
                      <div className="profile-avatar-circle">
                        <UserAvatar
                          user={currentUser}
                          size={32}
                          className="profile-avatar-asset"
                        />
                      </div>
                      <span className="profile-username">
                        {currentUser.name || currentUser.username || currentUser.email?.split("@")[0] || "User"}
                      </span>
                      <ChevronDown size={14} className={`profile-dropdown-arrow ${profileDropdownOpen ? "rotated" : ""}`} />
                    </button>

                    {/* PROFILE DROPDOWN MENU */}
                    {profileDropdownOpen && (
                      <div className="profile-dropdown-menu" role="menu">
                        <div className="profile-dropdown-header">
                          <div className="dropdown-user-avatar">
                            <UserAvatar
                              user={currentUser}
                              size={38}
                              className="dropdown-avatar-img"
                            />
                          </div>
                          <div className="dropdown-user-details">
                            <span className="dropdown-user-name">
                              {currentUser.name || currentUser.username || "User"}
                            </span>
                            <span className="dropdown-user-email">
                              {currentUser.email || (currentUser.role === "Farmer" ? "Farmer Account" : "Buyer Account")}
                            </span>
                            <span className={`dropdown-role-chip ${currentUser.role === "Farmer" ? "farmer" : "buyer"}`}>
                              {currentUser.role === "Farmer" ? "🌾 Farmer" : "🛒 Buyer"}
                            </span>
                          </div>
                        </div>

                        <div className="dropdown-divider" />

                        <div className="dropdown-menu-list">
                          {/* View Profile */}
                          <button
                            type="button"
                            className="profile-dropdown-item"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              setUserProfileTab("overview");
                              setUserProfileModalOpen(true);
                            }}
                          >
                            <User size={16} className="dropdown-item-icon" />
                            <span>View Profile</span>
                          </button>

                          {/* Settings */}
                          <button
                            type="button"
                            className="profile-dropdown-item"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              setUserProfileTab("settings");
                              setUserProfileModalOpen(true);
                            }}
                          >
                            <Settings size={16} className="dropdown-item-icon" />
                            <span>Settings</span>
                          </button>

                          <div className="dropdown-divider" />

                          {/* Logout */}
                          <button
                            type="button"
                            className="profile-dropdown-item logout-item"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              handleLogout();
                            }}
                          >
                            <LogOut size={16} className="dropdown-item-icon" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="auth-buttons-group">
                  <button
                    type="button"
                    className="btn-nav-outline"
                    onClick={() => openLoginModal("Buyer")}
                  >
                    <span>{t("nav.signIn")}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-nav-filled"
                    onClick={() => openRegisterModal("Buyer")}
                  >
                    <span>{t("nav.joinUs")}</span>
                  </button>
                </div>
              )}

              {/* Theme Toggle Button */}
              <button
                type="button"
                className="theme-toggle-btn btn-theme-toggle"
                onClick={() => toggleTheme(!darkMode)}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>

            {/* Mobile Header Hamburger Button (Mobile only) */}
            <button
              type="button"
              className="mobile-hamburger-btn mobile-header-hamburger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={22} />
              {(unreadNotificationCount > 0 || unreadChatCount > 0) && (
                <span className="hamburger-dot-badge" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Header Slide-Out Menu Drawer */}
        <MobileHeaderMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentUser={currentUser}
          onOpenProfile={() => {
            setUserProfileTab("overview");
            setUserProfileModalOpen(true);
          }}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={toggleTheme}
          onOpenLogin={openLoginModal}
          onOpenRegister={openRegisterModal}
          currentView={currentView}
          onNavigateHome={() => {
            setMobileMenuOpen(false);
            navigateToHome();
          }}
          onNavigateMarketplace={() => {
            setMobileMenuOpen(false);
            navigateToMarketplace();
          }}
          onNavigateBuyerDashboard={() => {
            setMobileMenuOpen(false);
            navigateToBuyerDashboard();
          }}
          onNavigateFarmerDashboard={() => {
            setMobileMenuOpen(false);
            navigateToFarmerDashboard();
          }}
          onNavigateFarmerDiscovery={() => {
            setMobileMenuOpen(false);
            navigateToFarmerDiscovery();
          }}
          onNavigateMessages={() => {
            setMobileMenuOpen(false);
            navigateToMessages();
          }}
          onOpenListingModal={() => {
            setMobileMenuOpen(false);
            openListingModal();
          }}
          buyerRespondedCount={buyerRespondedCount}
          farmerPendingCount={farmerPendingCount}
          unreadChatCount={unreadChatCount}
        />
      </nav>

      {(!currentUser || currentView === "home") ? (
        <>
          {/* SECTION 1: DIRECT FARM MARKETPLACE FOR HARDWORKING FARMERS & SMART BUYERS */}
          <header className="hero-section" id="home">
            <div className="hero-content">
              <h1 className="hero-heading">
                {t("hero.title")}
              </h1>

              <p className="hero-description">
                {t("hero.description")}
              </p>

              {/* KEY BENEFITS */}
              <div className="hero-benefits-wrapper">
                <ul className="hero-benefits-list">
                  {(Array.isArray(t("hero.benefits")) ? t("hero.benefits") : []).map((benefit, idx) => (
                    <li key={idx} className="hero-benefit-item">
                      <CheckCircle2 size={18} className="benefit-icon" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CALL-TO-ACTION BUTTONS */}
              <div className="hero-cta-group">
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={() => navigateToMarketplace()}
                >
                  <Store size={19} />
                  <span>{t("hero.exploreMarketplace")}</span>
                </button>
                <button
                  type="button"
                  className="btn-hero-secondary farmer-cta"
                  onClick={() => handleJoinRole("Farmer")}
                >
                  <Tractor size={19} />
                  <span>{t("hero.joinAsFarmer")}</span>
                </button>
                <button
                  type="button"
                  className="btn-hero-secondary buyer-cta"
                  onClick={() => handleJoinRole("Buyer")}
                >
                  <ShoppingCart size={19} />
                  <span>{t("hero.joinAsBuyer")}</span>
                </button>
              </div>
            </div>
          </header>

          {/* SECTION 2: HOW AGROCONNECT WORKS FOR EVERYONE */}
          <section className="how-it-works-section" id="how-it-works" aria-labelledby="how-it-works-title">
            <div className="how-it-works-container">
              <div className="how-it-works-header-center">
                <div className="how-it-works-badge">
                  <Sparkles size={14} className="how-badge-icon" />
                  <span>
                    {language === "te"
                      ? "సరళమైన విధానం"
                      : language === "hi"
                        ? "सरल 4-चरणीय प्रक्रिया"
                        : "Direct & Transparent Process"}
                  </span>
                </div>
                <h2 id="how-it-works-title" className="how-it-works-title">
                  {t("howItWorks.title")}
                </h2>
                <p className="how-it-works-subtitle">
                  {language === "te"
                    ? "రైతులు మరియు కొనుగోలుదారులను నేరుగా అనుసంధానించే 0% కమీషన్ వ్యవసాయ వేదిక"
                    : language === "hi"
                      ? "किसानों और खरीदारों को बिना किसी बिचौलिये के सीधे जोड़ने वाला 0% कमीशन कृषि मंच"
                      : "Zero-commission direct agricultural marketplace connecting verified growers directly with commercial and household buyers."}
                </p>
              </div>

              <div className="how-it-works-columns">
                {/* COLUMN 1: FOR FARMERS */}
                <div className="how-column farmer-how-col">
                  <div className="how-col-accent-bar farmer-accent-bar" aria-hidden="true" />
                  <div className="how-column-header">
                    <div className="how-header-icon farmer-icon-box">
                      <Tractor size={26} strokeWidth={2.2} />
                    </div>
                    <div className="how-header-titles">
                      <span className="how-role-pill farmer-role-pill">
                        {language === "te" ? "రైతుల కోసం" : language === "hi" ? "उत्पादक" : "PRODUCERS"}
                      </span>
                      <h3 className="how-column-title">{t("howItWorks.farmersTitle")}</h3>
                    </div>
                  </div>

                  <div className="how-steps-list">
                    {(Array.isArray(t("howItWorks.farmerSteps")) ? t("howItWorks.farmerSteps") : []).map((item) => (
                      <div className="how-step-card farmer-step-card" key={item.num}>
                        <div className="step-num-badge farmer-badge">{item.num}</div>
                        <div className="step-body">
                          <h4 className="step-title">{item.title}</h4>
                          <p className="step-desc">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="how-column-footer">
                    <button
                      type="button"
                      className="btn-how-cta farmer-how-cta"
                      onClick={() => handleJoinRole("Farmer")}
                    >
                      <Tractor size={18} />
                      <span>{t("hero.joinAsFarmer") || "Join as Farmer"}</span>
                      <ArrowRight size={16} className="cta-arrow" />
                    </button>
                  </div>
                </div>

                {/* COLUMN 2: FOR BUYERS */}
                <div className="how-column buyer-how-col">
                  <div className="how-col-accent-bar buyer-accent-bar" aria-hidden="true" />
                  <div className="how-column-header">
                    <div className="how-header-icon buyer-icon-box">
                      <ShoppingCart size={26} strokeWidth={2.2} />
                    </div>
                    <div className="how-header-titles">
                      <span className="how-role-pill buyer-role-pill">
                        {language === "te" ? "కొనుగోలుదారుల కోసం" : language === "hi" ? "खरीदार" : "BUYERS & TRADERS"}
                      </span>
                      <h3 className="how-column-title">{t("howItWorks.buyersTitle")}</h3>
                    </div>
                  </div>

                  <div className="how-steps-list">
                    {(Array.isArray(t("howItWorks.buyerSteps")) ? t("howItWorks.buyerSteps") : []).map((item) => (
                      <div className="how-step-card buyer-step-card" key={item.num}>
                        <div className="step-num-badge buyer-badge">{item.num}</div>
                        <div className="step-body">
                          <h4 className="step-title">{item.title}</h4>
                          <p className="step-desc">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="how-column-footer">
                    <button
                      type="button"
                      className="btn-how-cta buyer-how-cta"
                      onClick={() => handleJoinRole("Buyer")}
                    >
                      <ShoppingCart size={18} />
                      <span>{t("hero.joinAsBuyer") || "Join as Buyer"}</span>
                      <ArrowRight size={16} className="cta-arrow" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : currentView === "messages" && currentUser ? (
        <MessagesView
          currentUser={currentUser}
          activeConversationId={activeChatConversationId}
          initialTargetUser={chatRecipient}
          initialTargetCrop={chatCrop}
          onOpenProductDetails={(crop) => {
            setProductDetailsCrop(crop);
            setProductDetailsModalOpen(true);
          }}
          onOpenFarmerProfile={(farmerId) => {
            setActiveFarmerId(farmerId);
            setFarmerProfileModalOpen(true);
          }}
          onConversationChange={handleConversationChange}
        />
      ) : (!currentUser || currentUser.role === "Buyer") ? (
        currentView === "buyer-dashboard" && currentUser ? (
          <main className="dashboard-page-view" id="buyer-dashboard">
            <div className="section-container">
              <div className="dashboard-top-header">
                <div>
                  <span className="modal-eyebrow">{t("buyerDashboard.eyebrow")}</span>
                  <h2>{t("buyerDashboard.title")}</h2>
                  <p>{t("buyerDashboard.subtitle")}</p>
                </div>
                <div className="dashboard-action-buttons">
                  <button className="btn-dashboard-refresh" onClick={fetchBuyerEnquiries} title={t("buyerDashboard.refresh")}>
                    <RefreshCw size={15} />
                    <span>{t("buyerDashboard.refresh")}</span>
                  </button>
                  <button className="btn-dashboard-add" onClick={() => navigateToMarketplace()}>
                    <Store size={16} />
                    <span>{t("buyerDashboard.browseMoreCrops")}</span>
                  </button>
                </div>
              </div>

              {buyerLoading ? (
                <div className="state-box loading-box">
                  <RefreshCw className="spinner-icon" size={28} />
                  <h3>{t("marketplace.loadingTitle")}</h3>
                </div>
              ) : buyerError ? (
                <div className="state-box error-box">
                  <AlertCircle size={28} />
                  <h3>{buyerError}</h3>
                  <button className="btn-modal-submit green" onClick={fetchBuyerEnquiries}>
                    {t("farmerDashboard.refresh")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="stats-cards-grid">
                    <div className="stat-metric-card">
                      <div className="metric-icon-box blue">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <span className="metric-val">{buyerEnquiries.length}</span>
                        <span className="metric-lbl">{t("buyerDashboard.statTotalSent")}</span>
                      </div>
                    </div>

                    <div className="stat-metric-card alert">
                      <div className="metric-icon-box amber">
                        <Clock size={20} />
                      </div>
                      <div>
                        <span className="metric-val">{buyerPendingCount}</span>
                        <span className="metric-lbl">{t("buyerDashboard.statAwaitingReply")}</span>
                      </div>
                    </div>

                    <div className="stat-metric-card success">
                      <div className="metric-icon-box green">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <span className="metric-val">{buyerRespondedCount}</span>
                        <span className="metric-lbl">{t("buyerDashboard.statFarmerResponded")}</span>
                      </div>
                    </div>

                    <div className="stat-metric-card">
                      <div className="metric-icon-box">
                        <Check size={20} />
                      </div>
                      <div>
                        <span className="metric-val">{buyerClosedCount}</span>
                        <span className="metric-lbl">{t("buyerDashboard.statClosedDeals")}</span>
                      </div>
                    </div>

                    <div className={`stat-metric-card ${unreadNotificationCount > 0 ? "alert" : ""}`}>
                      <div className="metric-icon-box green">
                        <Bell size={20} />
                      </div>
                      <div>
                        <span className="metric-val">{unreadNotificationCount}</span>
                        <span className="metric-lbl">{t("buyerDashboard.statUnreadNotifications") || "Order Updates"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-tabs-bar">
                    <button
                      className={`d-tab-btn ${buyerDashboardTab === "all" ? "active" : ""}`}
                      onClick={() => handleSidebarNavigate("dashboard")}
                    >
                      {t("farmerDashboard.tabAll") || "Overview"}
                    </button>
                    <button
                      className={`d-tab-btn ${buyerDashboardTab === "enquiries" ? "active" : ""}`}
                      onClick={() => handleSidebarNavigate("enquiries")}
                    >
                      {`My Enquiries (${buyerEnquiries.length})`}
                      {buyerPendingCount > 0 && <span className="tab-bubble-count">{buyerPendingCount}</span>}
                    </button>
                    <button
                      className={`d-tab-btn ${buyerDashboardTab === "orders" ? "active" : ""}`}
                      onClick={() => handleSidebarNavigate("orders")}
                    >
                      {`Orders (${buyerConfirmedOrders.length || buyerNotifications.length})`}
                      {buyerConfirmedOrders.length > 0 && (
                        <span className="tab-bubble-count success">{buyerConfirmedOrders.length}</span>
                      )}
                    </button>
                    <button
                      className={`d-tab-btn ${buyerDashboardTab === "purchases-report" ? "active" : ""}`}
                      onClick={() => handleSidebarNavigate("purchases-report")}
                    >
                      Purchase Report
                    </button>
                  </div>

                  {(buyerDashboardTab === "all" || buyerDashboardTab === "orders") && (
                    buyerNotifications && buyerNotifications.length > 0 ? (
                      <div className="dashboard-content-block buyer-notifications-block">
                        <div className="block-title-row">
                          <div className="block-title-with-badge">
                            <Bell size={18} className="block-header-icon" />
                            <h3>{t("buyerDashboard.notificationsTitle") || "Order Notifications & Status Alerts"}</h3>
                            {unreadNotificationCount > 0 && (
                              <span className="badge-count-pulse">{unreadNotificationCount} new</span>
                            )}
                          </div>
                          {unreadNotificationCount > 0 && (
                            <button
                              type="button"
                              className="btn-mark-all-read"
                              onClick={markAllNotificationsAsRead}
                            >
                              <Check size={14} />
                              <span>{t("buyerDashboard.markAllRead") || "Mark all as read"}</span>
                            </button>
                          )}
                        </div>

                        <div className="notifications-list-stack">
                          {buyerNotifications.map((notif) => (
                            <div
                              key={notif._id}
                              className={`notification-item-card ${notif.read ? "read" : "unread"} ${notif.status || ""}`}
                              onClick={() => !notif.read && markNotificationAsRead(notif._id)}
                            >
                              <div className="notification-icon-box">
                                {notif.status === "confirmed" ? (
                                  <CheckCircle2 size={20} className="notif-icon-success" />
                                ) : notif.status === "rejected" ? (
                                  <XCircle size={20} className="notif-icon-danger" />
                                ) : (
                                  <Bell size={20} className="notif-icon-info" />
                                )}
                              </div>
                              <div className="notification-content-area">
                                <div className="notif-header-line">
                                  <strong className="notif-title">{notif.title}</strong>
                                  <span className="notif-timestamp">
                                    {formatEnquiryDate(notif.createdAt, language)}
                                  </span>
                                </div>
                                <p className="notif-message-text">{notif.message}</p>
                                <div className="notif-meta-tags">
                                  {notif.cropName && (
                                    <span className="notif-tag-crop">🌾 {notif.cropName}</span>
                                  )}
                                  <span className={`notif-status-tag ${notif.status}`}>
                                    {notif.status === "confirmed" ? "✓ Confirmed" : notif.status === "rejected" ? "✕ Rejected" : notif.status}
                                  </span>
                                  {!notif.read && (
                                    <span className="notif-new-dot">● Unread</span>
                                  )}
                                </div>
                              </div>
                              {!notif.read && (
                                <button
                                  type="button"
                                  className="btn-mark-read"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(notif._id);
                                  }}
                                  title="Mark as read"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : buyerDashboardTab === "orders" ? (
                      <div className="dashboard-content-block">
                        <div className="dashboard-empty-state">
                          <Bell size={36} className="empty-state-icon" />
                          <h4>No Order Updates Yet</h4>
                          <p>You have no recent order updates or status notifications from farmers.</p>
                          <button className="btn-modal-submit green" onClick={() => navigateToMarketplace()}>
                            <Store size={16} />
                            <span>Browse Fresh Produce</span>
                          </button>
                        </div>
                      </div>
                    ) : null
                  )}

                  {(buyerDashboardTab === "all" || buyerDashboardTab === "enquiries") && (
                    <div className="dashboard-content-block">
                      <div className="block-title-row">
                        <h3>{t("buyerDashboard.myEnquiryHistory", { count: buyerEnquiries.length })}</h3>
                      </div>

                    {buyerEnquiries.length === 0 ? (
                      <div className="dashboard-empty-state">
                        <ShoppingCart size={36} className="empty-state-icon" />
                        <h4>{t("buyerDashboard.emptyTitle")}</h4>
                        <p>{t("buyerDashboard.emptyDesc")}</p>
                        <button
                          className="btn-modal-submit green"
                          onClick={() => navigateToMarketplace()}
                        >
                          <span>{t("buyerDashboard.exploreBtn")}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="enquiries-list-stack">
                        {buyerEnquiries.map((enquiry) => (
                          <div className="enquiry-detail-card" key={enquiry._id}>
                            <div className="enquiry-top-row">
                              <div className="enquiry-crop-identifier">
                                <span className="crop-tag-title">
                                  🌾 {enquiry.crop?.name || "Crop"}
                                </span>
                                {enquiry.crop?.location && (
                                  <span className="enquiry-location-sub">
                                    📍 {enquiry.crop.location} · ₹{enquiry.crop.price} / {t(`units.${enquiry.crop.unit}`) || enquiry.crop.unit || "kg"}
                                  </span>
                                )}
                                <span className="enquiry-timestamp">
                                  {t("buyerDashboard.submittedOn", {
                                    date: formatEnquiryDate(enquiry.createdAt, language)
                                  })}
                                </span>
                              </div>

                              <span className={`status-pill-badge status-${(enquiry.status || "").toLowerCase()}`}>
                                {enquiry.status === "Pending" && t("statuses.buyerPendingBadge")}
                                {enquiry.status === "Responded" && t("statuses.buyerRespondedBadge")}
                                {enquiry.status === "Closed" && t("statuses.buyerClosedBadge")}
                                {(enquiry.status === "confirmed" || enquiry.status === "Confirmed") && `✓ ${t("farmerDashboard.orderConfirmed") || "Order Confirmed"}`}
                                {(enquiry.status === "rejected" || enquiry.status === "Rejected") && `✕ ${t("farmerDashboard.orderRejected") || "Order Rejected"}`}
                              </span>
                            </div>

                            <div className="enquiry-message-bubble">
                              <span className="msg-label">{t("buyerDashboard.yourRequirementSent")}</span>
                              <p style={{ whiteSpace: "pre-line" }}>{enquiry.message}</p>
                            </div>

                            <div className="buyer-enquiry-footer-note">
                              <Info size={14} />
                              <span>
                                {enquiry.status === "Pending"
                                  ? t("buyerDashboard.notePending")
                                  : enquiry.status === "Responded"
                                    ? t("buyerDashboard.noteResponded")
                                    : (enquiry.status === "confirmed" || enquiry.status === "Confirmed")
                                      ? (t("buyerDashboard.noteConfirmed") || "Good news! Your order has been confirmed by the farmer.")
                                      : (enquiry.status === "rejected" || enquiry.status === "Rejected")
                                        ? (t("buyerDashboard.noteRejected") || "Your order could not be accepted by the farmer at this time.")
                                        : t("buyerDashboard.noteClosed")}
                              </span>
                            </div>

                            <div className="enquiry-chat-action-strip">
                              <button
                                type="button"
                                className="btn-chat-with-user"
                                onClick={() => {
                                  const farmerObj = typeof enquiry.crop?.farmer === "object"
                                    ? enquiry.crop.farmer
                                    : { _id: enquiry.crop?.farmer, role: "Farmer" };
                                  handleStartChat(farmerObj, enquiry.crop);
                                }}
                              >
                                <MessageSquare size={14} />
                                <span>{t("chat.chatWithFarmer") || "Chat with Farmer"}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )}

                  {/* BUYER CONFIRMED ORDERS SECTION */}
                  {buyerDashboardTab === "orders" && buyerConfirmedOrders.length > 0 && (
                    <div className="dashboard-content-block">
                      <div className="block-title-row">
                        <div className="block-title-with-badge">
                          <CheckCircle2 size={18} className="block-header-icon notif-icon-success" />
                          <h3>Confirmed Purchases ({buyerConfirmedOrders.length})</h3>
                        </div>
                      </div>

                      <div className="orders-cards-list">
                        {buyerConfirmedOrders.map((order) => (
                          <div className="order-manage-card" key={order._id}>
                            <div className="order-card-header">
                              <div className="order-card-id-block">
                                <span className="order-ref-badge">ORDER #{order._id?.slice(-6).toUpperCase()}</span>
                                <span className="order-date-text">{formatEnquiryDate(order.createdAt, language)}</span>
                              </div>
                              <span className="order-status-pill confirmed">
                                <CheckCircle2 size={14} /> Confirmed by Farmer
                              </span>
                            </div>

                            <div className="order-card-body">
                              <div className="order-crop-summary">
                                <div className="order-crop-icon">🌾</div>
                                <div>
                                  <h4 className="order-crop-name">{order.crop?.name || "Harvest Produce"}</h4>
                                  <span className="order-crop-rate">₹{order.crop?.price || "--"} / {t(`units.${order.crop?.unit}`) || order.crop?.unit || "kg"}</span>
                                </div>
                              </div>

                              <div className="order-buyer-details">
                                <div className="order-detail-field">
                                  <MapPin size={14} />
                                  <span>Farm Location: <strong>{order.crop?.location || "Andhra Pradesh"}</strong></span>
                                </div>
                              </div>
                            </div>

                            {order.message && (
                              <div className="order-note-box">
                                <small>Your Order Requirement:</small>
                                <p>"{order.message}"</p>
                              </div>
                            )}

                            <div className="order-card-footer">
                              <div className="order-total-value">
                                <span>Estimated Batch Price: </span>
                                <strong>₹{Number(order.crop?.price || 0).toLocaleString("en-IN")}</strong>
                              </div>
                              <button
                                type="button"
                                className="btn-chat-with-user"
                                onClick={() => {
                                  const farmerObj = typeof order.crop?.farmer === "object"
                                    ? order.crop.farmer
                                    : { _id: order.crop?.farmer, role: "Farmer" };
                                  handleStartChat(farmerObj, order.crop);
                                }}
                              >
                                <MessageSquare size={14} />
                                <span>Chat with Farmer</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BUYER PURCHASE & PROCUREMENT REPORT TAB */}
                  {buyerDashboardTab === "purchases-report" && (
                    <div className="dashboard-content-block sales-report-view">
                      <div className="block-title-row">
                        <div>
                          <h3>Procurement & Purchase Report</h3>
                          <p className="block-subtitle">Procurement analytics, order spend, and sourcing summary.</p>
                        </div>
                        <button className="btn-dashboard-refresh" onClick={fetchBuyerEnquiries} title="Refresh Report">
                          <RefreshCw size={14} />
                          <span>Refresh Report</span>
                        </button>
                      </div>

                      <div className="sales-kpi-grid">
                        <div className="sales-kpi-card highlight">
                          <div className="sales-kpi-top">
                            <span className="sales-kpi-label">Total Procurement Value</span>
                            <div className="sales-kpi-icon-pill green"><TrendingUp size={18} /></div>
                          </div>
                          <div className="sales-kpi-val">₹{buyerTotalSpent.toLocaleString("en-IN")}</div>
                          <div className="sales-kpi-subtext">From {buyerConfirmedOrders.length} confirmed purchases</div>
                        </div>

                        <div className="sales-kpi-card">
                          <div className="sales-kpi-top">
                            <span className="sales-kpi-label">Active Requirements Sent</span>
                            <div className="sales-kpi-icon-pill blue"><MessageSquare size={18} /></div>
                          </div>
                          <div className="sales-kpi-val">{buyerEnquiries.length}</div>
                          <div className="sales-kpi-subtext">{buyerPendingCount} awaiting response</div>
                        </div>

                        <div className="sales-kpi-card">
                          <div className="sales-kpi-top">
                            <span className="sales-kpi-label">Confirmed Orders</span>
                            <div className="sales-kpi-icon-pill green"><CheckCircle2 size={18} /></div>
                          </div>
                          <div className="sales-kpi-val">{buyerConfirmedOrders.length}</div>
                          <div className="sales-kpi-subtext">{buyerRespondedCount} farmer responses received</div>
                        </div>

                        <div className="sales-kpi-card">
                          <div className="sales-kpi-top">
                            <span className="sales-kpi-label">Order Alerts & Updates</span>
                            <div className="sales-kpi-icon-pill amber"><Bell size={18} /></div>
                          </div>
                          <div className="sales-kpi-val">{buyerNotifications.length}</div>
                          <div className="sales-kpi-subtext">{unreadNotificationCount} unread status alerts</div>
                        </div>
                      </div>

                      <div className="sales-breakdown-card">
                        <h4>Sourcing Breakdown</h4>
                        {buyerEnquiries.length === 0 ? (
                          <p className="empty-subtext">No crop orders placed yet. Browse the marketplace to connect with verified farmers.</p>
                        ) : (
                          <div className="sales-table-wrapper">
                            <table className="sales-breakdown-table">
                              <thead>
                                <tr>
                                  <th>Crop Name</th>
                                  <th>Farm Location</th>
                                  <th>Unit Price</th>
                                  <th>Requirement Status</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {buyerEnquiries.map((enq) => (
                                  <tr key={enq._id}>
                                    <td className="crop-cell">
                                      <span className="crop-dot" />
                                      <strong>{enq.crop?.name || "Crop"}</strong>
                                    </td>
                                    <td>{enq.crop?.location || "Andhra Pradesh"}</td>
                                    <td className="metric-cell">₹{enq.crop?.price || "--"} / {enq.crop?.unit || "kg"}</td>
                                    <td>
                                      <span className={`status-pill-badge status-${(enq.status || "").toLowerCase()}`}>
                                        {enq.status === "Pending" ? "Awaiting Reply" : enq.status === "confirmed" ? "Confirmed" : enq.status}
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className="btn-chat-with-user small"
                                        onClick={() => {
                                          const farmerObj = typeof enq.crop?.farmer === "object"
                                            ? enq.crop.farmer
                                            : { _id: enq.crop?.farmer, role: "Farmer" };
                                          handleStartChat(farmerObj, enq.crop);
                                        }}
                                      >
                                        <MessageSquare size={13} />
                                        <span>Chat</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        ) : (
          /* MARKETPLACE SECTION */
          <main className="marketplace-section" id="marketplace">
            <div className="section-container">
                            {/* HERO AREA (Large friendly heading & prominent search bar) */}
              <div className="marketplace-hero-area">
                <h1 className="marketplace-main-title">
                  Fresh from the farm to your business
                </h1>
                <p className="marketplace-main-subtitle">
                  {t("marketplace.subtitle") || "Directly sourced from verified regional growers in Andhra Pradesh. Zero middlemen."}
                </p>

                {/* PROMINENT SEARCH BAR (Seamless borderless, saffron search button) */}
                <div className="prominent-search-bar">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="prominent-search-input"
                      placeholder={t("marketplace.searchPlaceholder") || "Search fresh crops (e.g. Paddy, Guntur Chillies, Sweet Corn, Tomatoes)..."}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label="Search crops"
                      style={{
                        border: "none",
                        outline: "none",
                        boxShadow: "none",
                        background: "transparent"
                      }}
                    />
                    {search && (
                      <button className="search-clear-action" onClick={() => setSearch("")} aria-label="Clear search">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button type="button" className="btn-search-saffron" aria-label="Search button">
                    <Search size={16} />
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* FILTERS AREA: Horizontal pills for categories, location/sort dropdowns on same row, plain muted text count */}
              <div className="marketplace-filter-section">
                {/* CATEGORY PILL CHIPS */}
                <div className="category-pill-track" role="tablist">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`filter-pill-chip ${category === cat.id ? "active" : ""}`}
                      onClick={() => setCategory(cat.id)}
                      role="tab"
                      aria-selected={category === cat.id}
                    >
                      <span className="pill-icon">{cat.icon}</span>
                      <span className="pill-text">{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* COMPACT CONTROLS ROW */}
                <div className="compact-filter-row">
                  <div className="dropdowns-group">
                    <LocationSelector
                      value={locationFilter}
                      onChange={setLocationFilter}
                      availableLocations={availableLocations}
                      t={t}
                    />

                    <div className="compact-sort-dropdown">
                      <SlidersHorizontal size={14} className="control-icon" />
                      <select
                        id="sortSelect"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-dropdown-select"
                        aria-label={t("marketplace.sortByLabel")}
                      >
                        <option value="featured">{t("marketplace.sortFeatured")}</option>
                        <option value="price-asc">{t("marketplace.sortPriceAsc")}</option>
                        <option value="price-desc">{t("marketplace.sortPriceDesc")}</option>
                        <option value="qty-desc">{t("marketplace.sortQtyDesc")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Plain muted count text, not a boxed badge */}
                  <div className="plain-crop-count">
                    <span>{filteredCrops.length} {t("marketplace.cropsAvailable") || "crops available"}</span>
                  </div>
                </div>
              </div>

              {/* CROPS GRID */}
              {loading ? (
                <div className="crops-grid">
                  {[1, 2, 3, 4].map((item) => (
                    <div className="crop-card-skeleton" key={item}>
                      <div className="skeleton-photo-box" />
                      <div className="skeleton-content-box">
                        <div className="skeleton-bar skeleton-title" />
                        <div className="skeleton-bar skeleton-location" />
                        <div className="skeleton-bar skeleton-farmer" />
                        <div className="skeleton-row-split">
                          <div className="skeleton-bar skeleton-price" />
                          <div className="skeleton-bar skeleton-qty" />
                        </div>
                        <div className="skeleton-bar skeleton-button" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : cropsError ? (
                <div className="state-box error-box">
                  <AlertCircle size={32} />
                  <h3>{t("marketplace.loadErrorTitle")}</h3>
                  <p>{cropsError}</p>
                  <div className="empty-actions">
                    <button className="btn-reset-filters" onClick={fetchCrops}>
                      <RefreshCw size={15} /> {t("marketplace.retryBtn")}
                    </button>
                  </div>
                </div>
              ) : filteredCrops.length > 0 ? (
                <div className="crops-grid">
                  {filteredCrops.map((crop, index) => {
                    const isOwner =
                      currentUser &&
                      (crop.farmer === currentUser.id ||
                        crop.farmer?._id === currentUser.id ||
                        crop.farmer === currentUser._id);

                    const localizedUnit = t(`units.${crop.unit}`) || crop.unit || "kg";
                    const photoUrl = getCropPhotoUrl(crop);

                    return (
                      <article className="crop-card-modern" key={crop._id || index}>
                        {/* Real Crop Photo: 4:3 Ratio, Hover Zoom, Rounded Top */}
                        <div className="crop-photo-wrap">
                          <img
                            src={photoUrl}
                            alt={crop.name}
                            className="crop-card-photo"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/crops/default.svg";
                            }}
                          />
                          {/* Owner badge on image corner if current user */}
                          {isOwner && (
                            <div className="crop-card-badge-tag">
                              <span className="badge-tag-owner">🧑‍🌾 {t("marketplace.card.yourListing") || "Your Listing"}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Details Body */}
                        <div className="crop-card-details">
                          {/* Crop Name (18px, bold) */}
                          <h3 className="crop-title-heading">{crop.name}</h3>

                          {/* Location with Pin Icon */}
                          <div className="crop-location-row">
                            <MapPin size={13} className="pin-icon-warm" />
                            <span>{crop.location}</span>
                          </div>

                          {/* Farmer name with small green Verified tick */}
                          <div
                            className="crop-farmer-row clickable"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (crop.farmer) {
                                handleOpenFarmerProfile(crop.farmer._id || crop.farmer);
                              }
                            }}
                            title={crop.farmer ? t("farmerProfile.viewProfileBtn") : ""}
                            role="button"
                            tabIndex={0}
                          >
                            <span className="farmer-name-text">🧑‍🌾 {crop.farmerName || t("marketplace.card.verifiedLocalFarmer")}</span>
                            <span className="verified-badge-inline">
                              <CheckCircle2 size={12} className="verified-check-icon" />
                              <span>Verified</span>
                            </span>
                          </div>

                          {/* Price & Quantity Available */}
                          <div className="crop-price-stock-row">
                            <div className="crop-price-display">
                              <span className="currency-sign">₹</span>
                              <span className="price-bold">{crop.price}</span>
                              <span className="price-unit-tag">/{localizedUnit}</span>
                            </div>
                            <div className="crop-stock-display">
                              <span>{crop.quantity} {localizedUnit} available</span>
                            </div>
                          </div>

                          {/* ONE Primary Button: "View / Buy" (or "Manage Listing" if owner) */}
                          <div className="crop-action-single">
                            {isOwner ? (
                              <button
                                type="button"
                                className="btn-card-primary is-owner-btn"
                                onClick={openFarmerDashboard}
                                title={t("marketplace.card.manage") || "Manage Listing"}
                              >
                                <Edit2 size={15} />
                                <span>{t("marketplace.card.manage") || "Manage Listing"}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-card-primary"
                                onClick={() => handleOpenProductDetails(crop)}
                                title="View / Buy"
                                aria-label={`View or Buy ${crop.name}`}
                              >
                                <ShoppingCart size={15} />
                                <span>View / Buy</span>
                                <ArrowRight size={14} className="btn-arrow-icon" />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : crops.length === 0 ? (
                <div className="state-box empty-box">
                  <div className="empty-icon-circle">🌱</div>
                  <h3>{t("marketplace.noListingsTitle")}</h3>
                  <p>{t("marketplace.noListingsDesc")}</p>
                  {currentUser?.role === "Farmer" && (
                    <div className="empty-actions">
                      <button className="btn-add-crop-accent" onClick={openListingModal}>
                        <Plus size={16} /> {t("marketplace.addCropBtn")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="state-box empty-box">
                  <div className="empty-icon-circle">🌱</div>
                  <h3>
                    {locationFilter !== "All"
                      ? (t("marketplace.noCropsInLocation") || "No crops found in this location.")
                      : t("marketplace.emptyTitle")}
                  </h3>
                  <p>
                    {locationFilter !== "All"
                      ? (t("marketplace.noCropsInLocationDesc", { location: locationFilter }) ||
                        `No crops currently listed in "${locationFilter}". Try switching to "All Locations" or adjusting other filters.`)
                      : t("marketplace.emptyDesc", { query: search, location: locationFilter === "All" ? t("marketplace.allLocations") : locationFilter })}
                  </p>
                  <div className="empty-actions">
                    {locationFilter !== "All" && (
                      <button
                        className="btn-reset-filters btn-reset-location-primary"
                        onClick={() => setLocationFilter("All")}
                      >
                        <MapPin size={15} /> {t("marketplace.viewAllLocations") || "View All Locations"}
                      </button>
                    )}
                    <button
                      className="btn-reset-filters"
                      onClick={() => {
                        setSearch("");
                        setCategory("All");
                        setLocationFilter("All");
                      }}
                    >
                      {t("marketplace.clearFiltersBtn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        )
      ) : (
        /* ================================================================ */
        /* 3. FARMER ROLE VIEWS: FARMER DISCOVERY OR FARMER DASHBOARD       */
        /* ================================================================ */
        currentView === "farmers" ? (
          <main className="discovery-page-view" id="farmers">
            <div className="section-container">
              <div className="discovery-header-row">
                <div>
                  <div className="market-badge">
                    <Tractor size={15} />
                    <span>{t("nav.farmers") || "Farmer Discovery"}</span>
                  </div>
                  <h2>{t("nav.farmers") || "Farmer Discovery"}</h2>
                  <p>Browse fellow farmers and producers across Andhra Pradesh.</p>
                </div>
                <button className="btn-dashboard-refresh" onClick={fetchFarmersList} title="Refresh Farmers">
                  <RefreshCw size={15} />
                  <span>{t("buyerDashboard.refresh") || "Refresh"}</span>
                </button>
              </div>

              {farmersLoading ? (
                <div className="state-box loading-box">
                  <RefreshCw className="spinner-icon" size={28} />
                  <h3>{t("marketplace.loadingTitle")}</h3>
                </div>
              ) : farmersList.length === 0 ? (
                <div className="state-box empty-box">
                  <div className="empty-icon-circle">🧑‍🌾</div>
                  <h3>No farmers found</h3>
                  <p>Registered farmers will appear here as they join the platform.</p>
                </div>
              ) : (
                <div className="farmers-discovery-grid">
                  {farmersList.map((farmer) => (
                    <div className="farmer-discovery-card" key={farmer._id}>
                      <div className="farmer-card-top">
                        <div className="farmer-avatar-circle">
                          {farmer.avatar ? (
                            <img src={farmer.avatar} alt={farmer.name} />
                          ) : (
                            <span>{farmer.name ? farmer.name.charAt(0).toUpperCase() : "F"}</span>
                          )}
                        </div>
                        <div className="farmer-card-title-group">
                          <h4>{farmer.name}</h4>
                          <span className="farmer-location-tag">
                            <MapPin size={12} />
                            {farmer.location || "Andhra Pradesh, India"}
                          </span>
                        </div>
                      </div>

                      <p className="farmer-card-bio">
                        {farmer.bio || "Local farmer cultivating produce in Andhra Pradesh."}
                      </p>

                      <div className="farmer-card-stats-row">
                        <div className="farmer-stat">
                          <strong>{farmer.crops?.length || 0}</strong>
                          <span>Crops Listed</span>
                        </div>
                        <div className="farmer-stat">
                          <strong>{farmer.followersCount || farmer.followers?.length || 0}</strong>
                          <span>Followers</span>
                        </div>
                      </div>

                      <div className="farmer-card-actions">
                        <button
                          type="button"
                          className="btn-farmer-view"
                          onClick={() => handleOpenFarmerProfile(farmer._id)}
                        >
                          <Eye size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                          <span>View Profile</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        ) : (
          <main className="dashboard-page-view" id="farmer-dashboard">
            <div className="section-container">
              <div className="dashboard-top-header">
                <div>
                  <span className="modal-eyebrow">{t("farmerDashboard.eyebrow")}</span>
                  <h2>{t("farmerDashboard.title")}</h2>
                  <p>{t("farmerDashboard.subtitle")}</p>
                </div>
                <div className="dashboard-action-buttons">
                  <button className="btn-dashboard-refresh" onClick={fetchFarmerDashboardData} title={t("farmerDashboard.refresh")}>
                    <RefreshCw size={15} />
                    <span>{t("farmerDashboard.refresh")}</span>
                  </button>
                  <button className="btn-dashboard-add" onClick={openListingModal}>
                    <Plus size={16} />
                    <span>{t("farmerDashboard.addNewCrop")}</span>
                  </button>
                </div>
              </div>

              {dashboardLoading ? (
                <div className="state-box loading-box">
                  <RefreshCw className="spinner-icon" size={28} />
                  <h3>{t("marketplace.loadingTitle")}</h3>
                </div>
              ) : (
                <>
                  <div className="stats-cards-grid">
                    <div className="stat-metric-card">
                      <div className="metric-icon-box green">
                        <Sprout size={20} />
                      </div>
                      <div>
                        <span className="metric-val">{dashboardListings.length}</span>
                        <span className="metric-lbl">{t("farmerDashboard.statPublishedCrops")}</span>
                      </div>
                    </div>

                    <div className="stat-metric-card alert">
                      <div className="metric-icon-box amber">
                        <Clock size={20} />
                      </div>
                      <div>
                        <span className="metric-val">{farmerPendingCount}</span>
                        <span className="metric-lbl">{t("farmerDashboard.statPendingReplies")}</span>
                      </div>
                    </div>

                    <div className="stat-metric-card success">
                      <div className="metric-icon-box blue">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <span className="metric-val">{farmerRespondedCount}</span>
                        <span className="metric-lbl">{t("farmerDashboard.statRespondedEnquiries")}</span>
                      </div>
                    </div>

                    <div className="stat-metric-card">
                      <div className="metric-icon-box">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <span className="metric-val">{dashboardEnquiries.length}</span>
                        <span className="metric-lbl">{t("farmerDashboard.statTotalEnquiries")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-tabs-bar">
                    <button
                      className={`d-tab-btn ${dashboardTab === "all" ? "active" : ""}`}
                      onClick={() => handleSidebarNavigate("dashboard")}
                    >
                      {t("farmerDashboard.tabAll") || "Overview"}
                    </button>
                    <button
                      className={`d-tab-btn ${dashboardTab === "listings" ? "active" : ""}`}
                      onClick={() => handleSidebarNavigate("products")}
                    >
                      {t("farmerDashboard.tabListings", { count: dashboardListings.length }) || `My Products (${dashboardListings.length})`}
                    </button>
                    <button
                      className={`d-tab-btn d-tab-enquiries ${dashboardTab === "enquiries" ? "active" : ""}`}
                      onClick={() => handleSidebarNavigate("enquiries")}
                    >
                      {t("farmerDashboard.tabEnquiries", { count: dashboardEnquiries.length }) || `Buyer Enquiries (${dashboardEnquiries.length})`}
                      {farmerPendingCount > 0 && <span className="tab-bubble-count">{farmerPendingCount}</span>}
                    </button>
                    <button
                      className={`d-tab-btn ${dashboardTab === "orders" ? "active" : ""}`}
                      onClick={() => handleSidebarNavigate("orders")}
                    >
                      Orders ({confirmedOrders.length})
                      {confirmedOrders.length > 0 && <span className="tab-bubble-count success">{confirmedOrders.length}</span>}
                    </button>
                    <button
                      className={`d-tab-btn ${dashboardTab === "sales-report" ? "active" : ""}`}
                      onClick={() => handleSidebarNavigate("sales-report")}
                    >
                      Sales Report
                    </button>
                  </div>

                  {(dashboardTab === "all" || dashboardTab === "listings") && (
                    <div className="dashboard-content-block">
                      <div className="block-title-row">
                        <h3>{t("farmerDashboard.myPublishedCrops", { count: dashboardListings.length })}</h3>
                        <button className="btn-small-link" onClick={openListingModal}>
                          {t("farmerDashboard.listAnotherCrop")}
                        </button>
                      </div>

                      {dashboardListings.length === 0 ? (
                        <div className="dashboard-empty-state">
                          <Tractor size={36} className="empty-state-icon" />
                          <h4>{t("farmerDashboard.emptyListingsTitle")}</h4>
                          <p>{t("farmerDashboard.emptyListingsDesc")}</p>
                          <button className="btn-modal-submit green" onClick={openListingModal}>
                            <Plus size={16} />
                            <span>{t("farmerDashboard.listFirstCropBtn")}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="dashboard-listings-grid">
                          {dashboardListings.map((crop) => (
                            <div className="farmer-crop-manage-card" key={crop._id}>
                              <div className="manage-card-header">
                                <div>
                                  <span className="category-pill-sm">{t(`categories.${crop.category}`) || crop.category}</span>
                                  <h4>{crop.name}</h4>
                                </div>
                                <div className="manage-price-box">
                                  <strong>₹{crop.price}</strong>
                                  <small>/{t(`units.${crop.unit}`) || crop.unit || "kg"}</small>
                                </div>
                              </div>

                              <div className="manage-card-meta">
                                <span>📦 {t("farmerDashboard.stockLabel")} <strong>{crop.quantity} {t(`units.${crop.unit}`) || crop.unit || "kg"}</strong></span>
                                <span>📍 {t("farmerDashboard.locationLabel")} <strong>{crop.location}</strong></span>
                              </div>

                              {crop.description && (
                                <p className="manage-card-notes">"{crop.description}"</p>
                              )}

                              <div className="manage-card-buttons">
                                <button className="btn-manage-edit" onClick={() => openEditModal(crop)}>
                                  <Edit2 size={14} />
                                  <span>{t("farmerDashboard.editBtn")}</span>
                                </button>
                                <button
                                  className="btn-manage-del"
                                  onClick={() => handleDeleteCrop(crop._id, crop.name)}
                                >
                                  <Trash2 size={14} />
                                  <span>{t("farmerDashboard.deleteBtn")}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(dashboardTab === "all" || dashboardTab === "enquiries") && (
                    <div className="dashboard-content-block">
                      <div className="block-title-row">
                        <h3>{t("farmerDashboard.incomingEnquiries", { count: dashboardEnquiries.length })}</h3>
                      </div>

                      {dashboardEnquiries.length === 0 ? (
                        <div className="dashboard-empty-state">
                          <MessageSquare size={36} className="empty-state-icon" />
                          <h4>{t("farmerDashboard.emptyEnquiriesTitle")}</h4>
                          <p>{t("farmerDashboard.emptyEnquiriesDesc")}</p>
                        </div>
                      ) : (
                        <div className="enquiries-list-stack">
                          {dashboardEnquiries.map((enquiry) => (
                            <div className="enquiry-detail-card" key={enquiry._id}>
                              <div className="enquiry-top-row">
                                <div className="enquiry-crop-identifier">
                                  <span className="crop-tag-title">
                                    🌾 {enquiry.crop?.name || "Crop"} · ₹{enquiry.crop?.price || "--"} / {t(`units.${enquiry.crop?.unit}`) || enquiry.crop?.unit || "kg"}
                                  </span>
                                  <span className="enquiry-timestamp">
                                    {formatEnquiryDate(enquiry.createdAt, language)}
                                  </span>
                                </div>

                                <span className={`status-pill-badge status-${(enquiry.status || "").toLowerCase()}`}>
                                  {enquiry.status === "Pending" && `🕒 ${t("statuses.Pending")}`}
                                  {enquiry.status === "Responded" && `✅ ${t("statuses.Responded")}`}
                                  {enquiry.status === "Closed" && `📁 ${t("statuses.Closed")}`}
                                  {(enquiry.status === "confirmed" || enquiry.status === "Confirmed") && `✓ ${t("farmerDashboard.orderConfirmed") || "Order Confirmed"}`}
                                  {(enquiry.status === "rejected" || enquiry.status === "Rejected") && `✕ ${t("farmerDashboard.orderRejected") || "Order Rejected"}`}
                                </span>
                              </div>

                              <div className="buyer-contact-cardlet">
                                <div className="contact-item">
                                  <User size={15} />
                                  <span><strong>{t("farmerDashboard.buyerLabel")}</strong> {enquiry.buyerName}</span>
                                </div>
                                <div className="contact-item">
                                  <Mail size={15} />
                                  <span><strong>{t("farmerDashboard.contactLabel")}</strong> <a href={`mailto:${enquiry.buyerEmail}`}>{enquiry.buyerEmail}</a></span>
                                </div>
                              </div>

                              <div className="enquiry-message-bubble">
                                <span className="msg-label">{t("farmerDashboard.buyerMessageLabel")}</span>
                                <p>{enquiry.message}</p>
                              </div>

                              <div className="enquiry-status-row enquiry-action-toolbar">
                                {(enquiry.status === "confirmed" || enquiry.status === "Confirmed") ? (
                                  <div className="order-final-status confirmed" role="status">
                                    <CheckCircle2 size={16} />
                                    <span>{t("farmerDashboard.orderConfirmed") || "Order Confirmed"}</span>
                                  </div>
                                ) : (enquiry.status === "rejected" || enquiry.status === "Rejected") ? (
                                  <div className="order-final-status rejected" role="status">
                                    <XCircle size={16} />
                                    <span>{t("farmerDashboard.orderRejected") || "Order Rejected"}</span>
                                  </div>
                                ) : (
                                  <div className="order-action-buttons-group">
                                    <button
                                      type="button"
                                      className="btn-order-action confirm"
                                      onClick={() => handlePromptOrderAction(enquiry, "confirm")}
                                      disabled={processingOrderAction}
                                      title={t("farmerDashboard.confirmOrderTooltip") || "Confirm this order"}
                                    >
                                      <Check size={16} />
                                      <span>{t("farmerDashboard.confirmOrder") || "Confirm Order"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-order-action reject"
                                      onClick={() => handlePromptOrderAction(enquiry, "reject")}
                                      disabled={processingOrderAction}
                                      title={t("farmerDashboard.rejectOrderTooltip") || "Reject this order"}
                                    >
                                      <X size={16} />
                                      <span>{t("farmerDashboard.rejectOrder") || "Reject Order"}</span>
                                    </button>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  className="btn-chat-with-user"
                                  onClick={() => {
                                    const buyerObj = typeof enquiry.buyer === "object"
                                      ? enquiry.buyer
                                      : { _id: enquiry.buyer, name: enquiry.buyerName, email: enquiry.buyerEmail, role: "Buyer" };
                                    handleStartChat(buyerObj, enquiry.crop);
                                  }}
                                >
                                  <MessageSquare size={14} />
                                  <span>{t("chat.chatWithBuyer") || "Chat with Buyer"}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. ORDERS VIEW TAB */}
                  {dashboardTab === "orders" && (
                    <div className="dashboard-content-block">
                      <div className="block-title-row">
                        <div>
                          <h3>Confirmed Orders ({confirmedOrders.length})</h3>
                          <p className="block-subtitle">Buyer orders confirmed by you, ready for packing and fulfillment.</p>
                        </div>
                        <button className="btn-dashboard-refresh" onClick={fetchFarmerDashboardData} title="Refresh Orders">
                          <RefreshCw size={14} />
                          <span>Refresh Orders</span>
                        </button>
                      </div>

                      <div className="orders-summary-strip">
                        <div className="orders-summary-item">
                          <span className="summary-lbl">Total Confirmed Orders</span>
                          <strong className="summary-val green">{confirmedOrders.length}</strong>
                        </div>
                        <div className="orders-summary-item">
                          <span className="summary-lbl">Gross Value</span>
                          <strong className="summary-val">₹{totalConfirmedSalesValue.toLocaleString("en-IN")}</strong>
                        </div>
                        <div className="orders-summary-item">
                          <span className="summary-lbl">Active Deliveries</span>
                          <strong className="summary-val">{confirmedOrders.length} In Progress</strong>
                        </div>
                      </div>

                      {confirmedOrders.length === 0 ? (
                        <div className="dashboard-empty-state">
                          <ShoppingCart size={38} className="empty-state-icon" />
                          <h4>No confirmed orders yet</h4>
                          <p>When buyers submit enquiries and you confirm them, they will appear here as confirmed orders.</p>
                          <button className="btn-modal-submit green" onClick={() => handleSidebarNavigate("enquiries")}>
                            <MessageSquare size={16} />
                            <span>View Buyer Enquiries</span>
                          </button>
                        </div>
                      ) : (
                        <div className="orders-cards-list">
                          {confirmedOrders.map((order) => (
                            <div className="order-manage-card" key={order._id}>
                              <div className="order-card-header">
                                <div className="order-card-id-block">
                                  <span className="order-ref-badge">ORDER #{order._id?.slice(-6).toUpperCase()}</span>
                                  <span className="order-date-text">{formatEnquiryDate(order.createdAt, language)}</span>
                                </div>
                                <span className="order-status-pill confirmed">
                                  <CheckCircle2 size={14} /> Confirmed Order
                                </span>
                              </div>

                              <div className="order-card-body">
                                <div className="order-crop-summary">
                                  <div className="order-crop-icon">🌾</div>
                                  <div>
                                    <h4 className="order-crop-name">{order.crop?.name || "Harvest Produce"}</h4>
                                    <span className="order-crop-rate">₹{order.crop?.price || "--"} / {t(`units.${order.crop?.unit}`) || order.crop?.unit || "kg"}</span>
                                  </div>
                                </div>

                                <div className="order-buyer-details">
                                  <div className="order-detail-field">
                                    <User size={14} />
                                    <span>Buyer: <strong>{order.buyerName}</strong></span>
                                  </div>
                                  <div className="order-detail-field">
                                    <Mail size={14} />
                                    <span>Email: <a href={`mailto:${order.buyerEmail}`}>{order.buyerEmail}</a></span>
                                  </div>
                                </div>
                              </div>

                              {order.message && (
                                <div className="order-note-box">
                                  <small>Buyer Request Note:</small>
                                  <p>"{order.message}"</p>
                                </div>
                              )}

                              <div className="order-card-footer">
                                <div className="order-total-value">
                                  <span>Estimated Batch Price: </span>
                                  <strong>₹{Number(order.crop?.price || 0).toLocaleString("en-IN")}</strong>
                                </div>
                                <button
                                  type="button"
                                  className="btn-chat-with-user"
                                  onClick={() => {
                                    const buyerObj = typeof order.buyer === "object"
                                      ? order.buyer
                                      : { _id: order.buyer, name: order.buyerName, email: order.buyerEmail, role: "Buyer" };
                                    handleStartChat(buyerObj, order.crop);
                                  }}
                                >
                                  <MessageSquare size={14} />
                                  <span>Chat with Buyer</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. SALES REPORT VIEW TAB */}
                  {dashboardTab === "sales-report" && (
                    <div className="dashboard-content-block sales-report-view">
                      <div className="block-title-row">
                        <div>
                          <h3>Sales & Revenue Report</h3>
                          <p className="block-subtitle">Performance metrics, revenue analytics, and crop breakdown.</p>
                        </div>
                        <button className="btn-dashboard-refresh" onClick={fetchFarmerDashboardData} title="Refresh Report">
                          <RefreshCw size={14} />
                          <span>Refresh Report</span>
                        </button>
                      </div>

                      <div className="sales-kpi-grid">
                        <div className="sales-kpi-card highlight">
                          <div className="sales-kpi-top">
                            <span className="sales-kpi-label">Total Realized Revenue</span>
                            <div className="sales-kpi-icon-pill green"><TrendingUp size={18} /></div>
                          </div>
                          <div className="sales-kpi-val">₹{totalConfirmedSalesValue.toLocaleString("en-IN")}</div>
                          <div className="sales-kpi-subtext">From {confirmedOrders.length} confirmed orders</div>
                        </div>

                        <div className="sales-kpi-card">
                          <div className="sales-kpi-top">
                            <span className="sales-kpi-label">Active Crop Inventory</span>
                            <div className="sales-kpi-icon-pill blue"><Package size={18} /></div>
                          </div>
                          <div className="sales-kpi-val">{dashboardListings.length} Products</div>
                          <div className="sales-kpi-subtext">Listed on Andhra marketplace</div>
                        </div>

                        <div className="sales-kpi-card">
                          <div className="sales-kpi-top">
                            <span className="sales-kpi-label">Order Conversion Rate</span>
                            <div className="sales-kpi-icon-pill amber"><Scale size={18} /></div>
                          </div>
                          <div className="sales-kpi-val">
                            {dashboardEnquiries.length > 0
                              ? `${Math.round((confirmedOrders.length / dashboardEnquiries.length) * 100)}%`
                              : "0%"}
                          </div>
                          <div className="sales-kpi-subtext">{confirmedOrders.length} of {dashboardEnquiries.length} enquiries confirmed</div>
                        </div>

                        <div className="sales-kpi-card">
                          <div className="sales-kpi-top">
                            <span className="sales-kpi-label">Buyer Inquiries</span>
                            <div className="sales-kpi-icon-pill purple"><MessageSquare size={18} /></div>
                          </div>
                          <div className="sales-kpi-val">{dashboardEnquiries.length} Total</div>
                          <div className="sales-kpi-subtext">{farmerPendingCount} pending response</div>
                        </div>
                      </div>

                      <div className="sales-analytics-section">
                        <h4 className="sales-section-title">Crop-Wise Performance Breakdown</h4>
                        <div className="sales-table-wrapper">
                          <table className="sales-performance-table">
                            <thead>
                              <tr>
                                <th>Crop Name</th>
                                <th>Category</th>
                                <th>Unit Price</th>
                                <th>Listed Stock</th>
                                <th>Inquiries</th>
                                <th>Confirmed Orders</th>
                                <th>Est. Realized Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardListings.map((crop) => {
                                const cropEnquiries = dashboardEnquiries.filter((e) => e.crop?._id === crop._id || e.crop === crop._id);
                                const cropOrders = cropEnquiries.filter((e) => (e.status || "").toLowerCase() === "confirmed");
                                const cropRev = cropOrders.length * Number(crop.price || 0);
                                return (
                                  <tr key={crop._id}>
                                    <td><strong>🌾 {crop.name}</strong></td>
                                    <td><span className="category-pill-sm">{crop.category}</span></td>
                                    <td>₹{crop.price} / {crop.unit || "kg"}</td>
                                    <td>{crop.quantity} {crop.unit || "kg"}</td>
                                    <td><span className="badge-cell count">{cropEnquiries.length}</span></td>
                                    <td><span className="badge-cell success">{cropOrders.length} orders</span></td>
                                    <td><strong className="rev-bold">₹{cropRev.toLocaleString("en-IN")}</strong></td>
                                  </tr>
                                );
                              })}
                              {dashboardListings.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="table-empty-cell">No crops listed yet to analyze.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        )
      )}

      {/* MODERN FOOTER (Hidden on messages page) */}
      {currentView !== "messages" && (
        <footer className="agro-footer">
          <div className="footer-container">
            <div className="footer-main-row">
              <div className="footer-brand-col">
                <a
                  className="brand-logo footer-logo"
                  href={!currentUser ? "#home" : currentUser.role === "Farmer" ? "#farmer-dashboard" : "#marketplace"}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!currentUser) navigateToHome();
                    else if (currentUser.role === "Farmer") navigateToFarmerDashboard();
                    else navigateToMarketplace();
                  }}
                >
                  <div className="brand-icon-box">
                    <Sprout size={22} />
                  </div>
                  <div className="brand-text">
                    <span className="brand-title">{t("nav.brandTitle")}</span>
                    <span className="brand-telugu">{t("nav.brandSubtitle")}</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="footer-bottom-bar">
              <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
            </div>
          </div>
        </footer>
      )}



      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}
      {modal && (
        <div className="modal-backdrop-modern" onClick={closeModal}>
          <div
            className={`modal-window ${modal === "dashboard" || modal === "buyerDashboard" ? "modal-large" : ""}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-round" onClick={closeModal} aria-label="Close dialog">
              <X size={18} />
            </button>

            {/* ----------------------------------------------------- */}
            {/* 1. FARMER: POST CROP MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "listing" && (
              <div className="modal-inner-scroll">
                <div className="modal-title-bar">
                  <div className="modal-title-icon-box green">
                    <Plus size={22} />
                  </div>
                  <div>
                    <span className="modal-eyebrow">{t("listingModal.eyebrow")}</span>
                    <h2>{t("listingModal.title")}</h2>
                    <p>{t("listingModal.subtitle")}</p>
                  </div>
                </div>

                {/* Quick suggestions */}
                <div className="suggestion-box">
                  <span className="suggestion-label">{t("listingModal.quickPick")}</span>
                  <div className="suggestion-chips">
                    {popularCropsSuggestions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className="suggestion-chip-btn"
                        onClick={() =>
                          setListing({
                            ...listing,
                            name: item.name,
                            category: item.category,
                            unit: item.unit,
                            price: item.price
                          })
                        }
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={submitListing} className="modern-form">
                  <div className="form-group">
                    <label htmlFor="cropName">{t("listingModal.cropName")}</label>
                    <input
                      id="cropName"
                      required
                      placeholder={t("listingModal.cropNamePlaceholder")}
                      value={listing.name}
                      onChange={(e) => setListing({ ...listing, name: e.target.value })}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="cropCategory">{t("listingModal.category")}</label>
                      <select
                        id="cropCategory"
                        value={listing.category}
                        onChange={(e) => setListing({ ...listing, category: e.target.value })}
                      >
                        {categories.filter((c) => c.id !== "All").map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="cropUnit">{t("listingModal.unit")}</label>
                      <select
                        id="cropUnit"
                        value={listing.unit}
                        onChange={(e) => setListing({ ...listing, unit: e.target.value })}
                      >
                        <option value="kg">{t("units.kgFull")}</option>
                        <option value="quintal">{t("units.quintalFull")}</option>
                        <option value="bag">{t("units.bagFull")}</option>
                        <option value="tonne">{t("units.tonneFull")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="cropPrice">
                        {t("listingModal.pricePerUnit", { unit: t(`units.${listing.unit}`) || listing.unit })}
                      </label>
                      <input
                        id="cropPrice"
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        placeholder={t("listingModal.pricePlaceholder")}
                        value={listing.price}
                        onChange={(e) => setListing({ ...listing, price: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cropQty">{t("listingModal.availableQuantity")}</label>
                      <input
                        id="cropQty"
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder={t("listingModal.qtyPlaceholder")}
                        value={listing.quantity}
                        onChange={(e) => setListing({ ...listing, quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* LIVE ESTIMATED REVENUE CALCULATOR */}
                  {estimatedBatchValue && (
                    <div className="calculator-preview-box">
                      <Scale size={18} className="calc-icon" />
                      <div>
                        <strong>{t("listingModal.estimatedValue")} ₹{estimatedBatchValue}</strong>
                        <span>({listing.quantity} {t(`units.${listing.unit}`) || listing.unit} × ₹{listing.price})</span>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="cropLocation">{t("listingModal.location")}</label>
                    <input
                      id="cropLocation"
                      required
                      placeholder={t("listingModal.locationPlaceholder")}
                      value={listing.location}
                      onChange={(e) => setListing({ ...listing, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cropDesc">{t("listingModal.notes")}</label>
                    <textarea
                      id="cropDesc"
                      rows="2"
                      placeholder={t("listingModal.notesPlaceholder")}
                      value={listing.description}
                      onChange={(e) => setListing({ ...listing, description: e.target.value })}
                    />
                  </div>

                  {/* CROP PHOTO ATTACHMENT SECTION (Upload + Direct Camera) */}
                  <div className="form-group crop-photo-upload-group">
                    <div className="crop-photo-header">
                      <div className="crop-photo-label-clean">
                        <span className="photo-label-title">
                          🌾 {t("listingModal.cropPhoto") ? t("listingModal.cropPhoto").replace(/\s*\(.*\)/, "") : "Crop Photo"}
                        </span>
                        <span className="photo-tag-optional">{t("listingModal.optional") || t("common.optional") || "Optional"}</span>
                      </div>
                      <span className="crop-photo-subnote">JPG, PNG, WebP · Max 8MB</span>
                    </div>

                    {!listing.image ? (
                      <div className="photo-dropzone-box">
                        <div className="dropzone-guide">
                          <div className="dropzone-icon-bubble">
                            <Camera size={20} />
                          </div>
                          <div className="dropzone-text-group">
                            <span className="dropzone-main-text">Attach Real Harvest Photo</span>
                            <span className="dropzone-sub-text">Helps buyers verify quality and buy your produce faster</span>
                          </div>
                        </div>

                        <div className="dropzone-action-buttons">
                          <label className="btn-dropzone-action" title="Upload from Device / Gallery">
                            <Upload size={15} />
                            <span>{t("listingModal.uploadPhoto") || "Upload Photo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={handleCropImageUpload}
                            />
                          </label>

                          <label className="btn-dropzone-action" title="Take a photo with your Camera">
                            <Camera size={15} />
                            <span>{t("listingModal.takePhoto") || "Take Photo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              style={{ display: "none" }}
                              onChange={handleCropImageUpload}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="crop-photo-card-preview">
                        <div className="preview-image-holder">
                          <img src={listing.image} alt="Crop preview" className="crop-preview-thumb" />
                          <div className="preview-status-pill">
                            <CheckCircle2 size={13} />
                            <span>Photo Attached</span>
                          </div>
                        </div>
                        <div className="preview-actions-col">
                          <div className="preview-info-text">
                            <strong>Harvest Photo Ready</strong>
                            <small>Displayed on crop card in marketplace</small>
                          </div>
                          <div className="preview-button-row">
                            <label className="btn-preview-action change" title="Change photo">
                              <RefreshCw size={13} />
                              <span>Change</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleCropImageUpload}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn-preview-action delete"
                              onClick={() => setListing((prev) => ({ ...prev, image: "" }))}
                              title="Remove photo"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-actions-row">
                    <button type="submit" className="btn-modal-submit green">
                      <Check size={18} />
                      <span>{t("listingModal.publishBtn")}</span>
                    </button>
                    <button type="button" className="btn-modal-cancel" onClick={() => setModal("")}>
                      {t("listingModal.cancelBtn")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 2. FARMER: EDIT CROP MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "editCrop" && editingCrop && (
              <div className="modal-inner-scroll">
                <div className="modal-title-bar">
                  <div className="modal-title-icon-box amber">
                    <Edit2 size={22} />
                  </div>
                  <div>
                    <span className="modal-eyebrow">{t("editModal.eyebrow")}</span>
                    <h2>{t("editModal.title")}</h2>
                    <p>{t("editModal.subtitle", { name: editingCrop.name })}</p>
                  </div>
                </div>

                <form onSubmit={submitEditCrop} className="modern-form">
                  <div className="form-group">
                    <label>{t("editModal.cropName")}</label>
                    <input
                      required
                      value={editingCrop.name}
                      onChange={(e) => setEditingCrop({ ...editingCrop, name: e.target.value })}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>{t("editModal.category")}</label>
                      <select
                        value={editingCrop.category}
                        onChange={(e) => setEditingCrop({ ...editingCrop, category: e.target.value })}
                      >
                        {categories.filter((c) => c.id !== "All").map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>{t("editModal.unit")}</label>
                      <select
                        value={editingCrop.unit}
                        onChange={(e) => setEditingCrop({ ...editingCrop, unit: e.target.value })}
                      >
                        <option value="kg">{t("units.kgFull")}</option>
                        <option value="quintal">{t("units.quintalFull")}</option>
                        <option value="bag">{t("units.bagFull")}</option>
                        <option value="tonne">{t("units.tonneFull")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>{t("editModal.price", { unit: t(`units.${editingCrop.unit}`) || editingCrop.unit })}</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        value={editingCrop.price}
                        onChange={(e) => setEditingCrop({ ...editingCrop, price: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t("editModal.availableQuantity")}</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={editingCrop.quantity}
                        onChange={(e) => setEditingCrop({ ...editingCrop, quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t("editModal.location")}</label>
                    <input
                      required
                      value={editingCrop.location}
                      onChange={(e) => setEditingCrop({ ...editingCrop, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t("editModal.notes")}</label>
                    <textarea
                      rows="2"
                      value={editingCrop.description || ""}
                      onChange={(e) => setEditingCrop({ ...editingCrop, description: e.target.value })}
                    />
                  </div>

                  {/* CROP PHOTO ATTACHMENT SECTION FOR EDIT */}
                  <div className="form-group crop-photo-upload-group">
                    <div className="crop-photo-header">
                      <div className="crop-photo-label-clean">
                        <span className="photo-label-title">
                          🌾 {t("listingModal.cropPhoto") ? t("listingModal.cropPhoto").replace(/\s*\(.*\)/, "") : "Crop Photo"}
                        </span>
                        <span className="photo-tag-optional">{t("listingModal.optional") || t("common.optional") || "Optional"}</span>
                      </div>
                      <span className="crop-photo-subnote">JPG, PNG, WebP · Max 8MB</span>
                    </div>

                    {!editingCrop.image ? (
                      <div className="photo-dropzone-box">
                        <div className="dropzone-guide">
                          <div className="dropzone-icon-bubble">
                            <Camera size={20} />
                          </div>
                          <div className="dropzone-text-group">
                            <span className="dropzone-main-text">Attach Real Harvest Photo</span>
                            <span className="dropzone-sub-text">Helps buyers verify quality and buy your produce faster</span>
                          </div>
                        </div>

                        <div className="dropzone-action-buttons">
                          <label className="btn-dropzone-action" title="Upload from Device / Gallery">
                            <Upload size={15} />
                            <span>{t("listingModal.uploadPhoto") || "Upload Photo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleCropImageUpload(e, "edit")}
                            />
                          </label>

                          <label className="btn-dropzone-action" title="Take a photo with your Camera">
                            <Camera size={15} />
                            <span>{t("listingModal.takePhoto") || "Take Photo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              style={{ display: "none" }}
                              onChange={(e) => handleCropImageUpload(e, "edit")}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="crop-photo-card-preview">
                        <div className="preview-image-holder">
                          <img src={editingCrop.image} alt="Crop preview" className="crop-preview-thumb" />
                          <div className="preview-status-pill">
                            <CheckCircle2 size={13} />
                            <span>Photo Attached</span>
                          </div>
                        </div>
                        <div className="preview-actions-col">
                          <div className="preview-info-text">
                            <strong>Harvest Photo Ready</strong>
                            <small>Displayed on crop card in marketplace</small>
                          </div>
                          <div className="preview-button-row">
                            <label className="btn-preview-action change" title="Change photo">
                              <RefreshCw size={13} />
                              <span>Change</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) => handleCropImageUpload(e, "edit")}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn-preview-action delete"
                              onClick={() => setEditingCrop((prev) => (prev ? { ...prev, image: "" } : prev))}
                              title="Remove photo"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-actions-row">
                    <button type="submit" className="btn-modal-submit green">
                      <Check size={18} />
                      <span>{t("editModal.saveChanges")}</span>
                    </button>
                    <button type="button" className="btn-modal-cancel" onClick={() => setModal("")}>
                      {t("editModal.backToDashboard")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 3. AUTHENTICATION: LOGIN & REGISTER */}
            {/* ----------------------------------------------------- */}
            {(modal === "login" || modal === "register") && (
              <div className="modal-inner-scroll">
                <div className="auth-tab-switch">
                  <button
                    className={`auth-tab-btn ${modal === "login" ? "active" : ""}`}
                    onClick={() => {
                      setAccount({ name: "", email: "", password: "", role: "Farmer" });
                      setFormReady(false);
                      setAuthModalKey((k) => k + 1);
                      setModal("login");
                    }}
                  >
                    {t("authModal.tabLogin")}
                  </button>
                  <button
                    className={`auth-tab-btn ${modal === "register" ? "active" : ""}`}
                    onClick={() => {
                      setAccount({ name: "", email: "", password: "", role: "Farmer" });
                      setFormReady(false);
                      setAuthModalKey((k) => k + 1);
                      setModal("register");
                    }}
                  >
                    {t("authModal.tabRegister")}
                  </button>
                </div>

                <div className="modal-title-bar">
                  <div>
                    <h2>{modal === "register" ? t("authModal.registerTitle") : t("authModal.loginTitle")}</h2>
                    <p>{modal === "register" ? t("authModal.registerDesc") : t("authModal.loginDesc")}</p>
                  </div>
                </div>

                <form key={`${modal}-${authModalKey}`} onSubmit={submitAccount} className="modern-form" autoComplete="off">
                  {/* Invisible decoy inputs to divert aggressive browser credential autofill */}
                  <input
                    type="text"
                    name="prevent_autofill_email_decoy"
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
                  />
                  <input
                    type="password"
                    name="prevent_autofill_pwd_decoy"
                    autoComplete="new-password"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
                  />

                  {modal === "register" && (
                    <div className="role-selector-cards">
                      <label
                        className={`role-choice-card ${account.role === "Farmer" ? "selected" : ""}`}
                        onClick={() => setAccount({ ...account, role: "Farmer" })}
                      >
                        <input
                          type="radio"
                          name="role"
                          checked={account.role === "Farmer"}
                          onChange={() => setAccount({ ...account, role: "Farmer" })}
                        />
                        <div className="role-choice-content">
                          <span className="role-emoji">🧑‍🌾</span>
                          <strong>{t("authModal.roleFarmerTitle")}</strong>
                          <small>{t("authModal.roleFarmerSub")}</small>
                        </div>
                      </label>

                      <label
                        className={`role-choice-card ${account.role === "Buyer" ? "selected" : ""}`}
                        onClick={() => setAccount({ ...account, role: "Buyer" })}
                      >
                        <input
                          type="radio"
                          name="role"
                          checked={account.role === "Buyer"}
                          onChange={() => setAccount({ ...account, role: "Buyer" })}
                        />
                        <div className="role-choice-content">
                          <span className="role-emoji">🛒</span>
                          <strong>{t("authModal.roleBuyerTitle")}</strong>
                          <small>{t("authModal.roleBuyerSub")}</small>
                        </div>
                      </label>
                    </div>
                  )}

                  {modal === "register" && (
                    <div className="form-group">
                      <label htmlFor="accName">{t("authModal.fullName")}</label>
                      <input
                        id="accName"
                        name="agro_reg_name"
                        type="text"
                        autoComplete="off"
                        required
                        placeholder={t("authModal.fullNamePlaceholder")}
                        value={account.name}
                        onChange={(e) => setAccount({ ...account, name: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="accEmail">{t("authModal.email")}</label>
                    <input
                      id="accEmail"
                      name="agro_login_email"
                      type="email"
                      autoComplete="off"
                      readOnly={!formReady}
                      onFocus={() => setFormReady(true)}
                      required
                      placeholder={t("authModal.emailPlaceholder")}
                      value={account.email}
                      onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="accPassword">{t("authModal.password")}</label>
                    <input
                      id="accPassword"
                      name="agro_login_password"
                      type="password"
                      autoComplete="new-password"
                      readOnly={!formReady}
                      onFocus={() => setFormReady(true)}
                      required
                      minLength={8}
                      placeholder={t("authModal.passwordPlaceholder")}
                      value={account.password}
                      onChange={(e) => setAccount({ ...account, password: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-modal-submit green full-width">
                    <span>{modal === "register" ? t("authModal.createAccountBtn") : t("authModal.signInBtn")}</span>
                  </button>

                  <div className="auth-footer-prompt">
                    {modal === "register" ? (
                      <p>
                        {t("authModal.alreadyAccount")}{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setAccount({ name: "", email: "", password: "", role: "Farmer" });
                            setFormReady(false);
                            setAuthModalKey((k) => k + 1);
                            setModal("login");
                          }}
                          className="link-text"
                        >
                          {t("authModal.loginHere")}
                        </button>
                      </p>
                    ) : (
                      <p>
                        {t("authModal.noAccount")}{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setAccount({ name: "", email: "", password: "", role: "Farmer" });
                            setFormReady(false);
                            setAuthModalKey((k) => k + 1);
                            setModal("register");
                          }}
                          className="link-text"
                        >
                          {t("authModal.createFree")}
                        </button>
                      </p>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 4. BUYER: ENQUIRY MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "enquiry" && selectedCrop && (
              <div className="modal-inner-scroll">
                <div className="modal-title-bar">
                  <div className="modal-title-icon-box green">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <span className="modal-eyebrow">{t("enquiryModal.eyebrow")}</span>
                    <h2>{t("enquiryModal.title")}</h2>
                    <p>{t("enquiryModal.subtitle")}</p>
                  </div>
                </div>

                {/* Crop summary card inside modal */}
                <div className="enquiry-crop-preview-box">
                  <div className="preview-emoji">{getCropVisualTheme(selectedCrop.name, selectedCrop.category).emoji}</div>
                  <div className="preview-details">
                    <h4>{selectedCrop.name}</h4>
                    <span className="preview-location">
                      📍 {selectedCrop.location} · {t("enquiryModal.grower")} {selectedCrop.farmerName || t("marketplace.card.verifiedLocalFarmer")}
                    </span>
                    <div className="preview-price-tag">
                      <strong>₹{selectedCrop.price}</strong> /{t(`units.${selectedCrop.unit}`) || selectedCrop.unit || "kg"} · {t("enquiryModal.stock")} {selectedCrop.quantity} {t(`units.${selectedCrop.unit}`) || selectedCrop.unit || "kg"}
                    </div>
                  </div>
                </div>

                <form onSubmit={submitEnquiry} className="modern-form">
                  <div className="form-group">
                    <label htmlFor="buyerNameInput">{t("enquiryModal.yourName")}</label>
                    <input
                      id="buyerNameInput"
                      name="buyerName"
                      required
                      defaultValue={currentUser?.name || ""}
                      placeholder={t("enquiryModal.yourNamePlaceholder")}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="contactInput">{t("enquiryModal.contactPhone")}</label>
                      <input
                        id="contactInput"
                        name="contact"
                        required
                        defaultValue={currentUser?.email || ""}
                        placeholder={t("enquiryModal.contactPlaceholder")}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="qtyInput">
                        {t("enquiryModal.quantityNeeded", { unit: t(`units.${selectedCrop.unit}`) || selectedCrop.unit || "kg" })}
                      </label>
                      <input
                        id="qtyInput"
                        name="quantity"
                        required
                        placeholder={t("enquiryModal.quantityPlaceholder", { unit: t(`units.${selectedCrop.unit}`) || selectedCrop.unit || "kg" })}
                      />
                    </div>
                  </div>

                  {/* Quick message suggestions */}
                  <div className="quick-template-row">
                    <span className="template-label">{t("enquiryModal.quickSuggestions")}</span>
                    <div className="template-buttons">
                      <button
                        type="button"
                        onClick={() => setEnquiryMessage(t("enquiryModal.templateBulk"))}
                      >
                        {t("enquiryModal.templateBulkBtn")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnquiryMessage(t("enquiryModal.templateSample"))}
                      >
                        {t("enquiryModal.templateSampleBtn")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnquiryMessage(t("enquiryModal.templatePickup"))}
                      >
                        {t("enquiryModal.templatePickupBtn")}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="enquiryMsgInput">{t("enquiryModal.messageLabel")}</label>
                    <textarea
                      id="enquiryMsgInput"
                      name="message"
                      rows="3"
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      placeholder={t("enquiryModal.messagePlaceholder")}
                    />
                  </div>

                  <div className="form-actions-row">
                    <button type="submit" className="btn-modal-submit green">
                      <MessageSquare size={18} />
                      <span>{t("enquiryModal.sendBtn")}</span>
                    </button>
                    <button type="button" className="btn-modal-cancel" onClick={() => setModal("")}>
                      {t("enquiryModal.cancelBtn")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 5. FARMER DASHBOARD MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "dashboard" && (
              <div className="modal-inner-scroll">
                <div className="dashboard-top-header">
                  <div>
                    <span className="modal-eyebrow">{t("farmerDashboard.eyebrow")}</span>
                    <h2>{t("farmerDashboard.title")}</h2>
                    <p>{t("farmerDashboard.subtitle")}</p>
                  </div>
                  <div className="dashboard-action-buttons">
                    <button className="btn-dashboard-refresh" onClick={openFarmerDashboard} title={t("farmerDashboard.refresh")}>
                      <RefreshCw size={15} />
                      <span>{t("farmerDashboard.refresh")}</span>
                    </button>
                    <button className="btn-dashboard-add" onClick={() => setModal("listing")}>
                      <Plus size={16} />
                      <span>{t("farmerDashboard.addNewCrop")}</span>
                    </button>
                  </div>
                </div>

                {dashboardLoading ? (
                  <div className="state-box loading-box">
                    <RefreshCw className="spinner-icon" size={28} />
                    <h3>{t("marketplace.loadingTitle")}</h3>
                  </div>
                ) : (
                  <>
                    {/* STATS OVERVIEW CARDS */}
                    <div className="stats-cards-grid">
                      <div className="stat-metric-card">
                        <div className="metric-icon-box green">
                          <Sprout size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{dashboardListings.length}</span>
                          <span className="metric-lbl">{t("farmerDashboard.statActiveCrops")}</span>
                        </div>
                      </div>

                      <div className="stat-metric-card">
                        <div className="metric-icon-box blue">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{dashboardEnquiries.length}</span>
                          <span className="metric-lbl">{t("farmerDashboard.statTotalEnquiries")}</span>
                        </div>
                      </div>

                      <div className="stat-metric-card alert">
                        <div className="metric-icon-box amber">
                          <Clock size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{farmerPendingCount}</span>
                          <span className="metric-lbl">{t("farmerDashboard.statPendingResponse")}</span>
                        </div>
                      </div>

                      <div className="stat-metric-card success">
                        <div className="metric-icon-box green">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{farmerRespondedCount}</span>
                          <span className="metric-lbl">{t("farmerDashboard.statResponded")}</span>
                        </div>
                      </div>
                    </div>

                    {/* DASHBOARD TAB CONTROLS */}
                    <div className="dashboard-tabs-bar">
                      <button
                        className={`d-tab-btn ${dashboardTab === "all" ? "active" : ""}`}
                        onClick={() => setDashboardTab("all")}
                      >
                        {t("farmerDashboard.tabAll")}
                      </button>
                      <button
                        className={`d-tab-btn ${dashboardTab === "listings" ? "active" : ""}`}
                        onClick={() => setDashboardTab("listings")}
                      >
                        {t("farmerDashboard.tabListings", { count: dashboardListings.length })}
                      </button>
                      <button
                        className={`d-tab-btn d-tab-enquiries desktop-hide ${dashboardTab === "enquiries" ? "active" : ""}`}
                        onClick={() => setDashboardTab("enquiries")}
                      >
                        {t("farmerDashboard.tabEnquiries", { count: dashboardEnquiries.length })}
                        {farmerPendingCount > 0 && <span className="tab-bubble-count">{farmerPendingCount}</span>}
                      </button>
                    </div>

                    {/* LISTINGS SECTION */}
                    {(dashboardTab === "all" || dashboardTab === "listings") && (
                      <div className="dashboard-content-block">
                        <div className="block-title-row">
                          <h3>{t("farmerDashboard.myPublishedCrops", { count: dashboardListings.length })}</h3>
                          <button className="btn-small-link" onClick={() => setModal("listing")}>
                            {t("farmerDashboard.listAnotherCrop")}
                          </button>
                        </div>

                        {dashboardListings.length === 0 ? (
                          <div className="dashboard-empty-state">
                            <Tractor size={36} className="empty-state-icon" />
                            <h4>{t("farmerDashboard.emptyListingsTitle")}</h4>
                            <p>{t("farmerDashboard.emptyListingsDesc")}</p>
                            <button className="btn-modal-submit green" onClick={() => setModal("listing")}>
                              <Plus size={16} />
                              <span>{t("farmerDashboard.listFirstCropBtn")}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="dashboard-listings-grid">
                            {dashboardListings.map((crop) => (
                              <div className="farmer-crop-manage-card" key={crop._id}>
                                <div className="manage-card-header">
                                  <div>
                                    <span className="category-pill-sm">{t(`categories.${crop.category}`) || crop.category}</span>
                                    <h4>{crop.name}</h4>
                                  </div>
                                  <div className="manage-price-box">
                                    <strong>₹{crop.price}</strong>
                                    <small>/{t(`units.${crop.unit}`) || crop.unit || "kg"}</small>
                                  </div>
                                </div>

                                <div className="manage-card-meta">
                                  <span>📦 {t("farmerDashboard.stockLabel")} <strong>{crop.quantity} {t(`units.${crop.unit}`) || crop.unit || "kg"}</strong></span>
                                  <span>📍 {t("farmerDashboard.locationLabel")} <strong>{crop.location}</strong></span>
                                </div>

                                {crop.description && (
                                  <p className="manage-card-notes">"{crop.description}"</p>
                                )}

                                <div className="manage-card-buttons">
                                  <button className="btn-manage-edit" onClick={() => openEditModal(crop)}>
                                    <Edit2 size={14} />
                                    <span>{t("farmerDashboard.editBtn")}</span>
                                  </button>
                                  <button
                                    className="btn-manage-del"
                                    onClick={() => handleDeleteCrop(crop._id, crop.name)}
                                  >
                                    <Trash2 size={14} />
                                    <span>{t("farmerDashboard.deleteBtn")}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ENQUIRIES SECTION */}
                    {(dashboardTab === "all" || dashboardTab === "enquiries") && (
                      <div className="dashboard-content-block">
                        <div className="block-title-row">
                          <h3>{t("farmerDashboard.incomingEnquiries", { count: dashboardEnquiries.length })}</h3>
                        </div>

                        {dashboardEnquiries.length === 0 ? (
                          <div className="dashboard-empty-state">
                            <MessageSquare size={36} className="empty-state-icon" />
                            <h4>{t("farmerDashboard.emptyEnquiriesTitle")}</h4>
                            <p>{t("farmerDashboard.emptyEnquiriesDesc")}</p>
                          </div>
                        ) : (
                          <div className="enquiries-list-stack">
                            {dashboardEnquiries.map((enquiry) => (
                              <div className="enquiry-detail-card" key={enquiry._id}>
                                <div className="enquiry-top-row">
                                  <div className="enquiry-crop-identifier">
                                    <span className="crop-tag-title">
                                      🌾 {enquiry.crop?.name || "Crop"} · ₹{enquiry.crop?.price || "--"} / {t(`units.${enquiry.crop?.unit}`) || enquiry.crop?.unit || "kg"}
                                    </span>
                                    <span className="enquiry-timestamp">
                                      {formatEnquiryDate(enquiry.createdAt, language)}
                                    </span>
                                  </div>

                                  <span className={`status-pill-badge status-${(enquiry.status || "").toLowerCase()}`}>
                                    {enquiry.status === "Pending" && `🕒 ${t("statuses.Pending")}`}
                                    {enquiry.status === "Responded" && `✅ ${t("statuses.Responded")}`}
                                    {enquiry.status === "Closed" && `📁 ${t("statuses.Closed")}`}
                                    {(enquiry.status === "confirmed" || enquiry.status === "Confirmed") && `✓ ${t("farmerDashboard.orderConfirmed") || "Order Confirmed"}`}
                                    {(enquiry.status === "rejected" || enquiry.status === "Rejected") && `✕ ${t("farmerDashboard.orderRejected") || "Order Rejected"}`}
                                  </span>
                                </div>

                                <div className="buyer-contact-cardlet">
                                  <div className="contact-item">
                                    <User size={15} />
                                    <span><strong>{t("farmerDashboard.buyerLabel")}</strong> {enquiry.buyerName}</span>
                                  </div>
                                  <div className="contact-item">
                                    <Mail size={15} />
                                    <span><strong>{t("farmerDashboard.contactLabel")}</strong> <a href={`mailto:${enquiry.buyerEmail}`}>{enquiry.buyerEmail}</a></span>
                                  </div>
                                </div>

                                <div className="enquiry-message-bubble">
                                  <span className="msg-label">{t("farmerDashboard.buyerMessageLabel")}</span>
                                  <p>{enquiry.message}</p>
                                </div>

                                <div className="enquiry-status-row enquiry-action-toolbar">
                                  {(enquiry.status === "confirmed" || enquiry.status === "Confirmed") ? (
                                    <div className="order-final-status confirmed" role="status">
                                      <CheckCircle2 size={16} />
                                      <span>{t("farmerDashboard.orderConfirmed") || "Order Confirmed"}</span>
                                    </div>
                                  ) : (enquiry.status === "rejected" || enquiry.status === "Rejected") ? (
                                    <div className="order-final-status rejected" role="status">
                                      <XCircle size={16} />
                                      <span>{t("farmerDashboard.orderRejected") || "Order Rejected"}</span>
                                    </div>
                                  ) : (
                                    <div className="order-action-buttons-group">
                                      <button
                                        type="button"
                                        className="btn-order-action confirm"
                                        onClick={() => handlePromptOrderAction(enquiry, "confirm")}
                                        disabled={processingOrderAction}
                                        title={t("farmerDashboard.confirmOrderTooltip") || "Confirm this order"}
                                      >
                                        <Check size={16} />
                                        <span>{t("farmerDashboard.confirmOrder") || "Confirm Order"}</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-order-action reject"
                                        onClick={() => handlePromptOrderAction(enquiry, "reject")}
                                        disabled={processingOrderAction}
                                        title={t("farmerDashboard.rejectOrderTooltip") || "Reject this order"}
                                      >
                                        <X size={16} />
                                        <span>{t("farmerDashboard.rejectOrder") || "Reject Order"}</span>
                                      </button>
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    className="btn-chat-with-user"
                                    onClick={() => {
                                      const buyerObj = typeof enquiry.buyer === "object"
                                        ? enquiry.buyer
                                        : { _id: enquiry.buyer, name: enquiry.buyerName, email: enquiry.buyerEmail, role: "Buyer" };
                                      handleStartChat(buyerObj, enquiry.crop);
                                    }}
                                  >
                                    <MessageSquare size={14} />
                                    <span>{t("chat.chatWithBuyer") || "Chat with Buyer"}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* 6. BUYER DASHBOARD MODAL */}
            {/* ----------------------------------------------------- */}
            {modal === "buyerDashboard" && (
              <div className="modal-inner-scroll">
                <div className="dashboard-top-header">
                  <div>
                    <span className="modal-eyebrow">{t("buyerDashboard.eyebrow")}</span>
                    <h2>{t("buyerDashboard.title")}</h2>
                    <p>{t("buyerDashboard.subtitle")}</p>
                  </div>
                  <div className="dashboard-action-buttons">
                    <button className="btn-dashboard-refresh" onClick={openBuyerDashboard} title={t("buyerDashboard.refresh")}>
                      <RefreshCw size={15} />
                      <span>{t("buyerDashboard.refresh")}</span>
                    </button>
                    <button className="btn-dashboard-add" onClick={() => setModal("")}>
                      <Store size={16} />
                      <span>{t("buyerDashboard.browseMoreCrops")}</span>
                    </button>
                  </div>
                </div>

                {buyerLoading ? (
                  <div className="state-box loading-box">
                    <RefreshCw className="spinner-icon" size={28} />
                    <h3>{t("marketplace.loadingTitle")}</h3>
                  </div>
                ) : buyerError ? (
                  <div className="state-box error-box">
                    <AlertCircle size={28} />
                    <h3>{buyerError}</h3>
                    <button className="btn-modal-submit green" onClick={openBuyerDashboard}>
                      {t("farmerDashboard.refresh")}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="stats-cards-grid">
                      <div className="stat-metric-card">
                        <div className="metric-icon-box blue">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{buyerEnquiries.length}</span>
                          <span className="metric-lbl">{t("buyerDashboard.statTotalSent")}</span>
                        </div>
                      </div>

                      <div className="stat-metric-card alert">
                        <div className="metric-icon-box amber">
                          <Clock size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{buyerPendingCount}</span>
                          <span className="metric-lbl">{t("buyerDashboard.statAwaitingReply")}</span>
                        </div>
                      </div>

                      <div className="stat-metric-card success">
                        <div className="metric-icon-box green">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{buyerRespondedCount}</span>
                          <span className="metric-lbl">{t("buyerDashboard.statFarmerResponded")}</span>
                        </div>
                      </div>

                      <div className="stat-metric-card">
                        <div className="metric-icon-box">
                          <Check size={20} />
                        </div>
                        <div>
                          <span className="metric-val">{buyerClosedCount}</span>
                          <span className="metric-lbl">{t("buyerDashboard.statClosedDeals")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-content-block">
                      <div className="block-title-row">
                        <h3>{t("buyerDashboard.myEnquiryHistory", { count: buyerEnquiries.length })}</h3>
                      </div>

                      {buyerEnquiries.length === 0 ? (
                        <div className="dashboard-empty-state">
                          <ShoppingCart size={36} className="empty-state-icon" />
                          <h4>{t("buyerDashboard.emptyTitle")}</h4>
                          <p>{t("buyerDashboard.emptyDesc")}</p>
                          <button
                            className="btn-modal-submit green"
                            onClick={() => {
                              setModal("");
                              const el = document.getElementById("marketplace");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            <span>{t("buyerDashboard.exploreBtn")}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="enquiries-list-stack">
                          {buyerEnquiries.map((enquiry) => (
                            <div className="enquiry-detail-card" key={enquiry._id}>
                              <div className="enquiry-top-row">
                                <div className="enquiry-crop-identifier">
                                  <span className="crop-tag-title">
                                    🌾 {enquiry.crop?.name || "Crop"}
                                  </span>
                                  {enquiry.crop?.location && (
                                    <span className="enquiry-location-sub">
                                      📍 {enquiry.crop.location} · ₹{enquiry.crop.price} / {t(`units.${enquiry.crop.unit}`) || enquiry.crop.unit || "kg"}
                                    </span>
                                  )}
                                  <span className="enquiry-timestamp">
                                    {t("buyerDashboard.submittedOn", {
                                      date: formatEnquiryDate(enquiry.createdAt, language)
                                    })}
                                  </span>
                                </div>

                                <span className={`status-pill-badge status-${enquiry.status.toLowerCase()}`}>
                                  {enquiry.status === "Pending" && t("statuses.buyerPendingBadge")}
                                  {enquiry.status === "Responded" && t("statuses.buyerRespondedBadge")}
                                  {enquiry.status === "Closed" && t("statuses.buyerClosedBadge")}
                                </span>
                              </div>

                              <div className="enquiry-message-bubble">
                                <span className="msg-label">{t("buyerDashboard.yourRequirementSent")}</span>
                                <p style={{ whiteSpace: "pre-line" }}>{enquiry.message}</p>
                              </div>

                              <div className="buyer-enquiry-footer-note">
                                <Info size={14} />
                                <span>
                                  {enquiry.status === "Pending"
                                    ? t("buyerDashboard.notePending")
                                    : enquiry.status === "Responded"
                                      ? t("buyerDashboard.noteResponded")
                                      : t("buyerDashboard.noteClosed")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. SPLASH SCREEN (Screen 1) */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false);
            try {
              sessionStorage.setItem("agroconnectSplashShown", "true");
            } catch {
              // ignore
            }
          }}
        />
      )}

      {/* 2. WEATHER UPDATES MODAL (Screen 9) */}
      {weatherModalOpen && (
        <WeatherModal onClose={() => setWeatherModalOpen(false)} />
      )}

      {/* 3. DIRECT CHAT MODAL (Screen 8) */}
      {chatModalOpen && (
        <DirectChatModal
          currentUser={currentUser}
          targetRecipient={chatRecipient}
          targetCrop={chatCrop}
          onClose={() => {
            setChatModalOpen(false);
            setChatRecipient(null);
            setChatCrop(null);
            fetchUnreadChats();
          }}
          onRequestLogin={() => {
            setChatModalOpen(false);
            openLoginModal("Buyer");
          }}
        />
      )}

      {/* 4. FARMER PROFILE MODAL (Screen 4) */}
      {farmerProfileModalOpen && activeFarmerId && (
        <FarmerProfileModal
          farmerId={activeFarmerId}
          currentUser={currentUser}
          onClose={() => {
            setFarmerProfileModalOpen(false);
            setActiveFarmerId(null);
          }}
          onSelectCropForDetails={(crop) => {
            setFarmerProfileModalOpen(false);
            handleOpenProductDetails(crop);
          }}
          onStartChatWithFarmer={(farmer, crop) => {
            setFarmerProfileModalOpen(false);
            handleStartChat(farmer, crop);
          }}
          onRequestLogin={() => {
            setFarmerProfileModalOpen(false);
            openLoginModal("Buyer");
          }}
        />
      )}

      {/* 5. BUYER SEARCH & DIRECTORY MODAL (Screen 5) */}
      {buyerDirectoryModalOpen && (
        <BuyerDirectoryModal
          currentUser={currentUser}
          onClose={() => setBuyerDirectoryModalOpen(false)}
          onStartChatWithBuyer={(buyer) => {
            setBuyerDirectoryModalOpen(false);
            handleStartChat(buyer);
          }}
          onRequestLogin={() => {
            setBuyerDirectoryModalOpen(false);
            openLoginModal("Farmer");
          }}
        />
      )}

      {/* 6. PRODUCT DETAILS MODAL (Screen 7) */}
      {productDetailsModalOpen && productDetailsCrop && (
        <ProductDetailsModal
          crop={productDetailsCrop}
          currentUser={currentUser}
          onClose={() => {
            setProductDetailsModalOpen(false);
            setProductDetailsCrop(null);
          }}
          onOpenEnquiry={(crop) => {
            setProductDetailsModalOpen(false);
            showEnquiry(crop);
          }}
          onStartChatWithFarmer={(farmer, crop) => {
            setProductDetailsModalOpen(false);
            handleStartChat(farmer, crop);
          }}
          onOpenFarmerProfile={(farmerId) => {
            setProductDetailsModalOpen(false);
            handleOpenFarmerProfile(farmerId);
          }}
        />
      )}

      {/* 7. USER PROFILE & SETTINGS MODAL (Screen 10) */}
      {userProfileModalOpen && currentUser && (
        <UserProfileModal
          isOpen={userProfileModalOpen}
          initialTab={userProfileTab}
          currentUser={currentUser}
          onClose={() => setUserProfileModalOpen(false)}
          onUserUpdate={(updatedUser) => {
            setCurrentUser(updatedUser);
            sessionStorage.setItem("agroconnectUser", JSON.stringify(updatedUser));
          }}
          onLogout={handleLogout}
          onOpenFarmerDashboard={() => {
            setUserProfileModalOpen(false);
            openFarmerDashboard();
          }}
          onOpenBuyerDashboard={() => {
            setUserProfileModalOpen(false);
            openBuyerDashboard();
          }}
          onOpenChat={() => {
            setUserProfileModalOpen(false);
            setChatRecipient(null);
            setChatCrop(null);
            navigateToMessages();
          }}
        />
      )}

      {/* ORDER CONFIRMATION / REJECTION MODAL */}
      {orderConfirmModal.isOpen && orderConfirmModal.enquiry && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-container modal-order-confirm">
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-eyebrow">
                  {orderConfirmModal.action === "confirm" ? "Order Action" : "Order Action"}
                </span>
                <h3 className="modal-title">
                  {orderConfirmModal.action === "confirm"
                    ? (t("farmerDashboard.confirmOrderModalTitle") || "Confirm Buyer Order?")
                    : (t("farmerDashboard.rejectOrderModalTitle") || "Reject Buyer Order?")}
                </h3>
              </div>
              <button
                className="btn-modal-close"
                onClick={() => !processingOrderAction && setOrderConfirmModal({ isOpen: false, action: null, enquiry: null })}
                disabled={processingOrderAction}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className={`order-confirm-warning-box ${orderConfirmModal.action}`}>
                {orderConfirmModal.action === "confirm" ? (
                  <CheckCircle2 size={30} className="warning-icon green" />
                ) : (
                  <XCircle size={30} className="warning-icon red" />
                )}
                <div className="warning-copy">
                  <p className="warning-main-text">
                    {orderConfirmModal.action === "confirm"
                      ? (t("farmerDashboard.confirmOrderPrompt") || "Are you sure you want to confirm this order?")
                      : (t("farmerDashboard.rejectOrderPrompt") || "Are you sure you want to reject this order?")}
                  </p>
                  <p className="warning-sub-text">
                    {orderConfirmModal.action === "confirm"
                      ? (t("farmerDashboard.confirmOrderBuyerNote", {
                          buyer: orderConfirmModal.enquiry.buyerName,
                          crop: orderConfirmModal.enquiry.crop?.name || "crop"
                        }) || "The buyer will be instantly notified that their order has been confirmed.")
                      : (t("farmerDashboard.rejectOrderBuyerNote", {
                          buyer: orderConfirmModal.enquiry.buyerName,
                          crop: orderConfirmModal.enquiry.crop?.name || "crop"
                        }) || "The buyer will be notified that this order could not be accepted.")}
                  </p>
                </div>
              </div>

              <div className="order-summary-cardlet">
                <div className="summary-row">
                  <span className="summary-label">{t("farmerDashboard.cropLabel") || "Crop"}:</span>
                  <span className="summary-val">🌾 {orderConfirmModal.enquiry.crop?.name || "Crop"}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">{t("farmerDashboard.buyerLabel")}:</span>
                  <span className="summary-val">{orderConfirmModal.enquiry.buyerName}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">{t("farmerDashboard.contactLabel")}:</span>
                  <span className="summary-val">{orderConfirmModal.enquiry.buyerEmail}</span>
                </div>
                {orderConfirmModal.enquiry.message && (
                  <div className="summary-requirement">
                    <span className="summary-label">{t("farmerDashboard.buyerMessageLabel")}:</span>
                    <p className="summary-msg">{orderConfirmModal.enquiry.message}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setOrderConfirmModal({ isOpen: false, action: null, enquiry: null })}
                disabled={processingOrderAction}
              >
                {t("buttons.cancel") || "Cancel"}
              </button>
              <button
                type="button"
                className={`btn-modal-submit ${orderConfirmModal.action === "confirm" ? "green" : "red"}`}
                onClick={executeOrderAction}
                disabled={processingOrderAction}
              >
                {processingOrderAction ? (
                  <>
                    <RefreshCw size={16} className="spinner-icon" />
                    <span>Processing...</span>
                  </>
                ) : orderConfirmModal.action === "confirm" ? (
                  <>
                    <Check size={16} />
                    <span>{t("farmerDashboard.confirmOrder") || "Confirm Order"}</span>
                  </>
                ) : (
                  <>
                    <X size={16} />
                    <span>{t("farmerDashboard.rejectOrder") || "Reject Order"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav
        activeNav={mobileNavActive}
        onNavClick={handleMobileNavClick}
        unreadChatCount={unreadChatCount}
        unreadCount={unreadChatCount}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
