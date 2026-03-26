# Coffee Loyalty App - Setup Guide

This is a complete digital loyalty app for coffee shops. Customers scan QR codes at checkout, collect digital stamps, and earn free coffee after 10 purchases.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier available at https://supabase.com)

## Quick Start

### 1. Set Up Supabase Database

1. Create a new project at https://supabase.com
2. Go to **Settings** → **Database** to find your connection details
3. You'll need:
   - Host
   - Port (usually 5432)
   - Database (usually `postgres`)
   - Username (usually `postgres`)
   - Password (the one you set during setup)

### 2. Update Environment Variables

Copy your Supabase connection details to `.env.local`:

```
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE"
```

**Example:**
```
DATABASE_URL="postgresql://postgres:MyPassword123@db.abcdefgh.supabase.co:5432/postgres"
```

### 3. Create Database Tables

Run Prisma migrations to create the tables:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the `Shop`, `Customer`, and `Stamp` tables
- Generate the Prisma client

### 4. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Using the App

### For Shop Owners

1. Visit `http://localhost:3000/setup`
2. Enter your coffee shop name
3. Get a QR code generated automatically
4. Download the QR code as PNG and print it for your counter
5. After setup, you'll be redirected to your admin dashboard at `/admin/[shopId]`

### For Customers

1. Visit the scanning page: `/scan/[shopCode]` (or just scan the QR code with their phone camera)
2. Enter their 11-digit Egyptian phone number (must start with 01, e.g., 01012345678)
3. Confirm their number
4. Get a digital stamp added to their card
5. After 10 stamps, they'll see an animated reward screen showing they've earned a free coffee
6. The reward is valid for 7 minutes
7. Customer shows their phone to the cashier and gets their free coffee

### Admin Dashboard

Shop owners can:
- View all customers and their stamp counts
- See active rewards
- Manually add stamps (for customers whose phones don't work)
- View statistics (total customers, total stamps, active rewards)

## API Endpoints

### POST /api/stamp
Add a stamp when customer scans QR code.

**Request:**
```json
{
  "phoneNumber": "01012345678",
  "shopCode": "abc123xyz"
}
```

**Response:**
```json
{
  "success": true,
  "stampCount": 7,
  "rewardActive": false,
  "message": "Stamp added! 7/10"
}
```

**Errors:**
- 400: Missing phone number or shop code
- 400: Invalid phone number format
- 404: Shop code not found
- 429: Customer scanned too recently (cooldown is 7 minutes)
- 500: Server error

### POST /api/manual-stamp
Add a stamp manually from admin dashboard (no cooldown).

**Request:**
```json
{
  "phoneNumber": "01012345678",
  "shopId": "abc123"
}
```

### POST /api/setup
Create a new shop and generate QR code.

**Request:**
```json
{
  "shopName": "Downtown Coffee"
}
```

**Response:**
```json
{
  "success": true,
  "shopId": "abc123",
  "qrCode": "xyz789",
  "shopName": "Downtown Coffee"
}
```

### GET /api/admin/[shopId]
Get all customers and stats for a shop.

**Response:**
```json
{
  "success": true,
  "shop": {
    "id": "abc123",
    "name": "Downtown Coffee",
    "qrCode": "xyz789"
  },
  "customers": [
    {
      "id": "cust1",
      "phoneNumber": "01012345678",
      "stampCount": 7,
      "rewardActive": false,
      "rewardExpiresAt": null,
      "lastScannedAt": "2025-03-26T10:30:00Z"
    }
  ],
  "totals": {
    "totalCustomers": 42,
    "totalStampsGiven": 287,
    "totalRewardsRedeemed": 3
  }
}
```

## Database Schema

### Shop
- `id` - Unique identifier
- `name` - Coffee shop name
- `qrCode` - Unique QR code identifier
- `createdAt` - When the shop was created

### Customer
- `id` - Unique identifier
- `phoneNumber` - 11-digit Egyptian phone number (unique)
- `createdAt` - When the customer first scanned

### Stamp
- `id` - Unique identifier
- `shopId` - Reference to Shop
- `customerId` - Reference to Customer
- `stampCount` - Current number of stamps (0-10, resets to 0 after reward)
- `lastScannedAt` - Timestamp of last scan (for cooldown enforcement)
- `rewardActive` - Whether customer currently has an active reward
- `rewardExpiresAt` - When the current reward expires (7 minutes from earning)
- `createdAt` - When this stamp record was created
- `updatedAt` - Last update timestamp

Unique constraint: `(shopId, customerId)` - One stamp record per customer per shop

## Features

✅ **Mobile-first design** - Optimized for phone screens
✅ **QR code generation** - Auto-generated for each shop
✅ **Digital stamps** - No physical cards needed
✅ **Automatic rewards** - Free coffee after 10 purchases
✅ **Reward animations** - Can't be screenshot-faked
✅ **7-minute cooldown** - Prevents scanning spam
✅ **7-minute reward window** - Fresh coffee guarantee
✅ **Admin dashboard** - Manage customers and rewards
✅ **Manual stamp support** - For fallback situations
✅ **Egypt phone validation** - 11 digits starting with 01
✅ **Error handling** - User-friendly error messages
✅ **TypeScript** - Full type safety

## Development

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **UI:** React with Tailwind CSS
- **Language:** TypeScript
- **QR Codes:** qrcode.react

### File Structure
```
app/
  ├── page.tsx              # Landing page
  ├── layout.tsx            # Root layout with metadata
  ├── scan/
  │   ├── page.tsx          # Scan info page
  │   └── [shopCode]/
  │       └── page.tsx      # Customer scanning page
  ├── admin/
  │   └── [shopId]/
  │       └── page.tsx      # Shop owner dashboard
  ├── setup/
  │   └── page.tsx          # Shop creation page
  ├── api/
  │   ├── stamp/
  │   │   └── route.ts      # Add stamp endpoint
  │   ├── manual-stamp/
  │   │   └── route.ts      # Manual stamp endpoint
  │   ├── setup/
  │   │   └── route.ts      # Shop creation endpoint
  │   └── admin/
  │       └── [shopId]/
  │           └── route.ts  # Admin data endpoint
  ├── components/
  │   └── ErrorDisplay.tsx  # Error UI component
  └── lib/
      └── utils.ts          # Utility functions

prisma/
  └── schema.prisma         # Database schema
```

## Troubleshooting

### Database Connection Error
- Verify your DATABASE_URL is correct in `.env.local`
- Make sure your Supabase database is running
- Check that your IP is whitelisted in Supabase network settings

### QR Code Not Scanning
- Make sure the QR code PNG is generated correctly
- Try increasing the size or darkness of the QR code when printing
- Ensure good lighting when scanning

### Cooldown Not Working
- Cooldown logic is server-side and cannot be bypassed by client manipulation
- Cooldown is 7 minutes from `lastScannedAt`
- Check the database directly if there are issues

### Reward Animation Not Showing
- Rewards are stored in browser session storage
- Clearing cache will clear active rewards
- Reward expires after 7 minutes (check `rewardExpiresAt` in database)

## Production Deployment

To deploy to production (e.g., Vercel):

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel settings:
   - `DATABASE_URL` - Your Supabase connection string

That's it! Vercel will handle building and deploying automatically.

## Future Enhancements

- Customer login with phone verification
- Reward redemption codes
- Email/SMS notifications
- Analytics dashboard
- Multiple shop chains support
- Reward customization (stamps needed, reward type)
- Referral bonuses
- Seasonal campaigns
