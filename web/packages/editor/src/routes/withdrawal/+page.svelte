<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  let { data, form } = $props();

  const currency = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  });

  const step = $derived(
    form?.step === 'confirm'
      ? 'confirm'
      : form?.step === 'success'
        ? 'success'
        : data.step,
  );

  const token = $derived(form?.token ?? data.token ?? '');
  const alreadySubmitted = $derived(form?.alreadySubmitted ?? data.alreadySubmitted ?? false);
  const errorMessage = $derived(form?.message ?? data.error ?? null);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
</script>

<svelte:head>
  <title>Withdraw from contract – ESPHome Designer</title>
</svelte:head>

<div class="withdrawal-page">
  <header class="withdrawal-header">
    <a href="/intro" class="back-link">Back</a>
    <h1>Withdraw from contract</h1>
    <p class="subtitle">Exercise your right of withdrawal for a credit pack purchase</p>
  </header>

  <main class="withdrawal-content">
    {#if errorMessage}
      <div class="alert error">{errorMessage}</div>
    {/if}

    {#if step === 'identify'}
      <section class="card">
        <h2>Step 1: Identify your purchase</h2>
        <p>
          Enter the email address used for your account and the order ID from your Stripe receipt email
          (starts with <code>cs_</code>).
        </p>

        <form
          method="POST"
          action="?/identify"
          use:enhance={() => {
            return async ({ result }) => {
              if (result.type === 'success' && result.data?.step === 'confirm' && typeof result.data.token === 'string') {
                await goto(`/withdrawal?step=confirm&token=${encodeURIComponent(result.data.token)}`);
              } else if (result.type === 'success' && result.data?.step === 'success') {
                await goto('/withdrawal?step=success');
              }
            };
          }}
        >
          <div class="field">
            <label for="email">Email address</label>
            <input id="email" name="email" type="email" autocomplete="email" required />
          </div>

          <div class="field">
            <label for="orderId">Order ID (Stripe Checkout Session)</label>
            <input
              id="orderId"
              name="orderId"
              type="text"
              placeholder="cs_test_..."
              autocomplete="off"
              required
            />
          </div>

          <button type="submit" class="primary">Continue</button>
        </form>
      </section>
    {:else if step === 'confirm' && data.purchase}
      <section class="card">
        <h2>Step 2: Confirm withdrawal</h2>
        <p>Review your order details and confirm that you want to withdraw from this purchase.</p>

        <dl class="summary">
          <div>
            <dt>Order ID</dt>
            <dd><code>{data.purchase.stripeSessionId}</code></dd>
          </div>
          <div>
            <dt>Purchase date</dt>
            <dd>{formatDate(data.purchase.purchasedAt)}</dd>
          </div>
          <div>
            <dt>Pack</dt>
            <dd>{data.purchase.packName} ({data.purchase.creditsPurchased} credits)</dd>
          </div>
          <div>
            <dt>Amount paid</dt>
            <dd>{currency.format(data.purchase.amountPaid)}</dd>
          </div>
        </dl>

        {#if data.purchase.hasUsedCredits}
          <div class="alert warning">
            Some credits from this purchase may already have been used ({data.purchase.creditsConsumed} of
            {data.purchase.creditsPurchased}). Your withdrawal will be reviewed manually and any refund may
            be adjusted accordingly.
          </div>
        {/if}

        <form
          method="POST"
          action="?/confirm"
          use:enhance={() => {
            return async ({ result }) => {
              if (result.type === 'success' && result.data?.step === 'success') {
                await goto('/withdrawal?step=success');
              }
            };
          }}
        >
          <input type="hidden" name="token" value={token} />
          <button type="submit" class="danger">Confirm withdrawal</button>
        </form>

        <p class="helper">
          <a href="/withdrawal">Start over</a>
        </p>
      </section>
    {:else if step === 'success'}
      <section class="card success-card">
        <h2>Withdrawal received</h2>
        {#if alreadySubmitted}
          <p>
            A withdrawal request for this order has already been submitted. If you need help, contact
            <a href="mailto:support@esphome-designer.com">support@esphome-designer.com</a>.
          </p>
        {:else}
          <p>
            Your withdrawal has been recorded and a confirmation email has been sent to your inbox.
          </p>
          <p>
            Refund processing is handled manually and may take a few business days. You will be contacted if
            we need additional information.
          </p>
        {/if}
        <p class="helper">
          <a href="/terms">View Terms of Service</a>
        </p>
      </section>
    {/if}
  </main>
</div>

<style>
  .withdrawal-page {
    min-height: 100vh;
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
    color: #fff;
  }

  .withdrawal-header {
    margin-bottom: 2rem;
  }

  .back-link {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
  }

  .back-link:hover {
    color: #fff;
  }

  h1 {
    margin-top: 0.8rem;
    font-size: 1.8rem;
  }

  .subtitle {
    color: var(--color-text-muted);
    margin-top: 0.4rem;
  }

  .card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.9rem;
    padding: 1.25rem;
  }

  h2 {
    font-size: 1.05rem;
    margin-bottom: 0.6rem;
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.55;
    margin-bottom: 1rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  input {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 0.6rem;
    color: #fff;
    padding: 0.7rem 0.85rem;
    font: inherit;
  }

  input:focus {
    outline: none;
    border-color: rgba(74, 158, 254, 0.6);
  }

  button {
    border: none;
    border-radius: 0.65rem;
    padding: 0.75rem 1rem;
    font-weight: 600;
    cursor: pointer;
    font: inherit;
  }

  .primary {
    background: var(--color-accent);
    color: #fff;
    width: 100%;
  }

  .danger {
    background: #dc2626;
    color: #fff;
    width: 100%;
  }

  .summary {
    display: grid;
    gap: 0.75rem;
    margin: 1rem 0 1.25rem;
    padding: 0.9rem;
    border-radius: 0.65rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .summary div {
    display: grid;
    gap: 0.15rem;
  }

  dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  dd {
    margin: 0;
    color: #fff;
  }

  code {
    font-size: 0.85rem;
    word-break: break-all;
  }

  .alert {
    border-radius: 0.65rem;
    padding: 0.8rem 0.9rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .alert.error {
    color: #ff9d9d;
    background: rgba(244, 67, 54, 0.15);
    border: 1px solid rgba(244, 67, 54, 0.35);
  }

  .alert.warning {
    color: #f5d78e;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.35);
  }

  .success-card p {
    margin-bottom: 0.75rem;
  }

  .helper {
    margin-top: 1rem;
    margin-bottom: 0;
    font-size: 0.85rem;
  }

  .helper a {
    color: #9fd2ff;
  }

  a {
    color: #9fd2ff;
  }
</style>
