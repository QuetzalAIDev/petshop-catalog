"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function Admin() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  const [products, setProducts] = useState<any[]>([]); const [form, setForm] = useState<any>({ name: "", description: "", price: "", stock: 0, category: "Perros", image_url: "🐾", active: true }); const [edit, setEdit] = useState<string | null>(null);
  const client = () => getSupabaseBrowserClient();
  async function load() { const db = client(); if (!db) return; const { data } = await db.from("products").select("*").order("created_at", { ascending: false }); setProducts(data || []); }
  useEffect(() => { const db = client(); if (!db) return; db.auth.getSession().then(({ data }) => { if (data.session?.user.app_metadata?.role === "admin") { setSession(data.session); load(); } }); }, []);
  async function login() { const db = client(); if (!db) return setError("Configura Supabase en Vercel para habilitar el acceso."); const { data, error: authError } = await db.auth.signInWithPassword({ email, password }); if (authError || data.user?.app_metadata?.role !== "admin") return setError("Acceso de administrador requerido"); setSession(data.session); load(); }
  async function save() { const db = client(); if (!db) return; const payload = { ...form, price: Number(form.price), stock: Number(form.stock), slug: `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}` }; if (edit) await db.from("products").update(payload).eq("id", edit); else await db.from("products").insert(payload); setEdit(null); load(); }
  if (!session) return <main className="admin"><section className="hero"><h1>🔐 Administración</h1><p>Gestión de productos y catálogo.</p></section><div className="panel"><input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><br /><br /><input className="input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} /><br /><br /><button className="primary" onClick={login}>Entrar</button><p>{error}</p></div></main>;
  return <main className="admin"><div className="row"><h1>🐾 Administración</h1><button className="chip" onClick={() => client()?.auth.signOut().then(() => location.reload())}>Salir</button></div><section className="panel"><h2>{edit ? "Editar" : "Nuevo"} producto</h2><div className="formgrid">{["name", "description", "image_url", "price", "stock"].map((key) => <input className="input" key={key} placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}</div><br /><button className="primary" onClick={save}>Guardar</button></section><section className="panel"><table className="table"><thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th /></tr></thead><tbody>{products.map((p) => <tr key={p.id}><td>{p.image_url} {p.name}</td><td>${Number(p.price).toFixed(2)}</td><td>{p.stock}</td><td><button className="chip" onClick={() => { setEdit(p.id); setForm(p); }}>Editar</button></td></tr>)}</tbody></table></section></main>;
}
