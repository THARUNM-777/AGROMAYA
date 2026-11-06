# AGROMAYA – REST API Documentation
## Version 1.0.0

### Base URL
- Development: `http://localhost:5000/api`
- Frontend Proxy: `/api`

### Authentication
All protected routes require an HTTP Authorization header formatted as:
`Authorization: Bearer <JWT_TOKEN>`

Tokens are valid for 7 days and encode the user's `userId`, `email`, `role`, and corresponding entity identifier (`farmerId`, `companyId`, or `panchayatId`).

---

### 1. Authentication Endpoints

#### POST `/api/auth/login`
Authenticates a user via email and password.
- **Request Body**:
  ```json
  {
    "email": "company@agromaya.in",
    "password": "Agromaya@2026"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "...",
      "email": "company@agromaya.in",
      "role": "BIOCHAR_COMPANY",
      "name": "Dr. Ramesh Kulkarni",
      "companyId": "..."
    }
  }
  ```

#### POST `/api/auth/demo-login`
One-click role authentication for Hackathon judging and evaluation.
- **Request Body**:
  ```json
  {
    "role": "BIOCHAR_COMPANY" // "GRAM_PANCHAYAT" | "FARMER"
  }
  ```

#### GET `/api/auth/me`
Retrieves currently logged-in user profile, linked wallet, and entities.

---

### 2. Agricultural Fields & Remote Sensing

#### GET `/api/fields`
Returns all agricultural fields with optional filtering.
- **Query Parameters**:
  - `status`: `"HARVEST_READY" | "HARVEST_APPROACHING" | "COLLECTED" | "GROWING"`
  - `cropType`: `"Paddy" | "Maize" | "Sugarcane" | "Cotton"`
  - `panchayatId`: Filter by Gram Panchayat UUID
  - `minReadiness`: Float (e.g. `85.0`)
  - `search`: Substring search on fieldCode, survey number, or farmer name.

#### GET `/api/fields/map`
Optimized endpoint delivering GeoJSON / map features with polygon coordinate arrays, centroid latitude/longitude, and visual status colors for Leaflet/Google Maps.

#### GET `/api/fields/:id`
Retrieves single field record with historical satellite NDVI observations, predictions, and associated requests.

---

### 3. Feedstock Requests (Method 1 & Method 2)

#### POST `/api/requests/direct` (Method 1: Direct Registered Farmer)
Issues an immediate feedstock collection offer to a registered farmer.
- **Request Body**:
  ```json
  {
    "fieldId": "ded70afd-e039-4b24-b959-58297c90b318",
    "offeredRewardPerKg": 2.0,
    "notes": "Immediate pickup for 8.25 tonnes of paddy straw."
  }
  ```

#### POST `/api/requests/bulk` (Method 2: Large-Scale Feedstock Discovery)
Selects multiple fields on the map and dispatches a bulk procurement request to the Gram Panchayat.
- **Request Body**:
  ```json
  {
    "fieldIds": ["id1", "id2", "id3"],
    "panchayatId": "8bb23e2e-8900-435e-8106-e28588411a82",
    "offeredRewardPerKg": 2.0,
    "notes": "Bulk harvest cluster across Kondajji and Bannikodu village."
  }
  ```

#### PATCH `/api/requests/:id/farmer-response`
Farmer accepts or declines a collection offer.
- **Request Body**:
  ```json
  { "action": "ACCEPT" } // or "REJECT"
  ```

#### POST `/api/requests/:id/schedule`
Gram Panchayat assigns transport logistics, collection point, and vehicle.
- **Request Body**:
  ```json
  {
    "collectionDate": "2026-11-10",
    "collectionCenter": "Harihara APMC Yard Collection Point #1",
    "vehicleNumber": "KA-17-TR-8819",
    "driverContact": "+91 94481 00223"
  }
  ```

---

### 4. Feedstock Verification & Farmer Rewards

#### POST `/api/collections/:id/verify`
Biochar company employee verifies actual weighbridge delivery and disburses dual rewards.
- **Request Body**:
  ```json
  {
    "actualQuantityTonnes": 3.2,
    "qualityGrade": "A",
    "moisturePct": 11.2,
    "rewardRatePerKg": 2.0,
    "creditSplitRatio": 0.75,
    "remarks": "Clean straw. Moisture 11.2%."
  }
  ```
- **Atomically updates**:
  - `FeedstockCollection.status` -> `VERIFIED`
  - `AgriculturalField.status` -> `COLLECTED` (Green)
  - `CreditWallet` incremented for credits and cash
  - `CreditTransaction` ledger entry created
  - `CashPayment` record created

---

### 5. Farmer Wallet & Agricultural Marketplace

#### GET `/api/wallet`
Retrieves farmer's wallet balance, earned/spent credits, cash received, and ledger history.

#### GET `/api/marketplace/products`
Retrieves catalog of biochar, seeds, fertilizers, and tools.

#### POST `/api/marketplace/orders`
Farmer redeems agricultural credits for input products.
- Validates wallet balance `>= totalCredits`.
- Deducts credits, adjusts stock, and generates order confirmation.
