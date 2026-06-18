import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useTranslation } from 'react-i18next';
import '../css/mapview.css';

const mapContainerStyle = { width: '100%', height: '100%' };

const REGIONS = [
    { label: 'Mt. Kenya Forest', name: 'Mount Kenya Forest, Kenya', lat: -0.15, lng: 37.30, zoom: 11 },
    { label: 'Aberdare Range', name: 'Aberdare Forest, Kenya', lat: -0.42, lng: 36.68, zoom: 11 },
    { label: 'Thika River Basin', name: 'Thika, Kiambu, Kenya', lat: -1.03, lng: 37.06, zoom: 11 },
    { label: 'Mau Forest Complex', name: 'Mau Forest, Kenya', lat: 0.00, lng: 35.50, zoom: 11 },
    { label: 'Kakamega Forest', name: 'Kakamega Forest, Kenya', lat: 0.27, lng: 34.87, zoom: 11 },
];

const defaultCenter = { lat: -0.50, lng: 37.30 };

const getRiskColor = (score) => {
    if (score < 30) return '#22c55e';
    if (score < 60) return '#f59e0b';
    return '#ef4444';
};

const getRiskLabel = (score) => {
    if (score < 30) return 'Healthy ✅';
    if (score < 60) return 'Warning ⚠️';
    return 'Critical ⛔';
};

const MapView = () => {
    const { t, i18n } = useTranslation();
    const mapRef = useRef(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(11);
    const [markerPin, setMarkerPin] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [customSearch, setCustomSearch] = useState('');
    const [scanLocation, setScanLocation] = useState('');

    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState(null);
    const [aiData, setAiData] = useState(null);
    const [showFires, setShowFires] = useState(false);
    const firesOverlayRef = useRef(null);

    const onLoad = useCallback((map) => {
        mapRef.current = map;
        if (showFires && firesOverlayRef.current) {
            map.overlayMapTypes.push(firesOverlayRef.current);
        }
    }, [showFires]);
    const onUnmount = useCallback(() => { mapRef.current = null; }, []);

    useEffect(() => {
        if (!mapRef.current) return;

        if (showFires) {
            if (!firesOverlayRef.current) {
                // Calculate a 7-day date range ending yesterday (safe for NASA GIBS processing time)
                const end = new Date();
                end.setUTCDate(end.getUTCDate() - 1); // yesterday
                const endYear = end.getUTCFullYear();
                const endMonth = String(end.getUTCMonth() + 1).padStart(2, '0');
                const endDay = String(end.getUTCDate()).padStart(2, '0');
                const endDateStr = `${endYear}-${endMonth}-${endDay}`;

                const start = new Date();
                start.setUTCDate(start.getUTCDate() - 7); 
                const startYear = start.getUTCFullYear();
                const startMonth = String(start.getUTCMonth() + 1).padStart(2, '0');
                const startDay = String(start.getUTCDate()).padStart(2, '0');
                const startDateStr = `${startYear}-${startMonth}-${startDay}`;

                const timeRangeStr = `${startDateStr}/${endDateStr}`;

                firesOverlayRef.current = new window.google.maps.ImageMapType({
                    getTileUrl: (coord, zoom) => {
                        const proj = mapRef.current?.getProjection();
                        if (!proj) return '';

                        const zfactor = Math.pow(2, zoom);
                        
                        const top_left_px = new window.google.maps.Point((coord.x * 256) / zfactor, (coord.y * 256) / zfactor);
                        const bottom_right_px = new window.google.maps.Point(((coord.x + 1) * 256) / zfactor, ((coord.y + 1) * 256) / zfactor);
                        
                        const top_left_ll = proj.fromPointToLatLng(top_left_px);
                        const bottom_right_ll = proj.fromPointToLatLng(bottom_right_px);
                        
                        if (!top_left_ll || !bottom_right_ll) return '';

                        const lngToX = (lng) => (lng * 20037508.34) / 180;
                        const latToY = (lat) => (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180) * 20037508.34) / 180;
                        
                        const minX = lngToX(top_left_ll.lng());
                        const maxX = lngToX(bottom_right_ll.lng());
                        
                        const maxY = latToY(top_left_ll.lat());
                        const minY = latToY(bottom_right_ll.lat());
                        
                        const bbox = `${minX},${minY},${maxX},${maxY}`;
                        
                        return `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?` +
                               `SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&` +
                               `LAYERS=VIIRS_SNPP_Thermal_Anomalies_375m_NRT&` +
                               `STYLES=default&` +
                               `CRS=EPSG:3857&` +
                               `BBOX=${bbox}&` +
                               `WIDTH=256&HEIGHT=256&` +
                               `FORMAT=image/png&` +
                               `TRANSPARENT=TRUE&` +
                               `TIME=${timeRangeStr}`;
                    },
                    tileSize: new window.google.maps.Size(256, 256),
                    opacity: 0.85,
                    name: 'ActiveFires'
                });
            }
            
            
            const arr = mapRef.current.overlayMapTypes.getArray() || [];
            if (!arr.includes(firesOverlayRef.current)) {
                mapRef.current.overlayMapTypes.push(firesOverlayRef.current);
            }
        } else {
            if (firesOverlayRef.current) {
                const index = mapRef.current.overlayMapTypes.indexOf(firesOverlayRef.current);
                if (index !== -1) {
                    mapRef.current.overlayMapTypes.removeAt(index);
                }
            }
        }
    }, [showFires]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const lat = parseFloat(params.get('lat'));
        const lng = parseFloat(params.get('lng'));
        const name = params.get('name');
        if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter({ lat, lng });
            setMarkerPin({ lat, lng });
            setMapZoom(16);
            if (name) {
                setScanLocation(name);
            } else {
                setScanLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
        }
    }, []);

    const handleMapClick = (evt) => {
        if (evt.latLng) {
            const lat = evt.latLng.lat();
            const lng = evt.latLng.lng();
            setMarkerPin({ lat, lng });
            setMapCenter({ lat, lng });
            setMapZoom(16);
            setScanLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            setSelectedRegion(null);
            setAiData(null);
            setScanError(null);
        }
    };

    const handleRegionSelect = (e) => {
        const region = REGIONS.find(r => r.name === e.target.value);
        if (!region) return;
        setSelectedRegion(region);
        setMapCenter({ lat: region.lat, lng: region.lng });
        setMapZoom(region.zoom);
        setMarkerPin({ lat: region.lat, lng: region.lng });
        setScanLocation(region.name);
        setAiData(null);
        setScanError(null);
    };

    const handleSearch = async () => {
        if (!customSearch.trim()) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(customSearch)}&format=json&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setMapCenter({ lat, lng });
                setMapZoom(12);
                setMarkerPin({ lat, lng });
                setScanLocation(customSearch);
                setAiData(null);
                setScanError(null);
            }
        } catch (err) {
            console.error('Search error:', err);
        }
    };

    const runAiScan = async () => {
        if (!scanLocation) return;
        setIsScanning(true);
        setAiData(null);
        setScanError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
            const zoom = 16; // Force zoom 16 to show a detailed small area in the scan results

            const params = new URLSearchParams({
                location: scanLocation,
                zoom: zoom,
                google_api_key: apiKey,
            });

            const res = await fetch(`${apiUrl}/analyze?${params.toString()}`);
            const data = await res.json();

            if (!res.ok || data.detail) {
                setScanError(data.detail || 'Scan failed. Check the backend.');
                return;
            }

            // Save scan results to Express backend if logged in
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const authApi = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000';
                    const saveRes = await fetch(`${authApi}/api/scans`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({
                            locationName: scanLocation,
                            coordinates: markerPin || defaultCenter,
                            deforestationRiskScore: data.deforestation_risk_score || 0,
                            forestCoveragePct: data.forest_coverage_pct ?? data.forest_area_pct ?? 0,
                            deforestedPct: data.deforested_pct ?? data.deforested_area_pct ?? 0,
                            totalDetections: data.total_detections || 0,
                            classCounts: data.class_counts || {},
                            carbon: data.carbon || null,
                            suitability: data.suitability || null,
                            annotatedImage: data.annotated_image || ""
                        })
                    });

                    const saveData = await saveRes.json();
                    if (!saveRes.ok) {
                        setScanError(saveData.error || 'Failed to save scan to database.');
                        return;
                    }

                    // Update local storage user credits
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    if (saveData.user) {
                        currentUser.credits = saveData.user.credits;
                        currentUser.totalCreditsEarned = saveData.user.totalCreditsEarned;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }
                } catch (saveErr) {
                    console.error('Failed to save scan:', saveErr);
                }
            }

            setAiData(data);
        } catch (err) {
            setScanError('Cannot reach the AI backend. Is it running on port 8000?');
            console.error(err);
        } finally {
            setIsScanning(false);
        }
    };

    const resetScan = () => {
        setAiData(null);
        setScanError(null);
    };

    const changeLanguage = (e) => i18n.changeLanguage(e.target.value);

    return (
        <div className="map-page-container">
            {}
            <div className="map-navbar">
                <Link to="/" className="map-logo">
                    <span>MITI</span><span>TRACK</span>
                </Link>
                <div className="map-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link to="/">{t('nav.home')}</Link>
                    <Link to="/dashboard">{t('nav.dashboard')}</Link>
                    <select
                        className="lang-select"
                        onChange={changeLanguage}
                        defaultValue={i18n.language}
                        style={{ marginLeft: '10px', border: 'none', background: 'transparent', color: '#ccc', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                    >
                        <option value="en">ENGLISH</option>
                        <option value="es">ESPAÑOL</option>
                        <option value="fr">FRANÇAIS</option>
                        <option value="sw">KISWAHILI</option>
                        <option value="de">DEUTSCH</option>
                    </select>
                    {localStorage.getItem('token') ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '15px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fff' }}>
                                {JSON.parse(localStorage.getItem('user') || '{}')?.firstName}
                            </span>
                            <button 
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    window.location.reload();
                                }}
                                style={{ 
                                    padding: '5px 12px', 
                                    fontSize: '0.75rem', 
                                    background: 'transparent', 
                                    border: '1px solid #fff', 
                                    borderRadius: '20px', 
                                    color: '#fff', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link 
                            to="/login" 
                            style={{ 
                                padding: '5px 12px', 
                                fontSize: '0.75rem', 
                                background: '#fff', 
                                borderRadius: '20px', 
                                color: '#111', 
                                fontWeight: 'bold',
                                textDecoration: 'none',
                                marginLeft: '15px'
                            }}
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>

            {}
            <div className="map-wrapper">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={mapZoom}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onClick={handleMapClick}
                        options={{
                            mapTypeId: 'satellite',
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                            disableDefaultUI: false,
                        }}
                    >
                        {markerPin && (
                            <MarkerF position={{ lat: markerPin.lat, lng: markerPin.lng }} />
                        )}
                    </GoogleMap>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'white' }}>
                        Loading Google Maps...
                    </div>
                )}

                {}
                <div className="map-control-panel">
                    <h3>{t('map.title')}</h3>
                    <p className="panel-desc">{t('map.desc')}</p>

                    {}
                    <div className="search-bar">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search any location…"
                            value={customSearch}
                            onChange={(e) => setCustomSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button className="btn-search" onClick={handleSearch}>Go</button>
                    </div>

                    {}
                    {}
                    {scanLocation && (
                        <div className="selected-coords">
                            {scanLocation}
                        </div>
                    )}

                    {}
                    <div style={{
                        marginTop: '15px',
                        marginBottom: '15px',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>
                            NASA FIRMS Active Fires (VIIRS)
                        </span>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={showFires}
                                onChange={(e) => setShowFires(e.target.checked)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: showFires ? '#10b981' : '#555',
                                transition: '0.3s',
                                borderRadius: '20px'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    height: '14px', width: '14px',
                                    left: showFires ? '23px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: 'white',
                                    transition: '0.3s',
                                    borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>

                    {}
                    <button
                        id="btn-run-scan"
                        className={`btn-scan ${isScanning ? 'scanning' : ''}`}
                        onClick={aiData ? resetScan : runAiScan}
                        disabled={isScanning || !scanLocation}
                    >
                        {isScanning
                            ? 'Scanning…'
                            : aiData
                                ? 'New Scan'
                                : 'Run AI Scan'}
                    </button>

                    {}
                    {scanError && (
                        <div className="scan-error">
                            ⚠️ {scanError}
                        </div>
                    )}

                    {}
                    {aiData && (
                        <div className="results-card" id="ai-results-panel">

                            <h4 className="results-title">Live Scan Results</h4>

                            {}
                            <div className="satellite-preview">
                                <img
                                    src={`data:image/jpeg;base64,${aiData.annotated_image}`}
                                    alt="AI Annotated Satellite"
                                />
                                <div className="satellite-label">
                                    {aiData.location || scanLocation}
                                </div>
                            </div>

                            {}
                            <div
                                className="health-badge"
                                style={{ backgroundColor: getRiskColor(aiData.deforestation_risk_score) + '22', borderColor: getRiskColor(aiData.deforestation_risk_score) }}
                            >
                                <span style={{ color: getRiskColor(aiData.deforestation_risk_score), fontWeight: 'bold', fontSize: '1rem' }}>
                                    {aiData.health_status || getRiskLabel(aiData.deforestation_risk_score)}
                                </span>
                            </div>

                            {}
                            <div className="stats-grid">
                                <div className="stat-box">
                                    <div className="stat-value" style={{ color: '#22c55e' }}>
                                        {aiData.forest_coverage_pct ?? aiData.forest_area_pct ?? 0}%
                                    </div>
                                    <div className="stat-label">Forest Cover</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-value" style={{ color: '#ef4444' }}>
                                        {aiData.deforested_pct ?? aiData.deforested_area_pct ?? 0}%
                                    </div>
                                    <div className="stat-label">Deforested</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-value" style={{ color: getRiskColor(aiData.deforestation_risk_score) }}>
                                        {aiData.deforestation_risk_score ?? 0}%
                                    </div>
                                    <div className="stat-label">Risk Score</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-value">{aiData.total_detections ?? 0}</div>
                                    <div className="stat-label">Objects</div>
                                </div>
                            </div>

                            {}
                            {aiData.carbon && (
                                <div className="carbon-panel">
                                    <div className="carbon-header">Carbon Impact</div>
                                    <div className="carbon-row">
                                        <span>Canopy Area</span>
                                        <strong>{aiData.carbon.canopy_area_hectares?.toLocaleString()} ha</strong>
                                    </div>
                                    <div className="carbon-row">
                                        <span>CO₂ Sequestered</span>
                                        <strong>{aiData.carbon.estimated_carbon_tonnes?.toLocaleString()} tCO₂</strong>
                                    </div>
                                    <div className="carbon-row carbon-credits-row">
                                        <span>Carbon Credits</span>
                                        <strong style={{ color: '#4ade80', fontSize: '1.1rem' }}>
                                            {aiData.carbon.estimated_carbon_credits?.toLocaleString()} credits
                                        </strong>
                                    </div>
                                    <div className="carbon-row">
                                        <span>Est. Market Value</span>
                                        <strong style={{ color: '#fbbf24' }}>
                                            ${aiData.carbon.credit_value_usd?.toLocaleString()}
                                        </strong>
                                    </div>
                                </div>
                            )}
                            {}
                            {aiData.suitability && (
                                <div className="carbon-panel suitability-panel" style={{ marginTop: '15px' }}>
                                    <div className="carbon-header">Planting Suitability</div>
                                    <div className="carbon-row">
                                        <span>Suitability Status</span>
                                        <strong style={{
                                            color: aiData.suitability.suitability === 'Highly Suitable' ? '#22c55e' :
                                                aiData.suitability.suitability === 'Fully Forested' ? '#3b82f6' :
                                                    aiData.suitability.suitability === 'Moderately Suitable' ? '#fbbf24' : '#ef4444',
                                            fontWeight: 'bold'
                                        }}>
                                            {aiData.suitability.suitability}
                                        </strong>
                                    </div>
                                    <div className="carbon-row">
                                        <span>Soil Profile</span>
                                        <strong>{aiData.suitability.soil_type}</strong>
                                    </div>
                                    <div className="carbon-row" style={{ display: 'block', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                            {aiData.suitability.reason}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {}
                            {aiData.class_counts && Object.keys(aiData.class_counts).length > 0 && (
                                <div className="class-breakdown">
                                    <div className="breakdown-title">Detected Classes</div>
                                    <div className="breakdown-tags">
                                        {Object.entries(aiData.class_counts).map(([label, count]) => (
                                            <span key={label} className="breakdown-tag">
                                                {label}: {count}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapView;