interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    viewCount: number;
    downloadCount: number;
    ratingSum: number;
    ratingCount: number;
    subject?: { name: string } | null;
    department?: { name: string } | null;
    createdAt: string;
  };
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const avg =
    resource.ratingCount > 0
      ? Number((resource.ratingSum / resource.ratingCount).toFixed(1))
      : null;
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold">{resource.title}</h3>
        {resource.fileName && (
          <span className="text-xs text-muted-foreground">
            {resource.fileName.split(".").pop()}
          </span>
        )}
      </div>
      {resource.description && (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {resource.description}
        </p>
      )}
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {resource.subject && (
          <span className="rounded bg-muted px-2 py-0.5">{resource.subject.name}</span>
        )}
        {resource.department && (
          <span className="rounded bg-muted px-2 py-0.5">{resource.department.name}</span>
        )}
        {resource.fileSize && (
          <span className="rounded bg-muted px-2 py-0.5">
            {(resource.fileSize / 1024).toFixed(1)} KB
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
        <div className="flex items-center gap-3">
          {avg !== null && <span>★ {avg}</span>}
          <span>👁 {resource.viewCount}</span>
          <span>↓ {resource.downloadCount}</span>
        </div>
      </div>
    </div>
  );
}
