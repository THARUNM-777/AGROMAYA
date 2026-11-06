import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Haversine formula for distance in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Polygon area calculation in Acres (Gauss Shoelace algorithm on lat/lng)
function calculatePolygonAreaAcres(coordinates: [number, number][]): number {
  if (coordinates.length < 3) return 2.5;
  let areaM2 = 0;
  const len = coordinates.length;
  for (let i = 0; i < len; i++) {
    const j = (i + 1) % len;
    const lat1 = (coordinates[i][0] * Math.PI) / 180;
    const lat2 = (coordinates[j][0] * Math.PI) / 180;
    const lon1 = (coordinates[i][1] * Math.PI) / 180;
    const lon2 = (coordinates[j][1] * Math.PI) / 180;
    areaM2 += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  areaM2 = Math.abs((areaM2 * 6378137 * 6378137) / 4);
  const acres = areaM2 / 4046.86;
  return parseFloat(Math.max(0.5, acres).toFixed(2));
}

// GET /api/fields - List all fields with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, cropType, panchayatId, villageId, minReadiness, search, farmerId } = req.query;

    const where: any = {};

    if (status) where.status = String(status);
    if (cropType) where.cropType = String(cropType);
    if (panchayatId) where.panchayatId = String(panchayatId);
    if (villageId) where.villageId = String(villageId);
    if (farmerId) where.farmerId = String(farmerId);
    if (minReadiness) {
      where.harvestReadinessPct = { gte: parseFloat(String(minReadiness)) };
    }
    if (search) {
      const q = String(search);
      where.OR = [
        { fieldCode: { contains: q } },
        { surveyNumber: { contains: q } },
        { farmer: { fullName: { contains: q } } },
      ];
    }

    const fields = await prisma.agriculturalField.findMany({
      where,
      include: {
        farmer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            registrationStatus: true,
          },
        },
        village: {
          select: { id: true, name: true },
        },
        panchayat: {
          select: { id: true, name: true, district: true, taluk: true },
        },
      },
      orderBy: { harvestReadinessPct: 'desc' },
    });

    const parsedFields = fields.map((f) => ({
      ...f,
      polygonCoordinates: JSON.parse(f.polygonCoordinatesJson),
    }));

    return res.json({ success: true, count: parsedFields.length, fields: parsedFields });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/fields/collection-centers - List Panchayat collection centers with distances
router.get('/collection-centers', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    const centers = await prisma.panchayatCollectionCenter.findMany({
      where: { active: true },
      include: { panchayat: true },
    });

    const enriched = centers.map((c) => {
      let distanceKm = null;
      if (lat && lng) {
        distanceKm = calculateHaversineDistance(
          parseFloat(String(lat)),
          parseFloat(String(lng)),
          c.latitude,
          c.longitude
        );
      }
      return {
        ...c,
        distanceKm,
        availableCapacityTonnes: Math.max(0, c.capacityTonnes - c.currentStockTonnes),
      };
    });

    if (lat && lng) {
      enriched.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return res.json({ success: true, count: enriched.length, centers: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/fields/map - GeoJSON / Map features for Google Maps / Leaflet satellite layer
router.get('/map', async (_req: Request, res: Response) => {
  try {
    const fields = await prisma.agriculturalField.findMany({
      include: {
        farmer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        village: { select: { id: true, name: true } },
        panchayat: { select: { id: true, name: true } },
      },
    });

    const features = fields.map((field) => {
      let color = '#94A3B8'; // grey default
      if (field.status === 'HARVEST_READY') color = '#EAB308'; // yellow
      else if (field.status === 'HARVEST_APPROACHING') color = '#F97316'; // orange
      else if (field.status === 'COLLECTED') color = '#10B981'; // green

      return {
        id: field.id,
        fieldCode: field.fieldCode,
        farmerName: field.farmer?.fullName || 'Unregistered Landowner',
        farmerPhone: field.farmer?.phone,
        farmerId: field.farmerId,
        village: field.village.name,
        panchayat: field.panchayat.name,
        panchayatId: field.panchayatId,
        cropType: field.cropType,
        areaAcres: field.areaAcres,
        harvestReadinessPct: field.harvestReadinessPct,
        estimatedResidueTonnes: field.estimatedResidueTonnes,
        harvestWindow: field.harvestWindow,
        status: field.status,
        color,
        center: [field.centerLat, field.centerLng] as [number, number],
        coordinates: JSON.parse(field.polygonCoordinatesJson),
      };
    });

    return res.json({ success: true, features });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/fields - Farmer or Panchayat registers new agricultural field polygon
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      farmerId: bodyFarmerId,
      surveyNumber,
      cropType = 'Paddy',
      polygonCoordinates,
      villageId,
      panchayatId,
    } = req.body;

    const farmerId = bodyFarmerId || req.user?.farmerId;
    if (!farmerId) {
      return res.status(400).json({ success: false, message: 'Farmer ID required' });
    }

    if (!polygonCoordinates || !Array.isArray(polygonCoordinates) || polygonCoordinates.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Valid GeoJSON polygon coordinates (at least 3 vertices) required',
      });
    }

    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      include: { village: true, panchayat: true },
    });

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    // Compute center and area
    const lats = polygonCoordinates.map((c: any) => c[0]);
    const lngs = polygonCoordinates.map((c: any) => c[1]);
    const centerLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;
    const areaAcres = calculatePolygonAreaAcres(polygonCoordinates);

    const count = await prisma.agriculturalField.count();
    const fieldCode = `KA-DVG-${String(count + 130).padStart(3, '0')}`;

    // Initial estimation formula
    const residueRatio = cropType === 'Paddy' ? 1.5 : cropType === 'Maize' ? 1.8 : 0.2;
    const yieldAcre = cropType === 'Paddy' ? 2.5 : cropType === 'Maize' ? 3.0 : 35.0;
    const initialResidue = parseFloat((areaAcres * yieldAcre * residueRatio).toFixed(2));

    const field = await prisma.agriculturalField.create({
      data: {
        fieldCode,
        farmerId: farmer.id,
        villageId: villageId || farmer.villageId,
        panchayatId: panchayatId || farmer.panchayatId,
        surveyNumber: surveyNumber || `SY-${Math.floor(100 + Math.random() * 900)}/${Math.floor(1 + Math.random() * 5)}`,
        cropType,
        areaAcres,
        status: 'GROWING',
        harvestReadinessPct: 45.0,
        estimatedResidueTonnes: initialResidue,
        harvestWindow: 'In 20+ Days',
        centerLat,
        centerLng,
        polygonCoordinatesJson: JSON.stringify(polygonCoordinates),
      },
      include: {
        farmer: true,
        village: true,
        panchayat: true,
      },
    });

    // Asynchronously trigger live Copernicus Sentinel-2 STAC analysis
    try {
      const coordObjects = polygonCoordinates.map((c: any) => ({ lat: c[0], lng: c[1] }));
      const aiRes = await fetch(`${AI_SERVICE_URL}/api/satellite/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_id: field.fieldCode,
          crop_type: cropType,
          area_acres: areaAcres,
          coordinates: coordObjects,
          center_lat: centerLat,
          center_lng: centerLng,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (aiRes.ok) {
        const aiData = (await aiRes.json()) as any;
        await prisma.agriculturalField.update({
          where: { id: field.id },
          data: {
            harvestReadinessPct: aiData.harvest_readiness_percentage,
            status: aiData.status,
            estimatedResidueTonnes: aiData.estimated_residue_tonnes,
            harvestWindow: aiData.suggested_harvest_window,
          },
        });

        // Save real satellite observation
        await prisma.satelliteObservation.create({
          data: {
            fieldId: field.id,
            satelliteSource: aiData.data_source || 'Copernicus Sentinel-2 MSI L2A',
            acquisitionDate: new Date(aiData.acquisition_date),
            ndvi: aiData.current_ndvi,
            ndwi: aiData.current_ndwi || 0.18,
            evi: aiData.current_evi,
            cloudCoverPct: aiData.cloud_coverage_pct || 0.0,
            rawDataJson: JSON.stringify(aiData),
          },
        });
      }
    } catch (_err) {
      console.warn('Initial satellite analysis call bypassed on creation');
    }

    return res.status(201).json({
      success: true,
      message: 'Agricultural field registered with real GeoJSON boundary coordinates',
      field: {
        ...field,
        polygonCoordinates,
      },
    });
  } catch (error: any) {
    console.error('Field registration error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/fields/:id/satellite-refresh - Trigger live remote sensing analysis for a field
router.post('/:id/satellite-refresh', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const field = await prisma.agriculturalField.findUnique({
      where: { id },
      include: { farmer: true, village: true, panchayat: true },
    });

    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    const coords: [number, number][] = JSON.parse(field.polygonCoordinatesJson);
    const coordObjects = coords.map((c) => ({ lat: c[0], lng: c[1] }));

    let analysis: any = null;
    try {
      const pyRes = await fetch(`${AI_SERVICE_URL}/api/satellite/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_id: field.fieldCode,
          crop_type: field.cropType,
          area_acres: field.areaAcres,
          coordinates: coordObjects,
          center_lat: field.centerLat,
          center_lng: field.centerLng,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (pyRes.ok) {
        analysis = await pyRes.json();
      }
    } catch (err: any) {
      console.warn('Satellite AI service error:', err.message);
    }

    if (!analysis) {
      return res.status(502).json({
        success: false,
        message: 'Could not contact Copernicus Sentinel-2 processing service. Please check AI microservice.',
      });
    }

    // Save observation in database
    await prisma.satelliteObservation.create({
      data: {
        fieldId: field.id,
        satelliteSource: analysis.data_source,
        acquisitionDate: new Date(analysis.acquisition_date),
        ndvi: analysis.current_ndvi,
        ndwi: analysis.current_ndwi,
        evi: analysis.current_evi,
        cloudCoverPct: analysis.cloud_coverage_pct,
        rawDataJson: JSON.stringify(analysis),
      },
    });

    // Update field model metrics
    const updated = await prisma.agriculturalField.update({
      where: { id: field.id },
      data: {
        harvestReadinessPct: analysis.harvest_readiness_percentage,
        status: analysis.status,
        estimatedResidueTonnes: analysis.estimated_residue_tonnes,
        harvestWindow: analysis.suggested_harvest_window,
      },
      include: {
        farmer: true,
        village: true,
        panchayat: true,
      },
    });

    return res.json({
      success: true,
      message: 'Field updated with latest Sentinel-2 observation',
      analysis,
      field: {
        ...updated,
        polygonCoordinates: coords,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/fields/:id - Field details with satellite observations
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const field = await prisma.agriculturalField.findUnique({
      where: { id },
      include: {
        farmer: {
          include: {
            wallet: true,
            biometricEnrollment: {
              select: { status: true, qualityScore: true, consentTimestamp: true },
            },
          },
        },
        village: true,
        panchayat: {
          include: { collectionCenters: true },
        },
        satelliteObservations: {
          orderBy: { acquisitionDate: 'desc' },
          take: 10,
        },
        harvestPredictions: {
          orderBy: { predictionDate: 'desc' },
          take: 5,
        },
        feedstockRequests: {
          orderBy: { createdAt: 'desc' },
          include: { company: true },
        },
      },
    });

    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    return res.json({
      success: true,
      field: {
        ...field,
        polygonCoordinates: JSON.parse(field.polygonCoordinatesJson),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/fields/:id/status
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const updated = await prisma.agriculturalField.update({
      where: { id },
      data: { status },
    });

    return res.json({ success: true, field: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
