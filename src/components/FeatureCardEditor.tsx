import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FeatureCard } from '../types';

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

      <div className="field">
        <label>
          Video URL <span className="badge-optional">optional</span>
        </label>
        <input
          value={card.videoUrl}
          onChange={e => onChange({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/..."
          type="url"
        />
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
