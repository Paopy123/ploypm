type MediaMetaProps = {
  description?: string;
  uploadedByLabel?: string | null;
  badge?: string;
};

export function MediaMeta({ description, uploadedByLabel, badge }: MediaMetaProps) {
  return (
    <div className="media-meta">
      {badge && <span className="media-meta__badge">{badge}</span>}
      {uploadedByLabel && <p className="media-meta__uploader">{uploadedByLabel}</p>}
      {description && <p className="media-meta__desc">{description}</p>}
    </div>
  );
}
