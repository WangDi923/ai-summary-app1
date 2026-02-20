'use client'
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState("");
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [status, setStatus] = useState("Waiting for file...");

  // 1. 上传逻辑 [cite: 205-224]
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus("Uploading to Supabase...");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setUploadedPath(data.path || "success"); 
      setStatus("File ready! Click 'Generate Summary' to continue.");
    } catch (err: any) {
      setStatus(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 2. 摘要逻辑 [cite: 539-540]
  const handleSummarize = async () => {
    if (!uploadedPath) return;
    setSummarizing(true);
    setStatus("DeepSeek is analyzing your document...");

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: `Please summarize the key points of this document: ${file?.name}. Focus on its main objectives and conclusions.` 
        })
      });
      const data = await res.json();
      setSummary(data.summary);
      setStatus("Summary complete.");
    } catch (err: any) {
      setStatus(`Summarization error: ${err.message}`);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
      <main className="w-full max-w-6xl h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* 左侧：控制面板 (Control Panel) */}
        <section className="w-full md:w-5/12 p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Summary App</h1>
              <p className="text-slate-400 text-sm mt-1 font-medium italic">CS Software Engineering Exercise</p>
            </div>

            <div className="space-y-6">
              <div className="group border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                <input 
                  type="file" 
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setUploadedPath("");
                    setSummary("");
                    setStatus("File selected.");
                  }} 
                  className="block w-full text-xs text-slate-400 file:hidden cursor-pointer"
                />
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {file ? file.name : "Drag & drop or click to select"}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm"
                >
                  {uploading ? "Processing..." : "1. Upload to Storage"}
                </button>
                
                <button 
                  onClick={handleSummarize}
                  disabled={summarizing || !uploadedPath}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm"
                >
                  {summarizing ? "Generating..." : "2. Generate AI Summary"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm text-slate-700 font-medium leading-tight">{status}</p>
          </div>
        </section>

        {/* 右侧：结果面板 (Insight Panel) */}
        <section className="w-full md:w-7/12 bg-slate-50/50 p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Summary Result</h2>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-100 p-6 shadow-inner">
            {summary ? (
              <p className="text-slate-700 leading-relaxed text-base font-medium whitespace-pre-wrap animate-in fade-in duration-700">
                {summary}
              </p>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="text-sm italic">AI output will appear here...</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}