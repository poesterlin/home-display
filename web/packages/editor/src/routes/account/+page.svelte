<script lang="ts">
  import { goto } from "$app/navigation";
  import * as mdiIcons from "@mdi/js";

  let { data } = $props();

  let balance = $state(data.balance);
  const checkoutStatus = $derived(data.checkoutStatus);
  let purchasing = $state<string | null>(null);
  let error = $state<string | null>(null);

  const packs = $derived([
    {
      name: "Starter",
      credits: 10,
      price: "$5",
      priceId: "price_1TeAvHAhO1kA3vuNbGO8y87n",
      priceKey: "10_builds",
      unitPrice: "$0.50",
    },
    {
      name: "Builder",
      credits: 50,
      price: "$20",
      priceId: "price_1TeAwuAhO1kA3vuNUUXVhx4e",
      priceKey: "50_builds",
      unitPrice: "$0.40",
      popular: true,
    },
    {
      name: "Pro",
      credits: 200,
      price: "$60",
      priceId: "price_1TeAy1AhO1kA3vuNfqw8gfpJ",
      priceKey: "200_builds",
      unitPrice: "$0.30",
    },
  ]);

  async function buyPack(pack: { priceId: string; priceKey: string; credits: number }) {
    purchasing = pack.priceKey;
    error = null;

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: pack.priceId,
          priceKey: pack.priceKey,
          credits: pack.credits,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Checkout failed");

      window.location.href = json.url;
    } catch (err: any) {
      error = err.message;
      purchasing = null;
    }
  }
</script>

<div class="account-page">
  <header class="account-header">
    <a href="/" class="back-link">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d={mdiIcons.mdiArrowLeft} />
      </svg>
      Back to Projects
    </a>
  </header>

  <main class="account-content">
    {#if checkoutStatus === "success"}
      <div class="toast success">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d={mdiIcons.mdiCheckCircle} fill="#4caf50" />
        </svg>
        Payment successful! Credits will appear shortly.
      </div>
    {:else if checkoutStatus === "cancelled"}
      <div class="toast muted">
        Checkout cancelled. Your credits remain unchanged.
      </div>
    {/if}

    {#if error}
      <div class="toast error">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d={mdiIcons.mdiAlertCircle} fill="#f44336" />
        </svg>
        {error}
      </div>
    {/if}

    <div class="balance-card">
      <div class="balance-label">Available Credits</div>
      <div class="balance-amount">{balance}</div>
      <div class="balance-sub">1 credit = 1 firmware build</div>
    </div>

    <h2>Get More Credits</h2>

    <div class="packs-grid">
      {#each packs as pack}
        <div class="pack-card" class:popular={pack.popular}>
          {#if pack.popular}
            <div class="popular-badge">Best Value</div>
          {/if}
          <div class="pack-name">{pack.name}</div>
          <div class="pack-credits">{pack.credits} builds</div>
          <div class="pack-price">{pack.price}</div>
          <div class="pack-unit">({pack.unitPrice} per build)</div>
          <button
            class="buy-btn"
            class:popular-btn={pack.popular}
            disabled={purchasing === pack.priceKey}
            onclick={() => buyPack(pack)}
          >
            {#if purchasing === pack.priceKey}
              Redirecting...
            {:else}
              Buy {pack.name}
            {/if}
          </button>
        </div>
      {/each}
    </div>
  </main>
</div>

<style>
  .account-page {
    min-height: 100vh;
    background: var(--color-bg-primary);
    color: #fff;
  }

  .account-header {
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--color-border);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color var(--transition-fast);
  }

  .back-link:hover {
    color: #fff;
  }

  .account-content {
    max-width: 700px;
    margin: 0 auto;
    padding: 3rem 2rem;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }

  .toast.success {
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.25);
    color: #81c784;
  }

  .toast.muted {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--color-text-secondary);
  }

  .toast.error {
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.25);
    color: #ef9a9a;
  }

  .balance-card {
    text-align: center;
    padding: 2.5rem;
    background: linear-gradient(135deg, #1e1e2e 0%, #1a1a2e 100%);
    border: 1px solid rgba(74, 158, 254, 0.15);
    border-radius: 1rem;
    margin-bottom: 3rem;
  }

  .balance-label {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
  }

  .balance-amount {
    font-size: 3.5rem;
    font-weight: 800;
    color: var(--color-accent);
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .balance-sub {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1.25rem;
  }

  .packs-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .pack-card {
    position: relative;
    background: #1e1e1e;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    padding: 1.5rem;
    text-align: center;
    transition: border-color var(--transition-normal);
  }

  .pack-card.popular {
    border-color: rgba(74, 158, 254, 0.3);
    background: linear-gradient(180deg, #1e1e2e 0%, #1a1a2e 100%);
  }

  .popular-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-accent);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
  }

  .pack-name {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .pack-credits {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--color-accent);
    margin-bottom: 0.25rem;
  }

  .pack-price {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .pack-unit {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: 1rem;
  }

  .buy-btn {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.75rem;
    background: transparent;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .buy-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .buy-btn.popular-btn {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }

  .buy-btn.popular-btn:hover:not(:disabled) {
    background: var(--color-accent-hover);
  }

  .buy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    .packs-grid {
      grid-template-columns: 1fr;
    }

    .account-content {
      padding: 2rem 1rem;
    }
  }
</style>
