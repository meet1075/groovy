import { useCallback, useState } from "react";

export default function UploadZone({ onUpload, loading }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (file && file.type === "application/pdf") onUpload(file);
  }, [onUpload]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-parchment-100 mb-2">Ask My Notes</h1>
          <p className="text-ink-400 text-sm">Upload a PDF and ask questions about it. Get cited answers.</p>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !loading && document.getElementById("pdf-input").click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            dragging
              ? "border-highlight-500 bg-highlight-500/5"
              : "border-ink-700 hover:border-ink-500 bg-ink-900/50"
          } ${loading ? "opacity-50 cursor-wait" : ""}`}
        >
          <input
            id="pdf-input"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {loading ? (
            <div>
              <div className="w-8 h-8 border-2 border-highlight-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-parchment-300 text-sm">Reading document...</p>
            </div>
          ) : (
            <div>
              <svg className="w-10 h-10 text-ink-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="text-parchment-200 font-medium mb-1">Drop a PDF here or click to upload</p>
              <p className="text-ink-500 text-xs">PDF files up to 10MB</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
