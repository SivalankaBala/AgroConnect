import { useEffect, useMemo, useState, useCallback } from "react";
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
  LogOut
} from "lucide-react";
import "./App.css";
import { useLanguage } from "./context/LanguageContext";
import LanguageSelector from "./components/LanguageSelector";
import { translations } from "./i18n/translations";
import SplashScreen from "./components/SplashScreen";
import WeatherModal from "./components/WeatherModal";
import DirectChatModal from "./components/DirectChatModal";
import FarmerProfileModal from "./components/FarmerProfileModal";
import BuyerDirectoryModal from "./components/BuyerDirectoryModal";
import ProductDetailsModal from "./components/ProductDetailsModal";
import UserProfileModal from "./components/UserProfileModal";
import MobileBottomNav from "./components/MobileBottomNav";
import LocationSelector from "./components/LocationSelector";

const PRESET_LOCATIONS = ["All", "B  himavaram", "Anakapalli", "Kakinada", "Rajahmundry", "East Godavari"];

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

function App() {
  const { language, t, getCropDisplayTag } = useLanguage();

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

      if (!user) return "home";
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
    return "home";
  });

  // Farmer discovery data
  const [farmersList, setFarmersList] = useState([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [topFarmers, setTopFarmers] = useState([]);

  // Fetch farmers list from real backend
  const fetchFarmersList = useCallback(async () => {
    try {
      setFarmersLoading(true);
      const res = await fetch("/api/farmers");
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
        fetch("/api/crops/my-listings", { headers }),
        fetch("/api/enquiries/farmer", { headers })
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
      const res = await fetch("/api/enquiries/my-enquiries", {
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

  const navigateToMarketplace = useCallback(() => {
    if (!currentUser) {
      triggerNotice(t("notices.loginToExploreMarketplace"), "info");
      setAccount({ name: "", email: "", password: "", role: "Buyer" });
      setModal("login");
      return;
    }
    if (currentUser.role === "Farmer") {
      triggerNotice(t("notices.buyerOnlyArea"), "info");
      goToFarmerDashboard();
      return;
    }
    goToMarketplace();
  }, [currentUser, t, goToFarmerDashboard, goToMarketplace]);

  const navigateToFarmerDashboard = useCallback(() => {
    if (!currentUser) {
      triggerNotice(t("notices.loginToAccess"), "info");
      setAccount({ name: "", email: "", password: "", role: "Farmer" });
      setModal("login");
      return;
    }
    if (currentUser.role !== "Farmer") {
      triggerNotice(t("notices.farmerOnlyArea"), "info");
      goToMarketplace();
      return;
    }
    goToFarmerDashboard();
  }, [currentUser, t, goToFarmerDashboard, goToMarketplace]);

  const navigateToHome = useCallback(() => {
    if (currentUser?.role === "Buyer") {
      navigateToMarketplace();
      return;
    }
    if (currentUser?.role === "Farmer") {
      navigateToFarmerDashboard();
      return;
    }
    setCurrentView("home");
    setMobileNavActive("home");
    if (window.location.hash !== "#home") {
      window.location.hash = "home";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentUser, navigateToMarketplace, navigateToFarmerDashboard]);

  const navigateToBuyerDashboard = useCallback(() => {
    if (!currentUser) {
      triggerNotice(t("notices.loginToAccess"), "info");
      setAccount({ name: "", email: "", password: "", role: "Buyer" });
      setModal("login");
      return;
    }
    if (currentUser.role !== "Buyer") {
      triggerNotice(t("notices.buyerOnlyArea"), "info");
      navigateToFarmerDashboard();
      return;
    }
    setCurrentView("buyer-dashboard");
    setMobileNavActive("buyerDashboard");
    if (window.location.hash !== "#buyer-dashboard") {
      window.location.hash = "buyer-dashboard";
    }
    fetchBuyerEnquiries();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentUser, t, fetchBuyerEnquiries, navigateToFarmerDashboard]);

  const navigateToFarmerDiscovery = useCallback(() => {
    if (!currentUser || currentUser.role !== "Farmer") {
      triggerNotice(t("notices.farmerOnlyArea"), "info");
      if (currentUser?.role === "Buyer") navigateToMarketplace();
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
  }, [currentUser, t, fetchFarmersList, navigateToMarketplace, navigateToHome]);

  const handleJoinRole = useCallback((role) => {
    setAccount((prev) => ({ ...prev, role }));
    setModal("register");
  }, []);

  const openListingModal = useCallback(() => {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token || !currentUser) {
      triggerNotice(t("notices.loginAsFarmerToList"), "info");
      setAccount({ name: "", email: "", password: "", role: "Farmer" });
      setModal("register");
      return;
    }

    if (currentUser.role !== "Farmer") {
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
  }, [currentUser, t]);

  // Synchronize route and enforce role access on hash changes
  useEffect(() => {
    const syncRouteFromHash = () => {
      const hash = window.location.hash.toLowerCase();

      if (!currentUser) {
        // GUEST RULES: only #home and #how-it-works permitted
        if (hash === "#marketplace" || hash === "#buyer-dashboard" || hash === "#farmer-dashboard" || hash === "#list-crop" || hash === "#farmers" || hash === "#profile") {
          triggerNotice(t("notices.loginToExploreMarketplace"), "info");
          setAccount({ name: "", email: "", password: "", role: "Buyer" });
          setModal("login");
          setCurrentView("home");
          setMobileNavActive("home");
          window.history.replaceState(null, "", "#home");
        } else {
          setCurrentView("home");
          setMobileNavActive("home");
        }
        return;
      }

      if (currentUser.role === "Buyer") {
        // BUYER RULES: only #marketplace, #buyer-dashboard, #profile permitted
        if (hash === "#buyer-dashboard") {
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

      if (currentUser.role === "Farmer") {
        // FARMER RULES: only #farmer-dashboard, #farmers, #list-crop, #profile permitted
        if (hash === "#farmers") {
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
  }, [currentUser, t, fetchBuyerEnquiries, fetchFarmerDashboardData, fetchFarmersList, openListingModal]);

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
      const res = await fetch("/api/chat/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const count = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadChatCount(count);
        }
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  const handleStartChat = (recipient, crop = null) => {
    if (!currentUser) {
      triggerNotice(t("chat.loginRequired") || "Please sign in to start chatting.", "info");
      setAccount({ name: "", email: "", password: "", role: "Buyer" });
      setModal("login");
      return;
    }
    setChatRecipient(recipient);
    setChatCrop(crop);
    setChatModalOpen(true);
  };

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
    } else if (tab === "profile") {
      if (currentUser) {
        setUserProfileModalOpen(true);
      } else {
        setAccount({ name: "", email: "", password: "", role: "Buyer" });
        setModal("login");
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
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        sessionStorage.setItem("agroconnectUser", JSON.stringify(data.user));
      } else {
        sessionStorage.removeItem("agroconnectToken");
        sessionStorage.removeItem("agroconnectUser");
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
      const res = await fetch("/api/crops");
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
    setCurrentUser(null);
    setDashboardListings([]);
    setDashboardEnquiries([]);
    setBuyerEnquiries([]);
    triggerNotice(t("notices.loggedOut"), "success");
    setModal("");
    setUserProfileModalOpen(false);
    setCurrentView("home");
    setMobileNavActive("home");
    window.location.hash = "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showEnquiry(crop) {
    const token = sessionStorage.getItem("agroconnectToken");
    if (!token || !currentUser) {
      triggerNotice(t("notices.loginAsBuyerForEnquiry"), "info");
      setAccount({ name: "", email: "", password: "", role: "Buyer" });
      setModal("login");
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

      const res = await fetch("/api/crops", {
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

      const res = await fetch(`/api/crops/${editingCrop._id}`, {
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
      const res = await fetch(`/api/crops/${cropId}`, {
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

      const res = await fetch(endpoint, {
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
      setCurrentUser(data.user);

      const translatedRole = t(`nav.role${data.user.role}`) || data.user.role;
      triggerNotice(
        t("notices.authWelcome", { name: data.user.name, role: translatedRole }),
        "success"
      );

      setModal("");
      setAccount({ name: "", email: "", password: "", role: "Farmer" });

      if (data.user.role === "Farmer") {
        navigateToFarmerDashboard();
      } else {
        navigateToMarketplace();
      }
    } catch (error) {
      triggerNotice(error.message || t("notices.authFailed"), "error");
    }
  }

  async function submitEnquiry(event) {
    event.preventDefault();

    const token = sessionStorage.getItem("agroconnectToken");

    if (!token || !currentUser) {
      triggerNotice(t("notices.loginAsBuyerForEnquiry"), "info");
      setModal("login");
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
      const res = await fetch("/api/enquiries", {
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
      setAccount({ name: "", email: "", password: "", role: "Farmer" });
      setModal("login");
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
      setAccount({ name: "", email: "", password: "", role: "Buyer" });
      setModal("login");
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
      const res = await fetch(`/api/enquiries/${enquiryId}/status`, {
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

      {/* TOP REGIONAL BANNER */}
      <div className="top-regional-banner">
        <div className="banner-inner">
          <div className="banner-left">
            <span className="regional-tag">🌾 {t("banner.regionalTag")}</span>
            <span className="banner-sep">|</span>
            <span className="banner-subtext">{t("banner.subtext")}</span>
          </div>
          <div className="banner-right">
            <span className="location-pill">📍 {t("banner.locationPill")}</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION BAR */}
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
              <span className="brand-telugu">{t("nav.brandSubtitle")}</span>
            </div>
          </a>

          {/* Nav Center Links - STRICTLY ROLE-BASED */}
          <div className="nav-center-links">
            {!currentUser ? (
              // GUEST NAVBAR: Home, How It Works
              <>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "home" ? "active" : ""}`}
                  onClick={navigateToHome}
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
              // BUYER NAVBAR: Fresh Harvests, Buyer Dashboard
              <>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "marketplace" ? "active" : ""}`}
                  onClick={navigateToMarketplace}
                >
                  <Store size={16} />
                  <span>{t("nav.freshHarvests") || "Fresh Harvests"}</span>
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "buyer-dashboard" ? "active" : ""}`}
                  onClick={navigateToBuyerDashboard}
                >
                  <ShoppingCart size={16} />
                  <span>{t("nav.buyerDashboard") || "Buyer Dashboard"}</span>
                  {buyerRespondedCount > 0 && <span className="badge-count-pulse">{buyerRespondedCount}</span>}
                </button>
              </>
            ) : (
              // FARMER NAVBAR: List Crop, Farmer Discovery, Farmer Dashboard
              <>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={openListingModal}
                >
                  <Plus size={16} />
                  <span>{t("nav.listCrop") || "List Crop"}</span>
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "farmers" ? "active" : ""}`}
                  onClick={navigateToFarmerDiscovery}
                >
                  <Tractor size={16} />
                  <span>{t("nav.farmers") || "Farmer Discovery"}</span>
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${currentView === "farmer-dashboard" ? "active" : ""}`}
                  onClick={navigateToFarmerDashboard}
                >
                  <Layers size={16} />
                  <span>{t("nav.farmerDashboard") || "Farmer Dashboard"}</span>
                  {farmerPendingCount > 0 && <span className="badge-count-pulse">{farmerPendingCount}</span>}
                </button>
              </>
            )}
          </div>

          <div className="nav-actions">
            {currentUser ? (
              <div className="user-action-cluster">
                <div
                  className="user-profile-badge clickable"
                  onClick={() => setUserProfileModalOpen(true)}
                  title={t("profile.title") || "My Profile"}
                  role="button"
                  tabIndex={0}
                >
                  <div className="profile-avatar">
                    {currentUser.role === "Farmer" ? "🧑‍🌾" : "🛒"}
                  </div>
                  <div className="profile-info">
                    <span className="profile-name">{currentUser.name}</span>
                    <span className="profile-role">
                      {t(`nav.role${currentUser.role}`) || currentUser.role}
                    </span>
                  </div>
                </div>

                <button className="btn-logout" onClick={handleLogout} title={t("nav.logout")}>
                  <LogOut size={15} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <div className="guest-action-cluster">
                <button
                  className="btn-text-login"
                  onClick={() => {
                    setAccount({ name: "", email: "", password: "", role: "Buyer" });
                    setModal("login");
                  }}
                >
                  <User size={16} />
                  <span>{t("nav.logIn")}</span>
                </button>
                <button
                  className="btn-register-highlight"
                  onClick={() => {
                    setAccount({ name: "", email: "", password: "", role: "Farmer" });
                    setModal("register");
                  }}
                >
                  <Sparkles size={16} />
                  <span>{t("nav.joinAgroConnect")}</span>
                </button>
              </div>
            )}

            {/* TOP-RIGHT LANGUAGE SELECTOR */}
            <LanguageSelector />
          </div>
        </div>
      </nav>

      {!currentUser ? (
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
                  onClick={navigateToMarketplace}
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
      ) : currentUser.role === "Buyer" ? (
        currentView === "buyer-dashboard" ? (
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
                  <button className="btn-dashboard-add" onClick={navigateToMarketplace}>
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
                          onClick={navigateToMarketplace}
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
          </main>
        ) : (
          /* MARKETPLACE SECTION */
          <main className="marketplace-section" id="marketplace">
            <div className="section-container">
              <div className="marketplace-header-row">
                <div>
                  <div className="market-badge">
                    <Store size={15} />
                    <span>{t("marketplace.badge")}</span>
                  </div>
                  <h2>{t("marketplace.title")}</h2>
                  <p>{t("marketplace.subtitle")}</p>
                </div>
              </div>

              {/* SEARCH & FILTERS BAR */}
              <div className="filter-panel-card">
                <div className="search-input-group">
                  <Search className="search-icon-inside" size={20} />
                  <input
                    type="text"
                    className="search-field"
                    placeholder={t("marketplace.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search crops"
                  />
                  {search && (
                    <button className="search-clear-btn" onClick={() => setSearch("")} aria-label="Clear search">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* ROW 2: LOCATION, SORT & CROP COUNT */}
                <div className="filter-controls-row">
                  <LocationSelector
                    value={locationFilter}
                    onChange={setLocationFilter}
                    availableLocations={availableLocations}
                    t={t}
                  />

                  <div className="filter-control-item sort-control-item">
                    <SlidersHorizontal size={15} className="control-icon" />
                    <label htmlFor="sortSelect">{t("marketplace.sortByLabel")}</label>
                    <select
                      id="sortSelect"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="control-select"
                    >
                      <option value="featured">{t("marketplace.sortFeatured")}</option>
                      <option value="price-asc">{t("marketplace.sortPriceAsc")}</option>
                      <option value="price-desc">{t("marketplace.sortPriceDesc")}</option>
                      <option value="qty-desc">{t("marketplace.sortQtyDesc")}</option>
                    </select>
                  </div>

                  <div className="results-counter-pill">
                    <strong>{filteredCrops.length}</strong> {t("marketplace.cropsAvailable")}
                  </div>
                </div>

                {/* ROW 3: CATEGORY TABS */}
                <div className="category-chips-row" role="tablist">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`category-chip-btn ${category === cat.id ? "active" : ""}`}
                      onClick={() => setCategory(cat.id)}
                      role="tab"
                      aria-selected={category === cat.id}
                    >
                      <span className="cat-icon">{cat.icon}</span>
                      <span className="cat-label">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CROPS GRID */}
              {loading ? (
                <div className="state-box loading-box">
                  <div className="inpage-loading-emblem">
                    <div className="inpage-loading-pulse" />
                    <div className="inpage-icon-box">
                      <Sprout size={32} className="inpage-sprout-icon" />
                    </div>
                  </div>
                  <h3>{t("marketplace.loadingTitle")}</h3>
                  <p>{t("marketplace.loadingDesc")}</p>
                  <div className="inpage-loading-bar">
                    <div className="inpage-loading-bar-fill" />
                  </div>
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
                    const theme = getCropVisualTheme(crop.name, crop.category);
                    const translatedCropTag = getCropDisplayTag(crop.name, crop.category);
                    const isOwner =
                      currentUser &&
                      (crop.farmer === currentUser.id ||
                        crop.farmer?._id === currentUser.id ||
                        crop.farmer === currentUser._id);

                    const totalVal =
                      crop.price && crop.quantity
                        ? (crop.price * crop.quantity).toLocaleString("en-IN")
                        : null;

                    const localizedUnit = t(`units.${crop.unit}`) || crop.unit || "kg";
                    const localizedCategory = t(`categories.${crop.category}`) || crop.category;

                    return (
                      <article className="crop-card-modern" key={crop._id || index}>
                        <div className={`crop-card-banner ${theme.bgClass}`}>
                          <div className="card-top-badges">
                            <span className="pill-category">{localizedCategory}</span>
                            {isOwner ? (
                              <span className="pill-owner">{t("marketplace.card.yourListing")}</span>
                            ) : (
                              <span className="pill-fresh">{t("marketplace.card.freshStock")}</span>
                            )}
                          </div>

                          <div className="crop-center-emoji" aria-hidden="true">
                            {theme.emoji}
                          </div>

                          <div className="crop-telugu-subtag">
                            <span>{translatedCropTag}</span>
                          </div>
                        </div>

                        <div className="crop-card-body">
                          <div className="crop-heading-area">
                            <h3 className="crop-name">{crop.name}</h3>
                            <div className="crop-location-badge">
                              <MapPin size={13} />
                              <span>{crop.location}</span>
                            </div>
                          </div>

                          <div
                            className="farmer-attribution clickable"
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
                            <div className="farmer-avatar-mini">🧑‍🌾</div>
                            <div className="farmer-meta">
                              <span className="farmer-name">{crop.farmerName || t("marketplace.card.verifiedLocalFarmer")}</span>
                              <span className="verified-status">
                                <CheckCircle2 size={12} /> {t("marketplace.card.verifiedGrower")}
                              </span>
                            </div>
                          </div>

                          {crop.description && (
                            <p className="crop-notes">"{crop.description}"</p>
                          )}

                          <div className="crop-specs-container">
                            <div className="spec-item">
                              <span className="spec-label">{t("marketplace.card.availableLot")}</span>
                              <strong className="spec-value">{crop.quantity} {localizedUnit}</strong>
                            </div>
                            {totalVal && (
                              <div className="spec-item right">
                                <span className="spec-label">{t("marketplace.card.totalLotValue")}</span>
                                <span className="spec-value-sub">~₹{totalVal}</span>
                              </div>
                            )}
                          </div>

                          <div className="crop-card-footer">
                            <div className="crop-price-row">
                              <div className="price-box">
                                <span className="price-tag-label">{t("marketplace.card.farmerRate")}</span>
                                <div className="price-main">
                                  <span className="currency-symbol">₹</span>
                                  <span className="price-amount">{crop.price}</span>
                                  <span className="price-unit">/{localizedUnit}</span>
                                </div>
                              </div>
                              <div className="crop-quality-tag">
                                <span className="quality-pill">
                                  <Sparkles size={11} className="quality-icon" />
                                  <span>{crop.category || "Fresh"}</span>
                                </span>
                              </div>
                            </div>

                            <div className="crop-actions-cluster">
                              <button
                                type="button"
                                className="btn-crop-action btn-view-details"
                                onClick={() => handleOpenProductDetails(crop)}
                                title={t("marketplace.card.viewDetails") || "View Details"}
                                aria-label="View Details"
                              >
                                <Eye size={15} className="btn-action-icon btn-icon-eye" />
                                <span className="btn-action-label">{t("marketplace.card.viewDetails") || "Details"}</span>
                              </button>

                              {isOwner ? (
                                <button
                                  type="button"
                                  className="btn-manage-crop"
                                  onClick={openFarmerDashboard}
                                  title={t("marketplace.card.manage")}
                                >
                                  <Edit2 size={15} className="btn-action-icon" />
                                  <span>{t("marketplace.card.manage")}</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="btn-crop-action btn-chat-action"
                                    onClick={() => handleStartChat(crop.farmer, crop)}
                                    title={t("chat.startConversation") || "Direct Chat"}
                                    aria-label="Direct Chat"
                                  >
                                    <MessageSquare size={15} className="btn-action-icon btn-icon-chat" />
                                    <span className="btn-action-label">{t("marketplace.card.chat") || "Chat"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-enquire-crop"
                                    onClick={() => showEnquiry(crop)}
                                    title={t("marketplace.card.enquire") || "Enquire"}
                                  >
                                    <span className="enquire-label">{t("marketplace.card.enquire") || "Enquire"}</span>
                                    <ArrowRight size={14} className="enquire-arrow" />
                                  </button>
                                </>
                              )}
                            </div>
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

      {/* MODERN FOOTER */}
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
              <p className="footer-summary">{t("footer.summary")}</p>
            </div>

            <div className="footer-nav-col">
              <h4>{t("footer.quickLinks")}</h4>
              {!currentUser ? (
                <>
                  <button type="button" className="footer-link-btn" onClick={navigateToHome}>{t("nav.home") || "Home"}</button>
                  <button
                    type="button"
                    className="footer-link-btn"
                    onClick={() => {
                      const el = document.getElementById("how-it-works");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    {t("footer.howItWorks")}
                  </button>
                  <button type="button" className="footer-link-btn" onClick={() => handleJoinRole("Farmer")}>{t("footer.joinAsFarmer")}</button>
                  <button type="button" className="footer-link-btn" onClick={() => handleJoinRole("Buyer")}>{t("footer.joinAsBuyer")}</button>
                </>
              ) : currentUser.role === "Buyer" ? (
                <>
                  <button type="button" className="footer-link-btn" onClick={navigateToMarketplace}>{t("nav.freshHarvests") || "Fresh Harvests"}</button>
                  <button type="button" className="footer-link-btn" onClick={navigateToBuyerDashboard}>{t("nav.buyerDashboard") || "Buyer Dashboard"}</button>
                  <button type="button" className="footer-link-btn" onClick={() => setUserProfileModalOpen(true)}>{t("profile.title") || "My Profile"}</button>
                </>
              ) : (
                <>
                  <button type="button" className="footer-link-btn" onClick={openListingModal}>{t("nav.listCrop") || "List Crop"}</button>
                  <button type="button" className="footer-link-btn" onClick={navigateToFarmerDiscovery}>{t("nav.farmers") || "Farmer Discovery"}</button>
                  <button type="button" className="footer-link-btn" onClick={navigateToFarmerDashboard}>{t("nav.farmerDashboard") || "Farmer Dashboard"}</button>
                  <button type="button" className="footer-link-btn" onClick={() => setUserProfileModalOpen(true)}>{t("profile.title") || "My Profile"}</button>
                </>
              )}
            </div>

            <div className="footer-nav-col">
              <h4>{t("footer.accountPortals")}</h4>
              {currentUser ? (
                <>
                  <button className="footer-link-btn" onClick={() => setUserProfileModalOpen(true)}>{t("profile.title") || "My Profile"}</button>
                  <button className="footer-link-btn" onClick={handleLogout}>{t("footer.logout")}</button>
                </>
              ) : (
                <>
                  <button className="footer-link-btn" onClick={() => { setAccount({ ...account, role: "Farmer" }); setModal("register"); }}>{t("footer.joinAsFarmer")}</button>
                  <button className="footer-link-btn" onClick={() => { setAccount({ ...account, role: "Buyer" }); setModal("register"); }}>{t("footer.joinAsBuyer")}</button>
                  <button className="footer-link-btn" onClick={() => setModal("login")}>{t("footer.signIn")}</button>
                </>
              )}
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
            <span className="footer-tagline">{t("footer.tagline")}</span>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}
      {modal && (
        <div className="modal-backdrop-modern" onClick={() => setModal("")}>
          <div
            className={`modal-window ${modal === "dashboard" || modal === "buyerDashboard" ? "modal-large" : ""}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-round" onClick={() => setModal("")} aria-label="Close dialog">
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
                    onClick={() => setModal("login")}
                  >
                    {t("authModal.tabLogin")}
                  </button>
                  <button
                    className={`auth-tab-btn ${modal === "register" ? "active" : ""}`}
                    onClick={() => setModal("register")}
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

                <form onSubmit={submitAccount} className="modern-form">
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
                      type="email"
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
                      type="password"
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
                        <button type="button" onClick={() => setModal("login")} className="link-text">
                          {t("authModal.loginHere")}
                        </button>
                      </p>
                    ) : (
                      <p>
                        {t("authModal.noAccount")}{" "}
                        <button type="button" onClick={() => setModal("register")} className="link-text">
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
            setModal("login");
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
            setModal("login");
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
            setModal("login");
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
            setChatModalOpen(true);
          }}
        />
      )}

      {/* 8. MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav
        activeNav={mobileNavActive}
        onNavClick={handleMobileNavClick}
        unreadCount={unreadChatCount}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
