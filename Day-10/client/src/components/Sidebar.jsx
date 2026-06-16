import { useState, useRef } from "react";

export default function Sidebar({ documents, currentDoc, onSelectDoc, onNewChat, onUpload, uploading }) {
  const [collapsed, setCollapsed] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") onUpload(file);
    e.target.value = "";
  };

  return (
    <div className={`${collapsed ? "w-14" : "w-64"} flex-shrink-0 h-screen bg-ink-900 border-r border-ink-800 flex flex-col transition-all duration-200`}>
      {/* Header */}
      <div className="px-3 py-3 border-b border-ink-800 flex items-center gap-2 flex-shrink-0">
        {!collapsed && (
          <span className="text-sm font-medium text-parchment-200 truncate flex-1">Ask My Notes</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-ink-800 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? "M8.25 4.5l7.5 7.5-7.5 7.5" : "M15.75 19.5L8.25 12l7.5-7.5"} />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Upload + New Chat */}
          <div className="px-3 py-3 space-y-2 border-b border-ink-800 flex-shrink-0">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-800 hover:bg-ink-700 text-parchment-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-highlight-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              )}
              {uploading ? "Uploading..." : "Upload PDF"}
            </button>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} className="hidden" />

            {currentDoc && (
              <button
                onClick={onNewChat}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ink-800 text-ink-400 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Chat
              </button>
            )}
          </div>

          {/* Document list */}
          <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2 space-y-0.5">
            <div className="text-[10px] text-ink-600 uppercase tracking-wider px-2 mb-1">Documents</div>
            {documents.length === 0 && (
              <p className="text-ink-600 text-xs px-2 py-4">No documents yet</p>
            )}
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors group ${
                  currentDoc?.id === doc.id
                    ? "bg-ink-800 text-parchment-200"
                    : "hover:bg-ink-800/50 text-ink-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate">{doc.filename}</div>
                    <div className="text-[10px] text-ink-600">{doc.pageCount}p · {doc.queryCount} chats</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
