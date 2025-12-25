# Landing Page Engine Contract
## Version 1.0.0 | Status: DRAFT

This document defines the interface between the **Engine Agent** (Logic, Data, Performance) and the **Figma Agent** (Design, UI/UX).

### 1. Responsibilities
*   **Engine:** Supplies the HTML structure (DOM), manages data fetching (API), handles 3D scene logic, performance optimization, and application state.
*   **Figma:** Supplies the CSS styling, layout decisions, typography, colors, and static assets. Uses provided DOM hooks.

### 2. DOM Interface (The Chassis)
The Engine guarantees the presence of these elements. Figma must target these IDs/Attributes without changing logic.

#### Main Layers
| Selector | Purpose | Z-Index Scope |
| :--- | :--- | :--- |
| `#scene-canvas` | 3D WebGL Canvas (Engine Territory) | z-0 |
| `#ui-layer` | Main UI container for Hero/Content | z-10 |
| `.data-overlay` | Container for real-time metrics | z-20 |

#### Data Hooks (Data Binding)
The Engine will inject text/values into elements with these specific attributes.
*   `[data-metric="nav"]` -> Receives NAV value (e.g., "12.45")
*   `[data-metric="equity"]` -> Receives Equity value (e.g., "€45,230")
*   `[data-metric="trade"]` -> Receives Last Trade % (e.g., "+3.2%")

#### State Classes
The Engine toggles these classes on parent containers (like `.data-overlay`) to indicate state.
*   `.loading` -> Data is being fetched. (Figma: Style skeleton screens here)
*   `.ready` -> Data is present. (Figma: Show final UI)
*   `.error` -> Fetch failed. (Figma: Show fallback/error visual)

### 3. API & Logic Layer
The Engine manages the following background processes:
*   **Endpoint:** `GET /api/public/metrics` (Aggregated) or individual endpoints.
*   **Polling:** Auto-refresh every 5s.
*   **Logic:**
    *   NAV animation (CountUp GSAP).
    *   Currency formatting (Locale RO).
    *   Error retry strategy (3 retries).

### 4. Figma Handoff Instructions
1.  **Do NOT** delete `#scene-canvas` or script tags.
2.  **Do NOT** change `id` or `data-metric` attributes.
3.  **DO** replace inline styles with `theme.css`.
4.  **DO** restructure internal layout of `#ui-layer` as needed, keeping hooks intact.

### 5. Current Implementation Status
*   [x] DOM Structure (Basic)
*   [x] 3D Scene Integration
*   [ ] Real API Connection (Currently Mock)
*   [ ] Clean "Chassis" (Design Strip) -> **NEXT STEP**
