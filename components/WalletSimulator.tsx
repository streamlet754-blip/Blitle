'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownLeft,
  ArrowDownUp,
  ArrowLeftRight,
  ArrowUpRight,
  Bitcoin,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  History,
  ShieldCheck,
  Wallet as WalletIcon,
  X,
} from 'lucide-react';

type AssetId = 'BTC' | 'ETH' | 'USDT';
type Transaction = {
  id: number;
  type: 'Sent' | 'Converted';
  asset: AssetId;
  amount: number;
  fee?: number;
  recipient?: string;
  reference?: string;
  time: Date;
};
type SendStep = 'form' | 'review' | 'complete';

const assets: Record<AssetId, { name: string; price: number; color: string; decimals: number }> = {
  BTC: { name: 'Bitcoin', price: 95000, color: 'bg-orange-400', decimals: 8 },
  ETH: { name: 'Ethereum', price: 3200, color: 'bg-indigo-400', decimals: 6 },
  USDT: { name: 'Tether', price: 1, color: 'bg-emerald-400', decimals: 2 },
};
const assetIds = Object.keys(assets) as AssetId[];
const simulatedFeeUsd = 1;

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCrypto(value: number, asset: AssetId) {
  return `${value.toFixed(assets[asset].decimals)} ${asset}`;
}

function AssetIcon({ asset, size = 'normal' }: { asset: AssetId; size?: 'normal' | 'small' }) {
  const classes = size === 'small' ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base';
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${classes} ${assets[asset].color} font-bold text-slate-950`}>
      {asset === 'BTC' ? <Bitcoin size={size === 'small' ? 19 : 23} /> : asset === 'ETH' ? '◆' : '₮'}
    </span>
  );
}

export function Wallet () {
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [balances, setBalances] = useState<Record<AssetId, number>>({
    BTC: 2650,
    ETH: 0,
    USDT: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modal, setModal] = useState<'send' | 'convert' | 'receive' | null>(null);
  const [sendAsset, setSendAsset] = useState<AssetId>('BTC');
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sendError, setSendError] = useState('');
  const [sendStep, setSendStep] = useState<SendStep>('form');
  const [sendReference, setSendReference] = useState('');
  const [convertFrom, setConvertFrom] = useState<AssetId>('BTC');
  const [convertTo, setConvertTo] = useState<AssetId>('ETH');
  const [convertAmount, setConvertAmount] = useState('');
  const [convertMessage, setConvertMessage] = useState('');
  const [copyStatus, setCopyStatus] = useState<'copied' | 'unavailable' | null>(null);

  const totalUsd = useMemo(() => assetIds.reduce((total, asset) => total + balances[asset], 0), [balances]);
  const availableCrypto = balances[sendAsset] / assets[sendAsset].price;
  const parsedSendAmount = Number(sendAmount);
  const sendValueUsd = parsedSendAmount * assets[sendAsset].price;
  const sendFeeCrypto = simulatedFeeUsd / assets[sendAsset].price;
  const sendCanProceed = parsedSendAmount > 0 && sendValueUsd + simulatedFeeUsd <= balances[sendAsset] + 1e-8;

  function openModal(kind: 'send' | 'convert' | 'receive') {
    setModal(kind);
    setSendError('');
    setConvertMessage('');
    if (kind === 'send') {
      setSendStep('form');
      setSendAmount('');
      setRecipient('');
      setSendReference('');
    }
  }

  function closeModal() {
    setModal(null);
    setSendError('');
    setConvertMessage('');
    setSendStep('form');
  }

  function submitSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipient.trim()) {
      setSendError('Add a recipient label to continue.');
      return;
    }
    if (!Number.isFinite(parsedSendAmount) || parsedSendAmount <= 0) {
      setSendError('Enter an amount greater than zero.');
      return;
    }
    if (!sendCanProceed) {
      setSendError('The amount and simulated network fee exceed this asset balance.');
      return;
    }

    setSendError('');
    setSendStep('review');
  }

  function confirmSimulatedSend() {
    if (!sendCanProceed || !recipient.trim()) {
      setSendStep('form');
      setSendError('Review the recipient and amount before continuing.');
      return;
    }

    const now = Date.now();
    const reference = `Demo-${now.toString(36).toUpperCase()}`;
    setBalances((current) => ({
      ...current,
      [sendAsset]: Math.max(0, current[sendAsset] - sendValueUsd - simulatedFeeUsd),
    }));
    setTransactions((current) => [{
      id: now,
      type: 'Sent',
      asset: sendAsset,
      amount: parsedSendAmount,
      fee: sendFeeCrypto,
      recipient: recipient.trim(),
      reference,
      time: new Date(),
    }, ...current]);
    setSendReference(reference);
    setSendStep('complete');
  }

  function submitConvert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountUsd = Number(convertAmount);
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      setConvertMessage('Enter an amount greater than zero.');
      return;
    }
    if (convertFrom === convertTo) {
      setConvertMessage('Choose two different assets.');
      return;
    }
    if (amountUsd > balances[convertFrom]) {
      setConvertMessage(`Not enough ${convertFrom} in this simulated balance.`);
      return;
    }

    setBalances((current) => ({
      ...current,
      [convertFrom]: Math.max(0, current[convertFrom] - amountUsd),
      [convertTo]: current[convertTo] + amountUsd,
    }));
    setTransactions((current) => [{
      id: Date.now(),
      type: 'Converted',
      asset: convertTo,
      amount: amountUsd / assets[convertTo].price,
      time: new Date(),
    }, ...current]);
    setConvertMessage(`Converted ${formatUsd(amountUsd)} to ${formatCrypto(amountUsd / assets[convertTo].price, convertTo)} (simulation).`);
    setConvertAmount('');
  }

  async function copyDemoId() {
    try {
      await navigator.clipboard.writeText('blitle-Demo-wallet');
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus(null), 1600);
    } catch {
      setCopyStatus('unavailable');
    }
  }

  if (!isDemoSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b12] px-5 py-12 text-slate-100">
        <section className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#10141d] p-7 shadow-2xl shadow-black/30 sm:p-9">
          <div className="mb-7 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-300 to-amber-500 text-slate-950">
              <WalletIcon size={22} />
            </span>
            <span className="text-lg font-semibold tracking-tight">blitle<span className="text-orange-400">.</span></span>
          </div>
          <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
            Demo mode
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Open the sample wallet</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Explore a simulated account showing $2,650 in sample BTC value. No account or credentials are needed.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-400/10 bg-amber-400/[0.04] p-4 text-xs leading-5 text-amber-100/80">
            This is not a real wallet. Never enter a recovery phrase, private key, or password here. Demo sends only change this page’s sample balance and history.
          </div>
          <button
            type="button"
            onClick={() => setIsDemoSession(true)}
            className="mt-6 h-12 w-full rounded-xl bg-orange-400 text-sm font-semibold text-slate-950 transition hover:bg-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-[#10141d]"
          >
            Continue to Demo wallet
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b12] text-slate-100">
      <header className="border-b border-white/[0.07] bg-[#0b0e16]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="Blitle Wallet Demo home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-300 to-amber-500 text-slate-950 shadow-lg shadow-orange-500/10">
              <WalletIcon size={21} />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">blitle<span className="text-orange-400">.</span></span>
          </a>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Demo mode
            </span>
            <button type="button" onClick={copyDemoId} className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 sm:flex">
              {copyStatus === 'copied' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copyStatus === 'copied' ? 'Copied' : copyStatus === 'unavailable' ? 'Copy unavailable' : 'Demo wallet ID'}
            </button>
            <button type="button" onClick={() => setIsDemoSession(false)} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:text-white">
              Exit Demo
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-12 pt-6 sm:px-8 sm:pt-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">My wallet</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[30px]">Welcome back</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
            <ShieldCheck size={15} className="text-emerald-400" />
            No real funds or transactions
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#171b25] via-[#11151e] to-[#17150f] p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-orange-400/[0.08] blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Total balance <span className="ml-1 text-slate-600">ⓘ</span></p>
                <span className="rounded-full border border-white/[0.08] bg-black/10 px-3 py-1.5 text-[11px] font-medium text-slate-400">USD estimate</span>
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{formatUsd(totalUsd)}</p>
              <p className="mt-2 text-sm text-slate-500">Your Demo portfolio value</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => openModal('send')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-orange-300">
                  <ArrowUpRight size={17} /> Send
                </button>
                <button type="button" onClick={() => openModal('receive')} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                  <ArrowLeftRight size={17} /> Swap
                </button>
                <button type="button" onClick={() => openModal('convert')} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                  <ArrowDownLeft size={17} /> Receive
                </button>
              </div>
              <p className="mt-5 max-w-lg text-xs leading-5 text-slate-500">
                Demo actions only. Nothing is sent, received, or exchanged on a blockchain.
              </p>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/[0.08] bg-[#10141d] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Quick tips</h2>
              <CircleHelp size={17} className="text-slate-500" />
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300"><ArrowDownUp size={17} /></span>
                <div>
                  <p className="text-sm font-medium text-slate-200">Try a conversion</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Swap between Demo assets at fixed sample prices.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><Clock3 size={17} /></span>
                <div>
                  <p className="text-sm font-medium text-slate-200">Explore the activity list</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Simulated sends appear as “Sent” in your history.</p>
                </div>
              </div>
              <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-200/80">
                This is a portfolio UI Demo, not a real wallet. Never enter a seed phrase or pay a fee here.
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10141d]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div>
                <h2 className="font-semibold text-white">Your assets</h2>
                <p className="mt-1 text-xs text-slate-500">Sample prices · values update with Demo actions</p>
              </div>
              <button type="button" onClick={() => openModal('convert')} className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-300 transition hover:text-orange-200">
                Convert <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {assetIds.map((asset) => {
                const amount = balances[asset] / assets[asset].price;
                return (
                  <div key={asset} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <AssetIcon asset={asset} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-100">{assets[asset].name}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatCrypto(amount, asset)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums text-slate-100">{formatUsd(balances[asset])}</p>
                      <p className="mt-1 text-xs text-slate-500">1 {asset} = {formatUsd(assets[asset].price)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10141d]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div>
                <h2 className="font-semibold text-white">Recent activity</h2>
                <p className="mt-1 text-xs text-slate-500">Local Demo history</p>
              </div>
              <History size={17} className="text-slate-500" />
            </div>
            {transactions.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-500"><History size={21} /></span>
                <p className="mt-4 text-sm font-medium text-slate-300">Nothing here yet</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Try a Demo send or conversion to see it in your activity.</p>
              </div>
            ) : (
              <div className="max-h-[370px] divide-y divide-white/[0.05] overflow-y-auto">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <AssetIcon asset={transaction.asset} size="small" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200">{transaction.type}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {transaction.type === 'Sent' ? `To ${transaction.recipient}` : `To ${transaction.asset}`}
                        </p>
                        {transaction.reference ? <p className="mt-1 font-mono text-[10px] text-slate-600">{transaction.reference}</p> : null}
                        <p className="mt-1 text-[11px] text-slate-600">{transaction.time.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums text-slate-200">{transaction.type === 'Converted' ? '+' : '-'}{formatCrypto(transaction.amount, transaction.asset)}</p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        <Check size={11} /> {transaction.type === 'Sent' ? 'Sent · Demo' : 'Converted'}
                      </span>
                      {transaction.fee ? <p className="mt-1 text-[10px] text-slate-600">Demo fee {formatCrypto(transaction.fee, transaction.asset)}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[11px] leading-5 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Blitle Wallet Demo · Simulated balances, prices, fees, and history</span>
          <span>Nothing in this Demo connects to a wallet or blockchain.</span>
        </footer>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="my-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#121722] p-5 shadow-2xl shadow-black/50 sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <span className="mb-3 inline-flex rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">Simulation only</span>
                <h2 id="modal-title" className="text-xl font-semibold text-white">{modal === 'send' ? sendStep === 'review' ? 'Review simulated send' : sendStep === 'complete' ? 'Demo send complete' : 'Send Demo assets' : modal === 'convert' ? 'Convert assets' : 'Receive Demo assets'}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{modal === 'send' ? 'No blockchain transaction will be created.' : modal === 'convert' ? 'Sample-price conversion; no real exchange takes place.' : 'This Demo cannot receive real crypto.'}</p>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"><X size={18} /></button>
            </div>

            {modal === 'send' ? (
              sendStep === 'form' ? (
              <form onSubmit={submitSend} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-300">Asset</span>
                  <span className="relative block">
                    <select value={sendAsset} onChange={(event) => setSendAsset(event.target.value as AssetId)} className="h-12 w-full appearance-none rounded-xl border border-white/[0.09] bg-[#0c1018] px-4 pr-10 text-sm text-white outline-none focus:border-orange-400/60">
                      {assetIds.map((asset) => <option key={asset} value={asset}>{assets[asset].name} ({asset}) · {formatUsd(balances[asset])} available</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-300">Recipient address or label</span>
                  <input value={recipient} onChange={(event) => setRecipient(event.target.value)} maxLength={100} placeholder="Paste an address or enter a Demo label" className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#0c1018] px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-400/60" />
                  <span className="mt-1.5 block text-[11px] leading-5 text-slate-600">Stored only in this page’s temporary Demo history. Never enter a seed phrase or private key.</span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-300">Amount</span>
                  <span className="relative block">
                    <input type="number" min="0" step="any" value={sendAmount} onChange={(event) => setSendAmount(event.target.value)} placeholder="0.00" className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#0c1018] px-4 pr-16 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-400/60" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">{sendAsset}</span>
                  </span>
                  <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                    <span>Available {formatCrypto(availableCrypto, sendAsset)}</span>
                    <button type="button" onClick={() => setSendAmount(Math.max(0, availableCrypto - sendFeeCrypto).toFixed(assets[sendAsset].decimals))} className="font-medium text-orange-300 hover:text-orange-200">Max (after fee)</button>
                  </div>
                </label>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Estimated network fee</span>
                    <span className="font-medium text-slate-200">{formatUsd(simulatedFeeUsd)} <span className="text-slate-500">({formatCrypto(sendFeeCrypto, sendAsset)})</span></span>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-slate-600">Demo estimate only. No fee is charged or collected.</p>
                </div>
                {sendAmount && Number.isFinite(parsedSendAmount) && parsedSendAmount > 0 ? (
                  <div className="flex justify-between px-1 text-xs text-slate-400">
                    <span>Amount + Demo fee</span><span>{formatUsd(sendValueUsd + simulatedFeeUsd)}</span>
                  </div>
                ) : null}
                {sendError ? <p role="alert" className="text-xs text-rose-300">{sendError}</p> : null}
                <button type="submit" className="h-12 w-full rounded-xl bg-orange-400 text-sm font-semibold text-slate-950 transition hover:bg-orange-300">Review send</button>
              </form>
            ) : sendStep === 'review' ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.07] bg-[#0c1018] p-4">
                  <p className="text-center text-xs text-slate-500">You are simulating a send of</p>
                  <p className="mt-2 text-center text-2xl font-semibold tabular-nums text-white">{formatCrypto(parsedSendAmount, sendAsset)}</p>
                  <p className="mt-1 text-center text-sm text-slate-400">{formatUsd(sendValueUsd)}</p>
                  <div className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-xs">
                    <div className="flex justify-between gap-4"><span className="text-slate-500">To</span><span className="max-w-[70%] break-all text-right text-slate-200">{recipient}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="text-slate-200">{assets[sendAsset].name} · Demo only</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Estimated network fee</span><span className="text-slate-200">{formatUsd(simulatedFeeUsd)} ({formatCrypto(sendFeeCrypto, sendAsset)})</span></div>
                    <div className="flex justify-between border-t border-white/[0.07] pt-3 font-semibold"><span className="text-slate-300">Total balance change</span><span className="text-white">{formatUsd(sendValueUsd + simulatedFeeUsd)}</span></div>
                  </div>
                </div>
                <p className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-200/80">
                  Final Demo check: this will only update the on-screen balance and history. Nothing is broadcast and no fee is charged.
                </p>
                {sendError ? <p role="alert" className="text-xs text-rose-300">{sendError}</p> : null}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setSendStep('form')} className="h-12 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white transition hover:bg-white/[0.08]">Back</button>
                  <button type="button" onClick={confirmSimulatedSend} className="h-12 rounded-xl bg-orange-400 text-sm font-semibold text-slate-950 transition hover:bg-orange-300">Send (simulation)</button>
                </div>
              </div>
            ) : sendStep === 'complete' ? (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"><Check size={26} /></div>
                <div>
                  <p className="text-lg font-semibold text-white">Sent in simulation</p>
                  <p className="mt-1 text-sm text-slate-400">{formatCrypto(parsedSendAmount, sendAsset)} to {recipient}</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#0c1018] px-4 py-3 text-left">
                  <p className="text-[11px] text-slate-500">Demo reference (not a transaction hash)</p>
                  <p className="mt-1 break-all font-mono text-sm text-slate-200">{sendReference}</p>
                  <p className="mt-2 text-[11px] leading-5 text-amber-200/70">No blockchain transaction was created. This reference cannot be used to verify a payment.</p>
                </div>
                <button type="button" onClick={closeModal} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white transition hover:bg-white/[0.08]">Done</button>
              </div>
              ) : null
            ) : modal === 'convert' ? (
              <form onSubmit={submitConvert} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-300">From</span>
                  <span className="relative block">
                    <select value={convertFrom} onChange={(event) => {
                      const next = event.target.value as AssetId;
                      setConvertFrom(next);
                      if (convertTo === next) setConvertTo(assetIds.find((asset) => asset !== next)!);
                      setConvertMessage('');
                    }} className="h-12 w-full appearance-none rounded-xl border border-white/[0.09] bg-[#0c1018] px-4 pr-10 text-sm text-white outline-none focus:border-orange-400/60">
                      {assetIds.map((asset) => <option key={asset} value={asset}>{assets[asset].name} ({asset}) · {formatUsd(balances[asset])}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  </span>
                </label>
                <div className="relative">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-slate-300">Amount in USD</span>
                    <span className="relative block">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
                      <input type="number" min="0" step="0.01" value={convertAmount} onChange={(event) => setConvertAmount(event.target.value)} placeholder="0.00" className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#0c1018] pl-8 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-400/60" />
                    </span>
                    <span className="mt-1.5 block text-[11px] text-slate-600">Available: {formatUsd(balances[convertFrom])}</span>
                  </label>
                  <button type="button" aria-label="Switch conversion assets" onClick={() => {
                    setConvertFrom(convertTo);
                    setConvertTo(convertFrom);
                    setConvertMessage('');
                  }} className="absolute -bottom-[27px] left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-xl border border-white/10 bg-[#1a202b] text-orange-300 transition hover:bg-[#242b38]"><ArrowDownUp size={16} /></button>
                </div>
                <label className="block pt-3">
                  <span className="mb-2 block text-xs font-medium text-slate-300">To</span>
                  <span className="relative block">
                    <select value={convertTo} onChange={(event) => {
                      setConvertTo(event.target.value as AssetId);
                      setConvertMessage('');
                    }} className="h-12 w-full appearance-none rounded-xl border border-white/[0.09] bg-[#0c1018] px-4 pr-10 text-sm text-white outline-none focus:border-orange-400/60">
                      {assetIds.filter((asset) => asset !== convertFrom).map((asset) => <option key={asset} value={asset}>{assets[asset].name} ({asset}) · 1 {asset} = {formatUsd(assets[asset].price)}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  </span>
                </label>
                {convertAmount && Number(convertAmount) > 0 && convertFrom !== convertTo ? (
                  <p className="rounded-xl bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
                    Estimated receive: <span className="font-medium text-white">{formatCrypto(Number(convertAmount) / assets[convertTo].price, convertTo)}</span>
                  </p>
                ) : null}
                {convertMessage ? <p role="status" className={`text-xs ${convertMessage.startsWith('Converted') ? 'text-emerald-300' : 'text-rose-300'}`}>{convertMessage}</p> : null}
                {convertMessage.startsWith('Converted') ? (
                  <button type="button" onClick={closeModal} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white transition hover:bg-white/[0.08]">Done</button>
                ) : (
                  <button type="submit" className="h-12 w-full rounded-xl bg-orange-400 text-sm font-semibold text-slate-950 transition hover:bg-orange-300">Convert (simulation)</button>
                )}
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.07] bg-[#0c1018] p-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/10 text-orange-300"><WalletIcon size={22} /></div>
                  <p className="mt-4 text-xs text-slate-500">Demo wallet ID</p>
                  <p className="mt-1 font-mono text-sm text-slate-200">blitle-Demo-wallet</p>
                  <button type="button" onClick={copyDemoId} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.05]">
                    {copyStatus === 'copied' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copyStatus === 'copied' ? 'Copied' : copyStatus === 'unavailable' ? 'Copy unavailable' : 'Copy Demo ID'}
                  </button>
                </div>
                <p className="text-center text-xs leading-5 text-slate-500">This is a display-only identifier. No address is generated and no funds can be received.</p>
                <button type="button" onClick={closeModal} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white transition hover:bg-white/[0.08]">Done</button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
