import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FieldMap } from '../../components/map/FieldMap';
import { fieldsApi } from '../../services/api';
import { MapFeature } from '../../types';
import { RefreshCw, Satellite, ShieldCheck, Info } from 'lucide-react';

export const CompanyLiveMap: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fieldIdParam = searchParams.get('fieldId');

  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const data = await fieldsApi.getMapFeatures();
      if (data.success) {
        setFeatures(data.features);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [refreshKey]);

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        <div>
          <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Satellite className="w-5 h-5 text-emerald-700" />
            Live Agricultural Field Radar • Karnataka Basin
          </h2>
          <p className="text-xs text-slate-500">
            MapMyCrop Precision Agriculture & Copernicus Sentinel-2 Multi-Spectral Telemetry (NDVI, NDWI, EVI) & Feedstock Discovery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Radar
          </button>
          <span className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300">
            {features.length} Parcels Mapped
          </span>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="flex-1 w-full relative rounded-2xl overflow-hidden shadow-md">
        {loading && features.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-2" />
              <p className="text-xs text-slate-400">Loading Sentinel-2 multispectral coordinates...</p>
            </div>
          </div>
        ) : (
          <FieldMap
            features={features}
            selectedFieldId={fieldIdParam}
            allowBulkSelection={true}
            onRequestCreated={fetchFeatures}
          />
        )}
      </div>
    </div>
  );
};
