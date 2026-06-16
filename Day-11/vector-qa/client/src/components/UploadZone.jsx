import { useCallback, useState } from "react";

export default function UploadZone({ onUpload, uploading, error }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (file && file.type === "application/pdf") onUpload(file);
  }, [onUpload]);

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 p-6 min-h-0">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-frost-100 mb-2">Vector Q&A</h1>
          <p className="text-slate-400 text-sm">Upload a PDF. Ask questions. Get cited answers with semantic search.</p>
        </div>
        <div onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && document.getElementById("pdf-input").click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${dragging ? "border-electric-500 bg-electric-500/5" : "border-slate-700 hover:border-slate-500 bg-slate-900/50"} ${uploading ? "opacity-50 cursor-wait" : ""}`}>
          <input id="pdf-input" type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          {uploading ? (
            <div>
              <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-frost-300 text-sm">Uploading & embedding chunks...</p>
            </div>
          ) : (
            <div>
              <svg className="w-10 h-10 text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="text-frost-200 font-medium mb-1">Drop a PDF here or click to upload</p>
              <p className="text-slate-500 text-xs">PDF files up to 10MB · Text is chunked, embedded, and stored in Pinecone</p>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
