# Coffee Loyalty App - Quick Start Guide

## ✅ What's Been Built

Your complete digital coffee loyalty app is ready! Here's what you have:

### **Pages**
- 🏠 **Home Page** (`/`) - Landing page with features and CTAs
- 📱 **Scan Page** (`/scan/[shopCode]`) - Customer scanning interface
- 🏪 **Admin Dashboard** (`/admin/[shopId]`) - Shop owner management panel
- 🏭 **Setup Page** (`/setup`) - Shop creation and QR code generation

### **API Routes**
- `POST /api/stamp` - Add stamp on QR scan
- `POST /api/manual-stamp` - Add stamp manually (admin)
- `POST /api/setup` - Create new shop
- `GET /api/admin/[shopId]` - Get shop analytics

### **Features**
✅ Mobile-first responsive design
✅ QR code generation and scanning
✅ Digital stamp cards (10 stamps = free coffee)
✅ Animated reward screen (7-minute window)
✅ 7-minute scan cooldown
✅ Admin dashboard with customer management
✅ Egyptian phone number validation
✅ Error handling with friendly UI
✅ TypeScript throughout
✅ Tailwind CSS styling

## 🚀 Next Steps

### 1. Set Up Supabase Database

Visit https://supabase.com and create a free account:

1. Create a new project
2. Go to **Settings** → **Database** → **Connection Strings**
3. Copy the PostgreSQL connection string

It should look like:
```
postgresql://postgres:PASSWORD@HOST:5432/postgres
```

### 2. Update `.env.local`

Edit the file `c:\Users\Zeyad.Amr\Work\coffe\.env.local`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@your-db-host:5432/postgres"
```

**Replace:**
- `YOUR_PASSWORD` - Your Supabase password
- `your-db-host` - Your Supabase host (e.g., `db.abcdefgh.supabase.co`)

### 3. Initialize Prisma & Database

Run these commands in your project directory:

```bash
# Generate Prisma client and run migrations
npx prisma migrate dev --name init

# This will create the database tables automatically
```

When prompted, give the migration a name (e.g., "init") and press Enter.

### 4. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

## 📝 Test the App

### Create a Shop

1. Go to http://localhost:3000
2. Click **"Setup Your Coffee Shop"**
3. Enter a shop name (e.g., "Downtown Coffee")
4. Click **"Create Shop & Generate QR Code"**
5. You'll see your QR code and a link to your admin dashboard
6. **Bookmark the admin URL** for later access

### Scan a Code (Customer)

1. Go to http://localhost:3000/setup and create a shop (or use an existing one's QR code)
2. Open the scan URL: `http://localhost:3000/scan/YOUR_SHOP_CODE`
3. Enter an Egyptian phone number (e.g., 01012345678)
4. Confirm the number
5. Add stamps and watch them appear
6. After 10 stamps, see the animated reward screen!

### Manage from Admin

1. Go to your admin dashboard link (from the setup page)
2. See all customers and their stamps
3. Manually add stamps for customers using the form
4. View statistics

## 🎨 Customization

### Change Colors
Edit Tailwind colors in:
- `/app/scan/[shopCode]/page.tsx` (look for `bg-orange-500`, `bg-green-600`, etc.)
- `/app/setup/page.tsx`
- `/app/admin/[shopId]/page.tsx`

### Change Reward Period
In `/app/api/stamp/route.ts`, change line with `7 * 60 * 1000`:
```typescript
rewardExpiresAt = new Date(now.getTime() + 7 * 60 * 1000); // Change 7 to any minutes
```

### Change Stamps Needed
In `/app/api/stamp/route.ts`, change the `10` in:
```typescript
if (newStampCount >= 10) { // Change 10 to any number
```

### Change Cooldown Duration
In `/app/api/stamp/route.ts`, change `COOLDOWN_MINUTES`:
```typescript
const COOLDOWN_MINUTES = 7; // Change 7 to any minutes
```

## 🔧 Troubleshooting

### "Module not found: '@prisma/client'"
Run: `npx prisma migrate dev --name init`

### "Cannot connect to database"
- Check your DATABASE_URL in `.env.local` is correct
- Make sure your Supabase database is running
- Verify you're using the correct password

### "QR Code not scanning"
- Make sure the URL format is correct: `http://localhost:3000/scan/YOUR_SHOP_CODE`
- Try generating a larger QR code
- Check browser console for errors

### Port 3000 already in use?
Run: `npm run dev -- -p 3001` to use port 3001 instead

## 📦 Deploying to Production

### Vercel (Recommended)

1. Push code to GitHub
2. Go to https://vercel.com and connect your repo
3. Add environment variable:
   - **KEY**: `DATABASE_URL`
   - **VALUE**: Your Supabase connection string
4. Deploy!

### Other Hosts

1. Build the app: `npm run build`
2. Run the server: `npm start`
3. Set `DATABASE_URL` environment variable
4. Make sure Node.js 18+ is available

## 📚 Project Structure

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout
├── scan/
│   ├── page.tsx               # Scan instructions
│   └── [shopCode]/page.tsx     # Customer scan interface
├── setup/page.tsx              # Shop creation
├── admin/[shopId]/page.tsx      # Admin dashboard
├── api/
│   ├── stamp/route.ts          # Add stamp logic
│   ├── manual-stamp/route.ts    # Manual stamp (admin)
│   ├── setup/route.ts          # Create shop
│   └── admin/[shopId]/route.ts  # Admin API
├── components/
│   └── ErrorDisplay.tsx        # Error UI
└── lib/
    ├── utils.ts                # Helpers
    └── prisma.ts               # DB client

prisma/
└── schema.prisma              # Database schema
```

## 📞 Need Help?

- Check `SETUP.md` for detailed information
- Review API response formats in `SETUP.md`
- Check browser console for error messages
- Verify Supabase database connection

## 🎯 What To Do Next

1. ✅ Set up Supabase and database
2. ✅ Test the app locally
3. ✅ Print QR codes and place at your shop
4. ✅ Share the loyalty app with customers
5. ✅ Deploy to production
6. ✅ Monitor admin dashboard for insights

Happy coding! ☕
