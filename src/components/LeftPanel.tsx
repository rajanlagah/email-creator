import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { EmailData, FeatureCard, FIItem } from '../types';
import FeatureCardEditor from './FeatureCardEditor';
import FIItemEditor from './FIItemEditor';

interface Props {
  data: EmailData;
  onChange: (data: EmailData) => void;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function LeftPanel({ data, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const set = (updates: Partial<EmailData>) => onChange({ ...data, ...updates });

  const updateCard = (id: string, updates: Partial<FeatureCard>) => {
    set({ featureCards: data.featureCards.map(c => c.id === id ? { ...c, ...updates } : c) });
  };

  const addCard = () => {
    const card: FeatureCard = { id: uid(), tag: '', title: '', description: '', videoUrl: '', videoHeight: 200, isNonYoutube: false, thumbnailUrl: '', ctaText: '', ctaUrl: '' };
    set({ featureCards: [...data.featureCards, card] });
  };

  const deleteCard = (id: string) => {
    set({ featureCards: data.featureCards.filter(c => c.id !== id) });
  };

  const handleCardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.featureCards.findIndex(c => c.id === active.id);
      const newIndex = data.featureCards.findIndex(c => c.id === over.id);
      set({ featureCards: arrayMove(data.featureCards, oldIndex, newIndex) });
    }
  };

  const updateFI = (id: string, updates: Partial<FIItem>) => {
    set({ fiItems: data.fiItems.map(i => i.id === id ? { ...i, ...updates } : i) });
  };

  const addFI = () => {
    const item: FIItem = { id: uid(), title: '', description: '' };
    set({ fiItems: [...data.fiItems, item] });
  };

  const deleteFI = (id: string) => {
    set({ fiItems: data.fiItems.filter(i => i.id !== id) });
  };

  return (
    <div className="left-panel">

      {/* EMAIL META */}
      <section className="panel-section">
        <h3 className="section-title">Email Meta</h3>

        <div className="field">
          <label>Month / Year</label>
          <input
            type="month"
            value={data.monthYear}
            onChange={e => set({ monthYear: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Preheader Text</label>
          <input
            value={data.preheader}
            onChange={e => set({ preheader: e.target.value })}
            placeholder="Hidden preview text shown in email clients..."
          />
        </div>
      </section>

      {/* HERO */}
      <section className="panel-section">
        <h3 className="section-title">Hero</h3>

        <div className="field">
          <label>Headline</label>
          <textarea
            value={data.heroHeadline}
            onChange={e => set({ heroHeadline: e.target.value })}
            placeholder="e.g., Instagram just arrived&#10;in your inbox."
            rows={3}
          />
        </div>

        <div className="field">
          <label>Subtext</label>
          <textarea
            value={data.heroSubtext}
            onChange={e => set({ heroSubtext: e.target.value })}
            placeholder="One-liner summary of this month's updates..."
            rows={2}
          />
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="panel-section">
        <h3 className="section-title">
          Feature Cards
          <span className="section-count">{data.featureCards.length}</span>
        </h3>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCardDragEnd}>
          <SortableContext items={data.featureCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {data.featureCards.map((card, i) => (
              <FeatureCardEditor
                key={card.id}
                card={card}
                index={i}
                onChange={updates => updateCard(card.id, updates)}
                onDelete={() => deleteCard(card.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button className="btn-add" onClick={addCard}>+ Add Feature Card</button>
      </section>

      {/* FEATURES & IMPROVEMENTS */}
      <section className="panel-section">
        <h3 className="section-title">
          Features &amp; Improvements
          <span className="section-count">{data.fiItems.length}</span>
        </h3>

        {data.fiItems.map((item, i) => (
          <FIItemEditor
            key={item.id}
            item={item}
            index={i}
            onChange={updates => updateFI(item.id, updates)}
            onDelete={() => deleteFI(item.id)}
          />
        ))}

        <button className="btn-add" onClick={addFI}>+ Add Item</button>
      </section>

      {/* CTA SECTION */}
      <section className="panel-section">
        <h3 className="section-title">CTA Section</h3>

        <div className="field">
          <label>Headline</label>
          <textarea
            value={data.ctaHeadline}
            onChange={e => set({ ctaHeadline: e.target.value })}
            placeholder="e.g., Instagram, WhatsApp, and more.&#10;All in one inbox, live now."
            rows={3}
          />
        </div>

        <div className="field">
          <label>Button</label>
          <div className="static-field">Open DoubleTick → <span className="badge-optional">fixed URL</span></div>
        </div>
      </section>

    </div>
  );
}
