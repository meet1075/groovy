import UploadZone from "../components/UploadZone";

export default function Home({ onUpload, loading }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-ink-950">
      <UploadZone onUpload={onUpload} loading={loading} />
    </div>
  );
}
