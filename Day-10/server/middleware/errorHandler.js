export default function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Maximum size is 10MB." });
  }
  if (err.message === "Only PDF files are allowed.") {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
}
