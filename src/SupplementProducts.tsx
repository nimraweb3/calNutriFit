import { useState } from 'react';
import { zero, type Store, type SupplementProduct } from './engine';
import type { UpdateJournal } from './preferences';
import { NutritionDetails, NutrientFields } from './NutritionDetails';
import { scaleNutrition, supplementStatus } from './supplement-tracking';

function ProductEditor({ product, save, cancel }: { product: SupplementProduct; save: (p: SupplementProduct) => Promise<boolean>; cancel: () => void }) {
  const [p, setP] = useState(product), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <form className="card" onSubmit={async e => {
    e.preventDefault(); if (busy) return; setBusy(true); setError(''); try {
      if (!p.name.trim() || !p.unit.trim()) throw Error('Enter a product name and one-serving description.');
      const nutrition = scaleNutrition(p.nutrition, 1);
      if (await save({ ...p, name: p.name.trim(), unit: p.unit.trim(), nutrition })) cancel(); else setError('Not saved. Your edits are still here.');
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }}><h3>Edit saved product</h3><p>Changes affect future intake entries only. Past dose snapshots remain unchanged.</p>
    <div className="form-grid two">{([['name', 'Exact product name'], ['brand', 'Brand'], ['productType', 'Product type'], ['unit', 'One serving (e.g. 1 tablet, 5 mL)']] as const).map(([key, label]) => <label className="field" key={key}><span>{label}</span><input required={key === 'name' || key === 'unit'} maxLength={120} value={p[key] || ''} onChange={e => setP({ ...p, [key]: e.target.value })} /></label>)}</div>
    <div className="form-grid two">{(Object.keys(zero) as (keyof typeof zero)[]).map(k => <label className="field" key={k}><span>{k} per serving ({k === 'calories' ? 'kcal' : 'g'})</span><input required min="0" step="any" type="number" value={p.nutrition[k]} onChange={e => setP({ ...p, nutrition: { ...p.nutrition, [k]: +e.target.value } })} /></label>)}</div>
    <NutrientFields value={p.nutrition.details} onChange={details => setP({ ...p, nutrition: { ...p.nutrition, details } })} />
    <div className="form-grid two"><label className="field"><span>Your recorded schedule</span><select value={p.frequency || 'as-needed'} onChange={e => setP({ ...p, frequency: e.target.value as SupplementProduct['frequency'] })}><option value="as-needed">As needed / no schedule</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
      <label className="field"><span>Start date (optional)</span><input type="date" value={p.started || ''} onChange={e => setP({ ...p, started: e.target.value })} /></label></div>
    {p.frequency === 'weekly' && <label className="field"><span>Day of week</span><select value={p.weekday ?? 0} onChange={e => setP({ ...p, weekday: +e.target.value })}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>}
    <label className="field"><span>Notes (optional)</span><textarea maxLength={1000} value={p.notes || ''} onChange={e => setP({ ...p, notes: e.target.value })} /></label>
    <p className="help">Copy the exact package label. This schedule records your routine; it does not recommend a dose or send notifications.</p>
    {error && <p role="alert">{error}</p>}<button className="button" disabled={busy}>Save product</button><button type="button" className="text-button" onClick={cancel}>Cancel</button></form>;
}

export default function SupplementProducts({ data, date, save }: { data: Store; date: string; save: UpdateJournal }) {
  const [selected, setSelected] = useState(''), [busy, setBusy] = useState(false), [editing, setEditing] = useState<SupplementProduct | null>(null), [remove, setRemove] = useState(''), [quantity, setQuantity] = useState('1'), [error, setError] = useState('');
  return <section className="card"><h2>My saved products</h2><p>Saving a product adds no nutrients. Record a dose only when you actually take it.</p>
    {editing && <ProductEditor key={editing.id} product={editing} cancel={() => setEditing(null)} save={p => save(s => ({ ...s, supplementProducts: s.supplementProducts?.map(x => x.id === p.id ? p : x) }))} />}
    {!(data.supplementProducts?.length) && <p>Use Add supplement, enter your exact label, then choose Save product for reuse.</p>}
    {data.supplementProducts?.map(p => <section className="supplement-product" key={p.id}><div><h3>{p.name} <small>{p.brand}</small></h3><p>{p.unit} · {p.productType || 'Supplement'} · <strong>{supplementStatus(p, date, data.supplementHistory)}</strong> on {date}</p>{p.notes && <p>{p.notes}</p>}<NutritionDetails details={p.nutrition.details} /></div>
      <div className="hero-actions"><button className="button secondary" onClick={() => { setSelected(p.id); setQuantity('1'); setError('') }}>Record intake</button><button className="text-button" onClick={() => setEditing(p)}>Edit product / schedule</button><button className="text-button" onClick={() => setRemove(p.id)}>Remove product</button>
        {!data.supplementHistory.some(r => r.productId === p.id && r.date === date) && <button className="text-button" onClick={() => save(s => ({ ...s, supplementProducts: s.supplementProducts?.map(x => x.id === p.id ? { ...x, skippedDates: x.skippedDates?.includes(date) ? x.skippedDates.filter(d => d !== date) : [...(x.skippedDates || []), date] } : x) }))}>{p.skippedDates?.includes(date) ? 'Clear skipped status' : 'Mark skipped'}</button>}</div>
      {remove === p.id && <div className="notice"><p>Remove this saved product? Existing intake history will stay.</p><button disabled={busy} onClick={async () => { setBusy(true); try { if (await save(s => ({ ...s, supplementProducts: s.supplementProducts?.filter(x => x.id !== p.id) }))) setRemove('') } finally { setBusy(false) } }}>Confirm removal</button><button onClick={() => setRemove('')}>Cancel</button></div>}
      {selected === p.id && <form className="notice" onSubmit={async e => {
        e.preventDefault(); if (busy) return; setBusy(true); setError(''); try {
          const q = Number(quantity); if (!Number.isFinite(q) || q <= 0 || q > 100) throw Error('Enter a positive amount up to 100 servings.');
          const nutrition = scaleNutrition(p.nutrition, q);
          if (await save(s => ({ ...s, supplementHistory: [...s.supplementHistory, { id: crypto.randomUUID(), productId: p.id, date, name: p.name, quantity: q, unit: p.unit, nutrition, takenAt: new Date().toISOString() }] }))) setSelected('');
          else setError('Not saved. Please review your journal before trying again.');
        } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
      }}><label className="field"><span>Servings actually taken on {date}</span><input required type="number" min=".01" max="100" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
        <p>One serving: {p.unit}. Every confirmation creates a separate intake event.</p>{error && <p role="alert">{error}</p>}<button disabled={busy}>Confirm intake</button><button type="button" onClick={() => setSelected('')}>Cancel</button></form>}
    </section>)}
    {data.supplements.some(p => p.archived) && <details><summary>Archived routine products</summary><p>Previous taken dates still contribute to history. Restore a product to correct its recorded dates.</p>{data.supplements.filter(p => p.archived).map(p => <div className="record" key={p.id}><div><strong>{p.name}</strong><p>{p.taken.length} recorded days preserved</p></div><button className="text-button" onClick={() => save(s => ({ ...s, supplements: s.supplements.map(x => x.id === p.id ? { ...x, archived: false } : x) }))}>Restore product</button></div>)}</details>}
  </section>;
}
