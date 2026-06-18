import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        credits: 0,
        totalCreditsEarned: 0,
        stats: {
            totalAreaHectares: 0,
            totalCarbonTonnes: 0,
            totalCredits: 0,
            totalValueUsd: 0,
            avgRiskScore: 0,
            totalScans: 0
        },
        trend: []
    });
    const [scans, setScans] = useState([]);
    const [activeTab, setActiveTab] = useState('metrics');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please sign in to access your dashboard.');
            navigate('/login');
            return;
        }
        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const authApi = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000';

        try {
            
            const statsRes = await fetch(`${authApi}/api/scans/stats`, {
                headers: { 'x-auth-token': token }
            });
            const statsData = await statsRes.json();

            if (!statsRes.ok) {
                throw new Error(statsData.error || 'Failed to fetch dashboard metrics.');
            }

            setData(statsData);

            
            const scansRes = await fetch(`${authApi}/api/scans`, {
                headers: { 'x-auth-token': token }
            });
            const scansData = await scansRes.json();

            if (scansRes.ok) {
                setScans(scansData);
            }

        } catch (err) {
            console.error(err);
            setError(err.message || 'Server error. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteScan = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this scan from your history?')) return;

        const token = localStorage.getItem('token');
        const authApi = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000';

        try {
            const res = await fetch(`${authApi}/api/scans/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                
                fetchDashboardData();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to delete scan.');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting scan.');
        }
    };

    const getRiskBadgeColor = (score) => {
        if (score < 30) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (score < 60) return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-rose-100 text-rose-800 border-rose-200';
    };

    
    const renderSparkline = () => {
        const trend = data.trend || [];
        if (trend.length < 2) return null;

        const width = 600;
        const height = 150;
        const padding = 20;

        const maxVal = Math.max(...trend.map(t => t.forestCoveragePct), 100);
        const minVal = Math.min(...trend.map(t => t.forestCoveragePct), 0);
        const range = maxVal - minVal || 1;

        const points = trend.map((t, idx) => {
            const x = padding + (idx * (width - 2 * padding)) / (trend.length - 1);
            const y = height - padding - ((t.forestCoveragePct - minVal) * (height - 2 * padding)) / range;
            return `${x},${y}`;
        }).join(' ');

        
        const fillPath = `M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`;

        return (
            <div className="relative bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
                <h4 className="font-semibold text-gray-800 mb-4">Forest Cover Historical Trend (%)</h4>
                <div className="relative w-full overflow-hidden">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>
                        {}
                        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f3f4f6" strokeWidth={1} />
                        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f3f4f6" strokeWidth={1} />
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeWidth={1.5} />

                        {}
                        <path d={fillPath} fill="url(#gradient)" />

                        {}
                        <polyline
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                        />

                        {}
                        {trend.map((t, idx) => {
                            const x = padding + (idx * (width - 2 * padding)) / (trend.length - 1);
                            const y = height - padding - ((t.forestCoveragePct - minVal) * (height - 2 * padding)) / range;
                            return (
                                <g key={idx} className="group cursor-pointer">
                                    <circle cx={x} cy={y} r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                                    <circle cx={x} cy={y} r="10" fill="#10b981" opacity="0" className="hover:opacity-20 transition-opacity" />
                                </g>
                            );
                        })}
                    </svg>
                </div>
                {}
                <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
                    <span>{new Date(trend[0].createdAt).toLocaleDateString()}</span>
                    <span>{new Date(trend[trend.length - 1].createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
            {}
            <div className="w-full bg-[#082a1d] text-white px-6 py-4 flex justify-between items-center shadow-md">
                <Link to="/" className="text-xl font-bold tracking-wider text-white no-underline flex items-center gap-2">
                    MITI<span className="text-emerald-400">TRACK</span>
                </Link>
                <div className="flex items-center gap-6">
                    <Link to="/map" className="text-emerald-300 hover:text-white transition font-medium no-underline">
                        Interactive Map
                    </Link>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            navigate('/login');
                        }}
                        className="bg-transparent border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-[#082a1d] px-4 py-1.5 rounded-full text-sm font-semibold transition"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {}
            <div className="flex-grow max-w-7xl w-full mx-auto p-6 space-y-8">
                {}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            Welcome Back, {JSON.parse(localStorage.getItem('user') || '{}')?.firstName || 'Explorer'}!
                        </h1>
                        <p className="text-slate-500 mt-1">Here is the climate impact and health metrics overview for your projects.</p>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm"
                    >
                        Refresh Metrics
                    </button>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3">
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="h-96 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
                    </div>
                ) : (
                    <>
                        {}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            {}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Credits Remaining</span>
                                <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">{data.credits}</h3>
                                <p className="text-xs text-slate-400 mt-1">Scan quota left</p>
                            </div>

                            {}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Carbon Credits</span>
                                <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{data.totalCreditsEarned || 0}</h3>
                                <p className="text-xs text-emerald-600 mt-1">Accumulated carbon assets</p>
                            </div>

                            {}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Est. Value (USD)</span>
                                <h3 className="text-3xl font-extrabold text-[#d97706] mt-2">${(data.totalCreditsEarned * 40).toLocaleString()}</h3>
                                <p className="text-xs text-slate-400 mt-1">Valued at $40/credit</p>
                            </div>

                            {}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Area Monitored</span>
                                <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{data.stats?.totalAreaHectares || 0} ha</h3>
                                <p className="text-xs text-slate-400 mt-1">Total canopy tracked</p>
                            </div>

                            {}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Risk</span>
                                <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{data.stats?.avgRiskScore || 0}%</h3>
                                <p className="text-xs text-slate-400 mt-1">Deforestation risk score</p>
                            </div>
                        </div>

                        {}
                        <div className="flex border-b border-slate-200">
                            <button
                                onClick={() => setActiveTab('metrics')}
                                className={`py-3 px-6 font-semibold border-b-2 text-sm transition ${activeTab === 'metrics' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                Impact Metrics
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`py-3 px-6 font-semibold border-b-2 text-sm transition ${activeTab === 'history' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                Scan History ({scans.length})
                            </button>
                        </div>

                        {}
                        {activeTab === 'metrics' && (
                            <div className="space-y-6">
                                {}
                                {data.trend && data.trend.length >= 2 ? (
                                    renderSparkline()
                                ) : (
                                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
                                        <p className="text-slate-400">Run at least 2 scans on different regions to generate historical trend graphs.</p>
                                        <Link to="/map" className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-xl text-sm no-underline transition">
                                            Go to Map & Scan
                                        </Link>
                                    </div>
                                )}

                                {}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h3 className="font-bold text-lg text-slate-800 mb-4">Ecological CO2 Breakdown</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">Total Carbon Sequestered</span>
                                                <span className="font-bold">{data.stats?.totalCarbonTonnes || 0} tonnes CO2</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">Total Scans Run</span>
                                                <span className="font-bold">{data.stats?.totalScans || 0} scans</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Standard Conversion Rate</span>
                                                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium">1 credit = 1 tCO2 offset</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h3 className="font-bold text-lg text-slate-800 mb-4">Monitoring Status</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">Global Canopy Coverage</span>
                                                <span className="font-bold text-emerald-600">{100 - (data.stats?.avgRiskScore || 0)}% average</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">Overall Forest Risk Level</span>
                                                <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${getRiskBadgeColor(data.stats?.avgRiskScore || 0)}`}>
                                                    {data.stats?.avgRiskScore < 30 ? 'HEALTHY' : data.stats?.avgRiskScore < 60 ? 'WARNING' : 'CRITICAL'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Incentive Status</span>
                                                <span className="text-xs text-emerald-600 font-bold">Incentive tier active</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                {scans.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-slate-400">You haven't run any scans yet. Run your first AI satellite scan to populate history.</p>
                                        <Link to="/map" className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-xl text-sm no-underline transition">
                                            Open Map
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Region / Coordinates</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date Scanned</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Level</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Forest Cover</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Carbon Credits</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Suitability</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-100">
                                                {scans.map((scan) => (
                                                    <tr key={scan._id} className="hover:bg-slate-50/50 transition">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-slate-800">{scan.locationName}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">
                                                                Lat: {scan.coordinates?.lat?.toFixed(4) || 0}, Lng: {scan.coordinates?.lng?.toFixed(4) || 0}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-500">
                                                            {new Date(scan.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBadgeColor(scan.deforestationRiskScore)}`}>
                                                                {scan.deforestationRiskScore}% Risk
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                                            {scan.forestCoveragePct}%
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <div className="font-bold text-emerald-600">+{scan.carbon?.estimatedCarbonCredits || 0}</div>
                                                            <div className="text-xs text-[#d97706] mt-0.5">${(scan.carbon?.creditValueUsd || 0).toLocaleString()}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium">
                                                            <span className={`px-2 py-0.5 rounded-full ${
                                                                scan.suitability?.suitability === 'Highly Suitable' ? 'bg-green-50 text-green-700' :
                                                                scan.suitability?.suitability === 'Fully Forested' ? 'bg-blue-50 text-blue-700' :
                                                                scan.suitability?.suitability === 'Moderately Suitable' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                                                            }`}>
                                                                {scan.suitability?.suitability || 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm space-x-2">
                                                            <Link
                                                                to={`/map?lat=${scan.coordinates?.lat}&lng=${scan.coordinates?.lng}&name=${encodeURIComponent(scan.locationName)}`}
                                                                className="inline-block bg-[#082a1d] text-white px-3 py-1.5 rounded-lg text-xs font-medium no-underline hover:bg-emerald-950 transition shadow-sm"
                                                            >
                                                                Map
                                                            </Link>
                                                            <button
                                                                onClick={(e) => handleDeleteScan(scan._id, e)}
                                                                className="border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 px-2.5 py-1.5 rounded-lg transition text-xs font-semibold"
                                                                title="Delete Scan"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
