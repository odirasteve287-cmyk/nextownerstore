import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('home'); // ✅ Always start on home
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const ADMIN_EMAILS = [
    'odirasteve287@gmail.com'
  ];

  useEffect(() => {
    // ✅ Clean OAuth token from URL hash immediately — prevents token leak and redirect loops
    if (window.location.hash.includes('access_token') || window.location.hash.includes('error')) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Check current user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser && ADMIN_EMAILS.includes(currentUser.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      // ✅ Do NOT redirect here — always stay on home
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser && ADMIN_EMAILS.includes(currentUser.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        if (view === 'admin-dashboard') {
          setView('home');
        }
      }

      // ✅ Only redirect to dashboard on explicit sign-in, not on page load session restore
      if (event === 'SIGNED_IN' && window.location.hash === '') {
        setView('user-dashboard');
      }

      // ✅ On sign out, always go home
      if (event === 'SIGNED_OUT') {
        setView('home');
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

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const refreshProducts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        view={view}
        setView={setView}
        cartCount={cart.length}
        isAdmin={isAdmin}
      />

      {view === 'home' ? (
        <HomePage products={products} addToCart={addToCart} setView={setView} refreshProducts={refreshProducts} />
      ) : (
        <main className="w-full">
          {view === 'bookAgent' && <BookAgent setView={setView} />}
          {view === 'cart' && (
            <Cart
              cart={cart}
              setCart={setCart}
              setView={setView}
              onContinueShopping={() => setView('listings')}
            />
          )}
          {view === 'listings' && (
            <Listings
              products={products}
              refreshProducts={refreshProducts}
              cart={cart}
              setCart={setCart}
              setView={setView}
              isLoggedIn={!!user}
              onNavigate={setView}
            />
          )}
          {view === 'blog' && <Blog setView={setView} />}

          {view === 'sell' && <SellInstructions setView={setView} />}
          {view === 'faq'  && <SellInstructions setView={setView} />}

          {view === 'privacy' && <PrivacyPolicy setView={setView} />}
          {view === 'terms'   && <TermsAndConditions setView={setView} />}

          {view === 'post' && <PostProduct loadProducts={loadProducts} user={user} setView={setView} />}
          {view === 'authForm' && <AuthForm setView={setView} />}
          {view === 'signup'   && <AuthForm type="signup" setView={setView} />}
          {view === 'signin'   && <AuthForm type="signin" setView={setView} />}
          {view === 'seller-dashboard' && user && <UserDashboard user={user} setView={setView} />}
          {view === 'user-dashboard'   && user && <UserDashboard user={user} setView={setView} />}
          {view === 'buyer-dashboard'  && user && <BuyerDashboard user={user} setView={setView} />}

          {view === 'admin-dashboard' && user && isAdmin && (
            <AdminDashboard user={user} setView={setView} />
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
                <button
                  onClick={() => setView('home')}
                  className="px-8 py-3 bg-teal-800 text-white hover:bg-teal-700 transition rounded font-semibold"
                >
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
                <button
                  onClick={() => setView('signin')}
                  className="px-8 py-3 bg-teal-800 text-white hover:bg-teal-700 transition rounded font-semibold"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      <Footer setView={setView} listings={products} />
    </div>
  );
}