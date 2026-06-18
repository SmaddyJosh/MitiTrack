import React, { useState } from "react";
import { analyzeImage, compareImages } from "../lib/forestApi.js";

export default function ForestAnalyzer() {
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeImage(image);
      setResult(data);
    } catch (err) {
      setError("Analysis failed. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (score) => {
    if (score < 30) return "text-green-500";
    if (score < 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">🛰️ Forest Deforestation Analyzer</h1>

      {}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
        <label htmlFor="upload" className="cursor-pointer text-blue-600 font-medium">
          Click to upload satellite image
        </label>
      </div>

      {}
      {preview && (
        <img src={preview} alt="Uploaded" className="w-full rounded-xl max-h-80 object-contain bg-black" />
      )}

      {}
      <button
        onClick={handleAnalyze}
        disabled={!image || loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl"
      >
        {loading ? "Analyzing..." : "Analyze Image"}
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {}
      {result && (
        <div className="space-y-4">

          {}
          <div>
            <h2 className="font-semibold mb-2">Detection Result</h2>
            <img
              src={`data:image/jpeg;base64,${result.annotated_image}`}
              alt="Annotated"
              className="w-full rounded-xl"
            />
          </div>

          {}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-500">Total Detections</p>
              <p className="text-3xl font-bold">{result.total_detections}</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-500">Deforestation Risk</p>
              <p className={`text-3xl font-bold ${riskColor(result.deforestation_risk_score)}`}>
                {result.deforestation_risk_score}%
              </p>
            </div>
          </div>

          {}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🌱</span>
              <h3 className="text-xl font-bold">Carbon Impact Dashboard</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-sm text-emerald-100 font-medium">Estimated CO2 Sequestered</p>
                <div className="flex items-baseline space-x-1">
                  <p className="text-3xl font-extrabold">{result.estimated_co2_kg_per_year?.toLocaleString() || 0}</p>
                  <span className="text-sm text-emerald-100">kg / year</span>
                </div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-20 text-6xl">🍃</div>
                <p className="text-sm text-emerald-100 font-medium">Carbon Credits Earned</p>
                <div className="flex items-baseline space-x-1 relative z-10">
                  <p className="text-3xl font-extrabold">{result.estimated_carbon_credits?.toLocaleString() || 0}</p>
                  <span className="text-sm text-emerald-100">credits</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/20 text-sm text-emerald-100 flex justify-between items-center">
              <p>Based on standard estimate: 1 mature tree ≈ 22kg CO2/year</p>
              <p className="font-semibold text-white">Estimated Value: ${(result.estimated_carbon_credits * 40).toLocaleString()}</p>
            </div>
          </div>

          {}
          <div className="bg-gray-100 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Detected Classes</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.class_counts).map(([label, count]) => (
                <span key={label} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {label}: {count}
                </span>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
