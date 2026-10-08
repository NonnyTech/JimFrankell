import { useRef, useState } from 'react';
import { storeRequest } from '../services/storeService.js';
import { cartMessage } from '../utils/whatsapp.js';
import { formatCurrency as money } from '../utils/currency.js';
import { WhatsAppButton } from './UI.jsx';
import '../styles/orders.css';

export default function OrderCheckout({ items, total }) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const retry = useRef(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);
  const [fulfilment, setFulfilment] = useState('delivery');
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      customer: { name: form.get('name'), phone: form.get('phone'), fulfilment,
        address: form.get('address') || '', installation: form.get('installation'), notes: form.get('notes') || '' },
      items: items.map(item => ({ id: item.product.id, kva: item.kva ?? null, quantity: item.quantity, expectedPrice: item.product.price })),
      consent: form.get('consent') === 'on', website: form.get('website') || '',
    };
    try {
      const signature = JSON.stringify(payload);
      if (retry.current?.signature !== signature) {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signature));
        const hash = [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
        let requestKey;
        try { const stored = JSON.parse(sessionStorage.getItem('jf-order-request') || 'null'); if (stored?.hash === hash) requestKey = stored.key; } catch { /* Storage is optional. */ }
        requestKey ||= crypto.randomUUID();
        retry.current = { signature, requestKey };
        try { sessionStorage.setItem('jf-order-request', JSON.stringify({ hash, key: requestKey })); } catch { /* Keep in memory. */ }
      }
      const result = await storeRequest('orders', { method: 'POST', body: { ...payload, requestKey: retry.current.requestKey } });
      setSaved(result.order);
    } catch (failure) { setError(failure.message); }
    finally { lock.current = false; setBusy(false); }
  }
  if (saved) {
    const message = cartMessage(saved.items.map(item => ({ product: item, quantity: item.quantity })), {
      reference: saved.reference, customerName: saved.customer.name, phone: saved.customer.phone,
      location: saved.customer.fulfilment === 'delivery' ? saved.customer.address : 'Collection from store',
      installation: saved.customer.installation, notes: saved.customer.notes,
    });
    return <aside className="order-summary saved-order">
      <h2>Order saved</h2>
      <p role="status">Your reference: <strong>{saved.reference}</strong></p>
      <p>Send your saved order to our team on WhatsApp to arrange confirmation and delivery.</p>
      <ul>{saved.items.map(item => <li key={`${item.productId}:${item.kva}`}>
        {item.name} × {item.quantity} — {money(item.subtotal)}
      </li>)}</ul>
      <p><strong>Product total: {money(saved.total)}</strong></p>
      <WhatsAppButton message={message} className="button green full">Send order on WhatsApp</WhatsAppButton>
      <p>No payment has been taken. Your order is awaiting confirmation.</p>
      <button className="button outline" onClick={() => { setSaved(null); retry.current = null; try { sessionStorage.removeItem('jf-order-request'); } catch {} }}>Start another order</button>
    </aside>;
  }
  return <aside className="order-summary">
    <h2>Complete your order</h2>
    <p>Product total: <strong>{items.some(item => item.product.price == null) ? 'Price confirmation required' : money(total)}</strong></p>
    <p>Delivery and installation charges will be confirmed separately. No payment is taken on this website.</p>
    <form className="order-checkout-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
        <label>Phone / WhatsApp number<input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={25} required /></label>
        <label>How would you like to receive your order?<select name="fulfilment" value={fulfilment} onChange={e => setFulfilment(e.target.value)}>
          <option value="delivery">Delivery</option><option value="pickup">Collect from store</option>
        </select></label>
        {fulfilment === 'delivery' && <label>Delivery address<textarea name="address" autoComplete="street-address" rows={3} minLength={10} maxLength={500} required placeholder="Street address, area and city" /></label>}
        <label>Do you need installation?<select name="installation"><option>Not sure yet</option><option>Yes, please include installation</option><option>No, products only</option></select></label>
        <label>Anything else? (optional)<textarea name="notes" rows={3} maxLength={600} /></label>
        <div hidden aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
        <label className="order-consent"><input type="checkbox" name="consent" required /> I agree that Jim-Frankell may store these details and contact me to process my order.</label>
        <button type="submit" className="button green full">{busy ? 'Saving order…' : 'Save order and continue'}</button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <p>Next, send your order and reference to our team on WhatsApp.</p>
    </form>
  </aside>;
}
