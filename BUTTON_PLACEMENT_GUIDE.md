# Analytics Button Placement - Visual Guide

## 🎯 Button Location

### BEFORE (Original):
```
┌─────────────────────────────────┐
│ Alert Card                      │
│                                 │
│ To: 0xabc...          [HIGH]    │
│ Hash: 0xdef...        $125      │
│                                 │
│ [Click entire card to view]     │
└─────────────────────────────────┘
```

### AFTER (Updated):
```
┌─────────────────────────────────┐
│ Alert Card                      │
│                                 │
│ To: 0xabc...          [HIGH]    │
│ Hash: 0xdef...        $125      │
│                                 │
│ ┌─────────┐ ┌────────────────┐ │
│ │ Ignore  │ │ 📊 Analytics   │ │
│ │ (gray)  │ │ (blue/white)   │ │
│ └─────────┘ └────────────────┘ │
└─────────────────────────────────┘
```

## 📐 Layout Specifications

### Container:
```jsx
<div className="flex items-center gap-2">
  {/* Ignore Button */}
  {/* Analytics Button */}
</div>
```

### Ignore Button (Left):
```
┌───────────────────┐
│     Ignore        │  ← Gray text
│  (text-gray-400)  │  → Red on hover
└───────────────────┘
```
**Styling:**
- Base: Gray text on transparent background
- Hover: Red text (`text-red-500`) + slate background
- Width: 50% of container (`flex-1`)
- Size: Extra small text (`text-xs`)

### Analytics Button (Right):
```
┌────────────────────┐
│  📊 Analytics      │  ← White text
│  (bg-blue-600)     │  → Darker blue on hover
└────────────────────┘
```
**Styling:**
- Base: Blue background (`bg-blue-600`) + white text
- Hover: Darker blue (`bg-blue-700`)
- Width: 50% of container (`flex-1`)
- Size: Extra small text (`text-xs`)
- Icon: Bar chart SVG (3.5px × 3.5px)

## 🎨 Color Palette

### Ignore Button:
| State   | Text Color    | Background      | Border |
|---------|---------------|-----------------|--------|
| Default | `#9ca3af`    | Transparent     | None   |
| Hover   | `#ef4444`    | `#334155`       | None   |

### Analytics Button:
| State   | Text Color    | Background      | Border |
|---------|---------------|-----------------|--------|
| Default | `#ffffff`    | `#2563eb`       | None   |
| Hover   | `#ffffff`    | `#1d4ed8`       | None   |

## 📱 Responsive Behavior

### Desktop (> 1024px):
```
┌────────────────────────────────────────┐
│                                        │
│ To: 0xabc...               [HIGH]      │
│ Hash: 0xdef...             $125        │
│                                        │
│ ┌─────────────┐  ┌──────────────────┐ │
│ │   Ignore    │  │  📊 Analytics    │ │
│ └─────────────┘  └──────────────────┘ │
└────────────────────────────────────────┘
      Equal width, side-by-side
```

### Mobile (< 640px):
```
┌─────────────────────┐
│                     │
│ To: 0xabc...        │
│ Hash: 0xdef...      │
│ [HIGH]  $125        │
│                     │
│ ┌────────┐ ┌──────┐│
│ │ Ignore │ │ 📊 A.││
│ └────────┘ └──────┘│
└─────────────────────┘
  Scaled but readable
```

## 🔧 Technical Implementation

### Component Structure:
```jsx
function AlertCard({ a, onSelect, onOpenCharts, onIgnore }) {
  return (
    <div onClick={handleCardClick}>
      {/* Card header info */}
      <div className="flex justify-between mb-3">
        {/* Address, hash, risk, loss */}
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button onClick={handleIgnore} className="action-button flex-1...">
          Ignore
        </button>
        <button onClick={handleAnalytics} className="action-button flex-1...">
          <svg>...</svg>
          Analytics
        </button>
      </div>
    </div>
  );
}
```

### Event Handling Flow:
```
User clicks Analytics button
       ↓
handleAnalytics(e)
       ↓
e.stopPropagation()  ← Prevents card click
       ↓
onOpenCharts(alert)
       ↓
Set chart filter
       ↓
Load filtered metrics
       ↓
Switch to analytics view
```

## 🎭 Interaction States

### Normal State:
```
[ Ignore ]    [ 📊 Analytics ]
  ↑gray         ↑blue+white
```

### Hover on Ignore:
```
[ Ignore ]    [ 📊 Analytics ]
  ↑red+bg       ↑blue+white
```

### Hover on Analytics:
```
[ Ignore ]    [ 📊 Analytics ]
  ↑gray         ↑darker blue
```

### Clicking Card (not buttons):
```
┌─────────────────────────────────┐
│ ← Click here opens details      │
│                                 │
│ To: 0xabc...          [HIGH]    │
│ Hash: 0xdef...        $125      │
│                                 │
│ [Ignore] [Analytics] ← Don't    │
│    ↑         ↑        trigger   │
│  Buttons    card     selection  │
└─────────────────────────────────┘
```

## ✅ Accessibility Features

1. **Tooltips:**
   - Ignore: "Ignore this alert"
   - Analytics: "View analytics for this transaction"

2. **Visual Feedback:**
   - Hover effects on both buttons
   - Cursor changes to pointer
   - Color transitions (150ms)

3. **Click Areas:**
   - Adequate touch target size (≥ 36px height)
   - Clear visual separation
   - No overlapping click zones

## 🧪 Test Scenarios

### Scenario 1: Click Analytics
```
Action: Click Analytics button on alert card
Expected:
  ✓ Analytics view opens
  ✓ Filter shows transaction hash
  ✓ Charts display transaction-specific data
  ✓ Alert details do NOT open
```

### Scenario 2: Click Ignore
```
Action: Click Ignore button on alert card
Expected:
  ✓ Confirmation dialog appears
  ✓ Shows transaction hash
  ✓ Alert details do NOT open
  ✓ Console logs the action
```

### Scenario 3: Click Card Background
```
Action: Click anywhere on card except buttons
Expected:
  ✓ Alert details open in main panel
  ✓ Shows full transaction info
  ✓ Action buttons become available
```

### Scenario 4: Responsive Resize
```
Action: Resize browser window
Expected:
  ✓ Buttons maintain equal width
  ✓ Text remains readable
  ✓ Icons scale appropriately
  ✓ Gap between buttons preserved
```

## 📊 Alignment Verification

### Horizontal Alignment:
```
┌─────────────────────────────────┐
│                                 │
│ ┌─────────────┐┌──────────────┐│
│ │   Button 1  ││   Button 2   ││ ← Same height
│ └─────────────┘└──────────────┘│
│        ↑             ↑          │
│    Equal top    Equal bottom    │
└─────────────────────────────────┘
```

### Vertical Alignment:
```
Text baseline:
┌────────┐  ┌──────────┐
│ Ignore │  │ 📊 Analytics │
└────────┘  └──────────┘
    ↑           ↑
 Centered   Centered
(items-center)
```

## 🎯 Key Features Summary

✅ **Proper Alignment**: Buttons sit perfectly next to each other
✅ **Consistent Styling**: Matches Protego's blue theme
✅ **Responsive Design**: Works on all screen sizes
✅ **Event Handling**: No conflicts with card selection
✅ **Visual Feedback**: Clear hover and active states
✅ **Accessibility**: Tooltips and proper contrast
✅ **Icon Integration**: SVG bar chart icon included
✅ **Build Success**: No errors or warnings

## 🚀 Ready to Use!

The implementation is complete and tested. Start the frontend server to see the changes:

```bash
cd frontend
npm run dev
```

Then navigate to `http://localhost:5173` and view the Dashboard!
