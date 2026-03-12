# Next Owner Store - Installation Guide (Split Structure)

## 📁 Project Structure

```
next-owner-store/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── ProductCard.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── BookAgent.jsx
│   │   ├── Cart.jsx
│   │   ├── Listings.jsx
│   │   ├── Blog.jsx
│   │   ├── SellInstructions.jsx
│   │   ├── PostProduct.jsx
│   │   ├── AuthForm.jsx
│   │   ├── SellerDashboard.jsx
│   │   └── BuyerDashboard.jsx
│   ├── utils/
│   │   └── supabase.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 🚀 Installation Steps

### 1. Create React App

```bash
npx create-react-app next-owner-store
cd next-owner-store
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
```

### 3. Replace/Add All Files

You need to replace and add the following files:

#### Delete default files:
```bash
# Remove these files (we'll replace them)
rm src/App.js
rm src/App.css
rm src/App.test.js
rm src/logo.svg
rm src/index.css
rm public/index.html
```

#### Create folder structure:
```bash
mkdir -p src/components
mkdir -p src/pages
mkdir -p src/utils
```

#### Copy files from the split structure:

**Root files:**
- `package.json` → Replace existing
- `tailwind.config.js` → Create new
- `postcss.config.js` → Create new

**Public folder:**
- `public/index.html` → Replace existing

**Src folder:**
- `src/App.js` → Replace
- `src/index.js` → Replace
- `src/index.css` → Replace

**Components folder (src/components/):**
- `Header.jsx`
- `Footer.jsx`
- `ProductCard.jsx`

**Pages folder (src/pages/):**
- `HomePage.jsx`
- `BookAgent.jsx`
- `Cart.jsx`
- `Listings.jsx`
- `Blog.jsx`
- `SellInstructions.jsx`
- `PostProduct.jsx`
- `AuthForm.jsx`
- `SellerDashboard.jsx`
- `BuyerDashboard.jsx`

**Utils folder (src/utils/):**
- `supabase.js`

### 4. Configure Supabase

Open `src/utils/supabase.js` and add your credentials:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

Get these from: Supabase Dashboard → Settings → API

### 5. Set Up Database

Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor.

### 6. Start the App

```bash
npm start
```

Your app will open at `http://localhost:3000` 🎉

## 🔧 Troubleshooting

**"Module not found" errors:**
```bash
npm install
```

**Tailwind not working:**
Make sure you have all three files:
- `tailwind.config.js`
- `postcss.config.js`
- `src/index.css` (with @tailwind directives)

**Supabase errors:**
- Check your credentials in `src/utils/supabase.js`
- Make sure you ran the SQL schema
- Verify RLS policies are enabled

## 📝 File Descriptions

### Components
- **Header.jsx** - Top navigation bar with auth buttons
- **Footer.jsx** - Bottom footer with links
- **ProductCard.jsx** - Reusable product display card

### Pages
- **HomePage.jsx** - Main landing page with product grid
- **BookAgent.jsx** - Agent booking form
- **Cart.jsx** - Shopping cart with checkout
- **Listings.jsx** - All products listing
- **Blog.jsx** - Blog posts page
- **SellInstructions.jsx** - How to sell guide
- **PostProduct.jsx** - Create new listing form
- **AuthForm.jsx** - Sign in/up forms
- **SellerDashboard.jsx** - Seller's control panel
- **BuyerDashboard.jsx** - Buyer's order history

### Utils
- **supabase.js** - Supabase client configuration

### Core Files
- **App.js** - Main app component with routing logic
- **index.js** - React DOM entry point
- **index.css** - Global styles + Tailwind

## 🎨 Customization

### Change Colors
Search for `bg-blue-600` and `text-blue-600` and replace with your brand color.

### Add New Pages
1. Create new file in `src/pages/`
2. Import in `App.js`
3. Add view condition in main render
4. Add navigation link in `Header.jsx`

### Modify Categories
Edit the categories array in `HomePage.jsx`:
```javascript
const categories = ['All', 'Furniture', 'Electronics', 'Household', 'B4Sale'];
```

## 🚀 Next Steps

1. Test all features
2. Add your logo
3. Customize colors
4. Add sample products
5. Deploy to Vercel/Netlify

## 💡 Benefits of Split Structure

✅ **Easier to maintain** - Find components quickly
✅ **Better organization** - Logical file grouping
✅ **Team collaboration** - Multiple devs can work simultaneously
✅ **Reusable components** - Import anywhere
✅ **Cleaner code** - Smaller, focused files

Happy coding! 🎉
