"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

type Product = { id: string; name: string; description: string | null; price: number; category: string; stock: number; image_url: string | null; active: boolean };
type CartItem = Product & { quantity: number };

const demoProducts: Product[] = [
  { id: "demo-dog", name: "Croquetas para Perro", description: "Alimento completo para perros.", price: 499, category: "Perros", stock: 10, image_url: "🐶", active: true },
  { id: "demo-cat", name: "Croquetas para Gato", description: "Nutrición diaria para gatos.", price: 429, category: "Gatos", stock: 10, image_url: "🐱", active: true },
  { id: "demo-bird", name: "Alimento para Aves", description: "Mezcla nutritiva para aves.", price: 189, category: "Aves", stock: 10, image_url: "🐦", active: true },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    client.from("products").select("*").eq("active", true).order("created_at").then(({ data }) => {
      if (data?.length) setProducts(data as Product[]);
    });
  }, []);

  const shown = useMemo(() => products.filter((p) =>
    (category === "Todos" || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())
  ), [products, query, category]);
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  function add(product: Product) {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) return items.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item);
      return [...items, { ...product, quantity: 1 }];
    });
  }

  async function order() {
    if (!customer.name || !customer.phone || !cart.length) return alert("Completa nombre, teléfono y agrega productos.");
    const response = await fetch("/api/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customer, items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })) }) });
    const data = await response.json();
    if (!response.ok) return alert(data.error || "No se pudo registrar el pedido.");
    window.open(`https://wa.me/525536600322?text=${encodeURIComponent(`Hola Quetzalli Pet Shop, quiero confirmar el pedido ${data.orderId} por $${data.total.toFixed(2)}`)}`, "_blank");
    setCart([]);
  }

  return <main className="shell">
    <section className="hero"><h1>🐾 Quetzalli Pet Shop</h1><p>Todo para consentir a perros, gatos y aves.</p></section>
    <div className="toolbar"><input placeholder="Buscar productos..." value={query} onChange={(e) => setQuery(e.target.value)} />{["Todos", "Perros", "Gatos", "Aves"].map((c) => <button className={`chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)} key={c}>{c}</button>)}</div>
    <div className="grid">{shown.map((p) => <article className="card" key={p.id}><div className="emoji">{p.image_url || "🐾"}</div><h3>{p.name}</h3><p>{p.description}</p><div className="row"><b className="price">${Number(p.price).toFixed(2)}</b><span>{p.stock} disponibles</span></div><br /><button className="add" disabled={!p.stock} onClick={() => add(p)}>Agregar</button></article>)}</div>
    {cart.length > 0 && <aside className="cart"><div className="row"><h2>Carrito</h2><b>${total.toFixed(2)}</b></div>{cart.map((item) => <div key={item.id}>{item.name} × {item.quantity}</div>)}<br /><input className="input" placeholder="Nombre" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /><br /><br /><input className="input" placeholder="Teléfono" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /><br /><br /><button className="primary" onClick={order}>Registrar pedido y abrir WhatsApp</button></aside>}
  </main>;
}
