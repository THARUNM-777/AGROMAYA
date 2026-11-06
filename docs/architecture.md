# AGROMAYA – Smart Agriculture Waste-to-Biochar Ecosystem
## System Architecture & Technical Specification

### 1. Overview
AGROMAYA is an enterprise-grade agricultural intelligence and logistics ecosystem designed to eliminate crop stubble burning across India. It bridges three key stakeholders:
1. **Farmers**: Earn revenue and agricultural credits for verified crop residues (paddy, maize, sugarcane, etc.) instead of burning them.
2. **Gram Panchayats**: Local village government bodies that register farmers, coordinate harvesting clusters, verify collection points, and schedule transports.
3. **Biochar Companies**: Industrial processors that purchase agricultural residues to produce carbon-negative biochar, bio-fertilizers, and activated carbon.

### 2. High-Level Architecture Diagram
```
+--------------------------------------------------------------------------+
|                        AGROMAYA WEB APPLICATION                          |
|  [Vite + React 19 + TypeScript + Tailwind CSS + Framer Motion + Recharts]|
+-------------------+--------------------+---------------------------------+
                    |                    |
          Role 1    |          Role 2    |          Role 3
   +----------------+---+   +------------+-----+   +-----------------------+
   |   Biochar Company  |   |  Gram Panchayat  |   |    Farmer Portal      |
   | - Satellite Radar  |   | - Farmer Reg     |   | - My Farm / Polygons  |
   | - Bulk Discovery   |   | - Land Records   |   | - Incoming Requests   |
   | - Direct Requests  |   | - Scheduling Cal |   | - Credit & Cash Wallet|
   | - Feedstock Verify |   | - Verification   |   | - Agri Marketplace    |
   | - Agri Marketplace |   | - Village Stats  |   | - Bilingual (EN/KN)   |
   +----------------+---+   +------------+-----+   +-----------------------+
                    \                    |                    /
                     \                   |                   /
                      v                  v                  v
+--------------------------------------------------------------------------+
|                           REST API GATEWAY                               |
|        [Node.js + Express + TypeScript + JWT Role-Based Auth]            |
+-------------------+------------------------------------+-----------------+
                    |                                    |
                    v                                    v
+------------------------------------+ +-----------------------------------+
|       RELATIONAL DATA ENGINE       | |      AI & SATELLITE ENGINE        |
|  [Prisma ORM + PostgreSQL / SQLite]| | [FastAPI + Python + NDVI Engine]  |
| - 22 Domain Entities               | | - Sentinel-2 Multi-Spectral Radar |
| - Immutable Wallet Ledger          | | - Harvest Readiness Estimation    |
| - PostGIS / GeoJSON Polygons       | | - Crop Yield & Residue Modeling   |
+------------------------------------+ +-----------------------------------+
```

### 3. Core Feedstock Collection Mechanisms
1. **Method 1: Direct Registered Farmer Matching**
   - High-resolution satellite scanning identifies fields approaching 85%+ harvest readiness.
   - The field polygon matches a registered farmer in the local Gram Panchayat registry.
   - The Biochar company issues an immediate collection request.
   - The farmer receives an in-app & SMS notification to accept or decline.
   - The Gram Panchayat verifies and assigns logistics to the nearest collection center.

2. **Method 2: Large-Scale Geo-Spatial Discovery (Bulk Harvesting Clusters)**
   - Biochar companies select a bounding box or cluster of agricultural fields on the satellite map.
   - The engine aggregates:
     * Total acreage
     * Estimated residue tonnage (using: `Acreage * Yield/Acre * Residue-to-Product Ratio`)
     * Involved villages & Panchayats
   - Company dispatches a unified bulk collection request to the respective Gram Panchayats.
   - The Panchayats map unregistered and registered landowners, coordinate logistics, and dispatch verified delivery manifests.

### 4. Financial & Reward Tokenomics
- Every kilogram of verified agricultural waste delivered generates dual rewards:
  - **Agricultural Credits**: Redeemable in the internal AGROMAYA Marketplace for organic biochar fertilizers, high-yield seeds, earthworms, and soil conditioners.
  - **Direct Cash Transfers**: Disbursed directly to the farmer's bank account with transparent transaction ledger records.
