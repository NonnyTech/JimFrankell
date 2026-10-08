import { useEffect, useRef, useState } from 'react';
import { formatCurrency as money } from '../utils/currency.js';
import '../styles/orders.css';
const statuses = ['new', 'confirmed', 'dispatched', 'completed', 'cancelled'];
export default function AdminOrders({ api }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('all');
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const version = useRef(0);
  async function load() {
    const current = ++version.current;
    setBusy(true); setError('');
    try {
      const result = await api('admin-orders', { query: { status, offset } });
      if (current === version.current) setOrders(result.orders);
    } catch (failure) { if (current === version.current) { setOrders([]); setError(failure.message); } }
    finally { if (current === version.current) setBusy(false); }
  }
  useEffect(() => { load(); return () => { version.current++; }; }, [status, offset]);
  async function update(event, order) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const next = new FormData(event.currentTarget).get('status');
      await api('admin-orders', { method: 'PATCH', body: { id: order.id, status: next, updatedAt: order.updated_at } });
      setNotice(`${order.reference} updated to ${next}.`);
      await load();
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  return <section className="admin-panel">
    <h2>Orders</h2>
    <p>New orders are saved requests. Confirm the customer, payment and delivery arrangements before updating their status.</p>
    <div className="admin-actions">
      <label>Order status <select disabled={busy} value={status} onChange={e => { setStatus(e.target.value); setOffset(0); }}><option value="all">All orders</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
      <button disabled={busy} onClick={load}>Refresh orders</button>
    </div>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {busy && <p>Loading…</p>}
    {!busy && !error && !orders.length && <p>No orders found.</p>}
    {orders.map(order => <article className="admin-order" key={order.id}>
      <h3>{order.reference}</h3><p><strong>{order.status}</strong> · {new Date(order.created_at).toLocaleString()}</p>
      <p>{order.customer.name} · <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></p>
      <p>{order.customer.fulfilment === 'delivery' ? order.customer.address : 'Collection from store'}</p>
      <p>Installation: {order.customer.installation}</p>
      {order.customer.notes && <p>Notes: {order.customer.notes}</p>}
      <ul className="admin-order-items">{order.items.map(item => <li key={`${item.productId}:${item.kva}`}>
        <img src={item.image} alt="" /><div><strong>{item.name}</strong><p>{item.quantity} × {money(item.price)} · {money(item.subtotal)}</p></div>
      </li>)}</ul>
      <p><strong>Product total: {money(order.total)}</strong> · Delivery and installation excluded</p>
      <form className="admin-actions" onSubmit={e => update(e, order)}>
        <label>Update status <select key={order.updated_at} name="status" defaultValue={order.status} disabled={busy}>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
        <button disabled={busy} type="submit">Save status</button>
      </form>
    </article>)}
    <div className="admin-actions"><button disabled={busy || !offset} onClick={() => setOffset(n => Math.max(0, n - 100))}>Previous orders</button><span>Page {offset / 100 + 1}</span><button disabled={busy || orders.length < 100} onClick={() => setOffset(n => n + 100)}>Next orders</button></div>
  </section>;
}
