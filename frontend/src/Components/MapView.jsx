import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import { useTranslation } from 'react-i18next';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../css/mapview.css';

const freeMapStyle = {
    version: 8,
    sources: {
        'esri-satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '&copy; Esri'
        }
    },
    layers: [
        {
            id: 'satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 22
        }
    ]
};

const degradedLandData = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [37.28, -0.48],
                        [37.35, -0.48],
                        [37.38, -0.52],
                        [37.32, -0.56],
                        [37.25, -0.53],
                        [37.28, -0.48]
                    ]
                ]
            },
            properties: {
                suitabilityScore: 92,
                areaHectares: 1250,
                type: 'Degraded Forest'
            }
        }
    ]
};

const degradedLandStyle = {
    id: 'degraded-land-fill',
    type: 'fill',
    paint: {
        'fill-color': '#2d6a4f',
        'fill-opacity': 0.4
    }
};

const degradedLandOutline = {
    id: 'degraded-land-outline',
    type: 'line',
    paint: {
        'line-color': '#2d6a4f',
        'line-width': 3
    }
};

const MapView = () => {
    const { t, i18n } = useTranslation();
    const [viewState, setViewState] = useState({
        longitude: 37.30,
        latitude: -0.50,
        zoom: 11,
        pitch: 45,
        bearing: -10
    });

    const [aiData, setAiData] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    const runAiScan = () => {
        setIsScanning(true);
        setAiData(null);

        setTimeout(() => {
            setAiData(degradedLandData);
            setIsScanning(false);
            setViewState(prev => ({ ...prev, zoom: 11.5, longitude: 37.31, latitude: -0.51 }));
        }, 2500);
    };

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <div className="map-page-container">
            <div className="map-navbar">
                <Link to="/" className="map-logo">
                    <span>MITI</span>
                    <span>TRACK</span>
                </Link>
                <div className="map-nav-links" style={{ display: 'flex', alignItems: 'center' }}>
                    <Link to="/">{t('nav.home')}</Link>
                    <Link to="/dashboard">{t('nav.dashboard')}</Link>
                    <select className="lang-select" onChange={changeLanguage} defaultValue={i18n.language} style={{ marginLeft: '20px', border: 'none', background: 'transparent', color: '#ccc', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
                        <option value="en">ENGLISH</option>
                        <option value="es">ESPAÑOL</option>
                        <option value="fr">FRANÇAIS</option>
                        <option value="sw">KISWAHILI</option>
                        <option value="de">DEUTSCH</option>
                    </select>
                </div>
            </div>

            <div className="map-wrapper">
                <Map
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle={freeMapStyle}
                >

                    {aiData && (
                        <Source id="ai-scan-data" type="geojson" data={aiData}>
                            <Layer {...degradedLandStyle} />
                            <Layer {...degradedLandOutline} />
                        </Source>
                    )}
                </Map>

                <div className="map-control-panel">
                    <h3>{t('map.title')}</h3>
                    <p className="panel-desc">
                        {t('map.desc')}
                    </p>

                    <div className="region-select">
                        <label>{t('map.targetRegion')}</label>
                        <select disabled={isScanning}>
                            <option>{t('map.regions.mtKenya')}</option>
                            <option>{t('map.regions.aberdare')}</option>
                            <option>{t('map.regions.thika')}</option>
                        </select>
                    </div>

                    <button
                        className={`btn-scan ${isScanning ? 'scanning' : ''}`}
                        onClick={runAiScan}
                        disabled={isScanning || aiData !== null}
                    >
                        {isScanning ? t('map.scanning') : aiData ? t('map.scanComplete') : t('map.runScan')}
                    </button>

                    {aiData && (
                        <div className="results-card">
                            <h4>{t('map.zoneDiscovered')}</h4>
                            <div className="metric">
                                <span>{t('map.areaSize')}</span>
                                <strong>{aiData.features[0].properties.areaHectares} {t('map.hectares')}</strong>
                            </div>
                            <div className="metric">
                                <span>{t('map.confidence')}</span>
                                <strong>{aiData.features[0].properties.suitabilityScore}%</strong>
                            </div>
                            <button className="btn-action-small">{t('map.initiate')}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapView;