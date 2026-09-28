import React, { useState, useEffect } from 'react';
import { Product, ProductSpec } from '../../types';
import { useStore } from '../../store/StoreContext';
import { LIMITS } from '../../config/settings';
import { isPublishablePrice } from '../../features/catalog/pricing';
import { parseCostInput } from '../../features/inventory/restock';
import { useDialog } from '../../hooks/useDialog';
import {
  X,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  Check,
  ImageOff,
  RefreshCw,
  Star,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ProductEditorModalProps {
  product: Product | null; // null means adding a new product
  isOpen: boolean;
  onClose: () => void;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({ product, isOpen, onClose }) => {
  const { categories, brands, addProduct, updateProduct, updateStock, currentRole, showToast } = useStore();
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

  // Form states
  const [model, setModel] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState<ProductSpec[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Pricing: distinction between blank (null), 0, and positive numbers
  const [priceType, setPriceType] = useState<'blank' | 'custom'>('blank');
  const [priceValue, setPriceValue] = useState<string>('');
  const [isPricePublic, setIsPricePublic] = useState(false);
  // Internal purchase cost (blank = unknown). Never shown to customers.
  const [purchaseCostText, setPurchaseCostText] = useState('');

  // Stock: distinction between blank (null), 0, and positive numbers
  const [stockType, setStockType] = useState<'confirmed' | 'unconfirmed'>('confirmed');
  const [stockValue, setStockValue] = useState<string>('0');

  // Publication
  const [isPublished, setIsPublished] = useState(true);

  // Status & Feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active form section tab
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'specs' | 'pricing' | 'inventory' | 'publish'>('basic');

  useEffect(() => {
    if (product) {
      setModel(product.model);
      setName(product.name || '');
      setBrand(product.brand);
      setCategory(product.category);
      setSku(product.sku);
      setShortDescription(product.shortDescription || '');
      setDescription(product.description || '');
      setSpecifications(product.specifications || []);
      setImages(product.images || []);
      if (product.price === null) {
        setPriceType('blank');
        setPriceValue('');
      } else {
        setPriceType('custom');
        setPriceValue(product.price.toString());
      }
      setIsPricePublic(product.isPricePublic);
      setPurchaseCostText(typeof product.purchaseCost === 'number' ? String(product.purchaseCost) : '');

      if (product.stock === null) {
        setStockType('unconfirmed');
        setStockValue('');
      } else {
        setStockType('confirmed');
        setStockValue(product.stock.toString());
      }
      setIsPublished(product.isPublished);
    } else {
      // New product defaults
      setModel('');
      setName('');
      setBrand(brands[0]?.name || 'Logitech');
      setCategory(categories[0]?.name || 'Keyboards & Mice');
      setSku(`SDS-${Math.floor(1000 + Math.random() * 9000)}`);
      setShortDescription('');
      setDescription('');
      // No default warranty/origin specs: those must come from confirmed product data.
      setSpecifications([]);
      setImages([]);
      setPriceType('blank');
      setPriceValue('');
      setIsPricePublic(false);
      setPurchaseCostText('');
      setStockType('unconfirmed');
      setStockValue('');
      setIsPublished(true);
    }
    setFormError(null);
    setSaveSuccess(false);
  }, [product, isOpen, categories, brands]);

  if (!isOpen) return null;

  // Stock editor and viewer cannot open this modal
  if (currentRole === 'stock_editor' || currentRole === 'viewer') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-[#183B57]">
          <h3 className="font-bold text-base text-red-600">Access Restricted</h3>
          <p className="text-xs text-[#62798C] mt-2">
            The {currentRole === 'stock_editor' ? 'Stock Editor' : 'Viewer'} role is not permitted to edit full product configurations.
          </p>
          <button onClick={onClose} className="mt-4 px-4 py-1.5 text-xs bg-slate-800 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  // Spec management
  const handleAddSpec = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const handleUpdateSpec = (idx: number, key: string, value: string) => {
    const updated = [...specifications];
    updated[idx] = { key, value };
    setSpecifications(updated);
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecifications(specifications.filter((_, i) => i !== idx));
  };

  // Image management
  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!/^(https?:\/\/|\/images\/)/i.test(url)) {
      setFormError('Image URL must start with https://, http:// or /images/.');
      return;
    }
    setFormError(null);
    setImages([...images, url]);
    setImageUrlInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please choose an image file.');
        return;
      }
      if (file.size > LIMITS.productImageMaxBytes) {
        setFormError('Image file is too large. Please select an image under 2MB (images are stored in this browser).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleReplaceFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please choose an image file.');
        return;
      }
      if (file.size > LIMITS.productImageMaxBytes) {
        setFormError('Image file is too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => {
            const updated = [...prev];
            updated[index] = reader.result as string;
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const updated = [...prev];
      const [item] = updated.splice(index, 1);
      updated.unshift(item);
      return updated;
    });
  };

  // Form Submission
  const handleSave = () => {
    setFormError(null);
    setIsSaving(true);

    // Validate basic info
    if (!model.trim()) {
      setFormError('Product model name is required.');
      setIsSaving(false);
      setActiveTab('basic');
      return;
    }
    if (!brand.trim()) {
      setFormError('Brand is required.');
      setIsSaving(false);
      setActiveTab('basic');
      return;
    }
    if (!category.trim()) {
      setFormError('Category is required.');
      setIsSaving(false);
      setActiveTab('basic');
      return;
    }

    // Parse pricing
    let finalPrice: number | null = null;
    if (priceType === 'custom') {
      if (priceValue.trim() === '') {
        setFormError('Please enter a valid price amount, or switch to "Price on Request (Blank)".');
        setIsSaving(false);
        setActiveTab('pricing');
        return;
      }
      const parsed = parseFloat(priceValue);
      if (isNaN(parsed) || parsed < 0) {
        setFormError('Price must be a valid non-negative number.');
        setIsSaving(false);
        setActiveTab('pricing');
        return;
      }
      finalPrice = parsed;
    }

    // Public visibility requires a price greater than zero (see features/catalog/pricing.ts).
    const finalIsPricePublic = isPricePublic && isPublishablePrice(finalPrice);

    // Purchase cost: blank = unknown (null). Never derived from the selling price.
    const parsedCost = parseCostInput(purchaseCostText);
    if (parsedCost === undefined) {
      setFormError('Purchase cost must be a valid non-negative number, or blank if unknown.');
      setIsSaving(false);
      setActiveTab('pricing');
      return;
    }

    // Parse stock
    let finalStock: number | null = null;
    if (stockType === 'confirmed') {
      if (stockValue.trim() === '') {
        setFormError('Please enter an exact stock count or mark as "Availability Not Confirmed".');
        setIsSaving(false);
        setActiveTab('inventory');
        return;
      }
      const parsedStock = parseInt(stockValue, 10);
      if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parseFloat(stockValue))) {
        setFormError('Stock must be a non-negative whole integer. No fractional stock numbers allowed.');
        setIsSaving(false);
        setActiveTab('inventory');
        return;
      }
      finalStock = parsedStock;
    }

    // Filter valid specs
    const validSpecs = specifications.filter(s => s.key.trim() || s.value.trim());

    if (product) {
      // Update catalogue fields first; stock changes are recorded separately in stock history.
      const res = updateProduct(product.id, {
        model: model.trim(),
        name: name.trim() || `${brand} ${model.trim()}`,
        brand,
        category,
        sku: sku.trim() || product.sku,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        specifications: validSpecs,
        images,
        price: finalPrice,
        isPricePublic: finalIsPricePublic,
        purchaseCost: parsedCost,
        isPublished,
      });

      if (!res.success) {
        setIsSaving(false);
        setFormError(res.error || 'Failed to save product changes.');
        return;
      }

      let stockNote = '';
      if (finalStock !== product.stock) {
        const stockRes = updateStock(product.id, finalStock, 'Stock count edited in product editor');
        if (!stockRes.success) {
          setIsSaving(false);
          setFormError(`Product details were saved, but the stock count was not: ${stockRes.error ?? 'unknown error'}`);
          return;
        }
        stockNote = ' Stock change recorded in history.';
      }

      setIsSaving(false);
      setSaveSuccess(true);
      showToast(`Product "${model.trim()}" updated.${stockNote}`);
      setTimeout(() => {
        onClose();
      }, 600);
    } else {
      // Add new
      const res = addProduct({
        model: model.trim(),
        name: name.trim() || `${brand} ${model.trim()}`,
        brand,
        category,
        sku: sku.trim() || `SDS-${Math.floor(1000 + Math.random() * 9000)}`,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        specifications: validSpecs,
        images,
        price: finalPrice,
        isPricePublic: finalIsPricePublic,
        purchaseCost: parsedCost,
        stock: finalStock,
        isPublished,
        isArchived: false,
      });

      setIsSaving(false);
      if (!res.success) {
        setFormError(res.error || 'Failed to create product.');
      } else {
        setSaveSuccess(true);
        showToast(`Product "${model.trim()}" added to catalog.`);
        setTimeout(() => {
          onClose();
        }, 600);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#10283D]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
        tabIndex={-1}
        className="relative bg-white rounded-xl shadow-2xl border border-[#DCE7EF] w-full max-w-3xl max-h-[92vh] flex flex-col text-[#183B57] focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#DCE7EF] bg-[#F7FAFD] flex items-center justify-between">
          <div>
            <h2 id="product-editor-title" className="text-base font-bold text-[#10283D]">
              {product ? `Edit Product: ${product.model}` : 'Add New IT Product'}
            </h2>
            <p className="text-xs text-[#62798C] mt-0.5">
              SDS Techware Catalog Management · Multi-section Editor
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-[#183B57] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-[#DCE7EF] px-6 bg-white overflow-x-auto text-xs">
          {[
            { id: 'basic', label: '1. Basic Info' },
            { id: 'images', label: '2. Images' },
            { id: 'specs', label: '3. Description & Specs' },
            { id: 'pricing', label: '4. Pricing' },
            { id: 'inventory', label: '5. Inventory' },
            { id: 'publish', label: '6. Publication' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-[#275B86] text-[#275B86]'
                  : 'border-transparent text-[#62798C] hover:text-[#183B57]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Error Banner */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Basic Info */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#10283D] mb-1">
                    Model Identifier *
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    placeholder="e.g. MX Keys S or NV2 1TB"
                    className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded-md bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                  />
                  <span className="text-[10px] text-[#62798C]">Shown prominently as primary title</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10283D] mb-1">
                    SKU / Part Number *
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="e.g. LOG-920-011585"
                    className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded-md bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                  />
                  <span className="text-[10px] text-[#62798C]">Internal inventory or distributor code</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10283D] mb-1">
                  Full Descriptive Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Logitech MX Keys S Wireless Illuminated Keyboard"
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded-md bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#10283D] mb-1">
                    Brand *
                  </label>
                  <select
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded-md bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10283D] mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded-md bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Images */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#EBF3F8] rounded-md text-xs text-[#275B86]">
                Upload a local file or paste an image URL. If no image is provided, the storefront displays a clean, neutral "Image pending" state without broken icons.
              </div>

              {/* Upload & URL inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-dashed border-[#DCE7EF] rounded-lg bg-[#F7FAFD] flex flex-col items-center justify-center text-center">
                  <Upload className="w-6 h-6 text-[#275B86] mb-2" />
                  <span className="text-xs font-semibold text-[#10283D]">Upload Local Image</span>
                  <span className="text-[10px] text-[#62798C] mb-2">PNG or JPG, max 2MB (stored in local prototype)</span>
                  <label className="cursor-pointer px-3 py-1.5 text-xs bg-[#275B86] hover:bg-[#10283D] text-white rounded font-medium transition-colors">
                    Browse File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-4 border border-[#DCE7EF] rounded-lg bg-[#F7FAFD] flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-[#10283D] mb-1">
                      Add Image by URL
                    </label>
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={e => setImageUrlInput(e.target.value)}
                      placeholder="https://... or /images/products/..."
                      className="w-full px-3 py-1.5 text-xs border border-[#DCE7EF] rounded bg-white focus:outline-none focus:border-[#275B86]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="mt-3 px-3 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-[#183B57] font-medium rounded transition-colors"
                  >
                    Add URL to List
                  </button>
                </div>
              </div>

              {/* Image Previews */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#10283D]">
                  Current Images ({images.length})
                </label>
                {images.length === 0 ? (
                  <div className="p-6 border border-slate-200 rounded-lg text-center text-xs text-[#62798C] flex flex-col items-center">
                    <ImageOff className="w-8 h-8 text-slate-300 mb-1" />
                    <span>No images assigned. Will display "Image pending" in store.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group border border-[#DCE7EF] rounded-lg overflow-hidden bg-[#F1F5F9] p-2 aspect-square flex items-center justify-center">
                        <img
                          src={img}
                          alt="Product preview"
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                        <div className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 z-10 ${
                          idx === 0 ? 'bg-[#10283D] text-white shadow-xs' : 'bg-slate-700/80 text-white'
                        }`}>
                          {idx === 0 && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />}
                          <span>{idx === 0 ? 'Primary' : `#${idx + 1}`}</span>
                        </div>

                        {/* Interactive Action Overlay */}
                        <div className="absolute inset-0 bg-[#10283D]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 z-20">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="px-2 py-1 text-[10px] bg-white/95 hover:bg-white text-[#10283D] font-bold rounded flex items-center justify-center gap-1 transition-colors w-full cursor-pointer shadow-xs"
                              title="Make this the primary featured image"
                            >
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>Set Primary</span>
                            </button>
                          )}

                          {/* Replace Image via local upload */}
                          <label className="cursor-pointer px-2 py-1 text-[10px] bg-[#275B86] hover:bg-[#10283D] text-white font-bold rounded flex items-center justify-center gap-1 transition-colors w-full shadow-xs">
                            <RefreshCw className="w-3 h-3" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleReplaceFileUpload(idx, e)}
                              className="hidden"
                            />
                          </label>

                          {/* Remove Image */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="px-2 py-1 text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center justify-center gap-1 transition-colors w-full cursor-pointer shadow-xs"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Description & Specifications */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#10283D] mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  placeholder="One or two sentences summarizing the product..."
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded-md bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10283D] mb-1">
                  Full Detailed Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed technical overview and commercial application details..."
                  className="w-full px-3 py-2 text-xs border border-[#DCE7EF] rounded-md bg-[#F7FAFD] focus:outline-none focus:border-[#275B86]"
                />
              </div>

              {/* Specifications builder */}
              <div className="space-y-2 pt-2 border-t border-[#DCE7EF]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#10283D]">
                    Technical Specifications
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="inline-flex items-center gap-1 text-xs text-[#275B86] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec Row</span>
                  </button>
                </div>

                {/* Quick template suggestions */}
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#62798C] pb-1">
                  <span className="font-semibold text-[#10283D] flex items-center gap-1 text-[10px]">
                    <Sparkles className="w-3 h-3 text-[#275B86]" /> Quick fields:
                  </span>
                  {['Warranty', 'Form Factor', 'Interface', 'Capacity', 'Connectivity', 'Power Rating', 'Origin'].map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (!specifications.some(s => s.key.toLowerCase() === key.toLowerCase())) {
                          setSpecifications(prev => [...prev, { key, value: '' }]);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-[#F1F5F9] hover:bg-[#EBF3F8] text-[#183B57] border border-[#DCE7EF] text-[10px] cursor-pointer transition-colors"
                    >
                      + {key}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {specifications.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={e => handleUpdateSpec(idx, e.target.value, spec.value)}
                        placeholder="Key (e.g. Connectivity)"
                        className="w-1/3 px-2.5 py-1.5 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD]"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={e => handleUpdateSpec(idx, spec.key, e.target.value)}
                        placeholder="Value (e.g. Bluetooth & Logi Bolt)"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-[#DCE7EF] rounded bg-[#F7FAFD]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                        title="Delete spec"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {specifications.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No specifications added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Pricing */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div className="p-3 bg-slate-50 border border-[#DCE7EF] rounded-md text-xs text-[#62798C] space-y-1">
                <span className="font-semibold text-[#10283D]">Pricing rules:</span>
                <p>• Selling price and purchase cost are separate. Customers never see purchase cost.</p>
                <p>• Blank selling price = no price entered (customers see "Price on Request").</p>
                <p>• A price is shown publicly only when visibility is ON and the price is greater than LKR 0.</p>
                <p>• LKR 0 can be stored but is never published (treated as Price on Request).</p>
                <p>• Hiding a price only hides it in this prototype's UI; a real backend must keep private prices off public responses.</p>
              </div>

              {/* Price Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#10283D]">
                  Pricing Entry
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPriceType('blank');
                      setPriceValue('');
                      setIsPricePublic(false);
                    }}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      priceType === 'blank'
                        ? 'border-[#275B86] bg-[#EBF3F8] text-[#275B86] font-semibold'
                        : 'border-[#DCE7EF] text-[#62798C] hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">Blank Price (Default)</div>
                    <div className="text-[11px] font-normal opacity-80 mt-0.5">
                      No price entered. Always displays as "Request price" to customers.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceType('custom')}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      priceType === 'custom'
                        ? 'border-[#275B86] bg-[#EBF3F8] text-[#275B86] font-semibold'
                        : 'border-[#DCE7EF] text-[#62798C] hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">Entered Amount (LKR)</div>
                    <div className="text-[11px] font-normal opacity-80 mt-0.5">
                      Enter internal price. May be made publicly visible.
                    </div>
                  </button>
                </div>
              </div>

              {priceType === 'custom' && (
                <div className="space-y-4 p-4 border border-[#DCE7EF] rounded-lg bg-[#F7FAFD]">
                  <div>
                    <label className="block text-xs font-semibold text-[#10283D] mb-1">
                      Price Amount in Sri Lankan Rupees (LKR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#62798C]">
                        LKR
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={priceValue}
                        onChange={e => setPriceValue(e.target.value)}
                        placeholder="e.g. 43500"
                        className="w-full pl-12 pr-3 py-2 text-xs font-mono font-bold border border-[#DCE7EF] rounded bg-white text-[#10283D] focus:outline-none focus:border-[#275B86]"
                      />
                    </div>
                  </div>

                  {/* Public visibility toggle */}
                  <div className="flex items-center justify-between p-3 bg-white border border-[#DCE7EF] rounded-md">
                    <div>
                      <div className="text-xs font-semibold text-[#10283D]">
                        Public Price Visibility
                      </div>
                      <div className="text-[11px] text-[#62798C]">
                        {!isPublishablePrice(parseFloat(priceValue))
                          ? 'Enter a price greater than LKR 0 to allow public display.'
                          : isPricePublic
                            ? 'Customers will see this LKR amount on cards, details, comparisons and quotation exports.'
                            : 'Hidden from customers (shows as "Price on Request"). Staff only.'}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPricePublic && isPublishablePrice(parseFloat(priceValue))}
                        disabled={!isPublishablePrice(parseFloat(priceValue))}
                        onChange={e => setIsPricePublic(e.target.checked)}
                        aria-label="Show selling price publicly"
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#275B86]"></div>
                    </label>
                  </div>
                </div>
              )}
              {/* Internal purchase cost (separate from selling price) */}
              <div className="space-y-1.5 p-4 border border-[#DCE7EF] rounded-lg bg-white">
                <label htmlFor="purchase-cost" className="block text-xs font-semibold text-[#10283D]">
                  Purchase cost per unit (LKR) — internal
                </label>
                <input
                  id="purchase-cost"
                  type="text"
                  inputMode="decimal"
                  value={purchaseCostText}
                  onChange={e => setPurchaseCostText(e.target.value)}
                  placeholder="Unknown"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#DCE7EF] rounded bg-white text-[#10283D] focus:outline-none focus:border-[#275B86]"
                />
                <p className="text-[11px] text-[#62798C]">
                  Leave blank if unknown. Used for reorder drafts; also updated when a goods receipt records a unit cost. Never shown to customers.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: Inventory */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-[#DCE7EF] rounded-md text-xs text-[#62798C] space-y-1">
                <span className="font-semibold text-[#10283D]">SDS Techware Stock Rules:</span>
                <p>• Blank quantity = "Availability not confirmed" (show inquiry prompt to customer).</p>
                <p>• Zero (0) = "Out of stock".</p>
                <p>• Positive quantity (&gt;0) = "In stock".</p>
                <p>• Fractional or negative stock quantities are strictly rejected.</p>
                <p>• Staff see exact numeric quantities; customers see availability status.</p>
              </div>

              {/* Stock type choice */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStockType('confirmed');
                    if (stockValue === '') setStockValue('0');
                  }}
                  className={`p-3 rounded-lg border text-left text-xs transition-all ${
                    stockType === 'confirmed'
                      ? 'border-[#275B86] bg-[#EBF3F8] text-[#275B86] font-semibold'
                      : 'border-[#DCE7EF] text-[#62798C] hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">Confirmed Stock Count</div>
                  <div className="text-[11px] font-normal opacity-80 mt-0.5">
                    Exact whole number (e.g. 0 for out of stock, 8 for in stock).
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStockType('unconfirmed');
                    setStockValue('');
                  }}
                  className={`p-3 rounded-lg border text-left text-xs transition-all ${
                    stockType === 'unconfirmed'
                      ? 'border-[#275B86] bg-[#EBF3F8] text-[#275B86] font-semibold'
                      : 'border-[#DCE7EF] text-[#62798C] hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">Unconfirmed Stock (Blank)</div>
                  <div className="text-[11px] font-normal opacity-80 mt-0.5">
                    Customer sees "Availability not confirmed" status.
                  </div>
                </button>
              </div>

              {stockType === 'confirmed' && (
                <div className="p-4 border border-[#DCE7EF] rounded-lg bg-[#F7FAFD]">
                  <label className="block text-xs font-semibold text-[#10283D] mb-1">
                    Exact Physical Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stockValue}
                    onChange={e => setStockValue(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-48 px-3 py-2 text-xs font-mono font-bold border border-[#DCE7EF] rounded bg-white text-[#10283D] focus:outline-none focus:border-[#275B86]"
                  />
                  <div className="text-[11px] text-[#62798C] mt-1">
                    {parseInt(stockValue, 10) === 0 ? (
                      <span className="text-red-600 font-medium">Out of stock (0 units)</span>
                    ) : parseInt(stockValue, 10) > 0 ? (
                      <span className="text-emerald-700 font-medium">In stock ({stockValue} units available)</span>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Publication */}
          {activeTab === 'publish' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F7FAFD] border border-[#DCE7EF] rounded-lg">
                <div>
                  <div className="text-xs font-semibold text-[#10283D]">
                    Storefront Publication Status
                  </div>
                  <div className="text-[11px] text-[#62798C] mt-0.5">
                    {isPublished
                      ? 'Published: Visible to customers in catalog browsing.'
                      : 'Unpublished / Draft: Hidden from public store. Visible only in Staff Workspace.'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#275B86]"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#DCE7EF] bg-[#F7FAFD] flex items-center justify-between">
          <div className="text-xs text-[#62798C]">
            {saveSuccess && (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-4 h-4" /> Changes saved successfully!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#183B57] hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#275B86] hover:bg-[#10283D] rounded-md transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Saving Changes...' : product ? 'Save Product' : 'Create Product'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
