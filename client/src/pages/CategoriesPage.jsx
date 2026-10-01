import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import * as categoryApi from '../api/category.api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import CategoryForm from '../components/CategoryForm';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Spinner from '../components/Spinner';

export default function CategoriesPage() {
  const { categories, loading, error, refetch } = useCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category) {
    setEditing(category);
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
        await categoryApi.updateCategory(editing.id, values);
      } else {
        await categoryApi.createCategory(values);
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
      await categoryApi.deleteCategory(deleting.id);
      setDeleting(null);
      await refetch();
    } catch (err) {
      // Likely a 409 — category in use by transactions.
      setActionError(err.response?.data?.error || 'Failed to delete category');
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
        >
          + New category
        </button>
      </div>

      <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />
      <ErrorBanner message={error} />

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          message="Create one to start tagging your transactions."
          action={
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
            >
              + New category
            </button>
          }
        />
      ) : (
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-slate-100">{c.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        c.type === 'INCOME'
                          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                          : 'border-red-500/40 text-red-400 bg-red-500/10'
                      }`}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-emerald-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleting(c)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit category' : 'New category'}
      >
        <CategoryForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete category"
        message={`Delete "${deleting?.name}"? This can't be undone. If transactions still use it, the delete will be blocked.`}
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
      />
    </div>
  );
}