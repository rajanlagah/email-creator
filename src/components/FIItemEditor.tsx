import type { FIItem } from '../types';

interface Props {
  item: FIItem;
  index: number;
  onChange: (updates: Partial<FIItem>) => void;
  onDelete: () => void;
}

export default function FIItemEditor({ item, index, onChange, onDelete }: Props) {
  return (
    <div className="fi-item-editor">
      <div className="fi-item-header">
        <span className="card-label">Item {index + 1}</span>
        <button className="btn-icon btn-delete" onClick={onDelete} title="Remove">✕</button>
      </div>
      <div className="field">
        <label>Bold Title</label>
        <input
          value={item.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="e.g., Full message search on Android & iOS"
        />
      </div>
      <div className="field">
        <label>Description</label>
        <input
          value={item.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Short description of the improvement..."
        />
      </div>
    </div>
  );
}
