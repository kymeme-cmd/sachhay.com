// Page: Admin - Trang quan tri

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI, productAPI, uploadAPI } from "@/api/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { getProductImageUrl } from "@/utils/image";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, shortOrderId } from "@/utils/order";
import type { OrderStatusValue } from "@/types";
import { LayoutDashboard, Users, ShoppingCart, Package, Plus, Edit, Trash2, X, BookOpen, Bot, RefreshCw, Search, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { LOW_STOCK_THRESHOLD } from "@/components/book/BookCard";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

interface ProductForm {
  name: string;
  author: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  is_active: boolean;
  category_id: string;
}

const initialProductForm: ProductForm = {
  name: "",
  author: "",
  description: "",
  price: 0,
  stock: 0,
  sku: "",
  is_active: true,
  category_id: "",
};

interface CategoryForm {
  name: string;
  slug: string;
  parent_id: string;
}

const initialCategoryForm: CategoryForm = {
  name: "",
  slug: "",
  parent_id: "",
};

const PRODUCTS_PER_PAGE = 20;

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Bảng sách: tìm kiếm, lọc thể loại, chỉ sách sắp hết, phân trang
  const [productQuery, setProductQuery] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [productPage, setProductPage] = useState(1);

  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(initialProductForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, productsRes, ordersRes, usersRes, categoriesRes] = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.listProducts(),
        adminAPI.listOrders(),
        adminAPI.listUsers(),
        adminAPI.listCategories(),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      else setError("Không thể tải thống kê");

      if (productsRes.status === "fulfilled") setProducts(productsRes.value.data || []);
      if (ordersRes.status === "fulfilled") setOrders(ordersRes.value.data || []);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data || []);
      if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value.data || []);
    } catch {
      setError("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Chatbot AI: nạp lại vector sách + chính sách vào Vectorize
  const [syncingAI, setSyncingAI] = useState(false);
  const [aiSyncResult, setAiSyncResult] = useState<{ ok: boolean; text: string } | null>(null);
  const handleSyncAI = async () => {
    setSyncingAI(true);
    setAiSyncResult(null);
    try {
      const res = await adminAPI.syncAI();
      const d = res.data as { books: number; policies: number; authors?: number; removed: number };
      setAiSyncResult({ ok: true, text: `Đã nạp ${d.books} sách, ${d.authors ?? 0} tác giả và ${d.policies} mục chính sách${d.removed ? `, gỡ ${d.removed} sách đã ẩn` : ""}.` });
    } catch (err: any) {
      setAiSyncResult({ ok: false, text: err.response?.data?.message || "Không thể đồng bộ dữ liệu AI" });
    } finally {
      setSyncingAI(false);
    }
  };

  // Product CRUD handlers
  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm(initialProductForm);
    setProductError(null);
    setImageFile(null);
    setShowProductModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      author: product.author || "",
      description: product.description || "",
      price: product.price || 0,
      stock: product.stock || 0,
      sku: product.sku || "",
      is_active: product.is_active === 1 || product.is_active === true,
      category_id: product.category_id || "",
    });
    setProductError(null);
    setImageFile(null);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleProductFormChange = (field: string, value: any) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveProduct = async () => {
    setSavingProduct(true);
    setProductError(null);
    try {
      const payload: any = {
        name: productForm.name,
        author: productForm.author || null,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        sku: productForm.sku || null,
        is_active: productForm.is_active,
      };
      payload.category_id = productForm.category_id || null;

      let productId: string;
      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, payload);
        productId = editingProduct.id;
      } else {
        const res = await adminAPI.createProduct(payload);
        productId = (res.data as { id: string }).id;
      }

      // Upload ảnh bìa lên R2 rồi gắn làm ảnh chính của sách
      if (imageFile) {
        const upload = await uploadAPI.image(imageFile);
        const { r2_key } = upload.data as { r2_key: string };
        await productAPI.addImage(productId, { r2_key, alt_text: productForm.name, is_primary: true });
      }

      await fetchAll();
      closeProductModal();
    } catch (err: any) {
      setProductError(err.response?.data?.message || "Lưu thất bại");
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (p: { id: string; name: string }) => {
    if (!window.confirm(`Xóa sách "${p.name}"?\n\nThao tác này không thể hoàn tác. (Sách đã có đơn hàng sẽ chỉ bị ẩn khỏi cửa hàng.)`)) return;
    try {
      await adminAPI.deleteProduct(p.id);
      await fetchAll(); // sách đã có đơn hàng chỉ bị ẩn, không bị xóa
    } catch (err: any) {
      setError(err.response?.data?.message || "Xóa thất bại");
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatusValue) => {
    setUpdatingOrderId(id);
    setError(null);
    try {
      await adminAPI.updateOrderStatus(id, status);
      await fetchAll(); // cập nhật cả tồn kho / doanh thu
    } catch (err: any) {
      setError(err.response?.data?.message || "Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Category CRUD handlers
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm(initialCategoryForm);
    setCategoryError(null);
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      parent_id: category.parent_id || "",
    });
    setCategoryError(null);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleCategoryFormChange = (field: string, value: any) => {
    setCategoryForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveCategory = async () => {
    setSavingCategory(true);
    setCategoryError(null);
    try {
      const payload: any = {
        name: categoryForm.name,
        slug: categoryForm.slug,
        parent_id: categoryForm.parent_id || null,
      };

      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.id, payload);
      } else {
        await adminAPI.createCategory(payload);
      }

      await fetchAll();
      closeCategoryModal();
    } catch (err: any) {
      setCategoryError(err.response?.data?.message || "Lưu thất bại");
    } finally {
      setSavingCategory(false);
    }
  };

  const deleteCategory = async (c: { id: string; name: string }) => {
    if (!window.confirm(`Xóa danh mục "${c.name}"?\n\nThao tác này không thể hoàn tác.`)) return;
    try {
      await adminAPI.deleteCategory(c.id);
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Xóa thất bại");
    }
  };

  const tabs = [
    { id: "dashboard", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
    { id: "products", label: "Quản lý sách", icon: <Package size={20} /> },
    { id: "categories", label: "Quản lý danh mục", icon: <BookOpen size={20} /> },
    { id: "orders", label: "Đơn hàng", icon: <ShoppingCart size={20} /> },
    { id: "users", label: "Người dùng", icon: <Users size={20} /> },
  ];

  const normalize = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
  const filteredProducts = products.filter((p: any) =>
    (!productQuery.trim() || normalize(`${p.name} ${p.author ?? ""} ${p.sku ?? ""}`).includes(normalize(productQuery.trim()))) &&
    (!productCategory || p.category_id === productCategory) &&
    (!lowStockOnly || p.stock < LOW_STOCK_THRESHOLD)
  );
  const lowStockCount = products.filter((p: any) => p.stock < LOW_STOCK_THRESHOLD).length;
  const productPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const currentProductPage = Math.min(productPage, productPages);
  const pagedProducts = filteredProducts.slice((currentProductPage - 1) * PRODUCTS_PER_PAGE, currentProductPage * PRODUCTS_PER_PAGE);

  if (loading) return <Loading text="Đang tải trang quản trị..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trang quản trị</h1>
          <p className="text-gray-600">Quản lý sách, danh mục, đơn hàng và người dùng</p>
        </div>
        <Link to="/" className="text-sm text-gray-600 hover:text-primary">Về trang chủ</Link>
      </div>

      {error && <Alert type="error" title="Lỗi" description={error} />}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Tổng đơn hàng</p><p className="text-2xl font-bold text-gray-800">{stats.orders || stats.total_orders || 0}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Package size={24} /></div></div></div>
          <div className="card p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Tổng doanh thu</p><p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.revenue || stats.total_revenue || 0)}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><ShoppingCart size={24} /></div></div></div>
          <div className="card p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Tổng số sách</p><p className="text-2xl font-bold text-gray-800">{stats.products || stats.total_products || 0}</p></div><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><BookOpen size={24} /></div></div></div>
          <div className="card p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Người dùng</p><p className="text-2xl font-bold text-gray-800">{stats.users || stats.total_users || 0}</p></div><div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600"><Users size={24} /></div></div></div>
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-primary hover:bg-gray-50"}`}>{t.icon} {t.label}</button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Đơn hàng gần đây</h3>
            {orders.length === 0 ? (
              <EmptyState title="Chưa có đơn hàng" description="Chưa có đơn hàng nào được đặt." />
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o: any) => (
                  <div key={o.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                    <div><div className="font-medium text-gray-800">Đơn #{o.id.slice(0, 8)}</div><div className="text-sm text-gray-500">{new Date(o.created_at * 1000).toLocaleDateString("vi-VN")}</div></div>
                    <div className="text-right"><div className="font-bold text-gray-800">{formatCurrency(o.total_amount)}</div><span className={`badge mt-1 ${ORDER_STATUS_COLORS[o.status as OrderStatusValue]}`}>{ORDER_STATUS_LABELS[o.status as OrderStatusValue]}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Bot size={20} className="text-primary" /> Trợ lý AI (chatbot)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Chatbot chỉ trả lời dựa trên sách và chính sách đã nạp. Sách thêm/sửa/xóa trong trang này được cập nhật tự động;
              bấm đồng bộ khi mới sửa chính sách trong database hoặc lần đầu bật chatbot.
            </p>
            <Button onClick={handleSyncAI} isLoading={syncingAI} className="inline-flex items-center gap-2">
              <RefreshCw size={16} /> Đồng bộ dữ liệu AI
            </Button>
            {aiSyncResult && (
              <p className={`mt-3 text-sm ${aiSyncResult.ok ? "text-green-700" : "text-red-600"}`}>{aiSyncResult.text}</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-800">Quản lý sách <span className="text-gray-500 font-normal">({filteredProducts.length}/{products.length})</span></h3>
            <Button onClick={openCreateModal}><Plus size={18} /> Thêm sách mới</Button>
          </div>

          {/* Thanh công cụ: tìm kiếm, lọc thể loại, sách sắp hết */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={productQuery}
                onChange={(e) => { setProductQuery(e.target.value); setProductPage(1); }}
                placeholder="Tìm theo tên sách, tác giả, SKU..."
                aria-label="Tìm sách trong bảng"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
            <select
              value={productCategory}
              onChange={(e) => { setProductCategory(e.target.value); setProductPage(1); }}
              aria-label="Lọc theo thể loại"
              className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Tất cả thể loại</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => { setLowStockOnly((v) => !v); setProductPage(1); }}
              aria-pressed={lowStockOnly}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                lowStockOnly ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-white border-gray-300 text-gray-700 hover:border-amber-400"
              }`}
            >
              <AlertTriangle size={16} /> Sắp hết hàng ({lowStockCount})
            </button>
          </div>

          <div className="card overflow-hidden">
            {/* Cuộn trong khung, tiêu đề cột dính khi cuộn */}
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-light shadow-[0_1px_0_0] shadow-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Tên sách</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Giá</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Tồn kho</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Trạng thái</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProducts.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{products.length === 0 ? "Chưa có sách nào" : "Không có sách nào khớp bộ lọc"}</td></tr>
                  ) : (
                    pagedProducts.map((p: any) => {
                      const low = p.stock < LOW_STOCK_THRESHOLD;
                      return (
                        <tr key={p.id} className={`border-b border-gray-100 ${low ? "bg-amber-50/60" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={getProductImageUrl(p.image_key)} alt={p.name} loading="lazy" className="w-10 h-14 rounded object-cover bg-gray-100 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-gray-800">{p.name}</div>
                                <div className="text-xs text-gray-500">{[p.author, p.category_name].filter(Boolean).join(" · ")}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(p.price)}</td>
                          <td className="px-4 py-3">
                            {p.stock <= 0 ? (
                              <span className="badge bg-red-100 text-red-700">Hết hàng</span>
                            ) : low ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-700"><AlertTriangle size={14} /> {p.stock}</span>
                            ) : (
                              p.stock
                            )}
                          </td>
                          <td className="px-4 py-3"><span className={`badge ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>{p.is_active ? "Đang bán" : "Đã ẩn"}</span></td>
                          <td className="px-4 py-3">
                            {/* Xóa: icon viền, đặt xa nút sửa, luôn hỏi xác nhận kèm tên sách */}
                            <div className="flex items-center justify-end gap-6">
                              <Button variant="outline" size="sm" onClick={() => openEditModal(p)}>
                                <Edit size={16} /> Chỉnh sửa
                              </Button>
                              <Button variant="danger-outline" size="sm" onClick={() => deleteProduct(p)} aria-label={`Xóa sách ${p.name}`} title="Xóa sách">
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {productPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 text-sm">
                <span className="text-gray-600">Trang {currentProductPage}/{productPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentProductPage <= 1} onClick={() => setProductPage(currentProductPage - 1)} aria-label="Trang trước"><ChevronLeft size={16} /></Button>
                  <Button variant="outline" size="sm" disabled={currentProductPage >= productPages} onClick={() => setProductPage(currentProductPage + 1)} aria-label="Trang sau"><ChevronRight size={16} /></Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800">Quản lý danh mục</h3>
            <Button onClick={openCreateCategoryModal}><Plus size={18} /> Thêm danh mục mới</Button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Tên</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Slug</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Phân loại</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Số sách</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chưa có danh mục nào</td></tr>
                ) : (
                  categories.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3">{c.slug}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.parent_id ? `Thuộc: ${categories.find((x: any) => x.id === c.parent_id)?.name ?? "?"}` : "Danh mục gốc"}</td>
                      <td className="px-4 py-3">{c.product_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-6">
                          <Button variant="outline" size="sm" onClick={() => openEditCategoryModal(c)}>
                            <Edit size={16} /> Chỉnh sửa
                          </Button>
                          <Button variant="danger-outline" size="sm" onClick={() => deleteCategory(c)} aria-label={`Xóa danh mục ${c.name}`} title="Xóa danh mục">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="">
          <h3 className="font-semibold text-gray-800 mb-6">Quản lý đơn hàng</h3>
          {orders.length === 0 ? (
            <EmptyState title="Chưa có đơn hàng" description="Chưa có đơn hàng nào được đặt." />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Mã đơn</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Khách hàng</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Tổng tiền</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Trạng thái</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Ngày đặt</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => (
                    <tr key={o.id} className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <div className="font-medium">#{shortOrderId(o.id)}</div>
                        <div className="text-xs text-gray-500">{o.items?.map((i: any) => `${i.name} ×${i.quantity}`).join(", ")}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{o.name}</div>
                        <div className="text-xs text-gray-500">{o.email}</div>
                      </td>
                      <td className="px-4 py-3">{formatCurrency(o.total_amount)}</td>
                      <td className="px-4 py-3">
                        {o.status === "cancelled" || o.status === "refunded" ? (
                          <span className={`badge ${ORDER_STATUS_COLORS[o.status as OrderStatusValue]}`}>{ORDER_STATUS_LABELS[o.status as OrderStatusValue]}</span>
                        ) : (
                          <select
                            value={o.status}
                            disabled={updatingOrderId === o.id}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatusValue)}
                            className={`badge border-0 cursor-pointer ${ORDER_STATUS_COLORS[o.status as OrderStatusValue]}`}
                          >
                            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatusValue[]).map((s) => (
                              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(o.created_at * 1000).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="">
          <h3 className="font-semibold text-gray-800 mb-6">Quản lý người dùng</h3>
          {users.length === 0 ? (
            <EmptyState title="Chưa có người dùng" description="Danh sách người dùng sẽ hiển thị tại đây." />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Email</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Tên</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Vai trò</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-100">
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3">{({ customer: "Khách hàng", admin: "Quản trị viên", super_admin: "Quản trị cấp cao" } as Record<string, string>)[u.role] ?? u.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.created_at * 1000).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-light rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <button onClick={closeProductModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {productError && <Alert type="error" title="Lỗi" description={productError} />}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Tên sách"
                    value={productForm.name}
                    onChange={(e) => handleProductFormChange("name", e.target.value)}
                    required
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Tác giả"
                    value={productForm.author}
                    onChange={(e) => handleProductFormChange("author", e.target.value)}
                    placeholder="Ví dụ: Nguyễn Nhật Ánh"
                  />
                </div>
                <div>
                  <Input
                    label="Giá"
                    type="number"
                    min={0}
                    value={productForm.price}
                    onChange={(e) => handleProductFormChange("price", Number(e.target.value))}
                    required
                    placeholder="0"
                  />
                </div>
                <div>
                  <Input
                    label="Tồn kho"
                    type="number"
                    min={0}
                    value={productForm.stock}
                    onChange={(e) => handleProductFormChange("stock", Number(e.target.value))}
                    required
                    placeholder="0"
                  />
                </div>
                <div>
                  <Input
                    label="SKU"
                    value={productForm.sku}
                    onChange={(e) => handleProductFormChange("sku", e.target.value)}
                    placeholder="Mã SKU"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productForm.is_active}
                      onChange={(e) => handleProductFormChange("is_active", e.target.checked)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Hoạt động</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <select
                    value={productForm.category_id}
                    onChange={(e) => handleProductFormChange("category_id", e.target.value)}
                    className="input-field"
                  >
                    <option value="">Chọn danh mục...</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Mô tả"
                    value={productForm.description}
                    onChange={(e) => handleProductFormChange("description", e.target.value)}
                    placeholder="Nhập mô tả sản phẩm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa (jpg, png, webp - tối đa 5MB)</label>
                  <div className="flex items-center gap-4">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : getProductImageUrl(editingProduct?.image_key)}
                      alt=""
                      className="w-16 h-24 rounded object-cover bg-gray-100"
                    />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={closeProductModal} disabled={savingProduct}>Hủy</Button>
              <Button
                onClick={saveProduct}
                disabled={savingProduct || !productForm.name}
                className="bg-primary text-white"
                isLoading={savingProduct}
              >
                {editingProduct ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-light rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
              </h3>
              <button onClick={closeCategoryModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {categoryError && <Alert type="error" title="Lỗi" description={categoryError} />}

              <div>
                <Input
                  label="Tên danh mục"
                  value={categoryForm.name}
                  onChange={(e) => handleCategoryFormChange("name", e.target.value)}
                  required
                  placeholder="Nhập tên danh mục"
                />
              </div>
              <div>
                <Input
                  label="Slug (bỏ trống để tự tạo từ tên)"
                  value={categoryForm.slug}
                  onChange={(e) => handleCategoryFormChange("slug", e.target.value)}
                  placeholder="Ví dụ: kinh-te"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
                <select
                  value={categoryForm.parent_id}
                  onChange={(e) => handleCategoryFormChange("parent_id", e.target.value)}
                  className="input-field"
                >
                  <option value="">(Không có)</option>
                  {categories
                    .filter((c: any) => c.id !== editingCategory?.id)
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={closeCategoryModal} disabled={savingCategory}>Hủy</Button>
              <Button
                onClick={saveCategory}
                disabled={savingCategory || !categoryForm.name}
                className="bg-primary text-white"
                isLoading={savingCategory}
              >
                {editingCategory ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

