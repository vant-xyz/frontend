export type ExplorerChain = "solana-mainnet" | "base-mainnet";

export interface TokenBalance {
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  logo_url: string;
  balance: string;
  quote: number;
  quote_rate: number;
  type: string;
  pretty_quote: string;
}

export interface BalancesData {
  address: string;
  chain_name: string;
  quote_currency: string;
  updated_at: string;
  items: TokenBalance[];
}

export interface Transaction {
  tx_hash: string;
  block_height: number;
  block_signed_at: string;
  from_address: string;
  to_address: string | null;
  value: string;
  fees_paid: string | null;
  gas_quote: number | null;
  successful: boolean;
}

export interface TransactionsData {
  address: string;
  chain_name: string;
  items: Transaction[];
  pagination: { page_number: number; page_size: number; has_more: boolean } | null;
}

export interface TransactionSummaryData {
  address: string;
  chain_name: string;
  items: Array<{
    total_count: number;
    earliest_transaction: { block_signed_at: string; tx_hash: string } | null;
    latest_transaction: { block_signed_at: string; tx_hash: string } | null;
  }>;
}

export interface SingleTransactionData {
  items: Transaction[];
}

async function explorerFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Request failed: ${res.status}`);
  return json as T;
}

export function getBalances(chain: ExplorerChain, address: string): Promise<BalancesData> {
  return explorerFetch<BalancesData>(
    `/api/explorer/balances?chain=${chain}&address=${encodeURIComponent(address)}`
  );
}

export function getTransactions(chain: ExplorerChain, address: string, page = 0): Promise<TransactionsData> {
  return explorerFetch<TransactionsData>(
    `/api/explorer/transactions?chain=${chain}&address=${encodeURIComponent(address)}&page=${page}`
  );
}

export function getTransactionSummary(chain: ExplorerChain, address: string): Promise<TransactionSummaryData> {
  return explorerFetch<TransactionSummaryData>(
    `/api/explorer/summary?chain=${chain}&address=${encodeURIComponent(address)}`
  );
}

export function getTransaction(chain: ExplorerChain, txHash: string): Promise<SingleTransactionData> {
  return explorerFetch<SingleTransactionData>(
    `/api/explorer/transaction?chain=${chain}&tx_hash=${encodeURIComponent(txHash)}`
  );
}
