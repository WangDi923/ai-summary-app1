'use client'
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState("");
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [status, setStatus] = useState("Ready to start");

  // 1. 上传逻辑：增加文件大小检查以适配 Vercel 免费版限制
  const handleUpload = async () => {
    if (!file) return;

    // 💡 检查文件大小：Vercel 免费版 Serverless 函数限制约为 4.5MB [cite: 260-261]
    if (file.size > 4.5 * 1024 * 1024) {
      setStatus("Error: File exceeds 4.5MB (Vercel limit). Please use a smaller file.");
      return;
    }

    setUploading(true);
    setStatus("Uploading to Supabase...");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      
      // 捕获非 JSON 响应（如 Vercel 抛出的 HTML 错误页面）
      if (!res.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Server returned a non-JSON response. The file might still be too large.");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setUploadedPath(data.path || "success_placeholder"); 
      setStatus("File uploaded successfully! Ready for AI summary.");
    } catch (err: any) {
      console.error("Upload detail:", err);
      setStatus(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 2. 摘要逻辑：调用 DeepSeek API [cite: 539-540]
  const handleSummarize = async () => {
    if (!uploadedPath) return;
    setSummarizing(true);
    setStatus("DeepSeek AI is analyzing...");

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: `Please summarize this document: ${file?.name}.` 
        })
      });
      
      if (!res.headers.get("content-type")?.includes("application/json")) {
        throw new Error("AI server error while generating summary.");
      }

      const data = await res.json();
      setSummary(data.summary);
      setStatus("Summary completed.");
    } catch (err: any) {
      setStatus(`Summary failed: ${err.message}`);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans text-gray-900">
      {/* 左右分栏容器 */}
      <main className="w-full max-w-6xl h-auto md:h-[700px] bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* 左侧：上传与控制面板 (40%) */}
        <section className="w-full md:w-[40%] p-8 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between">
          <div>
            <div className="mb-10">
              <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">AI Summary App</h1>
              <p className="text-gray-400 text-sm mt-2">CS Software Engineering Project</p>
            </div>

            <div className="space-y-6">
              {/* 自定义文件选择区域 */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    setFile(selectedFile);
                    setUploadedPath("");
                    setSummary("");
                    setStatus(selectedFile ? `Selected: ${selectedFile.name}` : "Ready");
                  }} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-300 mb-3 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="text-sm font-semibold text-gray-600">
                    {file ? file.name : "Choose or drag a PDF file"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">Max file size: 4.5MB</p>
                </div>
              </div>

              {/* 动作按钮组 */}
              <div className="space-y-3">
                <button 
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-lg active:scale-95"
                >
                  {uploading ? "Uploading..." : "1. Upload File"}
                </button>
                
                <button 
                  onClick={handleSummarize}
                  disabled={summarizing || !uploadedPath}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-lg active:scale-95"
                >
                  {summarizing ? "AI Summarizing..." : "2. Generate AI Summary"}
                </button>
              </div>
            </div>
          </div>

          {/* 状态栏 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</h3>
            <p className="text-sm text-gray-700 font-bold leading-tight">{status}</p>
          </div>
        </section>

        {/* 右侧：结果展示区域 (60%) */}
        <section className="w-full md:w-[60%] bg-gray-50/30 p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Summary Result</h2>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
            </div>
          </div>

          {/* 滚动展示框 */}
          <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 p-8 shadow-inner custom-scrollbar">
            {summary ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000">
                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                  {summary}
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <svg className="w-20 h-20 mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="text-sm italic font-bold">The AI summary will appear here once ready.</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}