import React, { useContext, useMemo, useState } from 'react'
import { AppContext } from './App'

const POOLS = [
  { key: 'A', title: 'Group-A', basePrice: 5000000 },
  { key: 'B', title: 'Group-B', basePrice: 4000000 },
  { key: 'C', title: 'Group-C', basePrice: 3000000 },
  { key: 'D', title: 'Group-D', basePrice: 1000000 },
]

export default function Players(){
  const { state, dispatch, uid } = useContext(AppContext)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name:'', positions:'', pool:'A', imageData:null })

  function onFile(e){
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setForm(prev => ({...prev, imageData: reader.result}))
    reader.readAsDataURL(f)
  }

  function getBasePrice(poolKey) {
    const found = POOLS.find(p => p.key === poolKey)
    return found ? found.basePrice : 0
  }

  function onSubmit(e){
    e.preventDefault()
    const payload = {
      id: editing?.id ?? uid('player'),
      name: form.name.trim(),
      positions: form.positions.split(',').map(s=>s.trim()).filter(Boolean),
      pool: form.pool,
      basePrice: getBasePrice(form.pool),
      status: editing?.status ?? 'pending',
      teamId: editing?.teamId ?? null,
      price: editing?.price ?? 0,
      imageData: form.imageData || editing?.imageData || null
    }
    dispatch({ type: 'UPSERT_PLAYER', payload })
    setEditing(null); setForm({ name:'', positions:'', pool:'A', imageData:null })
  }

  function onEdit(p){
    setEditing(p)
    setForm({ 
      name: p.name, 
      positions: p.positions.join(', '), 
      pool: p.pool || 'A', 
      imageData: p.imageData || null 
    })
  }

  return (
    <section className="panel">
      <div className="panel-head"><h2>Players</h2></div>
      <div className="panel-body">
        <form className="form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>Player Name</span>
              <input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} required placeholder="E.g. Rahul"/>
            </label>
            <label className="form-field">
              <span>Positions (comma separated)</span>
              <input value={form.positions} onChange={e=>setForm(f=>({...f, positions:e.target.value}))} placeholder="OH, MB, S"/>
            </label>
            <label className="form-field">
              <span>Group Category</span>
              <select value={form.pool} onChange={e=>setForm(f=>({...f, pool:e.target.value}))}>
                {POOLS.map(pool => (
                  <option key={pool.key} value={pool.key}>{pool.title} (Base: {pool.basePrice.toLocaleString()})</option>
                ))}
              </select>
            </label>
            <label className="form-field image-field">
              <span>Player Photo</span>
              <div className="image-picker">
                <div className="image-preview">{form.imageData ? <img alt="preview" src={form.imageData}/> : 'No image'}</div>
                <input type="file" accept="image/*" onChange={onFile}/>
              </div>
            </label>
          </div>
          <div className="form-actions">
            <button className="primary" type="submit">{editing ? 'Update Player' : 'Save Player'}</button>
            <button className="neutral" type="button" onClick={()=>{setEditing(null); setForm({name:'', positions:'', pool:'A', imageData:null})}}>Clear</button>
          </div>
        </form>

        <div className="list">
          {state.players.length===0 && <p className="empty">No players yet. Add your first player above.</p>}
          {state.players.map(p => (
            <div key={p.id} className="player-card">
              <div className="player-avatar">{p.imageData ? <img src={p.imageData} alt="avatar"/> : (p.name||'?').slice(0,2).toUpperCase()}</div>
              <div className="player-main">
                <div className="player-content">
                  <h3 className="player-name">{p.name}</h3>
                  <p className="player-meta">
                    Roles: {p.positions.join(', ')||'-'} • Group: {POOLS.find(pool => pool.key === p.pool)?.title || '-'} • Base: {Number(p.basePrice||0).toLocaleString()}
                  </p>
                  <p className="player-meta">Status: {p.status}</p>
                </div>
              </div>
              <div className="player-actions">
                <button className="ghost" onClick={()=>onEdit(p)}>Edit</button>
                <button className="danger ghost" onClick={()=>dispatch({type:'DELETE_PLAYER', payload: p.id})}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}