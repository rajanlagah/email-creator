import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FeatureCard } from '../types';

// email card inner width: 600px - 2×32px padding = 536px
const CARD_WIDTH = 536;
const ASPECT_16_9_HEIGHT = Math.round(CARD_WIDTH * 9 / 16); // 302

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface Props {
  card: FeatureCard;
  index: number;
  onChange: (updates: Partial<FeatureCard>) => void;
  onDelete: () => void;
}

export default function FeatureCardEditor({ card, index, onChange, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isNonYoutube = card.isNonYoutube ?? false;
  const videoHeight = card.videoHeight ?? 200;
  const thumbnailUrl = card.thumbnailUrl ?? '';

  const youtubeId = card.videoUrl.trim() ? extractYoutubeId(card.videoUrl) : null;
  const isYoutube = !!youtubeId;

  const hasThumbnail = isYoutube || (isNonYoutube && thumbnailUrl.trim());

  const handleVideoUrlChange = (url: string) => {
    const id = extractYoutubeId(url);
    // auto-clear the non-youtube flag when a valid YT url is typed
    if (id) {
      onChange({ videoUrl: url, isNonYoutube: false });
    } else {
      onChange({ videoUrl: url });
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="card-editor">
      <div className="card-editor-header">
        <span className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
          ⠿
        </span>
        <span className="card-label">Feature {index + 1}</span>
        <button className="btn-icon btn-delete" onClick={onDelete} title="Remove">✕</button>
      </div>

      <div className="field">
        <label>Tag Label</label>
        <input
          value={card.tag}
          onChange={e => onChange({ tag: e.target.value })}
          placeholder="e.g., New Feature"
        />
      </div>

      <div className="field">
        <label>Title</label>
        <textarea
          value={card.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="Feature headline..."
          rows={2}
        />
      </div>

      <div className="field">
        <label>Description</label>
        <textarea
          value={card.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Describe what this feature does..."
          rows={3}
        />
      </div>

      {/* VIDEO SECTION */}
      <div className="field">
        <label>
          Video URL <span className="badge-optional">optional</span>
          {isYoutube && <span className="badge-youtube">YouTube ✓</span>}
        </label>
        <input
          value={card.videoUrl}
          onChange={e => handleVideoUrlChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          type="url"
        />
      </div>

      <div className="video-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isNonYoutube}
            disabled={isYoutube}
            onChange={e => onChange({ isNonYoutube: e.target.checked })}
          />
          Non-YouTube video
        </label>

        {isNonYoutube && (
          <div className="field" style={{ marginTop: 8 }}>
            <label>Thumbnail URL</label>
            <input
              value={thumbnailUrl}
              onChange={e => onChange({ thumbnailUrl: e.target.value })}
              placeholder="https://example.com/thumbnail.jpg"
              type="url"
            />
          </div>
        )}

        {hasThumbnail && (
          <div className="video-height-row">
            <span className="video-height-label">Height: {videoHeight}px</span>
            <button
              className="btn-aspect-ratio"
              onClick={() => onChange({ videoHeight: ASPECT_16_9_HEIGHT })}
              title={`Set height to ${ASPECT_16_9_HEIGHT}px (16:9)`}
            >
              Match thumbnail aspect ratio
            </button>
          </div>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <label>
            CTA Button Text <span className="badge-optional">optional</span>
          </label>
          <input
            value={card.ctaText}
            onChange={e => onChange({ ctaText: e.target.value })}
            placeholder="Connect Instagram"
          />
        </div>
        <div className="field">
          <label>CTA URL</label>
          <input
            value={card.ctaUrl}
            onChange={e => onChange({ ctaUrl: e.target.value })}
            placeholder="https://..."
            type="url"
          />
        </div>
      </div>
    </div>
  );
}
