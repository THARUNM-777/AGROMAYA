# AGROMAYA – Database Schema Specification

### Relational Database Engine
- **ORM**: Prisma ORM
- **Default Development**: SQLite (`dev.db`) for zero-dependency local execution
- **Production Option**: PostgreSQL with PostGIS extension for spatial queries

---

### Entity Relationship Model

```
+----------------------------------------------------------------------------------------------------+
|                                    AGROMAYA RELATIONAL ENTITIES                                    |
+----------------------------------------------------------------------------------------------------+

1. User (Authentication & RBAC)
   - id: UUID (PK)
   - email: String (Unique)
   - passwordHash: String
   - role: String ("BIOCHAR_COMPANY" | "GRAM_PANCHAYAT" | "FARMER" | "ADMIN")
   - name: String
   - phone: String?
   - createdAt, updatedAt: DateTime

2. Panchayat (Local Village Government)
   - id: UUID (PK)
   - name: String (Unique)
   - district: String
   - taluk: String
   - contactOfficer: String
   - phone: String
   - officeAddress: String

3. Village (Settlements within Panchayat)
   - id: UUID (PK)
   - name: String
   - panchayatId: UUID (FK -> Panchayat.id)
   - pinCode: String
   - latitude, longitude: Float

4. BiocharCompany (Procurement & Processing Entity)
   - id: UUID (PK)
   - userId: UUID (FK -> User.id)
   - companyName: String
   - registrationNo: String (Unique)
   - contactPerson, contactPhone, address: String

5. Farmer (Residue Producer)
   - id: UUID (PK)
   - userId: UUID (FK -> User.id)
   - fullName, phone: String
   - villageId: UUID (FK -> Village.id)
   - panchayatId: UUID (FK -> Panchayat.id)
   - surveyNumber: String
   - totalLandAcres: Float
   - registrationStatus: String ("VERIFIED")
   - bankAccountRef: String?
   - preferredLang: String ("en" | "kn")

6. AgriculturalField (Monitored Crop Parcel)
   - id: UUID (PK)
   - fieldCode: String (Unique, e.g. "KA-DVG-101")
   - farmerId: UUID? (FK -> Farmer.id)
   - villageId: UUID (FK -> Village.id)
   - panchayatId: UUID (FK -> Panchayat.id)
   - surveyNumber: String
   - cropType: String ("Paddy", "Maize", "Sugarcane", etc.)
   - areaAcres: Float
   - status: String ("HARVEST_READY" | "HARVEST_APPROACHING" | "COLLECTED" | "GROWING")
   - harvestReadinessPct: Float
   - estimatedResidueTonnes: Float
   - harvestWindow: String?
   - centerLat, centerLng: Float
   - polygonCoordinatesJson: String (GeoJSON polygon array)

7. SatelliteObservation (Sentinel-2 Spectral Metrics)
   - id: UUID (PK)
   - fieldId: UUID (FK -> AgriculturalField.id)
   - satelliteSource: String ("Sentinel-2 MSI")
   - acquisitionDate: DateTime
   - ndvi, evi, cloudCoverPct: Float

8. HarvestPrediction (AI Crop Ripening Classifier)
   - id: UUID (PK)
   - fieldId: UUID (FK -> AgriculturalField.id)
   - readinessPct, confidencePct: Float
   - cropStage: String
   - estimatedResidueTonnes: Float

9. FeedstockRequest (Procurement Offer)
   - id: UUID (PK)
   - requestNumber: String (Unique, e.g. "REQ-2026-081")
   - companyId: UUID (FK -> BiocharCompany.id)
   - farmerId: UUID? (FK -> Farmer.id)
   - panchayatId: UUID (FK -> Panchayat.id)
   - fieldId: UUID? (FK -> AgriculturalField.id)
   - requestMethod: String ("DIRECT_FARMER" | "BULK_DISCOVERY")
   - requestedTonnes: Float
   - offeredRewardPerKg: Float
   - status: String ("PENDING" | "ACCEPTED" | "SCHEDULED" | "COMPLETED")

10. CollectionSchedule (Logistics Manifest)
    - id: UUID (PK)
    - requestId: UUID (FK -> FeedstockRequest.id, Unique)
    - collectionDate: DateTime
    - collectionCenter: String
    - transportStatus: String
    - vehicleNumber, driverContact: String?

11. FeedstockCollection (Intake Delivery Batch)
    - id: UUID (PK)
    - collectionNumber: String (Unique, e.g. "COL-2026-018")
    - actualWeightKg: Float
    - residueCategory: String
    - qualityGrade: String ("A" | "B" | "C")
    - moisturePct: Float
    - collectionLocation: String
    - status: String ("PENDING_VERIFICATION" | "VERIFIED")

12. FeedstockVerification (Company QC Sign-Off)
    - id: UUID (PK)
    - collectionId: UUID (FK -> FeedstockCollection.id, Unique)
    - verifiedByCompanyId: UUID (FK -> BiocharCompany.id)
    - actualQuantityTonnes: Float
    - rewardCreditsAwarded: Float
    - cashbackAwarded: Float
    - verifiedAt: DateTime

13. CreditWallet (Farmer Reward Balance)
    - id: UUID (PK)
    - farmerId: UUID (FK -> Farmer.id, Unique)
    - availableCredits, totalEarnedCredits, totalSpentCredits, totalCashReceived: Float

14. CreditTransaction (Immutable Audit Ledger)
    - id: UUID (PK)
    - walletId: UUID (FK -> CreditWallet.id)
    - type: String ("CREDIT_EARNED" | "CREDIT_SPENT")
    - amount: Float
    - description: String
    - referenceId: String?
    - balanceAfter: Float

15. CashPayment (Direct Bank Transfers)
    - id: UUID (PK)
    - amount: Float
    - paymentMethod: String ("DIRECT_BANK_TRANSFER")
    - transactionRef: String (Unique)
    - status: String ("PROCESSED")

16. Product & ProductCategory (Marketplace Catalog)
17. Order & OrderItem (Input Purchases Redeemed with Credits)
18. Notification (Multi-Role Alert Notifications)
19. AuditLog (Tamper-Proof Activity Tracking)
```
