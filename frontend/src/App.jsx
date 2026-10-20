import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  ChevronUp
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
import MessagesView from "./components/MessagesView";
import SidebarNav from "./components/SidebarNav";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomeView from "./components/views/HomeView";
import MarketplaceView from "./components/views/MarketplaceView";
import BuyerDashboardView from "./components/views/BuyerDashboardView";
import FarmerDashboardView from "./components/views/FarmerDashboardView";
import FarmerDiscoveryView from "./components/views/FarmerDiscoveryView";
import AuthModal from "./components/modals/AuthModal";
import CropListingModal from "./components/modals/CropListingModal";
import SendEnquiryModal from "./components/modals/SendEnquiryModal";
import OrderConfirmModal from "./components/modals/OrderConfirmModal";
import {
  PRESET_LOCATIONS,
  getCropPhotoUrl,
  getCropVisualTheme,
  formatEnquiryDate,
  formatRelativeTime,
  playChatNotificationSound
} from "./utils/formatters";
import { connectChatSocket, getChatSocket } from "./services/socket";
import { apiUrl } from "./config/api";

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
  const [dashboardTab, setDashboardTab] = useState(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#my-products" || hash === "#products") return "listings";
      if (hash === "#farmer-enquiries" || hash === "#enquiries") return "enquiries";
      if (hash === "#farmer-orders" || hash === "#orders") return "orders";
      if (hash === "#sales-report") return "sales-report";
      const saved = sessionStorage.getItem("agroconnectDashboardTab");
      if (saved) return saved;
    } catch { }
    return "all";
  }); // 'all' | 'listings' | 'enquiries' | 'orders' | 'sales-report'

  // Buyer Dashboard states
  const [buyerDashboardTab, setBuyerDashboardTab] = useState(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#buyer-enquiries" || hash === "#enquiries") return "enquiries";
      if (hash === "#buyer-orders" || hash === "#orders" || hash === "#order-updates") return "orders";
      if (hash === "#purchases-report") return "purchases-report";
      const saved = sessionStorage.getItem("agroconnectBuyerTab");
      if (saved) return saved;
    } catch { }
    return "all";
  }); // 'all' | 'enquiries' | 'orders' | 'purchases-report'
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
      const savedView = sessionStorage.getItem("agroconnectCurrentView");
      const view = hash.replace("#", "") || savedView;
      if (!user) {
        if (view === "marketplace") return "crops";
        return "home";
      }
      if (view === "marketplace") return "crops";
      if (view === "messages") return "messages";
      if (view === "farmers") return "farmers";
      if (view === "buyer-dashboard" || view === "buyer-enquiries" || view === "buyer-orders" || view === "purchases-report") return "buyerDashboard";
      if (view === "farmer-dashboard" || view === "my-products" || view === "farmer-enquiries" || view === "farmer-orders" || view === "sales-report") return "farmerDashboard";
    } catch {
      // ignore
    }
    return "home";
  });

  // Current view: 'home' | 'marketplace' | 'buyer-dashboard' | 'farmer-dashboard' | 'farmers' | 'messages'
  const [currentView, setCurrentView] = useState(() => {
    try {
      const stored = sessionStorage.getItem("agroconnectUser");
      const user = stored ? JSON.parse(stored) : null;
      const hash = window.location.hash.toLowerCase();
      const savedView = sessionStorage.getItem("agroconnectCurrentView");

      // 1. Check URL hash first
      if (hash === "#marketplace") return "marketplace";
      if (hash === "#farmers") return "farmers";
      if (hash === "#messages") return user ? "messages" : "home";
      if (
        hash === "#buyer-dashboard" ||
        hash === "#buyer-enquiries" ||
        hash === "#buyer-orders" ||
        hash === "#purchases-report" ||
        hash === "#order-updates"
      ) {
        return user?.role === "Buyer" ? "buyer-dashboard" : user?.role === "Farmer" ? "farmer-dashboard" : "home";
      }
      if (
        hash === "#farmer-dashboard" ||
        hash === "#dashboard" ||
        hash === "#my-products" ||
        hash === "#products" ||
        hash === "#farmer-enquiries" ||
        hash === "#enquiries" ||
        hash === "#farmer-orders" ||
        hash === "#orders" ||
        hash === "#sales-report" ||
        hash === "#list-crop"
      ) {
        return user?.role === "Farmer" ? "farmer-dashboard" : user?.role === "Buyer" ? "buyer-dashboard" : "home";
      }
      if (hash === "#home" || hash === "#how-it-works") return "home";

      // 2. Fall back to savedView from sessionStorage
      if (savedView) {
        if (savedView === "messages" && !user) return "home";
        if (savedView === "buyer-dashboard" && user?.role !== "Buyer") return user ? "farmer-dashboard" : "home";
        if (savedView === "farmer-dashboard" && user?.role !== "Farmer") return user ? "buyer-dashboard" : "home";
        return savedView;
      }

      // 3. Fallback based on user state
      if (!user) return "home";
      if (user.role === "Farmer") return "farmer-dashboard";
      return "marketplace";
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

  // Enable native browser scroll restoration on reload
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "auto";
    }
  }, []);

  // Floating round arrow button visibility + track scroll location per view
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 280);
      if (window.scrollY > 0) {
        sessionStorage.setItem(`agroconnectScroll_${currentView}`, window.scrollY.toString());
        sessionStorage.setItem("agroconnectLastScrollY", window.scrollY.toString());
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentView]);

  // Restore scroll position at exact location on reload or when view data finishes loading
  useEffect(() => {
    const saved =
      sessionStorage.getItem(`agroconnectScroll_${currentView}`) ||
      sessionStorage.getItem("agroconnectLastScrollY");
    if (saved) {
      const pos = parseInt(saved, 10);
      if (pos > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: pos, behavior: "instant" });
        });
        const timer = setTimeout(() => {
          if (Math.abs(window.scrollY - pos) > 40) {
            window.scrollTo({ top: pos, behavior: "instant" });
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [currentView, loading, farmersLoading, dashboardLoading, buyerLoading]);

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
    setCurrentView((prev) => {
      if (prev !== "marketplace") {
        sessionStorage.removeItem("agroconnectScroll_marketplace");
        sessionStorage.removeItem("agroconnectLastScrollY");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return "marketplace";
    });
    sessionStorage.setItem("agroconnectCurrentView", "marketplace");
    setMobileNavActive("crops");
    if (window.location.hash !== "#marketplace") {
      window.location.hash = "marketplace";
    }
  }, []);

  const goToFarmerDashboard = useCallback(() => {
    setCurrentView((prev) => {
      if (prev !== "farmer-dashboard") {
        sessionStorage.removeItem("agroconnectScroll_farmer-dashboard");
        sessionStorage.removeItem("agroconnectLastScrollY");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return "farmer-dashboard";
    });
    sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
    setDashboardTab("all");
    sessionStorage.setItem("agroconnectDashboardTab", "all");
    setMobileNavActive("farmerDashboard");
    if (window.location.hash !== "#farmer-dashboard") {
      window.location.hash = "farmer-dashboard";
    }
    fetchFarmerDashboardData();
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

  const navigateToMarketplace = useCallback(() => {
    goToMarketplace();
  }, [goToMarketplace]);

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
    setCurrentView((prev) => {
      if (prev !== "home") {
        sessionStorage.removeItem("agroconnectScroll_home");
        sessionStorage.removeItem("agroconnectLastScrollY");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return "home";
    });
    sessionStorage.setItem("agroconnectCurrentView", "home");
    setMobileNavActive("home");
    if (window.location.hash !== "#home") {
      window.location.hash = "home";
    }
  }, []);

  const navigateToBuyerDashboard = useCallback((userOverride) => {
    const activeUser = resolveActiveUser(userOverride);
    if (!activeUser) {
      triggerNotice(t("notices.loginToAccess"), "info");
      openLoginModal("Buyer");
      return;
    }
    if (activeUser.role !== "Buyer") {
      triggerNotice(t("notices.buyerOnlyArea"), "info");
      goToFarmerDashboard();
      return;
    }
    setCurrentView((prev) => {
      if (prev !== "buyer-dashboard") {
        sessionStorage.removeItem("agroconnectScroll_buyer-dashboard");
        sessionStorage.removeItem("agroconnectLastScrollY");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return "buyer-dashboard";
    });
    sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
    setBuyerDashboardTab("all");
    sessionStorage.setItem("agroconnectBuyerTab", "all");
    setMobileNavActive("buyerDashboard");
    if (window.location.hash !== "#buyer-dashboard") {
      window.location.hash = "buyer-dashboard";
    }
    fetchBuyerEnquiries();
  }, [resolveActiveUser, t, goToFarmerDashboard, fetchBuyerEnquiries, openLoginModal]);

  const navigateToFarmerDiscovery = useCallback((userOverride) => {
    const activeUser = resolveActiveUser(userOverride);
    if (!activeUser) {
      triggerNotice(t("notices.loginToAccess"), "info");
      openLoginModal("Buyer");
      return;
    }
    setCurrentView((prev) => {
      if (prev !== "farmers") {
        sessionStorage.removeItem("agroconnectScroll_farmers");
        sessionStorage.removeItem("agroconnectLastScrollY");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return "farmers";
    });
    sessionStorage.setItem("agroconnectCurrentView", "farmers");
    setMobileNavActive("farmers");
    if (window.location.hash !== "#farmers") {
      window.location.hash = "farmers";
    }
    fetchFarmersList();
  }, [resolveActiveUser, t, fetchFarmersList, openLoginModal]);

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
    setCurrentView((prev) => {
      if (prev !== "messages") {
        sessionStorage.removeItem("agroconnectScroll_messages");
        sessionStorage.removeItem("agroconnectLastScrollY");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return "messages";
    });
    sessionStorage.setItem("agroconnectCurrentView", "messages");
    setMobileNavActive("messages");
    if (window.location.hash !== "#messages") {
      window.location.hash = "messages";
    }
  }, [currentUser, openLoginModal, t]);

  const handleJoinRole = useCallback((role) => {
    openRegisterModal(role);
  }, [openRegisterModal]);

  const handleClearNotification = useCallback(async (notifId) => {
    const token = sessionStorage.getItem("agroconnectToken");
    setBuyerNotifications((prev) => {
      const target = prev.find((n) => n._id === notifId);
      if (target && !target.read) {
        setUnreadNotificationCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n._id !== notifId);
    });
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

  const handleClearAllNotifications = useCallback(async () => {
    if (!buyerNotifications || buyerNotifications.length === 0) return;
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;

    const token = sessionStorage.getItem("agroconnectToken");
    setBuyerNotifications([]);
    setUnreadNotificationCount(0);
    if (!token) return;
    try {
      await fetch(apiUrl("/api/notifications/clear-all"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn("Failed to clear all notifications:", err);
    }
  }, [buyerNotifications]);

  const handleSidebarNavigate = useCallback((id) => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
    if (currentUser?.role === "Farmer") {
      if (id === "dashboard") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("all");
        sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
        sessionStorage.setItem("agroconnectDashboardTab", "all");
        setMobileNavActive("farmerDashboard");
        if (window.location.hash !== "#farmer-dashboard") {
          window.location.hash = "farmer-dashboard";
        }
        fetchFarmerDashboardData();
      } else if (id === "products") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("listings");
        sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
        sessionStorage.setItem("agroconnectDashboardTab", "listings");
        setMobileNavActive("farmerDashboard");
        if (window.location.hash !== "#my-products") {
          window.location.hash = "my-products";
        }
        fetchFarmerDashboardData();
      } else if (id === "enquiries") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("enquiries");
        sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
        sessionStorage.setItem("agroconnectDashboardTab", "enquiries");
        setMobileNavActive("farmerDashboard");
        if (window.location.hash !== "#farmer-enquiries") {
          window.location.hash = "farmer-enquiries";
        }
        fetchFarmerDashboardData();
      } else if (id === "orders") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("orders");
        sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
        sessionStorage.setItem("agroconnectDashboardTab", "orders");
        setMobileNavActive("farmerDashboard");
        if (window.location.hash !== "#farmer-orders") {
          window.location.hash = "farmer-orders";
        }
        fetchFarmerDashboardData();
      } else if (id === "sales-report") {
        setCurrentView("farmer-dashboard");
        setDashboardTab("sales-report");
        sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
        sessionStorage.setItem("agroconnectDashboardTab", "sales-report");
        setMobileNavActive("farmerDashboard");
        if (window.location.hash !== "#sales-report") {
          window.location.hash = "sales-report";
        }
        fetchFarmerDashboardData();
      } else if (id === "marketplace") {
        navigateToMarketplace();
      } else if (id === "farmers") {
        navigateToFarmerDiscovery();
      } else if (id === "messages") {
        navigateToMessages();
      } else if (id === "settings") {
        setUserProfileTab("overview");
        setUserProfileModalOpen(true);
      }
    } else {
      // Buyer Navigation
      if (id === "dashboard") {
        setCurrentView("buyer-dashboard");
        setBuyerDashboardTab("all");
        sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
        sessionStorage.setItem("agroconnectBuyerTab", "all");
        setMobileNavActive("buyerDashboard");
        if (window.location.hash !== "#buyer-dashboard") {
          window.location.hash = "buyer-dashboard";
        }
        fetchBuyerEnquiries();
      } else if (id === "enquiries") {
        setCurrentView("buyer-dashboard");
        setBuyerDashboardTab("enquiries");
        sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
        sessionStorage.setItem("agroconnectBuyerTab", "enquiries");
        setMobileNavActive("buyerDashboard");
        if (window.location.hash !== "#buyer-enquiries") {
          window.location.hash = "buyer-enquiries";
        }
        fetchBuyerEnquiries();
      } else if (id === "orders") {
        setCurrentView("buyer-dashboard");
        setBuyerDashboardTab("orders");
        sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
        sessionStorage.setItem("agroconnectBuyerTab", "orders");
        setMobileNavActive("buyerDashboard");
        if (window.location.hash !== "#buyer-orders") {
          window.location.hash = "buyer-orders";
        }
        fetchBuyerEnquiries();
      } else if (id === "purchases-report" || id === "purchase-report") {
        setCurrentView("buyer-dashboard");
        setBuyerDashboardTab("purchases-report");
        sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
        sessionStorage.setItem("agroconnectBuyerTab", "purchases-report");
        setMobileNavActive("buyerDashboard");
        if (window.location.hash !== "#purchases-report" && window.location.hash !== "#purchase-report") {
          window.location.hash = "purchases-report";
        }
        fetchBuyerEnquiries();
      } else if (id === "marketplace") {
        navigateToMarketplace();
      } else if (id === "farmers") {
        navigateToFarmerDiscovery();
      } else if (id === "messages") {
        navigateToMessages();
      } else if (id === "settings") {
        setUserProfileTab("overview");
        setUserProfileModalOpen(true);
      }
    }
  }, [
    currentUser,
    fetchFarmerDashboardData,
    fetchBuyerEnquiries,
    navigateToMarketplace,
    navigateToFarmerDiscovery,
    navigateToMessages
  ]);

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

  const handleCropImageUpload = (e, target = "listing", callback) => {
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
        if (typeof callback === "function") {
          callback(dataUrl);
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

      // 1. GUEST RULES
      if (!activeUser) {
        if (
          hash === "#messages" ||
          hash === "#buyer-dashboard" ||
          hash === "#farmer-dashboard" ||
          hash === "#list-crop" ||
          hash === "#profile" ||
          hash === "#my-products" ||
          hash === "#products" ||
          hash === "#buyer-enquiries" ||
          hash === "#farmer-enquiries" ||
          hash === "#enquiries" ||
          hash === "#buyer-orders" ||
          hash === "#farmer-orders" ||
          hash === "#orders" ||
          hash === "#sales-report" ||
          hash === "#purchases-report" ||
          hash === "#settings"
        ) {
          triggerNotice(t("chat.loginRequired") || t("notices.loginToExploreMarketplace"), "info");
          openLoginModal("Buyer");
          setCurrentView("home");
          sessionStorage.setItem("agroconnectCurrentView", "home");
          setMobileNavActive("home");
          if (hash !== "#home") {
            window.history.replaceState(null, "", "#home");
          }
        } else if (hash === "#marketplace") {
          setCurrentView("marketplace");
          sessionStorage.setItem("agroconnectCurrentView", "marketplace");
          setMobileNavActive("crops");
        } else {
          setCurrentView("home");
          sessionStorage.setItem("agroconnectCurrentView", "home");
          setMobileNavActive("home");
        }
        return;
      }

      // 2. COMMON LOGGED-IN ROUTES (Both Farmer & Buyer can access)
      if (hash === "#messages") {
        setCurrentView("messages");
        sessionStorage.setItem("agroconnectCurrentView", "messages");
        setMobileNavActive("messages");
        fetchUnreadChats();
        return;
      }
      if (hash === "#marketplace") {
        setCurrentView("marketplace");
        sessionStorage.setItem("agroconnectCurrentView", "marketplace");
        setMobileNavActive("crops");
        return;
      }
      if (hash === "#farmers") {
        setCurrentView("farmers");
        sessionStorage.setItem("agroconnectCurrentView", "farmers");
        setMobileNavActive("farmers");
        fetchFarmersList();
        return;
      }
      if (hash === "#home" || hash === "#how-it-works") {
        setCurrentView("home");
        sessionStorage.setItem("agroconnectCurrentView", "home");
        setMobileNavActive("home");
        return;
      }
      // Clean up any legacy or transient #profile or #settings hash on reload without opening modal
      if (hash === "#profile" || hash === "#settings") {
        setUserProfileModalOpen(false);
        if (activeUser.role === "Farmer") {
          window.history.replaceState(null, "", "#farmer-dashboard");
          setCurrentView("farmer-dashboard");
          setDashboardTab("all");
          sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
          sessionStorage.setItem("agroconnectDashboardTab", "all");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
          return;
        } else {
          window.history.replaceState(null, "", "#buyer-dashboard");
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab("all");
          sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
          sessionStorage.setItem("agroconnectBuyerTab", "all");
          setMobileNavActive("buyerDashboard");
          fetchBuyerEnquiries();
          return;
        }
      }

      // 3. BUYER-SPECIFIC ROUTES
      if (activeUser.role === "Buyer") {
        if (hash === "#buyer-dashboard") {
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab("all");
          sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
          sessionStorage.setItem("agroconnectBuyerTab", "all");
          setMobileNavActive("buyerDashboard");
          fetchBuyerEnquiries();
          return;
        }
        if (hash === "#buyer-enquiries") {
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab("enquiries");
          sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
          sessionStorage.setItem("agroconnectBuyerTab", "enquiries");
          setMobileNavActive("buyerDashboard");
          fetchBuyerEnquiries();
          return;
        }
        if (hash === "#buyer-orders" || hash === "#orders" || hash === "#order-updates") {
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab("orders");
          sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
          sessionStorage.setItem("agroconnectBuyerTab", "orders");
          setMobileNavActive("buyerDashboard");
          fetchBuyerEnquiries();
          return;
        }
        if (hash === "#purchases-report" || hash === "#purchase-report") {
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab("purchases-report");
          sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
          sessionStorage.setItem("agroconnectBuyerTab", "purchases-report");
          setMobileNavActive("buyerDashboard");
          fetchBuyerEnquiries();
          return;
        }
        // If buyer lands on a farmer-only route, redirect to buyer dashboard
        if (
          hash === "#farmer-dashboard" ||
          hash === "#list-crop" ||
          hash === "#my-products" ||
          hash === "#products" ||
          hash === "#sales-report"
        ) {
          triggerNotice(t("notices.farmerOnlyArea"), "info");
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab("all");
          sessionStorage.setItem("agroconnectCurrentView", "buyer-dashboard");
          sessionStorage.setItem("agroconnectBuyerTab", "all");
          setMobileNavActive("buyerDashboard");
          window.history.replaceState(null, "", "#buyer-dashboard");
          fetchBuyerEnquiries();
          return;
        }

        // Empty hash or default restore from sessionStorage
        const savedView = sessionStorage.getItem("agroconnectCurrentView");
        if (savedView === "buyer-dashboard") {
          const savedTab = sessionStorage.getItem("agroconnectBuyerTab") || "all";
          setCurrentView("buyer-dashboard");
          setBuyerDashboardTab(savedTab);
          setMobileNavActive("buyerDashboard");
          const targetHash =
            savedTab === "enquiries"
              ? "#buyer-enquiries"
              : savedTab === "orders"
                ? "#buyer-orders"
                : savedTab === "purchases-report"
                  ? "#purchases-report"
                  : "#buyer-dashboard";
          window.history.replaceState(null, "", targetHash);
          fetchBuyerEnquiries();
          return;
        }
        if (savedView === "farmers") {
          setCurrentView("farmers");
          setMobileNavActive("farmers");
          window.history.replaceState(null, "", "#farmers");
          fetchFarmersList();
          return;
        }
        if (savedView === "messages") {
          setCurrentView("messages");
          setMobileNavActive("messages");
          window.history.replaceState(null, "", "#messages");
          fetchUnreadChats();
          return;
        }
        if (savedView === "home") {
          setCurrentView("home");
          setMobileNavActive("home");
          window.history.replaceState(null, "", "#home");
          return;
        }

        // Default Buyer fallback: marketplace
        setCurrentView("marketplace");
        sessionStorage.setItem("agroconnectCurrentView", "marketplace");
        setMobileNavActive("crops");
        if (hash && hash !== "#marketplace") {
          window.history.replaceState(null, "", "#marketplace");
        }
        return;
      }

      // 4. FARMER-SPECIFIC ROUTES
      if (activeUser.role === "Farmer") {
        if (hash === "#farmer-dashboard" || hash === "#dashboard") {
          setCurrentView("farmer-dashboard");
          setDashboardTab("all");
          sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
          sessionStorage.setItem("agroconnectDashboardTab", "all");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
          return;
        }
        if (hash === "#my-products" || hash === "#products") {
          setCurrentView("farmer-dashboard");
          setDashboardTab("listings");
          sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
          sessionStorage.setItem("agroconnectDashboardTab", "listings");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
          return;
        }
        if (hash === "#farmer-enquiries" || hash === "#buyer-enquiries" || hash === "#enquiries") {
          setCurrentView("farmer-dashboard");
          setDashboardTab("enquiries");
          sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
          sessionStorage.setItem("agroconnectDashboardTab", "enquiries");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
          return;
        }
        if (hash === "#farmer-orders" || hash === "#orders") {
          setCurrentView("farmer-dashboard");
          setDashboardTab("orders");
          sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
          sessionStorage.setItem("agroconnectDashboardTab", "orders");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
          return;
        }
        if (hash === "#sales-report") {
          setCurrentView("farmer-dashboard");
          setDashboardTab("sales-report");
          sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
          sessionStorage.setItem("agroconnectDashboardTab", "sales-report");
          setMobileNavActive("farmerDashboard");
          fetchFarmerDashboardData();
          return;
        }
        if (hash === "#list-crop") {
          setCurrentView("farmer-dashboard");
          setMobileNavActive("listCrop");
          openListingModal();
          return;
        }
        // If farmer lands on buyer dashboard url, redirect to farmer dashboard
        if (hash === "#buyer-dashboard" || hash === "#purchases-report") {
          triggerNotice(t("notices.buyerOnlyArea"), "info");
          setCurrentView("farmer-dashboard");
          setDashboardTab("all");
          sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
          sessionStorage.setItem("agroconnectDashboardTab", "all");
          setMobileNavActive("farmerDashboard");
          window.history.replaceState(null, "", "#farmer-dashboard");
          fetchFarmerDashboardData();
          return;
        }

        // Empty hash or default restore from sessionStorage
        const savedView = sessionStorage.getItem("agroconnectCurrentView");
        if (savedView === "farmer-dashboard") {
          const savedTab = sessionStorage.getItem("agroconnectDashboardTab") || "all";
          setCurrentView("farmer-dashboard");
          setDashboardTab(savedTab);
          setMobileNavActive("farmerDashboard");
          const targetHash =
            savedTab === "listings"
              ? "#my-products"
              : savedTab === "enquiries"
                ? "#farmer-enquiries"
                : savedTab === "orders"
                  ? "#farmer-orders"
                  : savedTab === "sales-report"
                    ? "#sales-report"
                    : "#farmer-dashboard";
          window.history.replaceState(null, "", targetHash);
          fetchFarmerDashboardData();
          return;
        }
        if (savedView === "marketplace") {
          setCurrentView("marketplace");
          setMobileNavActive("crops");
          window.history.replaceState(null, "", "#marketplace");
          return;
        }
        if (savedView === "farmers") {
          setCurrentView("farmers");
          setMobileNavActive("farmers");
          window.history.replaceState(null, "", "#farmers");
          fetchFarmersList();
          return;
        }
        if (savedView === "messages") {
          setCurrentView("messages");
          setMobileNavActive("messages");
          window.history.replaceState(null, "", "#messages");
          fetchUnreadChats();
          return;
        }
        if (savedView === "home") {
          setCurrentView("home");
          setMobileNavActive("home");
          window.history.replaceState(null, "", "#home");
          return;
        }

        // Default Farmer fallback: farmer-dashboard
        setCurrentView("farmer-dashboard");
        setDashboardTab("all");
        sessionStorage.setItem("agroconnectCurrentView", "farmer-dashboard");
        sessionStorage.setItem("agroconnectDashboardTab", "all");
        setMobileNavActive("farmerDashboard");
        if (hash && hash !== "#farmer-dashboard") {
          window.history.replaceState(null, "", "#farmer-dashboard");
        }
        fetchFarmerDashboardData();
        return;
      }
    };

    syncRouteFromHash();
    window.addEventListener("hashchange", syncRouteFromHash);
    return () => window.removeEventListener("hashchange", syncRouteFromHash);
  }, [
    currentUser,
    t,
    fetchBuyerEnquiries,
    fetchFarmerDashboardData,
    fetchFarmersList,
    fetchUnreadChats,
    openListingModal,
    openLoginModal
  ]);

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

  async function submitListing(event, customData) {
    if (event?.preventDefault) event.preventDefault();
    const dataToUse = customData || listing;

    try {
      const token = sessionStorage.getItem("agroconnectToken");
      const payload = {
        name: dataToUse.name.trim(),
        category: dataToUse.category,
        price: Number(dataToUse.price),
        unit: dataToUse.unit,
        quantity: Number(dataToUse.quantity),
        location: dataToUse.location.trim(),
        farmerName: currentUser?.name || "Local Farmer",
        description: dataToUse.description ? dataToUse.description.trim() : "",
        image: dataToUse.image || ""
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

  async function submitEditCrop(event, customData) {
    if (event?.preventDefault) event.preventDefault();
    const dataToUse = customData || editingCrop;
    const cropId = dataToUse?._id || editingCrop?._id;
    if (!cropId) return;

    try {
      const token = sessionStorage.getItem("agroconnectToken");
      const payload = {
        name: dataToUse.name.trim(),
        category: dataToUse.category,
        price: Number(dataToUse.price),
        unit: dataToUse.unit,
        quantity: Number(dataToUse.quantity),
        location: dataToUse.location.trim(),
        description: dataToUse.description ? dataToUse.description.trim() : "",
        image: dataToUse.image || ""
      };

      const res = await fetch(apiUrl(`/api/crops/${cropId}`), {
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

      const updated = data.crop || { ...dataToUse, ...payload, _id: cropId };

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

  async function submitAccount(event, customAccount, isRegOverride) {
    if (event?.preventDefault) event.preventDefault();
    const accToUse = customAccount || account;
    const isRegister = isRegOverride !== undefined ? isRegOverride : modal === "register";
    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

    if (isRegister && accToUse.password.length < 8) {
      triggerNotice(t("notices.passwordLength"), "error");
      return;
    }

    try {
      const payload = isRegister
        ? {
          name: accToUse.name.trim(),
          email: accToUse.email.trim().toLowerCase(),
          password: accToUse.password,
          role: accToUse.role
        }
        : {
          email: accToUse.email.trim().toLowerCase(),
          password: accToUse.password
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

  async function submitEnquiry(event, customMessage) {
    if (event?.preventDefault) event.preventDefault();

    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      triggerNotice(t("notices.loginAsBuyerForEnquiry"), "info");
      openLoginModal("Buyer");
      return;
    }

    const formData = event?.currentTarget ? new FormData(event.currentTarget) : null;
    const buyerName = formData?.get("buyerName")?.trim() || currentUser?.name || "Buyer";
    const contact = formData?.get("contact")?.trim() || currentUser?.email || "";
    const quantity = formData?.get("quantity")?.trim() || "";
    const messageText = customMessage || formData?.get("message")?.trim() || "";

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
      setSelectedCrop(null);
      setEnquiryMessage("");
      fetchBuyerEnquiries();
    } catch (error) {
      triggerNotice(error.message || t("notices.enquiryFailed"), "error");
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

  const hasDesktopSidebar = Boolean(currentUser);

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
          buyerEnquiriesCount={buyerEnquiries.length}
          buyerOrdersCount={buyerConfirmedOrders.length || buyerNotifications.length}
          farmerCropCount={dashboardListings.length}
          unreadChatCount={unreadChatCount}
          onNavigate={handleSidebarNavigate}
          onOpenSettings={() => {
            setUserProfileTab("overview");
            setUserProfileModalOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* 1. TOP NAVBAR */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        unreadNotificationCount={unreadNotificationCount}
        unreadChatCount={unreadChatCount}
        buyerRespondedCount={buyerRespondedCount}
        farmerPendingCount={farmerPendingCount}
        notifications={buyerNotifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsRead={markAllNotificationsAsRead}
        onMarkNotificationRead={markNotificationAsRead}
        onClearNotification={handleClearNotification}
        onClearAllNotifications={handleClearAllNotifications}
        onNavigateHome={navigateToHome}
        onNavigateMarketplace={navigateToMarketplace}
        onNavigateBuyerDashboard={navigateToBuyerDashboard}
        onNavigateFarmerDashboard={navigateToFarmerDashboard}
        onNavigateFarmerDiscovery={navigateToFarmerDiscovery}
        onNavigateMessages={navigateToMessages}
        onOpenListingModal={openListingModal}
        onOpenLogin={openLoginModal}
        onOpenRegister={openRegisterModal}
        onOpenProfile={() => {
          setUserProfileTab("overview");
          setUserProfileModalOpen(true);
        }}
        onOpenSettings={() => {
          setUserProfileTab("overview");
          setUserProfileModalOpen(true);
        }}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={toggleTheme}
      />

      {(!currentUser && currentView === "home") ? (
        <HomeView
          onNavigateMarketplace={navigateToMarketplace}
          onJoinRole={handleJoinRole}
        />
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
      ) : currentView === "farmers" ? (
        <FarmerDiscoveryView
          farmersList={farmersList}
          farmersLoading={farmersLoading}
          onRefreshFarmers={fetchFarmersList}
          onOpenFarmerProfile={handleOpenFarmerProfile}
        />
      ) : currentView === "marketplace" ? (
        <MarketplaceView
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          categories={categories}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          availableLocations={availableLocations}
          sortBy={sortBy}
          setSortBy={setSortBy}
          loading={loading}
          cropsError={cropsError}
          fetchCrops={fetchCrops}
          filteredCrops={filteredCrops}
          crops={crops}
          currentUser={currentUser}
          openListingModal={openListingModal}
          openFarmerDashboard={openFarmerDashboard}
          handleOpenProductDetails={handleOpenProductDetails}
          handleOpenFarmerProfile={handleOpenFarmerProfile}
        />
      ) : currentView === "buyer-dashboard" && currentUser?.role === "Buyer" ? (
        <BuyerDashboardView
          buyerLoading={buyerLoading}
          buyerError={buyerError}
          buyerEnquiries={buyerEnquiries}
          buyerPendingCount={buyerPendingCount}
          buyerRespondedCount={buyerRespondedCount}
          buyerClosedCount={buyerClosedCount}
          unreadNotificationCount={unreadNotificationCount}
          buyerNotifications={buyerNotifications}
          buyerDashboardTab={buyerDashboardTab}
          buyerConfirmedOrders={buyerConfirmedOrders}
          buyerTotalSpent={buyerTotalSpent}
          fetchBuyerEnquiries={fetchBuyerEnquiries}
          navigateToMarketplace={navigateToMarketplace}
          handleSidebarNavigate={handleSidebarNavigate}
          markAllNotificationsAsRead={markAllNotificationsAsRead}
          markNotificationAsRead={markNotificationAsRead}
          handleStartChat={handleStartChat}
        />
      ) : currentView === "farmer-dashboard" && currentUser?.role === "Farmer" ? (
        <FarmerDashboardView
          dashboardLoading={dashboardLoading}
          dashboardListings={dashboardListings}
          dashboardEnquiries={dashboardEnquiries}
          farmerPendingCount={farmerPendingCount}
          farmerRespondedCount={farmerRespondedCount}
          confirmedOrders={confirmedOrders}
          totalConfirmedSalesValue={totalConfirmedSalesValue}
          dashboardTab={dashboardTab}
          processingOrderAction={processingOrderAction}
          fetchFarmerDashboardData={fetchFarmerDashboardData}
          openListingModal={openListingModal}
          openEditModal={openEditModal}
          handleDeleteCrop={handleDeleteCrop}
          handleSidebarNavigate={handleSidebarNavigate}
          handlePromptOrderAction={handlePromptOrderAction}
          handleStartChat={handleStartChat}
        />
      ) : (
        <HomeView
          onNavigateMarketplace={navigateToMarketplace}
          onJoinRole={handleJoinRole}
        />
      )}

      {/* MODERN FOOTER (Hidden on messages page) */}
      {currentView !== "messages" && (
        <Footer
          currentUser={currentUser}
          onNavigateHome={navigateToHome}
          onNavigateMarketplace={navigateToMarketplace}
          onNavigateFarmerDashboard={navigateToFarmerDashboard}
        />
      )}



      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}
      {/* 1. FARMER: POST / EDIT CROP MODAL */}
      <CropListingModal
        isOpen={modal === "listing" || modal === "editCrop"}
        mode={modal === "editCrop" ? "edit" : "create"}
        initialData={modal === "editCrop" ? editingCrop : null}
        categories={categories}
        popularCropsSuggestions={popularCropsSuggestions}
        onClose={closeModal}
        onSubmit={(e, data) => {
          if (modal === "editCrop") {
            submitEditCrop(e, data);
          } else {
            submitListing(e, data);
          }
        }}
        onImageUpload={handleCropImageUpload}
      />

      {/* 2. AUTH MODAL (LOGIN / REGISTER) */}
      <AuthModal
        isOpen={modal === "login" || modal === "register"}
        initialMode={modal === "register" ? "register" : "login"}
        initialRole={account.role || "Farmer"}
        onClose={closeModal}
        onSubmitAccount={submitAccount}
      />

      {/* 3. SEND ENQUIRY MODAL */}
      <SendEnquiryModal
        isOpen={modal === "enquiry"}
        selectedCrop={selectedCrop}
        currentUser={currentUser}
        onClose={closeModal}
        onSubmitEnquiry={submitEnquiry}
      />

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
          onClose={() => {
            setUserProfileModalOpen(false);
            if (window.location.hash === "#settings" || window.location.hash === "#profile") {
              const fallback = currentUser?.role === "Farmer" ? "#farmer-dashboard" : "#buyer-dashboard";
              window.history.replaceState(null, "", fallback);
            }
          }}
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
      <OrderConfirmModal
        isOpen={orderConfirmModal.isOpen}
        action={orderConfirmModal.action}
        enquiry={orderConfirmModal.enquiry}
        processing={processingOrderAction}
        onClose={() => setOrderConfirmModal({ isOpen: false, action: null, enquiry: null })}
        onConfirmAction={executeOrderAction}
      />

      {/* 8. MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav
        activeNav={mobileNavActive}
        onNavClick={handleMobileNavClick}
        unreadChatCount={unreadChatCount}
        unreadCount={unreadChatCount}
        currentUser={currentUser}
      />

      {/* 9. GLOBAL ROUND ARROW SIGN TO PULL SCREEN BACK TO TOP */}
      {showScrollTop && (
        <button
          type="button"
          className="global-scroll-top-fab"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title={language === "te" ? "పైకి వెళ్ళండి" : "Pull screen back to top"}
          aria-label="Back to top"
        >
          <ChevronUp size={22} />
        </button>
      )}
    </div>
  );
}

export default App;
