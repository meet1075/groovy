export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-3">
        <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <h1 className="text-base font-semibold tracking-tight">Explain This Codebase</h1>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800">
          Powered by Groq · Llama 3.3 70B
        </span>
      </div>
    </header>
  );
}
