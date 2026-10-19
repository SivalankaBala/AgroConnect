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
  Menu
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
      } catch {}
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
  const [dashboardTab, setDashboardTab] = useState("all"); // 'all' | 'listings' | 'enquiries'

  // Buyer Dashboard states
  const [buyerEnquiries, setBuyerEnquiries] = useState([]);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const [buyerError, setBuyerError] = useState("");

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
      description: ""
    });
    setModal("listing");
  }, [currentUser, t, openRegisterModal]);

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
        if (hash === "#messages" || hash === "#marketplace" || hash === "#buyer-dashboard" || hash === "#farmer-dashboard" || hash === "#list-crop" || hash === "#farmers" || hash === "#profile") {
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
          setMobileNavActive("buyerDashboard");
          fetchBuyerEnquiries();
        } else if (hash === "#profile") {
          setUserProfileModalOpen(true);
          setCurrentView("marketplace");
          setMobileNavActive("profile");
        } else if (hash === "#farmer-dashboard" || hash === "#list-crop" || hash === "#farmers") {
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
        // FARMER RULES: #messages, #farmer-dashboard, #farmers, #list-crop, #profile permitted
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
        } else if (hash === "#profile") {
          setUserProfileModalOpen(true);
          setCurrentView("farmer-dashboard");
          setMobileNavActive("profile");
        } else if (hash === "#marketplace" || hash === "#buyer-dashboard") {
          triggerNotice(t("notices.buyerOnlyArea"), "info");
          setCurrentView("farmer-dashboard");
          setMobileNavActive("farmerDashboard");
          window.history.replaceState(null, "", "#farmer-dashboard");
        } else {
          setCurrentView("farmer-dashboard");
          setMobileNavActive("farmerDashboard");
          if (hash !== "#farmer-dashboard") {
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

    const handleMessageArrival = (msg) => {
      fetchUnreadChats();
      if (!msg) return;

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

    if (socket) {
      socket.on("new_message", handleMessageArrival);
      socket.on("message_notification", handleMessageArrival);
      socket.on("unread_count_updated", handleUpdate);
      socket.on("conversation_updated", handleUpdate);
      socket.on("messages_read", handleUpdate);
    }

    const pollInterval = setInterval(fetchUnreadChats, 10000);

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.off("new_message", handleMessageArrival);
        socket.off("message_notification", handleMessageArrival);
        socket.off("unread_count_updated", handleUpdate);
        socket.off("conversation_updated", handleUpdate);
        socket.off("messages_read", handleUpdate);
      }
    };
  }, [currentUser, fetchUnreadChats, t]);

  const handleStartChat = useCallback((recipient, crop = null) => {
    if (!currentUser) {
      triggerNotice(t("chat.loginRequired") || "Please sign in to start chatting.", "info");
      openLoginModal("Buyer");
      return;
    }
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

  // When user is authenticated, load their role dashboard data
  useEffect(() => {
    if (currentUser?.role === "Farmer") {
      fetchFarmerDashboardData();
    } else if (currentUser?.role === "Buyer") {
      fetchBuyerEnquiries();
    }
  }, [currentUser, fetchFarmerDashboardData, fetchBuyerEnquiries]);

  // Poll unread messages for logged in users
  useEffect(() => {
    if (currentUser) {
      fetchUnreadChats();
      const interval = setInterval(fetchUnreadChats, 12000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchUnreadChats]);

  function triggerNotice(message, type = "info") {
    setNotice({ message, type });
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
        description: listing.description ? listing.description.trim() : ""
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
        description: ""
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
      description: crop.description || ""
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
        description: editingCrop.description ? editingCrop.description.trim() : ""
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

  const buyerPendingCount = buyerEnquiries.filter((e) => e.status === "Pending").length;
  const buyerRespondedCount = buyerEnquiries.filter((e) => e.status === "Responded").length;
  const buyerClosedCount = buyerEnquiries.filter((e) => e.status === "Closed").length;

  // Live estimated batch value in crop creation
  const estimatedBatchValue =
    Number(listing.price) > 0 && Number(listing.quantity) > 0
      ? (Number(listing.price) * Number(listing.quantity)).toLocaleString("en-IN")
      : null;

  return (
    <div className="agro-app">
      {/* GLOBAL TOAST NOTIFICATION */}
      {notice && (
        <div className={`toast-banner toast-${notice.type}`} role="alert">
          <div className="toast-body">
            {notice.type === "success" && <CheckCircle2 className="toast-icon success" size={20} />}
            {notice.type === "error" && <AlertCircle className="toast-icon error" size={20} />}
            {notice.type === "info" && <Sparkles className="toast-icon info" size={20} />}
            <span className="toast-text">{notice.message}</span>
          </div>
          <button className="toast-close" onClick={() => setNotice(null)} aria-label="Close alert">
            <X size={16} />
          </button>
        </div>
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
              <Sprout className="sprout-icon" size={24} />
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
              // GUEST NAVBAR: Home, How It Works
              <>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "marketplace" ? "active" : ""}`}
                  onClick={goToMarketplace}
                >
                  <Store size={16} />
                  <span>{t("nav.freshHarvests") || "Marketplace"}</span>
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "home" ? "active" : ""}`}
                  onClick={() => navigateToHome()}
                >
                  <Home size={16} />
                  <span>{t("nav.home") || "Home"}</span>
                </button>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => {
                    const el = document.getElementById("how-it-works");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    window.location.hash = "how-it-works";
                  }}
                >
                  <Layers size={16} />
                  <span>{t("nav.howItWorks") || "How It Works"}</span>
                </button>
              </>
            ) : currentUser.role === "Buyer" ? (
              // BUYER NAVBAR: Fresh Harvests, Buyer Dashboard, Messages
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
                  className={`nav-link-btn ${currentView === "buyer-dashboard" ? "active" : ""}`}
                  onClick={() => navigateToBuyerDashboard()}
                >
                  <ShoppingCart size={16} />
                  <span>{t("nav.buyerDashboard") || "Buyer Dashboard"}</span>
                  {buyerRespondedCount > 0 && <span className="badge-count-pulse">{buyerRespondedCount}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "messages" ? "active" : ""}`}
                  onClick={() => navigateToMessages()}
                >
                  <MessageSquare size={16} />
                  <span>{t("nav.messages") || "Messages"}</span>
                  {unreadChatCount > 0 && <span className="badge-count-pulse">{unreadChatCount}</span>}
                </button>
              </>
            ) : (
              // FARMER NAVBAR: Messages, Farmer Discovery, Farmer Dashboard
              <>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "messages" ? "active" : ""}`}
                  onClick={() => navigateToMessages()}
                >
                  <MessageSquare size={16} />
                  <span>{t("nav.messages") || "Messages"}</span>
                  {unreadChatCount > 0 && <span className="badge-count-pulse">{unreadChatCount}</span>}
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "farmers" ? "active" : ""}`}
                  onClick={() => navigateToFarmerDiscovery()}
                >
                  <Tractor size={16} />
                  <span>{t("nav.farmers") || "Farmer Discovery"}</span>
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "farmer-dashboard" ? "active" : ""}`}
                  onClick={() => navigateToFarmerDashboard()}
                >
                  <Layers size={16} />
                  <span>{t("nav.farmerDashboard") || "Farmer Dashboard"}</span>
                  {farmerPendingCount > 0 && <span className="badge-count-pulse">{farmerPendingCount}</span>}
                </button>
              </>
            )}
          </div>

          <div className="nav-actions">
            {/* Desktop Actions Cluster (visible on desktop > 768px, hidden on mobile) */}
            <div className="nav-actions-desktop">
              {currentUser ? (
                <div className="user-action-cluster">
                  <button
                    type="button"
                    className="user-profile-badge clickable"
                    onClick={() => setUserProfileModalOpen(true)}
                    title={`${currentUser.name || "User"} (${t(`nav.role${currentUser.role}`) || currentUser.role}) - ${t("profile.title") || "My Profile"}`}
                    aria-label={t("profile.title") || "My Profile"}
                  >
                    <div className="profile-avatar-circle">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt="" className="avatar-img" />
                      ) : (
                        <span className="avatar-role-icon">
                          {currentUser.role === "Farmer" ? "🧑‍🌾" : "🛒"}
                        </span>
                      )}
                    </div>
                    <span className="profile-name">
                      {currentUser.name || currentUser.username || currentUser.email?.split("@")[0] || "User"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="guest-action-cluster">
                  <button
                    className="btn-text-login"
                    onClick={() => openLoginModal("Buyer")}
                  >
                    <User size={16} />
                    <span>{t("nav.logIn")}</span>
                  </button>
                  <button
                    className="btn-register-highlight"
                    onClick={() => openRegisterModal("Farmer")}
                  >
                    <Sparkles size={16} />
                    <span>{t("nav.joinAgroConnect")}</span>
                  </button>
                </div>
              )}

              {/* DARK MODE THEME TOGGLE (Desktop) */}
              <button
                type="button"
                className="btn-theme-toggle"
                onClick={() => toggleTheme(!darkMode)}
                title={darkMode ? "Switch to Warm Cream Light Mode" : "Switch to Dark Earth Mode"}
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={17} className="theme-icon-sun" /> : <Moon size={17} className="theme-icon-moon" />}
              </button>
            </div>

            {/* TOP-RIGHT MOBILE HAMBURGER BUTTON (Mobile only) */}
            <button
              type="button"
              className={`mobile-hamburger-btn ${mobileMenuOpen ? "active" : ""}`}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              id="mobile-nav-hamburger"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* MOBILE SLIDE-OVER DRAWER MENU */}
        <MobileHeaderMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentUser={currentUser}
          onOpenProfile={() => {
            setMobileMenuOpen(false);
            setUserProfileModalOpen(true);
          }}
          onLogout={() => {
            setMobileMenuOpen(false);
            handleLogout();
          }}
          darkMode={darkMode}
          onToggleDarkMode={(target) => toggleTheme(target)}
          onOpenLogin={(role) => {
            setMobileMenuOpen(false);
            openLoginModal(role);
          }}
          onOpenRegister={(role) => {
            setMobileMenuOpen(false);
            openRegisterModal(role);
          }}
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
          <section className="how-it-works-section" id="how-it-works">
            <div className="section-container">
              <div className="section-title-center">
                <h2>{t("howItWorks.title")}</h2>
              </div>

              <div className="how-it-works-columns">
                {/* COLUMN 1: FOR FARMERS */}
                <div className="how-column farmer-how-col">
                  <div className="how-column-header">
                    <div className="how-header-icon farmer-icon-box">
                      <Tractor size={24} />
                    </div>
                    <h3>{t("howItWorks.farmersTitle")}</h3>
                  </div>

                  <div className="how-steps-list">
                    {(Array.isArray(t("howItWorks.farmerSteps")) ? t("howItWorks.farmerSteps") : []).map((item) => (
                      <div className="how-step-card" key={item.num}>
                        <div className="step-num-badge farmer-badge">{item.num}</div>
                        <div className="step-body">
                          <h4 className="step-title">{item.title}</h4>
                          <p className="step-desc">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMN 2: FOR BUYERS */}
                <div className="how-column buyer-how-col">
                  <div className="how-column-header">
                    <div className="how-header-icon buyer-icon-box">
                      <ShoppingCart size={24} />
                    </div>
                    <h3>{t("howItWorks.buyersTitle")}</h3>
                  </div>

                  <div className="how-steps-list">
                    {(Array.isArray(t("howItWorks.buyerSteps")) ? t("howItWorks.buyerSteps") : []).map((item) => (
                      <div className="how-step-card" key={item.num}>
                        <div className="step-num-badge buyer-badge">{item.num}</div>
                        <div className="step-body">
                          <h4 className="step-title">{item.title}</h4>
                          <p className="step-desc">{item.desc}</p>
                        </div>
                      </div>
                    ))}
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
          onConversationChange={(convId) => {
            setActiveChatConversationId(convId);
            if (chatNotification && (chatNotification.conversationId || "").toString() === (convId || "").toString()) {
              setChatNotification(null);
            }
            fetchUnreadChats();
          }}
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
                      className={`d-tab-btn ${dashboardTab === "enquiries" ? "active" : ""}`}
                      onClick={() => setDashboardTab("enquiries")}
                    >
                      {t("farmerDashboard.tabEnquiries", { count: dashboardEnquiries.length })}
                      {farmerPendingCount > 0 && <span className="tab-bubble-count">{farmerPendingCount}</span>}
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

                                <span className={`status-pill-badge status-${enquiry.status.toLowerCase()}`}>
                                  {enquiry.status === "Pending" && `🕒 ${t("statuses.Pending")}`}
                                  {enquiry.status === "Responded" && `✅ ${t("statuses.Responded")}`}
                                  {enquiry.status === "Closed" && `📁 ${t("statuses.Closed")}`}
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

                              <div className="enquiry-status-row">
                                <label htmlFor={`enq-status-${enquiry._id}`}>{t("farmerDashboard.updateStatusLabel")}</label>
                                <select
                                  id={`enq-status-${enquiry._id}`}
                                  className="status-select-control"
                                  value={enquiry.status}
                                  onChange={(e) => updateEnquiryStatus(enquiry._id, e.target.value)}
                                >
                                  <option value="Pending">{t("statuses.PendingDetailed")}</option>
                                  <option value="Responded">{t("statuses.RespondedDetailed")}</option>
                                  <option value="Closed">{t("statuses.ClosedDetailed")}</option>
                                </select>

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
                        className={`d-tab-btn ${dashboardTab === "enquiries" ? "active" : ""}`}
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

                                  <span className={`status-pill-badge status-${enquiry.status.toLowerCase()}`}>
                                    {enquiry.status === "Pending" && `🕒 ${t("statuses.Pending")}`}
                                    {enquiry.status === "Responded" && `✅ ${t("statuses.Responded")}`}
                                    {enquiry.status === "Closed" && `📁 ${t("statuses.Closed")}`}
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

                                <div className="enquiry-status-row">
                                  <label htmlFor={`enq-status-${enquiry._id}`}>{t("farmerDashboard.updateStatusLabel")}</label>
                                  <select
                                    id={`enq-status-${enquiry._id}`}
                                    className="status-select-control"
                                    value={enquiry.status}
                                    onChange={(e) => updateEnquiryStatus(enquiry._id, e.target.value)}
                                  >
                                    <option value="Pending">{t("statuses.PendingDetailed")}</option>
                                    <option value="Responded">{t("statuses.RespondedDetailed")}</option>
                                    <option value="Closed">{t("statuses.ClosedDetailed")}</option>
                                  </select>
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
