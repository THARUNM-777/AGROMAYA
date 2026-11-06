import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Search,
  Filter,
  CheckSquare,
  Sparkles,
  Send,
  X,
  Info,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  Wheat,
  PenTool,
  Warehouse,
  Check,
  Undo2,
  Trash2,
  Radar,
  Satellite,
  Activity,
  Droplets,
  Leaf,
  Globe,
  Key,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { MapFeature, PanchayatCollectionCenter } from '../../types';
import { requestsApi, fieldsApi, satelliteApi } from '../../services/api';

interface FieldMapProps {
  features: MapFeature[];
  onSelectField?: (field: MapFeature) => void;
  onRequestCreated?: () => void;
  selectedFieldId?: string | null;
  allowBulkSelection?: boolean;
  isDrawingMode?: boolean;
  onPolygonCreated?: (coords: [number, number][], areaAcres: number) => void;
}

// Map Controller for programmatically flying to coordinates
const MapController: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Map click listener for drawing mode
const DrawListener: React.FC<{
  isDrawing: boolean;
  onAddPoint: (point: [number, number]) => void;
}> = ({ isDrawing, onAddPoint }) => {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};

// Custom Leaflet Icons
const warehouseIcon = L.divIcon({
  className: 'custom-warehouse-marker',
  html: `
    <div style="background:#0F172A;color:#10B981;border:2px solid #10B981;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.4);font-size:16px;">
      🏭
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const drawVertexIcon = L.divIcon({
  className: 'custom-vertex-marker',
  html: `
    <div style="background:#EF4444;border:2px solid white;border-radius:50%;width:12px;height:12px;box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// Helper to compute polygon area in acres from lat/lng vertices
function calculatePolygonArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  let areaM2 = 0;
  const len = coords.length;
  for (let i = 0; i < len; i++) {
    const j = (i + 1) % len;
    const lat1 = (coords[i][0] * Math.PI) / 180;
    const lat2 = (coords[j][0] * Math.PI) / 180;
    const lon1 = (coords[i][1] * Math.PI) / 180;
    const lon2 = (coords[j][1] * Math.PI) / 180;
    areaM2 += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  areaM2 = Math.abs((areaM2 * 6378137 * 6378137) / 4);
  return parseFloat((areaM2 / 4046.86).toFixed(2));
}

// Distance helper
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// MapMyCrop / Sentinel-2 Temporal Overpass Schedule
const OVERPASS_DATES = [
  { id: 0, date: '2026-09-01', stage: 'Tillering & Vegetative Canopy', ndvi: 0.42, ndwi: 0.28, evi: 0.35, cloud: 3.2 },
  { id: 1, date: '2026-09-20', stage: 'Heading & Panicle Initiation', ndvi: 0.72, ndwi: 0.42, evi: 0.62, cloud: 2.1 },
  { id: 2, date: '2026-10-10', stage: 'Peak Flowering & Grain Filling', ndvi: 0.82, ndwi: 0.48, evi: 0.71, cloud: 4.8 },
  { id: 3, date: '2026-10-25', stage: 'Canopy Senescence & Ripening', ndvi: 0.54, ndwi: 0.25, evi: 0.45, cloud: 2.5 },
  { id: 4, date: '2026-11-06', stage: 'Maturity / Harvest Ready', ndvi: 0.36, ndwi: 0.14, evi: 0.31, cloud: 1.4 },
];

export const FieldMap: React.FC<FieldMapProps> = ({
  features,
  onSelectField,
  onRequestCreated,
  selectedFieldId,
  allowBulkSelection = true,
  isDrawingMode: externalDrawingMode,
  onPolygonCreated,
}) => {
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cropFilter, setCropFilter] = useState<string>('ALL');
  const [selectedField, setSelectedField] = useState<MapFeature | null>(null);

  // MapMyCrop API Connector State
  const [mmcModalOpen, setMmcModalOpen] = useState(false);
  const [mmcStatus, setMmcStatus] = useState<{
    status: string;
    auth_valid: boolean;
    message: string;
    active_pipeline?: string;
    customer_id?: string;
    plan?: string;
    quota_remaining?: string;
    supported_indices?: string[];
    supported_features?: string[];
  }>({
    status: 'UNCONFIGURED',
    auth_valid: false,
    message: 'Loading...',
    active_pipeline: 'Copernicus Sentinel-2 Level-2A STAC',
  });
  const [mmcApiKey, setMmcApiKey] = useState('mmc_live_agromaya2026');
  const [mmcCustomerId, setMmcCustomerId] = useState('MMC-AGROMAYA-ENTERPRISE');
  const [mmcEndpoint, setMmcEndpoint] = useState('https://api.mapmycrop.com/v1');
  const [mmcLoading, setMmcLoading] = useState(false);
  const [mmcSuccessMsg, setMmcSuccessMsg] = useState('');
  const [mmcErrorMsg, setMmcErrorMsg] = useState('');

  // MapMyCrop Spectral Index Switcher
  const [activeSpectralIndex, setActiveSpectralIndex] = useState<'NDVI' | 'NDWI' | 'EVI' | 'RGB'>('NDVI');

  // MapMyCrop Temporal Historical Satellite Timeline
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number>(4);
  const [showTimelineBar, setShowTimelineBar] = useState<boolean>(true);

  // MapMyCrop Field Intelligence Dossier Modal
  const [inspectField, setInspectField] = useState<MapFeature | null>(null);
  const [showInspectModal, setShowInspectModal] = useState<boolean>(false);

  // Collection Centers
  const [collectionCenters, setCollectionCenters] = useState<PanchayatCollectionCenter[]>([]);
  const [showCenters, setShowCenters] = useState(true);

  // Load MapMyCrop status on mount
  useEffect(() => {
    satelliteApi
      .getMapMyCropStatus()
      .then((data) => {
        if (data.success) {
          setMmcStatus(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleConnectMapMyCrop = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMmcLoading(true);
    setMmcErrorMsg('');
    setMmcSuccessMsg('');
    try {
      const res = await satelliteApi.configureMapMyCrop(mmcApiKey, mmcCustomerId, mmcEndpoint);
      if (res.success) {
        setMmcStatus(res);
        setMmcSuccessMsg('MapMyCrop API successfully authenticated! 10m multi-spectral indices synced.');
        setTimeout(() => {
          setMmcModalOpen(false);
          setMmcSuccessMsg('');
        }, 1500);
      } else {
        setMmcErrorMsg(res.message || 'Authentication failed');
      }
    } catch (err: any) {
      setMmcErrorMsg(err.response?.data?.message || err.message || 'Failed to authenticate MapMyCrop API');
    } finally {
      setMmcLoading(false);
    }
  };

  const handleDisconnectMapMyCrop = async () => {
    setMmcLoading(true);
    try {
      const res = await satelliteApi.disconnectMapMyCrop();
      setMmcStatus(res);
      setMmcApiKey('mmc_live_agromaya2026');
      setMmcModalOpen(false);
    } catch (err: any) {
      alert('Failed to disconnect MapMyCrop');
    } finally {
      setMmcLoading(false);
    }
  };

  // Helper to compute spectral values and colors based on active timeline pass & index
  const getFeatureSpectralDisplay = (feature: MapFeature) => {
    const pass = OVERPASS_DATES[selectedTimelineIndex];
    let ndviVal = pass.ndvi;
    let ndwiVal = pass.ndwi;
    let eviVal = pass.evi;

    if (feature.status === 'GROWING') {
      ndviVal = Math.min(0.85, ndviVal + 0.16);
      ndwiVal = Math.min(0.55, ndwiVal + 0.12);
      eviVal = Math.min(0.75, eviVal + 0.14);
    } else if (feature.status === 'HARVEST_APPROACHING') {
      ndviVal = Math.min(0.70, ndviVal + 0.08);
      ndwiVal = Math.min(0.38, ndwiVal + 0.07);
    }

    let fillColor = feature.color;
    let strokeColor = feature.color;
    let badgeText = '';

    if (activeSpectralIndex === 'NDVI') {
      badgeText = `NDVI ${ndviVal.toFixed(2)}`;
      if (ndviVal < 0.42) {
        fillColor = '#F59E0B'; // Amber - Senesced / Harvest Ready
        strokeColor = '#D97706';
      } else if (ndviVal < 0.65) {
        fillColor = '#22C55E'; // Bright Green
        strokeColor = '#16A34A';
      } else {
        fillColor = '#15803D'; // Lush Dark Green
        strokeColor = '#166534';
      }
    } else if (activeSpectralIndex === 'NDWI') {
      badgeText = `NDWI ${ndwiVal.toFixed(2)}`;
      if (ndwiVal < 0.18) {
        fillColor = '#EAB308'; // Straw / Dry Biomass (<14% moisture)
        strokeColor = '#CA8A04';
      } else if (ndwiVal < 0.32) {
        fillColor = '#06B6D4'; // Cyan - Moderate moisture
        strokeColor = '#0891B2';
      } else {
        fillColor = '#0284C7'; // Deep Blue - High moisture
        strokeColor = '#0369A1';
      }
    } else if (activeSpectralIndex === 'EVI') {
      badgeText = `EVI ${eviVal.toFixed(2)}`;
      fillColor = '#059669';
      strokeColor = '#047857';
    } else {
      badgeText = 'RGB Optical';
      fillColor = feature.status === 'HARVEST_READY' ? '#D97706' : '#15803D';
      strokeColor = '#FFFFFF';
    }

    return { ndviVal, ndwiVal, eviVal, fillColor, strokeColor, badgeText };
  };

  // Bulk Selection State (Method 2)
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRewardRate, setBulkRewardRate] = useState(2.0);
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Direct Request Modal State (Method 1)
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [directField, setDirectField] = useState<MapFeature | null>(null);
  const [directRewardRate, setDirectRewardRate] = useState(2.0);
  const [directNotes, setDirectNotes] = useState('');
  const [directSubmitting, setDirectSubmitting] = useState(false);
  const [directSuccessMsg, setDirectSuccessMsg] = useState('');

  // Farm Boundary Drawing Tool State
  const [internalDrawingMode, setInternalDrawingMode] = useState(false);
  const isDrawingMode = externalDrawingMode !== undefined ? externalDrawingMode : internalDrawingMode;
  const setIsDrawingMode = (val: boolean) => setInternalDrawingMode(val);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [showSaveDrawModal, setShowSaveDrawModal] = useState(false);
  const [drawSurveyNo, setDrawSurveyNo] = useState('');
  const [drawCropType, setDrawCropType] = useState('Paddy');
  const [drawSaving, setDrawSaving] = useState(false);

  // Live Satellite Refresh State
  const [refreshingFieldId, setRefreshingFieldId] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([14.485, 75.835]);

  // Load collection centers on mount
  useEffect(() => {
    fieldsApi
      .getCollectionCenters(mapCenter[0], mapCenter[1])
      .then((res) => {
        if (res.success) setCollectionCenters(res.centers);
      })
      .catch(console.error);
  }, []);

  // Synchronize with external selectedFieldId
  useEffect(() => {
    if (selectedFieldId) {
      const match = features.find((f) => f.id === selectedFieldId);
      if (match) {
        setSelectedField(match);
        setMapCenter(match.center);
      }
    }
  }, [selectedFieldId, features]);

  // Filtering features
  const filteredFeatures = features.filter((f) => {
    const matchesSearch =
      searchQuery === '' ||
      f.fieldCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.village.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchesCrop = cropFilter === 'ALL' || f.cropType === cropFilter;

    return matchesSearch && matchesStatus && matchesCrop;
  });

  // Calculate Bulk Selection Metrics
  const bulkSelectedFeatures = features.filter((f) => bulkSelectedIds.includes(f.id));
  const bulkMetrics = {
    count: bulkSelectedFeatures.length,
    acres: bulkSelectedFeatures.reduce((acc, f) => acc + f.areaAcres, 0).toFixed(1),
    tonnes: bulkSelectedFeatures.reduce((acc, f) => acc + f.estimatedResidueTonnes, 0).toFixed(1),
    farmers: new Set(bulkSelectedFeatures.map((f) => f.farmerName)).size,
    villages: Array.from(new Set(bulkSelectedFeatures.map((f) => f.village))),
  };

  const handlePolygonClick = (feature: MapFeature) => {
    if (isDrawingMode) return;
    if (isBulkMode) {
      setBulkSelectedIds((prev) =>
        prev.includes(feature.id) ? prev.filter((id) => id !== feature.id) : [...prev, feature.id]
      );
    } else {
      setSelectedField(feature);
      if (onSelectField) onSelectField(feature);
    }
  };

  const handleSelectAllHarvestReady = () => {
    const harvestReadyIds = filteredFeatures
      .filter((f) => f.status === 'HARVEST_READY')
      .map((f) => f.id);
    setBulkSelectedIds(harvestReadyIds);
  };

  const handleSendDirectRequest = async () => {
    if (!directField) return;
    setDirectSubmitting(true);
    try {
      await requestsApi.createDirectRequest({
        fieldId: directField.id,
        offeredRewardPerKg: directRewardRate,
        notes: directNotes,
      });
      setDirectSuccessMsg(`Collection request successfully dispatched to ${directField.farmerName}!`);
      setTimeout(() => {
        setShowDirectModal(false);
        setDirectSuccessMsg('');
        if (onRequestCreated) onRequestCreated();
      }, 1800);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch request');
    } finally {
      setDirectSubmitting(false);
    }
  };

  const handleSendBulkRequest = async () => {
    if (bulkSelectedIds.length === 0) return;
    setBulkSubmitting(true);
    try {
      await requestsApi.createBulkRequest({
        fieldIds: bulkSelectedIds,
        offeredRewardPerKg: bulkRewardRate,
        notes: bulkNotes,
      });
      setBulkSuccessMsg(`Procurement cluster (${bulkMetrics.tonnes} Tonnes) submitted to Gram Panchayat!`);
      setTimeout(() => {
        setShowBulkModal(false);
        setIsBulkMode(false);
        setBulkSelectedIds([]);
        setBulkSuccessMsg('');
        if (onRequestCreated) onRequestCreated();
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Bulk request creation failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleSaveDrawnField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (drawPoints.length < 3) return;
    setDrawSaving(true);
    try {
      const demoFarmerId = features[0]?.farmerId;
      await fieldsApi.createField({
        farmerId: demoFarmerId,
        surveyNumber: drawSurveyNo || `SY-${Math.floor(100 + Math.random() * 900)}`,
        cropType: drawCropType,
        polygonCoordinates: drawPoints,
      });
      alert('Farm boundary saved and linked to Copernicus Sentinel-2 remote sensing!');
      setShowSaveDrawModal(false);
      setIsDrawingMode(false);
      setDrawPoints([]);
      if (onRequestCreated) onRequestCreated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register drawn field');
    } finally {
      setDrawSaving(false);
    }
  };

  const handleRefreshSentinel2 = async (fieldId: string) => {
    setRefreshingFieldId(fieldId);
    try {
      const res = await fieldsApi.refreshSatellite(fieldId);
      if (res.success) {
        alert(`Sentinel-2 Satellite Telemetry Refreshed!\nAcquisition Date: ${res.analysis.acquisition_date}\nNDVI: ${res.analysis.current_ndvi}\nNDWI: ${res.analysis.current_ndwi}\nStatus: ${res.analysis.status}`);
        if (onRequestCreated) onRequestCreated();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Satellite refresh request failed');
    } finally {
      setRefreshingFieldId(null);
    }
  };

  const drawnAcres = calculatePolygonArea(drawPoints);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search field ID, farmer, village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 w-48 sm:w-60"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 bg-transparent border-none outline-none font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="HARVEST_READY">Harvest Ready</option>
              <option value="HARVEST_APPROACHING">Approaching</option>
              <option value="GROWING">Growing</option>
              <option value="COLLECTED">Collected</option>
            </select>

            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="px-2 py-1 bg-transparent border-none outline-none font-medium text-slate-700 border-l border-slate-200"
            >
              <option value="ALL">All Crops</option>
              <option value="Paddy">Paddy</option>
              <option value="Maize">Maize</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Cotton">Cotton</option>
            </select>
          </div>
        </div>

        {/* Right Controls: Mode Toggle & Bulk Discovery Switch */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Farm Boundary Drawing Button */}
          <button
            onClick={() => {
              setIsDrawingMode(!isDrawingMode);
              if (isDrawingMode) setDrawPoints([]);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${
              isDrawingMode
                ? 'bg-red-600 text-white ring-2 ring-red-300'
                : 'bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            {isDrawingMode ? 'Cancel Drawing' : 'Draw Farm Boundary'}
          </button>

          {/* Toggle Collection Centers */}
          <button
            onClick={() => setShowCenters(!showCenters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              showCenters
                ? 'bg-emerald-800 text-white'
                : 'bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            Collection Hubs ({collectionCenters.length})
          </button>

          {/* MapMyCrop Enterprise API Connector */}
          <button
            onClick={() => setMmcModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${
              mmcStatus.status === 'CONNECTED'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white ring-1 ring-indigo-400'
            }`}
            title="Authenticate & Connect MapMyCrop Precision Ag API"
          >
            <Satellite className="w-4 h-4 text-white" />
            <span>{mmcStatus.status === 'CONNECTED' ? 'MapMyCrop Live' : 'MapMyCrop API'}</span>
            {mmcStatus.status === 'CONNECTED' && (
              <span className="w-2 h-2 rounded-full bg-lime-300 animate-pulse ml-0.5" />
            )}
          </button>

          {allowBulkSelection && (
            <button
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                if (isBulkMode) setBulkSelectedIds([]);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
                isBulkMode
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-amber-500/20'
                  : 'bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              {isBulkMode ? `Bulk Discovery (${bulkSelectedIds.length})` : 'Bulk Discovery'}
            </button>
          )}

          {/* Satellite vs Street Map Switcher */}
          <div className="flex bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200">
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                mapType === 'satellite'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                mapType === 'roadmap'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
          </div>
        </div>
      </div>

      {/* MapMyCrop Multi-Spectral Layer Switcher */}
      <div className="absolute top-18 left-4 z-[400] flex flex-wrap items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-slate-700/80 pointer-events-auto">
        <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-400" /> Layer:
        </span>
        <button
          onClick={() => setActiveSpectralIndex('NDVI')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            activeSpectralIndex === 'NDVI'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold ring-1 ring-emerald-300'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Normalized Difference Vegetation Index - Plant Vigour & Senescence"
        >
          <Leaf className="w-3.5 h-3.5" />
          NDVI (Canopy)
        </button>
        <button
          onClick={() => setActiveSpectralIndex('NDWI')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            activeSpectralIndex === 'NDWI'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold ring-1 ring-cyan-300'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Normalized Difference Water Index - Canopy Moisture & Residue Dryness"
        >
          <Droplets className="w-3.5 h-3.5" />
          NDWI (Moisture)
        </button>
        <button
          onClick={() => setActiveSpectralIndex('EVI')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            activeSpectralIndex === 'EVI'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold ring-1 ring-amber-300'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Enhanced Vegetation Index - Dense Biomass Density"
        >
          <Wheat className="w-3.5 h-3.5" />
          EVI
        </button>
        <button
          onClick={() => setActiveSpectralIndex('RGB')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            activeSpectralIndex === 'RGB'
              ? 'bg-blue-500 text-white shadow-md font-extrabold ring-1 ring-blue-300'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Natural RGB True Color Satellite Image"
        >
          <Globe className="w-3.5 h-3.5" />
          RGB
        </button>

        {/* Timeline Toggle Pill */}
        <button
          onClick={() => setShowTimelineBar(!showTimelineBar)}
          className={`px-2 py-1 rounded-xl text-[11px] font-semibold border ml-1 transition-all flex items-center gap-1 ${
            showTimelineBar
              ? 'bg-slate-800 text-slate-200 border-slate-600'
              : 'text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle Satellite Overpass Timeline"
        >
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Timeline</span>
        </button>
      </div>

      {/* MapMyCrop Spectral Legend */}
      <div className="absolute bottom-6 left-4 z-[400] bg-slate-950/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 text-white text-[11px] shadow-2xl pointer-events-auto hidden md:block max-w-[220px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5">
          <span className="font-bold text-slate-200 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {activeSpectralIndex === 'NDVI' && 'NDVI Plant Health'}
            {activeSpectralIndex === 'NDWI' && 'NDWI Moisture Stress'}
            {activeSpectralIndex === 'EVI' && 'EVI Biomass Density'}
            {activeSpectralIndex === 'RGB' && 'Natural RGB Imagery'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">10m Res</span>
        </div>

        {activeSpectralIndex === 'NDVI' && (
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#15803D]" />
              <span className="text-slate-300">&gt; 0.65 Lush Canopy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#22C55E]" />
              <span className="text-slate-300">0.45 - 0.65 Vegetative</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#F59E0B]" />
              <span className="text-amber-400 font-bold">&lt; 0.42 Senesced / Harvest Ready</span>
            </div>
          </div>
        )}

        {activeSpectralIndex === 'NDWI' && (
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#0284C7]" />
              <span className="text-slate-300">&gt; 0.32 High Water Content</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#06B6D4]" />
              <span className="text-slate-300">0.20 - 0.32 Moderate Moisture</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#EAB308]" />
              <span className="text-amber-400 font-bold">&lt; 0.18 Dry Residue (&lt;14% Biochar Grade)</span>
            </div>
          </div>
        )}

        {activeSpectralIndex === 'EVI' && (
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#059669]" />
              <span className="text-slate-300">Dense Structural Biomass</span>
            </div>
          </div>
        )}

        {activeSpectralIndex === 'RGB' && (
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#D97706]" />
              <span className="text-slate-300">Golden Harvest Ground Stubble</span>
            </div>
          </div>
        )}
      </div>

      {/* MapMyCrop Temporal Historical Satellite Timeline */}
      {showTimelineBar && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-11/12 max-w-xl bg-slate-950/95 backdrop-blur-md p-2.5 rounded-2xl shadow-2xl border border-slate-700/80 pointer-events-auto text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-300">
                Satellite Overpass:
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-700/60 px-2 py-0.5 rounded-lg">
                {OVERPASS_DATES[selectedTimelineIndex].date}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                ({OVERPASS_DATES[selectedTimelineIndex].stage})
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {OVERPASS_DATES[selectedTimelineIndex].id === 4 ? '🟢 Current' : '⏮ Historical'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {OVERPASS_DATES.map((item, idx) => {
              const isActive = selectedTimelineIndex === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedTimelineIndex(idx)}
                  className={`flex-1 py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all border text-center ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg scale-102 ring-1 ring-emerald-300'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="block font-bold">{item.date.slice(5)}</span>
                  <span className="text-[9px] block opacity-80 truncate">{item.stage.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Drawing Mode Floating Toolbar */}
      {isDrawingMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/95 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-red-500/40 flex items-center gap-4 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-red-400">Boundary Drawing Active:</span>
            <span>Click map corners to form parcel vertices</span>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-700 pl-3">
            <span className="font-mono font-bold text-white">
              {drawPoints.length} vertices • {drawnAcres} Acres
            </span>

            {drawPoints.length > 0 && (
              <button
                onClick={() => setDrawPoints((prev) => prev.slice(0, -1))}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px]"
              >
                <Undo2 className="w-3.5 h-3.5" /> Undo
              </button>
            )}

            <button
              disabled={drawPoints.length < 3}
              onClick={() => setShowSaveDrawModal(true)}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-lg text-[11px] shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" /> Save Boundary
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map Engine */}
      <div className="w-full h-full flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController center={mapCenter} />
          <DrawListener
            isDrawing={isDrawingMode}
            onAddPoint={(pt) =>
              setDrawPoints((prev) => {
                const next = [...prev, pt];
                if (onPolygonCreated) {
                  onPolygonCreated(next, calculatePolygonArea(next));
                }
                return next;
              })
            }
          />

          {/* High-Resolution Satellite or Standard Map Tiles */}
          {mapType === 'satellite' ? (
            <TileLayer
              attribution='&copy; ESRI World Imagery &copy; Sentinel-2 Copernicus'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          ) : (
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* Render Active Draw Vertices & Polyline */}
          {isDrawingMode && drawPoints.length > 0 && (
            <>
              {drawPoints.map((pt, idx) => (
                <Marker key={idx} position={pt} icon={drawVertexIcon} />
              ))}
              <Polyline positions={drawPoints} pathOptions={{ color: '#EF4444', weight: 3, dashArray: '4, 4' }} />
              {drawPoints.length >= 3 && (
                <Polygon
                  positions={drawPoints}
                  pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.25, weight: 2 }}
                />
              )}
            </>
          )}

          {/* Render Panchayat Collection Centers */}
          {showCenters &&
            collectionCenters.map((center) => (
              <Marker key={center.id} position={[center.latitude, center.longitude]} icon={warehouseIcon}>
                <Popup>
                  <div className="p-2 min-w-[240px] text-slate-800 text-xs space-y-1.5">
                    <div className="border-b pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                        Gram Panchayat Collection Hub
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">{center.centerName}</h4>
                      <p className="text-[11px] text-slate-500">{center.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 py-1 bg-slate-50 p-2 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Max Capacity</span>
                        <span className="font-bold text-slate-900">{center.capacityTonnes} Tonnes</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Stock</span>
                        <span className="font-bold text-emerald-800">{center.currentStockTonnes} Tonnes</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Officer: <span className="font-semibold text-slate-900">{center.contactPerson}</span> (📞{' '}
                      {center.phone})
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Render Field Polygons */}
          {filteredFeatures.map((feature) => {
            const isSelected = selectedField?.id === feature.id;
            const isBulkSelected = bulkSelectedIds.includes(feature.id);
            const spectral = getFeatureSpectralDisplay(feature);

            let strokeColor = spectral.strokeColor;
            let fillColor = spectral.fillColor;
            let fillOpacity = 0.58;
            let weight = 2;

            if (isBulkSelected) {
              strokeColor = '#FFFFFF';
              fillColor = '#F59E0B';
              fillOpacity = 0.85;
              weight = 4;
            } else if (isSelected) {
              strokeColor = '#FFFFFF';
              fillOpacity = 0.85;
              weight = 4;
            }

            // Find nearest collection center distance
            const nearestCenter = collectionCenters[0];
            const distToCenter = nearestCenter
              ? getDistanceKm(feature.center[0], feature.center[1], nearestCenter.latitude, nearestCenter.longitude)
              : null;

            return (
              <Polygon
                key={feature.id}
                positions={feature.coordinates}
                pathOptions={{
                  color: strokeColor,
                  fillColor,
                  fillOpacity,
                  weight,
                }}
                eventHandlers={{
                  click: () => handlePolygonClick(feature),
                }}
              >
                <Tooltip sticky direction="top" className="custom-leaflet-tooltip">
                  <div className="text-xs p-1">
                    <span className="font-bold">{feature.fieldCode}</span> • {feature.cropType} (
                    <span className="font-bold text-amber-400">{spectral.badgeText}</span> •{' '}
                    {feature.harvestReadinessPct}%)
                  </div>
                </Tooltip>

                {!isBulkMode && !isDrawingMode && (
                  <Popup>
                    <div className="p-2 min-w-[270px] text-slate-800">
                      <div className="flex items-center justify-between border-b pb-2 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{feature.fieldCode}</h4>
                          <span className="text-xs text-slate-500">
                            {feature.village} • {feature.panchayat}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            feature.status === 'HARVEST_READY'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : feature.status === 'HARVEST_APPROACHING'
                              ? 'bg-orange-100 text-orange-800'
                              : feature.status === 'COLLECTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {feature.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                        <div className="flex justify-between">
                          <span>Farmer:</span>
                          <span className="font-semibold text-slate-900">{feature.farmerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Crop Type:</span>
                          <span className="font-semibold text-slate-900">{feature.cropType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Acreage:</span>
                          <span className="font-semibold text-slate-900">{feature.areaAcres} Acres</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Telemetry ({OVERPASS_DATES[selectedTimelineIndex].date}):</span>
                          <span className="font-bold text-indigo-700">{spectral.badgeText}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Harvest Readiness:</span>
                          <span className="font-bold text-amber-600">{feature.harvestReadinessPct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Residue Biomass:</span>
                          <span className="font-bold text-emerald-700">
                            {feature.estimatedResidueTonnes} Tonnes
                          </span>
                        </div>
                        {distToCenter !== null && (
                          <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t">
                            <span>To Collection Hub:</span>
                            <span className="font-bold text-slate-800">
                              {distToCenter} km ({nearestCenter?.centerName.slice(0, 16)}...)
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {/* MapMyCrop Field Intelligence Opener */}
                        <button
                          onClick={() => {
                            setInspectField(feature);
                            setShowInspectModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg text-[11px] font-bold shadow-xs transition-all"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          MapMyCrop Agronomic Dossier
                        </button>

                        {/* Live Sentinel-2 Refresh Button */}
                        <button
                          onClick={() => handleRefreshSentinel2(feature.id)}
                          disabled={refreshingFieldId === feature.id}
                          className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                        >
                          <Radar className={`w-3.5 h-3.5 text-lime-400 ${refreshingFieldId === feature.id ? 'animate-spin' : ''}`} />
                          {refreshingFieldId === feature.id ? 'Querying Satellite...' : 'Refresh Multi-Spectral NDVI'}
                        </button>

                        {/* Direct Request Action Button */}
                        {feature.status === 'HARVEST_READY' && (
                          <button
                            onClick={() => {
                              setDirectField(feature);
                              setShowDirectModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-3 rounded-lg text-xs font-semibold shadow-md transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Request Feedstock (Direct)
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                )}
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200 text-xs">
        <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
          <Wheat className="w-3.5 h-3.5 text-emerald-600" />
          Field Harvest Status & Infrastructure
        </h5>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-yellow-400 border border-yellow-500 shadow-sm" />
            <span>Harvest Ready ({features.filter((f) => f.status === 'HARVEST_READY').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-orange-500 border border-orange-600 shadow-sm" />
            <span>Approaching ({features.filter((f) => f.status === 'HARVEST_APPROACHING').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-600 shadow-sm" />
            <span>Collected ({features.filter((f) => f.status === 'COLLECTED').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-slate-400 border border-slate-500 shadow-sm" />
            <span>Growing ({features.filter((f) => f.status === 'GROWING').length})</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 pt-1 border-t">
            <span className="text-xs">🏭</span>
            <span className="font-bold text-slate-800">GP Collection Hub ({collectionCenters.length} APMC Centers)</span>
          </div>
        </div>
      </div>

      {/* Save Drawn Boundary Modal */}
      {showSaveDrawModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveDrawnField}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-base text-slate-900">Register Drawn Farm Boundary</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveDrawModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-1">
              <div className="flex justify-between font-bold">
                <span>Calculated Land Area:</span>
                <span className="text-sm font-black">{drawnAcres} Acres</span>
              </div>
              <div className="text-[11px] text-emerald-800">
                GeoJSON Boundary: {drawPoints.length} GPS Coordinates Verified
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Survey Number / RTC Record</label>
              <input
                type="text"
                placeholder="e.g. SY-142/3A"
                value={drawSurveyNo}
                onChange={(e) => setDrawSurveyNo(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Crop Type</label>
              <select
                value={drawCropType}
                onChange={(e) => setDrawCropType(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Paddy">Paddy (Rice)</option>
                <option value="Maize">Maize (Corn)</option>
                <option value="Sugarcane">Sugarcane</option>
                <option value="Cotton">Cotton</option>
                <option value="Groundnut">Groundnut</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSaveDrawModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={drawSaving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md disabled:opacity-50"
              >
                {drawSaving ? 'Saving...' : 'Confirm Boundary & Sync Satellite'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Method 1: Direct Request Modal */}
      {showDirectModal && directField && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                  <Wheat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Method 1: Direct Collection Offer</h3>
                  <p className="text-xs text-slate-500">Send offer directly to registered landowner</p>
                </div>
              </div>
              <button onClick={() => setShowDirectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {directSuccessMsg ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">Request Dispatched!</h4>
                <p className="text-xs text-slate-600">{directSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Field Code:</span>
                    <span className="font-bold">{directField.fieldCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registered Farmer:</span>
                    <span className="font-bold text-emerald-800">{directField.farmerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Village & Panchayat:</span>
                    <span>
                      {directField.village} • {directField.panchayat}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Residue Volume:</span>
                    <span className="font-bold text-emerald-700">
                      {directField.estimatedResidueTonnes} Tonnes ({directField.cropType} Straw)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Offered Reward Rate (₹ per Kg):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="10.0"
                      value={directRewardRate}
                      onChange={(e) => setDirectRewardRate(parseFloat(e.target.value) || 2.0)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      = ₹{(directField.estimatedResidueTonnes * 1000 * directRewardRate).toLocaleString()} Est. Payout
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Logistics / Pickup Notes:</label>
                  <textarea
                    rows={2}
                    value={directNotes}
                    onChange={(e) => setDirectNotes(e.target.value)}
                    placeholder="e.g., Immediate pickup arranged via Harihara APMC center..."
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowDirectModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={directSubmitting}
                    onClick={handleSendDirectRequest}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition-all"
                  >
                    {directSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Confirm & Send Offer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Method 2: Bulk Discovery Request Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Method 2: Bulk Discovery Procurement</h3>
                  <p className="text-xs text-slate-500">Dispatch request to Gram Panchayat to identify landowners</p>
                </div>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkSuccessMsg ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">Bulk Request Transmitted!</h4>
                <p className="text-xs text-slate-600">{bulkSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-slate-800">
                  <div className="flex justify-between font-semibold">
                    <span>Cluster Harvest Potential:</span>
                    <span className="text-amber-800 font-bold">{bulkMetrics.tonnes} Tonnes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected Fields:</span>
                    <span>
                      {bulkMetrics.count} Fields ({bulkMetrics.acres} Acres)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Landowners / Farmers:</span>
                    <span>{bulkMetrics.farmers} Identified</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Villages:</span>
                    <span className="text-right">{bulkMetrics.villages.join(', ')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Offered Base Reward (₹ per Kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="10.0"
                    value={bulkRewardRate}
                    onChange={(e) => setBulkRewardRate(parseFloat(e.target.value) || 2.0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Procurement Instructions to Panchayat:
                  </label>
                  <textarea
                    rows={2}
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    placeholder="e.g., Company fleet of 3 hydraulic tractor trolleys available for collection..."
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={bulkSubmitting}
                    onClick={handleSendBulkRequest}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 shadow-md transition-all"
                  >
                    {bulkSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Submit to Gram Panchayat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MapMyCrop Precision Agriculture API Connector Modal */}
      {mmcModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Satellite className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">MapMyCrop Precision Ag API</h3>
                    <a
                      href="https://mapmycrop.com/?utm_source=chatgpt.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 transition-all"
                    >
                      mapmycrop.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-500">
                    Satellite remote sensing, farm boundary detection & multi-spectral agronomic intelligence
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMmcModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Pipeline Status Card */}
            <div
              className={`p-4 rounded-2xl border mb-5 transition-all ${
                mmcStatus.status === 'CONNECTED'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      mmcStatus.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-xs font-extrabold uppercase tracking-wide">
                    {mmcStatus.status === 'CONNECTED'
                      ? 'MapMyCrop API Status: CONNECTED (Active)'
                      : 'MapMyCrop Status: UNCONFIGURED (STAC Fallback)'}
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white/80 border text-slate-700 shadow-2xs">
                  {mmcStatus.plan || 'Enterprise Tier'}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-3">{mmcStatus.message}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Active Pipeline</span>
                  <span className="font-bold text-slate-900 truncate block">{mmcStatus.active_pipeline}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-medium">API Quota Remaining</span>
                  <span className="font-bold text-emerald-700 block">{mmcStatus.quota_remaining || '94.8%'}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Telemetry Cadence</span>
                  <span className="font-bold text-indigo-700 block">Daily 10m Multi-Spectral</span>
                </div>
              </div>
            </div>

            {/* Quick Fill Key Helper */}
            <div className="mb-4 flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
              <span className="text-[11px] font-medium">Need instant verified enterprise access for testing?</span>
              <button
                type="button"
                onClick={() => {
                  setMmcApiKey('mmc_live_agromaya2026');
                  setMmcCustomerId('MMC-AGROMAYA-ENTERPRISE');
                  setMmcEndpoint('https://api.mapmycrop.com/v1');
                }}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs transition-all"
              >
                Insert Test Key
              </button>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleConnectMapMyCrop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  MapMyCrop API Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={mmcApiKey}
                    onChange={(e) => setMmcApiKey(e.target.value)}
                    placeholder="e.g. mmc_live_agromaya2026"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Organization ID</label>
                  <input
                    type="text"
                    value={mmcCustomerId}
                    onChange={(e) => setMmcCustomerId(e.target.value)}
                    placeholder="e.g. MMC-AGROMAYA-ENTERPRISE"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">API Endpoint URL</label>
                  <input
                    type="text"
                    value={mmcEndpoint}
                    onChange={(e) => setMmcEndpoint(e.target.value)}
                    placeholder="https://api.mapmycrop.com/v1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {mmcErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{mmcErrorMsg}</span>
                </div>
              )}

              {mmcSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{mmcSuccessMsg}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-3">
                {mmcStatus.status === 'CONNECTED' ? (
                  <button
                    type="button"
                    onClick={handleDisconnectMapMyCrop}
                    disabled={mmcLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
                  >
                    Disconnect MapMyCrop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMmcModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Close
                  </button>
                )}

                <button
                  type="submit"
                  disabled={mmcLoading || !mmcApiKey}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md transition-all disabled:opacity-50"
                >
                  {mmcLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Satellite className="w-4 h-4" />
                  )}
                  {mmcStatus.status === 'CONNECTED' ? 'Re-Verify Connection' : 'Authenticate & Sync API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MapMyCrop Field Intelligence Dossier Modal */}
      {showInspectModal && inspectField && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-lg">{inspectField.fieldCode}</h3>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        inspectField.status === 'HARVEST_READY'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {inspectField.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {inspectField.farmerName} • {inspectField.village}, {inspectField.panchayat}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInspectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Field Telemetry Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold mb-1">
                  <Leaf className="w-4 h-4" /> NDVI Canopy
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {getFeatureSpectralDisplay(inspectField).ndviVal.toFixed(2)}
                </div>
                <span className="text-[10px] text-emerald-800 font-semibold block">
                  {getFeatureSpectralDisplay(inspectField).ndviVal < 0.42 ? 'Maturity / Senesced' : 'Active Growth'}
                </span>
              </div>

              <div className="p-3 bg-cyan-50/70 border border-cyan-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-cyan-700 text-xs font-bold mb-1">
                  <Droplets className="w-4 h-4" /> NDWI Moisture
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {getFeatureSpectralDisplay(inspectField).ndwiVal.toFixed(2)}
                </div>
                <span className="text-[10px] text-cyan-800 font-semibold block">
                  {getFeatureSpectralDisplay(inspectField).ndwiVal < 0.18 ? 'Dry Biomass (<14%)' : 'Moderate Moisture'}
                </span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold mb-1">
                  <Wheat className="w-4 h-4" /> Est. Residue
                </div>
                <div className="text-xl font-extrabold text-slate-900">{inspectField.estimatedResidueTonnes} T</div>
                <span className="text-[10px] text-amber-800 font-semibold block">
                  {inspectField.cropType} Biomass
                </span>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold mb-1">
                  <Clock className="w-4 h-4" /> Harvest Window
                </div>
                <div className="text-sm font-extrabold text-slate-900 pt-1">3 - 5 Days</div>
                <span className="text-[10px] text-indigo-800 font-semibold block">94% Confidence</span>
              </div>
            </div>

            {/* Agronomic Advisory Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-5 text-xs text-slate-700 space-y-1.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> MapMyCrop Biochar Suitability Advisory
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Optical vegetation index NDVI ({getFeatureSpectralDisplay(inspectField).ndviVal.toFixed(2)}) and canopy
                water index NDWI ({getFeatureSpectralDisplay(inspectField).ndwiVal.toFixed(2)}) confirm physiological
                grain maturity. Standing straw moisture is estimated below 14%, eliminating artificial kiln pre-drying
                and making it immediately suitable for zero-emission biochar pyrolysis.
              </p>
            </div>

            {/* Multi-Temporal Satellite Pass Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden mb-5">
              <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Temporal Sentinel-2 Satellite Overpasses
                </span>
                <span className="text-[10px] font-mono text-slate-500">10m Resolution (ESA Copernicus)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {OVERPASS_DATES.map((pass, idx) => (
                  <div
                    key={pass.id}
                    className={`px-4 py-2.5 flex items-center justify-between transition-all ${
                      selectedTimelineIndex === idx ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-slate-900 font-bold block">{pass.date}</span>
                      <span className="text-[11px] text-slate-500">{pass.stage}</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block">NDVI</span>
                        <span className="font-bold text-emerald-700">{pass.ndvi.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">NDWI</span>
                        <span className="font-bold text-cyan-700">{pass.ndwi.toFixed(2)}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          pass.cloud < 3.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {pass.cloud}% cloud
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setShowInspectModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Close
              </button>

              {inspectField.status === 'HARVEST_READY' && (
                <button
                  onClick={() => {
                    setShowInspectModal(false);
                    setDirectField(inspectField);
                    setShowDirectModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Direct Feedstock Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
