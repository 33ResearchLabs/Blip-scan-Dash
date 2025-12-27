# BlipScan Features

## 🎨 UI Design System

### Design Philosophy
- **Apple-inspired minimal aesthetic**: Clean lines, subtle effects, no visual clutter
- **Green theme matching**: Uses same `#22C55E` primary color as Blip Money dashboard
- **Glassmorphism effects**: Subtle `backdrop-blur-xl` with semi-transparent backgrounds
- **Professional typography**: Small, readable fonts with proper spacing

### Color Palette
```css
Primary Green:     #22C55E (hsl(142 76% 36%))
Background:        White / Dark (#0A0A0A in dark mode)
Secondary:         Light gray with low opacity
Borders:           Very subtle with 30% opacity
Text:              High contrast with muted variants
```

### Component Styling

**Cards:**
- `rounded-2xl` for main cards (16px radius)
- `bg-secondary/40` semi-transparent backgrounds
- `border border-border/30` very subtle borders
- `backdrop-blur-sm` for depth
- Consistent 4px padding: `p-4`

**Typography:**
- Numbers: `text-2xl font-semibold` with `.toLocaleString()`
- Labels: `text-xs text-muted-foreground/60`
- Addresses: `font-mono` for monospace
- Titles: `text-2xl font-semibold tracking-tight`

**Status Badges:**
```typescript
funded:    bg-blue-500/10 text-blue-500 border-blue-500/20
locked:    bg-yellow-500/10 text-yellow-500 border-yellow-500/20
released:  bg-primary/10 text-primary border-primary/20 (green)
refunded:  bg-red-500/10 text-red-500 border-red-500/20
```

**Icons:**
- 14-16px size for inline icons
- Lucide React icon library
- Colored to match status

## 📊 Pages

### 1. Homepage (`/`)

**Stats Cards (Top Section):**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total       │ Total       │ Active      │ Avg.        │
│ Trades      │ Volume      │ Merchants   │ Completion  │
│ 1,234       │ $567,890.00 │ 89          │ 12m         │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Search & Filters:**
- Full-width search bar with icon
- Filter chips: All | Funded | Locked | Released | Refunded
- Active filter highlighted in green

**Trade List:**
```
┌────────────────────────────────────────────────────────┐
│ a1b2...c3d4  [RELEASED]                               →│
│ Amount: $100.00  Merchant: e5f6...g7h8                 │
│ Buyer: i9j0...k1l2       Created: 2h ago               │
└────────────────────────────────────────────────────────┘
```

### 2. Trade Detail Page (`/trade/[escrow]`)

**Amount Card:**
```
┌──────────────────┐
│ Amount           │
│ $1,250.00        │
│ Fee: 2.50%       │
└──────────────────┘
```

**Participants:**
```
┌─────────────────┬─────────────────┐
│ Merchant        │ Buyer           │
│ abc123...xyz789 │ def456...uvw012 │
│ (clickable)     │ (clickable)     │
└─────────────────┴─────────────────┘
```

**Timeline (Event History):**
```
┌──────────────────────────────────────┐
│ Timeline                             │
│                                      │
│ [👤] Created        Jan 15, 2:30 PM │
│  │   Signer: abc...xyz              │
│  │   Slot: 123,456                  │
│  │   View transaction →             │
│  │                                  │
│ [🔒] Locked         Jan 15, 2:45 PM │
│  │   Signer: def...uvw              │
│  │   Slot: 123,789                  │
│  │   View transaction →             │
│  │                                  │
│ [✓] Released       Jan 15, 3:00 PM │
│      Signer: abc...xyz              │
│      Slot: 124,012                  │
│      View transaction →             │
└──────────────────────────────────────┘
```

### 3. Merchant Profile (`/merchant/[pubkey]`)

**Reputation Score:**
```
┌────────────────────────────────────────┐
│ Reputation Score     Completion Rate   │
│ 87.3 / 100          95.5%             │
│ Very Good                              │
│                                        │
│ Breakdown:                             │
│ Completion: 57.3 pts                   │
│ Volume Bonus: 15.0 pts                 │
│ Speed Bonus: 15.0 pts                  │
└────────────────────────────────────────┘
```

**Stats Grid:**
```
┌─────────┬─────────┬─────────┬─────────┐
│ Total   │ Total   │ Completed│ Avg.   │
│ Trades  │ Volume  │          │ Time   │
│ 156     │$45,678  │ 149      │ 15m    │
└─────────┴─────────┴─────────┴─────────┘
```

**Trade Breakdown:**
```
┌─────────┬─────────┬─────────┐
│ 149     │ 5       │ 2       │
│ Released│ Locked  │ Refunded│
└─────────┴─────────┴─────────┘
```

**Recent Trades List:**
- Same format as homepage trade list
- Filtered to this merchant only

## 🔢 Number Formatting

All numbers use proper formatting:

```typescript
// Amounts (USDT with 6 decimals)
const formatAmount = (amount: string) => {
  const num = parseInt(amount) / 1_000_000;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
// Output: "1,234.56"

// Counts
total.toLocaleString()
// Output: "1,234"

// Percentages
rate.toFixed(1) + '%'
// Output: "95.5%"

// Time
Math.round(seconds / 60) + 'm'
// Output: "15m"
```

## 🔗 Address Formatting

```typescript
// Short format (for lists)
formatAddress(address)
// Output: "a1b2...c3d4"

// Medium format (for cards)
formatFullAddress(address)
// Output: "a1b2c3d4...x7y8z9"

// Always with monospace font
className="font-mono"
```

## 📱 Responsive Design

- Mobile: Single column, stacked cards
- Tablet: 2-column grids
- Desktop: 3-4 column grids
- All layouts use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)

## ⚡ Performance

- Server-side data fetching via Next.js App Router
- Efficient PostgreSQL queries with indexes
- Pagination support (limit parameter)
- API responses optimized for minimal payload

## 🎯 User Experience

**Navigation:**
- Breadcrumb links (← Back to explorer)
- Clickable addresses link to merchant profiles
- External links to Solana Explorer for transactions

**Loading States:**
- Spinner with green primary color
- "Loading..." text in muted foreground
- Centered layout

**Empty States:**
- "No trades found" centered message
- Helpful back links
- Consistent styling

**Interactive Elements:**
- Hover effects on cards (border brightens)
- Smooth transitions (`transition-all`)
- Arrow icons on hoverable items
- Active filter states

## 🎨 Animations

Subtle, Apple-like animations:

```css
/* Fade in on load */
opacity-0 animate-fade-in

/* Slide up on mount */
translate-y-20 animate-slide-up

/* Spin loader */
animate-spin

/* Pulse (live indicator) */
animate-pulse
```

All animations are subtle and professional, never distracting.

## 📊 Data Display Patterns

**Stat Cards:**
- Icon in rounded container (8x8px, 14-16px icon)
- Large number (2xl font, semibold)
- Small label (xs font, muted color)

**Trade Cards:**
- Main info (escrow address + status badge)
- Grid of details (2-4 columns depending on screen)
- Hover effect + arrow icon for clickability

**Timeline Events:**
- Icon indicator with connecting line
- Event name + timestamp
- Additional details in smaller text
- External link for transaction

## 🚀 Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom config
- **Icons**: Lucide React
- **Database**: PostgreSQL with pg driver
- **TypeScript**: Full type safety
- **Deployment**: Vercel-ready

## 🎨 Design Tokens

```typescript
// Spacing
gap-3      // 12px
gap-4      // 16px
p-4        // 16px padding
mb-6       // 24px margin-bottom

// Rounding
rounded-xl     // 12px
rounded-2xl    // 16px
rounded-lg     // 8px

// Opacity
/10        // 10% opacity
/20        // 20% opacity
/30        // 30% opacity
/40        // 40% opacity
/50        // 50% opacity
/60        // 60% opacity

// Blur
backdrop-blur-sm    // 4px
backdrop-blur-xl    // 24px
blur-[80px]        // 80px (background effects)
```

This creates a cohesive, professional design system that matches the Blip Money brand perfectly!
