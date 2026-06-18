const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";


export async function analyzeImage(imageFile) {
  const formData = new FormData();
  formData.append("file", imageFile);

  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}


export async function compareImages(beforeFile, afterFile) {
  const formData = new FormData();
  formData.append("before", beforeFile);
  formData.append("after", afterFile);

  const res = await fetch(`${API_URL}/compare`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Comparison failed");
  return res.json();
}
