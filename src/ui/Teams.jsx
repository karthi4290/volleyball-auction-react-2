import React, { useContext, useMemo, useState } from 'react'
import { AppContext } from './App'

const DEFAULT_BUDGET = 30000000

export default function Teams(){
  const { state, dispatch, uid } = useContext(AppContext)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name:'', imageData:null })

  const spentByTeam = useMemo(() => {
    const out = Object.fromEntries(state.teams.map(t => [t.id, 0]))
    for (const p of state.players){
      if (p.status==='sold' && p.teamId && p.price){
        out[p.teamId] = (out[p.teamId]||0) + Number(p.price)
      }
    }
    return out
  }, [state.players, state.teams])

  const remaining = (t) => (Number(t.budget)||0) - (spentByTeam[t.id]||0)

  function onFile(e){
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setForm(prev => ({...prev, imageData: reader.result}))
    reader.readAsDataURL(f)
  }

  function onSubmit(e){
    e.preventDefault()
    const payload = {
      id: editing?.id ?? uid('team'),
      name: form.name.trim(),
      budget: DEFAULT_BUDGET,
      imageData: form.imageData || null
    }
    dispatch({ type: 'UPSERT_TEAM', payload })
    setEditing(null); setForm({ name:'', imageData:null })
  }

  function onEdit(t){
    setEditing(t)
    setForm({ name: t.name, imageData: t.imageData || null })
  }

  return (
    <section className="panel">
      <div className="panel-head"><h2>Teams</h2></div>
      <div className="panel-body">
        <form className="form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>Team Name</span>
              <input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} required placeholder="E.g. Thunderbolts"/>
            </label>
            <label className="form-field image-field">
              <span>Team Crest</span>
              <div className="image-picker">
                <div className="image-preview">{form.imageData ? <img alt="preview" src={form.imageData}/> : 'No image'}</div>
                <input type="file" accept="image/*" onChange={onFile}/>
              </div>
            </label>
          </div>
          <div className="form-actions">
            <button className="primary" type="submit">{editing ? 'Update Team' : 'Save Team'}</button>
            <button className="neutral" type="button" onClick={()=>{setEditing(null); setForm({name:'', imageData:null})}}>Clear</button>
          </div>
        </form>

        <div className="list">
          {state.teams.length===0 && <p className="empty">No teams yet. Add your first team above.</p>}
          {state.teams.map(t => (
            <div key={t.id} className="team-card">
              <div className="team-main">
                <div className="team-avatar">{t.imageData ? <img src={t.imageData} alt="crest"/> : (t.name||'?').slice(0,2).toUpperCase()}</div>
                <div className="team-content">
                  <h3 className="team-name">{t.name}</h3>
                  <p className="team-budget">Budget: {DEFAULT_BUDGET.toLocaleString()}</p>
                </div>
              </div>
              <div className="team-meta"><span className="badge remaining">Remaining: {remaining(t).toLocaleString()}</span></div>
              <div className="team-actions">
                <button className="ghost" onClick={()=>onEdit(t)}>Edit</button>
                <button className="danger ghost" onClick={()=>dispatch({type:'DELETE_TEAM', payload: t.id})}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}