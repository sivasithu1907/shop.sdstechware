import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Category, Brand } from '../../types';
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Tag,
  Edit2,
  X,
  Loader2,
  Search,
} from 'lucide-react';

export const CategoryBrandManager: React.FC = () => {
  const {
    categories,
    brands,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    addBrand,
    updateBrand,
    deleteBrand,
    currentRole,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');

  // Search filters
  const [catSearch, setCatSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  // Category add inputs
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catActionError, setCatActionError] = useState<string | null>(null);
  const [catActionSuccess, setCatActionSuccess] = useState<string | null>(null);

  // Category edit state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [isSavingCatEdit, setIsSavingCatEdit] = useState(false);
  const [editCatError, setEditCatError] = useState<string | null>(null);

  // Brand add inputs
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [brandActionError, setBrandActionError] = useState<string | null>(null);
  const [brandActionSuccess, setBrandActionSuccess] = useState<string | null>(null);

  // Brand edit state
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandCountry, setEditBrandCountry] = useState('');
  const [isSavingBrandEdit, setIsSavingBrandEdit] = useState(false);
  const [editBrandError, setEditBrandError] = useState<string | null>(null);

  const canEdit = currentRole === 'owner' || currentRole === 'product_manager';

  // Category Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCatActionError(null);
    setCatActionSuccess(null);
    setIsAddingCat(true);

    const res = addCategory(newCatName, newCatDesc);
    setIsAddingCat(false);
    if (!res.success) {
      setCatActionError(res.error || 'Failed to add category');
    } else {
      const msg = `Category "${newCatName.trim()}" added.`;
      setCatActionSuccess(msg);
      showToast(msg);
      setNewCatName('');
      setNewCatDesc('');
      setTimeout(() => setCatActionSuccess(null), 3500);
    }
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setEditCatError(null);
  };

  const handleSaveEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setEditCatError(null);
    setIsSavingCatEdit(true);

    const res = updateCategory(editingCategory.id, editCatName, editCatDesc);
    setIsSavingCatEdit(false);
    if (!res.success) {
      setEditCatError(res.error || 'Failed to update category');
    } else {
      const msg = `Category updated to "${editCatName.trim()}".`;
      setCatActionSuccess(msg);
      showToast(msg);
      setEditingCategory(null);
      setTimeout(() => setCatActionSuccess(null), 3500);
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setCatActionError(null);
    setCatActionSuccess(null);
    const res = deleteCategory(id);
    if (!res.success) {
      setCatActionError(res.error || 'Failed to delete category');
    } else {
      const msg = `Category "${name}" removed.`;
      setCatActionSuccess(msg);
      showToast(msg);
      setTimeout(() => setCatActionSuccess(null), 3500);
    }
  };

  // Brand Handlers
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    setBrandActionError(null);
    setBrandActionSuccess(null);
    setIsAddingBrand(true);

    const res = addBrand(newBrandName, newBrandCountry);
    setIsAddingBrand(false);
    if (!res.success) {
      setBrandActionError(res.error || 'Failed to add brand');
    } else {
      const msg = `Brand "${newBrandName.trim()}" added.`;
      setBrandActionSuccess(msg);
      showToast(msg);
      setNewBrandName('');
      setNewBrandCountry('');
      setTimeout(() => setBrandActionSuccess(null), 3500);
    }
  };

  const handleStartEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setEditBrandName(brand.name);
    setEditBrandCountry(brand.country || '');
    setEditBrandError(null);
  };

  const handleSaveEditBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    setEditBrandError(null);
    setIsSavingBrandEdit(true);

    const res = updateBrand(editingBrand.id, editBrandName, editBrandCountry);
    setIsSavingBrandEdit(false);
    if (!res.success) {
      setEditBrandError(res.error || 'Failed to update brand');
    } else {
      const msg = `Brand updated to "${editBrandName.trim()}".`;
      setBrandActionSuccess(msg);
      showToast(msg);
      setEditingBrand(null);
      setTimeout(() => setBrandActionSuccess(null), 3500);
    }
  };

  const handleDeleteBrand = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete brand "${name}"?`)) return;
    setBrandActionError(null);
    setBrandActionSuccess(null);
    const res = deleteBrand(id);
    if (!res.success) {
      setBrandActionError(res.error || 'Failed to delete brand');
    } else {
      const msg = `Brand "${name}" removed.`;
      setBrandActionSuccess(msg);
      showToast(msg);
      setTimeout(() => setBrandActionSuccess(null), 3500);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(catSearch.toLowerCase()))
  );

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
    (b.country && b.country.toLowerCase().includes(brandSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-[#DCE7EF] gap-4">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'categories'
              ? 'border-[#275B86] text-[#275B86]'
              : 'border-transparent text-[#62798C] hover:text-[#183B57]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'brands'
              ? 'border-[#275B86] text-[#275B86]'
              : 'border-transparent text-[#62798C] hover:text-[#183B57]'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Brands &amp; Manufacturers ({brands.length})</span>
        </button>
      </div>

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Add Category Form (left) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-[#DCE7EF] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
              Add New Category
            </h3>

            {catActionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{catActionError}</span>
              </div>
            )}

            {catActionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{catActionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#183B57] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  disabled={!canEdit || isAddingCat}
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Enterprise Networking"
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183B57] mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit || isAddingCat}
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Short note regarding products in this classification..."
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86] disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={!canEdit || !newCatName.trim() || isAddingCat}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isAddingCat ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding Category...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Category</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-[11px] text-[#62798C] pt-2 border-t border-slate-100">
              * Categories with active products cannot be deleted until all assigned products are reassigned or removed.
            </div>
          </div>

          {/* Categories List (right) */}
          <div className="lg:col-span-7 bg-white rounded-lg border border-[#DCE7EF] shadow-sm overflow-hidden space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE7EF]">
              <div>
                <span className="text-xs font-bold text-[#10283D] uppercase tracking-wider block">
                  Existing Categories
                </span>
                <span className="text-[11px] text-[#62798C]">
                  {categories.length} total categories registered
                </span>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                />
              </div>
            </div>

            <div className="divide-y divide-[#DCE7EF] max-h-[480px] overflow-y-auto pr-1">
              {filteredCategories.map(cat => {
                const assignedProducts = products.filter(p => p.category === cat.name && !p.isArchived);
                const hasAssigned = assignedProducts.length > 0;

                return (
                  <div key={cat.id} className="py-3 px-2 flex items-center justify-between hover:bg-[#F7FAFD] rounded transition-colors">
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-bold text-[#10283D] flex items-center gap-2">
                        <span className="truncate">{cat.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                          hasAssigned ? 'bg-[#EBF3F8] text-[#275B86] font-semibold' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {assignedProducts.length} product(s)
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-[11px] text-[#62798C] mt-0.5 line-clamp-1">{cat.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditCategory(cat)}
                            className="p-1.5 text-[#275B86] hover:bg-[#EBF3F8] rounded transition-colors cursor-pointer"
                            title="Edit category name and description"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              hasAssigned
                                ? 'text-slate-300 hover:text-slate-400 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              hasAssigned
                                ? `Cannot delete: ${assignedProducts.length} product(s) currently use this category`
                                : 'Delete category'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="py-8 text-center text-xs text-[#62798C]">
                  No categories match your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BRANDS TAB */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Add Brand Form (left) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-[#DCE7EF] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#10283D] uppercase tracking-wider">
              Add New Brand
            </h3>

            {brandActionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{brandActionError}</span>
              </div>
            )}

            {brandActionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{brandActionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddBrand} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#183B57] mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  disabled={!canEdit || isAddingBrand}
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  placeholder="e.g. Cisco Systems"
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183B57] mb-1">
                  Country of Origin / Global HQ
                </label>
                <input
                  type="text"
                  disabled={!canEdit || isAddingBrand}
                  value={newBrandCountry}
                  onChange={e => setNewBrandCountry(e.target.value)}
                  placeholder="e.g. United States, Taiwan, Japan"
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86] disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={!canEdit || !newBrandName.trim() || isAddingBrand}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isAddingBrand ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding Brand...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Brand</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-[11px] text-[#62798C] pt-2 border-t border-slate-100">
              * Brands with active products cannot be deleted until all assigned products are reassigned or removed.
            </div>
          </div>

          {/* Brands List (right) */}
          <div className="lg:col-span-7 bg-white rounded-lg border border-[#DCE7EF] shadow-sm overflow-hidden space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE7EF]">
              <div>
                <span className="text-xs font-bold text-[#10283D] uppercase tracking-wider block">
                  Existing Brands
                </span>
                <span className="text-[11px] text-[#62798C]">
                  {brands.length} total brands registered
                </span>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={brandSearch}
                  onChange={e => setBrandSearch(e.target.value)}
                  placeholder="Filter brands..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                />
              </div>
            </div>

            <div className="divide-y divide-[#DCE7EF] max-h-[480px] overflow-y-auto pr-1">
              {filteredBrands.map(brand => {
                const assignedProducts = products.filter(p => p.brand === brand.name && !p.isArchived);
                const hasAssigned = assignedProducts.length > 0;

                return (
                  <div key={brand.id} className="py-3 px-2 flex items-center justify-between hover:bg-[#F7FAFD] rounded transition-colors">
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-bold text-[#10283D] flex items-center gap-2">
                        <span className="truncate">{brand.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                          hasAssigned ? 'bg-[#EBF3F8] text-[#275B86] font-semibold' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {assignedProducts.length} product(s)
                        </span>
                      </div>
                      {brand.country && (
                        <p className="text-[11px] text-[#62798C] mt-0.5">Origin / HQ: {brand.country}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditBrand(brand)}
                            className="p-1.5 text-[#275B86] hover:bg-[#EBF3F8] rounded transition-colors cursor-pointer"
                            title="Edit brand name and country"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBrand(brand.id, brand.name)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              hasAssigned
                                ? 'text-slate-300 hover:text-slate-400 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              hasAssigned
                                ? `Cannot delete: ${assignedProducts.length} product(s) currently use this brand`
                                : 'Delete brand'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredBrands.length === 0 && (
                <div className="py-8 text-center text-xs text-[#62798C]">
                  No brands match your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-[#10283D]/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#DCE7EF] space-y-4 text-[#183B57]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7EF]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#275B86]" />
                <h3 className="font-bold text-sm text-[#10283D]">Edit Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editCatError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{editCatError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#10283D] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={editCatName}
                  onChange={e => setEditCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                  required
                />
                <span className="text-[10px] text-[#62798C] mt-1 block">
                  Renaming will automatically update all associated active products.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10283D] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editCatDesc}
                  onChange={e => setEditCatDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE7EF]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCatEdit || !editCatName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded transition-colors disabled:opacity-50"
                >
                  {isSavingCatEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Edit Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-[#10283D]/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#DCE7EF] space-y-4 text-[#183B57]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7EF]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#275B86]" />
                <h3 className="font-bold text-sm text-[#10283D]">Edit Brand</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBrand(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editBrandError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{editBrandError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditBrand} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#10283D] mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={editBrandName}
                  onChange={e => setEditBrandName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                  required
                />
                <span className="text-[10px] text-[#62798C] mt-1 block">
                  Renaming will automatically update all associated active products.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10283D] mb-1">
                  Country of Origin / HQ
                </label>
                <input
                  type="text"
                  value={editBrandCountry}
                  onChange={e => setEditBrandCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE7EF]">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBrandEdit || !editBrandName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded transition-colors disabled:opacity-50"
                >
                  {isSavingBrandEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
