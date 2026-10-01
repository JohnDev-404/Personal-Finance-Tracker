import { useMemo, useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import * as transactionApi from '../api/transaction.api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Spinner from '../components/Spinner';

export default function TransactionsPage() {
  const { categories } = useCategories();

  const [filters, setFilters] = useState({ type: '', categoryId: '', page: 1, limit: 20 });
  // Strip empty values so we don't send ?type=&categoryId= on the wire.
  const activeFilters = useMemo(() => {
    const f = { page: filters.page, limit: filters.limit };
    if (filters.type) f.type = filters.type;
    if (filters.categoryId) f.categoryId = filters.categoryId;
    return f;
  }, [filters]);

  const { items, pagination, loading, error, refetch } = useTransactions(activeFilters);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const noCategories = categories.length === 0;

  function openCreate() {
    if (noCategories) return;
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(t) {
    setEditing(t);
    setFormOpen(true);
  }

  function closeForm() {
    if (submitting) return;
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      if (editing) {
        await transactionApi.updateTransaction(editing.id, values);
      } else {
        await transactionApi.createTransaction(values);
      }
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError('');
    try {
      await transactionApi.deleteTransaction(deleting.id);
      setDeleting(null);
      await refetch();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete transaction');
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button
          onClick={openCreate}
          disabled={noCategories}
          title={noCategories ? 'Create a category first' : undefined}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          + New transaction
        </button>
      </div>

      {noCategories && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-3 py-2">
          You need at least one category before adding transactions.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          value={filters.type}
          onChange={(e) => setFilter('type', e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>

        <select
          value={filters.categoryId}
          onChange={(e) => setFilter('categoryId', e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />
      <ErrorBanner message={error} />

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No transactions"
          message={
            noCategories
              ? 'Create a category first, then come back here.'
              : 'Add your first income or expense.'
          }
          action={
            !noCategories && (
              <button
                onClick={openCreate}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
              >
                + New transaction
              </button>
            )
          }
        />
      ) : (
        <>
          <TransactionList items={items} onEdit={openEdit} onDelete={setDeleting} />
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>
                Page {pagination.page} of {pagination.pages} · {pagination.total} total
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                  className="px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  className="px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit transaction' : 'New transaction'}
      >
        <TransactionForm
          initial={editing}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete transaction"
        message={`Delete this ${deleting?.type?.toLowerCase() || ''} of ${deleting?.amount ?? ''}? This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
      />
    </div>
  );
}