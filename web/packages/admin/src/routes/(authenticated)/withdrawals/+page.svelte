<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  const currency = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  });

  const filters = [
    { value: 'confirmed', label: 'Needs action' },
    { value: 'processed', label: 'Processed' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' },
  ] as const;

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
  }

  function stripeSearchUrl(sessionId: string) {
    return `https://dashboard.stripe.com/search?query=${encodeURIComponent(sessionId)}`;
  }
</script>

<svelte:head>
  <title>Withdrawals - Admin</title>
</svelte:head>

<h2>Withdrawal Requests</h2>

<div class="workflow">
  <strong>Manual refund workflow</strong>
  <ol>
    <li>Refund the payment in the Stripe Dashboard (search by order ID).</li>
    <li>Deduct remaining credits on the user account if applicable.</li>
    <li>Mark the withdrawal as processed below.</li>
  </ol>
</div>

{#if form?.message}
  <p class="form-error">{form.message}</p>
{/if}

<div class="filters">
  {#each filters as filter}
    <a
      href="/withdrawals?status={filter.value}"
      class:active={data.statusFilter === filter.value}
    >
      {filter.label}
    </a>
  {/each}
</div>

<table style="margin-top: 16px;">
  <thead>
    <tr>
      <th>Confirmed</th>
      <th>Email</th>
      <th>Order ID</th>
      <th>Purchase</th>
      <th>Balance</th>
      <th>Status</th>
      <th>Notes</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each data.withdrawals as withdrawal}
      <tr>
        <td>{formatDate(withdrawal.confirmedAt)}</td>
        <td>
          <div>{withdrawal.email}</div>
          {#if withdrawal.userId}
            <a href="/users/{withdrawal.userId}" class="subtle-link">
              {withdrawal.username ?? withdrawal.userId}
            </a>
          {/if}
        </td>
        <td>
          <code class="order-id">{withdrawal.stripeSessionId}</code>
          <a href={stripeSearchUrl(withdrawal.stripeSessionId)} target="_blank" rel="noreferrer" class="subtle-link">
            Stripe
          </a>
        </td>
        <td>
          {#if withdrawal.creditsPurchased}
            {withdrawal.creditsPurchased} credits
            {#if withdrawal.amountPaid}
              ({currency.format(withdrawal.amountPaid)})
            {/if}
            <div class="subtle">{formatDate(withdrawal.purchasedAt)}</div>
          {:else}
            <span class="subtle">Not found</span>
          {/if}
        </td>
        <td>{withdrawal.currentBalance}</td>
        <td><span class="badge badge-{withdrawal.status}">{withdrawal.status}</span></td>
        <td class="notes-cell">
          {#if withdrawal.notes}
            {withdrawal.notes}
          {:else}
            <span class="subtle">—</span>
          {/if}
          {#if withdrawal.processedAt}
            <div class="subtle">Processed {formatDate(withdrawal.processedAt)}</div>
          {/if}
        </td>
        <td>
          {#if withdrawal.status === 'confirmed'}
            <form
              method="POST"
              action="?/markProcessed"
              use:enhance
              class="process-form"
            >
              <input type="hidden" name="id" value={withdrawal.id} />
              <input
                name="notes"
                type="text"
                placeholder="Optional note"
                aria-label="Processing note"
              />
              <button type="submit" class="primary">Mark processed</button>
            </form>
          {/if}
        </td>
      </tr>
    {/each}
    {#if data.withdrawals.length === 0}
      <tr>
        <td colspan="8" class="empty">No withdrawal requests in this view.</td>
      </tr>
    {/if}
  </tbody>
</table>

<style>
  h2 {
    margin-bottom: 16px;
    font-size: 22px;
  }

  .workflow {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 16px;
    margin-bottom: 16px;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }

  .workflow strong {
    color: var(--text-primary);
  }

  .workflow ol {
    margin: 8px 0 0 18px;
  }

  .filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filters a {
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-secondary);
    font-size: 13px;
    text-decoration: none;
  }

  .filters a:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
    text-decoration: none;
  }

  .filters a.active {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(74, 158, 254, 0.08);
  }

  .order-id {
    display: block;
    font-size: 11px;
    word-break: break-all;
    margin-bottom: 4px;
  }

  .subtle,
  .subtle-link {
    font-size: 12px;
    color: var(--text-muted);
  }

  .subtle-link {
    display: inline-block;
    margin-top: 2px;
  }

  .notes-cell {
    max-width: 220px;
    font-size: 13px;
  }

  .process-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 180px;
  }

  .process-form input {
    width: 100%;
  }

  .empty {
    color: var(--text-muted);
    text-align: center;
  }

  .form-error {
    color: var(--error);
    margin-bottom: 12px;
    font-size: 13px;
  }

  .badge-confirmed {
    background: var(--warning);
    color: #000;
  }

  .badge-processed {
    background: var(--success);
    color: #000;
  }

  .badge-pending {
    background: var(--accent);
    color: #000;
  }

  .badge-rejected {
    background: var(--error);
    color: #fff;
  }
</style>
