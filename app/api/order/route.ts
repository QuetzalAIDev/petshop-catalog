import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const db = getServerClient();
    if (!db) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    const body = await req.json();
    if (!body?.customer?.name || !body?.customer?.phone || !Array.isArray(body.items) || !body.items.length) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    const ids = body.items.map((item: any) => item.productId);
    const { data: products, error } = await db.from("products").select("id,name,price,stock,active").in("id", ids);
    if (error) throw error;
    const map = new Map((products || []).map((p: any) => [p.id, p]));
    let total = 0; const items: any[] = [];
    for (const item of body.items) {
      const product: any = map.get(item.productId); const quantity = Number(item.quantity);
      if (!product || !product.active || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) return NextResponse.json({ error: "Producto sin stock o inválido" }, { status: 400 });
      const subtotal = Number(product.price) * quantity; total += subtotal;
      items.push({ product_id: product.id, product_name: product.name, unit_price: product.price, quantity, subtotal });
    }
    const { data: order, error: orderError } = await db.from("orders").insert({ customer_name: body.customer.name, customer_phone: body.customer.phone, customer_email: body.customer.email || null, notes: body.customer.notes || null, status: "pending", total }).select("id,total").single();
    if (orderError) throw orderError;
    const { error: itemError } = await db.from("order_items").insert(items.map((item) => ({ ...item, order_id: order.id })));
    if (itemError) throw itemError;
    return NextResponse.json({ orderId: order.id, total: Number(order.total) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo registrar el pedido." }, { status: 500 });
  }
}
