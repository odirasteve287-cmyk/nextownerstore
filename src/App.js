import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './utils/supabase';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BookAgent from './pages/BookAgent';
import Listings from './pages/Listings';
import Blog from './pages/Blog';
import SellInstructions from './pages/SellInstructions';
import PostProduct from './pages/PostProduct';
import AuthForm from './pages/AuthForm';
import UserDashboard from './pages/userDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import CookieConsent from './components/CookieConsent'; // ✅ Cookie Consent

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('home');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [authReady, setAuthReady] = useState(false);

  const viewRef = useRef('home');
  const isFirstLoad = useRef(true);

  const updateView = (v) => {
    viewRef.current = v;
    setView(v);
  };

  const ADMIN_EMAILS = ['odirasteve25@gmail.com'];

  const checkAdmin = (currentUser) => {
    if (currentUser && ADMIN_EMAILS.includes(currentUser.email)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // ✅ Clean OAuth token from URL hash
    if (window.location.hash.includes('access_token') || window.location.hash.includes('error')) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // ✅ Timeout fallback — if Supabase is slow or paused, app still loads in 3s
    const sessionTimeout = setTimeout(() => setAuthReady(true), 3000);

    // ✅ Get session once on load — restore user state, never redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(sessionTimeout);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkAdmin(currentUser);
      setAuthReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // ✅ Ignore token refreshes — stops view from resetting every hour
      if (event === 'TOKEN_REFRESHED') return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkAdmin(currentUser);

      if (event === 'SIGNED_OUT') {
        updateView('home');
        return;
      }

      if (event === 'SIGNED_IN') {
        // ✅ First SIGNED_IN is just session restore on page load — ignore it
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          return;
        }
        // User actively signed in from auth page — redirect to dashboard
        const authPages = ['signin', 'signup', 'authForm'];
        if (authPages.includes(viewRef.current)) {
          updateView('user-dashboard');
        }
      }
    });

    // Load products
    loadProducts();

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Reload products when view changes to listings or home
  useEffect(() => {
    if (view === 'listings' || view === 'home') {
      loadProducts();
    }
  }, [view, refreshTrigger]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
    if (error) console.error('Error loading products:', error);
  };

  const addToCart = (product) => setCart([...cart, product]);
  const refreshProducts = () => setRefreshTrigger(prev => prev + 1);

  // ✅ Show spinner until auth resolves — prevents header flicker
  if (!authReady) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #1e293b',
          borderTop: '3px solid #0bbfaa',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        view={view}
        setView={updateView}
        cartCount={cart.length}
        isAdmin={isAdmin}
      />

      {view === 'home' ? (
        <HomePage
          products={products}
          addToCart={addToCart}
          setView={updateView}
          refreshProducts={refreshProducts}
        />
      ) : (
        <main className="w-full">
          {view === 'bookAgent' && <BookAgent setView={updateView} />}
          {view === 'cart' && (
            <Cart
              cart={cart}
              setCart={setCart}
              setView={updateView}
              onContinueShopping={() => updateView('listings')}
            />
          )}
          {view === 'listings' && (
            <Listings
              products={products}
              refreshProducts={refreshProducts}
              cart={cart}
              setCart={setCart}
              setView={updateView}
              isLoggedIn={!!user}
              onNavigate={updateView}
            />
          )}
          {view === 'blog'    && <Blog setView={updateView} />}
          {view === 'sell'    && <SellInstructions setView={updateView} />}
          {view === 'faq'     && <SellInstructions setView={updateView} />}
          {view === 'privacy' && <PrivacyPolicy setView={updateView} />}
          {view === 'terms'   && <TermsAndConditions setView={updateView} />}
          {view === 'post'    && <PostProduct loadProducts={loadProducts} user={user} setView={updateView} />}
          {view === 'authForm' && <AuthForm setView={updateView} />}
          {view === 'signup'   && <AuthForm type="signup" setView={updateView} />}
          {view === 'signin'   && <AuthForm type="signin" setView={updateView} />}
          {view === 'seller-dashboard' && user && <UserDashboard user={user} setView={updateView} />}
          {view === 'user-dashboard'   && user && <UserDashboard user={user} setView={updateView} />}
          {view === 'buyer-dashboard'  && user && <BuyerDashboard user={user} setView={updateView} />}

          {view === 'admin-dashboard' && user && isAdmin && (
            <AdminDashboard user={user} setView={updateView} />
          )}

          {view === 'admin-dashboard' && user && !isAdmin && (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-12">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-3xl font-serif text-red-800 mb-4">Access Denied</h2>
                <p className="text-gray-600 mb-4">You don't have permission to access the admin dashboard.</p>
                <p className="text-sm text-gray-500 mb-8">
                  Your email: <strong>{user.email}</strong> is not in the admin list.
                </p>
                <button onClick={() => updateView('home')}
                  className="px-8 py-3 bg-teal-800 text-white hover:bg-teal-700 transition rounded font-semibold">
                  Return to Home
                </button>
              </div>
            </div>
          )}

          {view === 'admin-dashboard' && !user && (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-12">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-3xl font-serif text-yellow-800 mb-4">Authentication Required</h2>
                <p className="text-gray-600 mb-8">Please sign in to access the admin dashboard.</p>
                <button onClick={() => updateView('signin')}
                  className="px-8 py-3 bg-teal-800 text-white hover:bg-teal-700 transition rounded font-semibold">
                  Sign In
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      <Footer setView={updateView} listings={products} />

      {/* ✅ Cookie Consent Banner — renders as fixed overlay above everything */}
      <CookieConsent />
    </div>
  );
}