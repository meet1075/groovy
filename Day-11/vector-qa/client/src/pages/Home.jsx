import UploadZone from "../components/UploadZone";

export default function Home({ onUpload, uploading, error }) {
  return <UploadZone onUpload={onUpload} uploading={uploading} error={error} />;
}
