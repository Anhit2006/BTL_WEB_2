import React, { useState, useEffect, useMemo } from 'react';
import { orderAPI, customerAPI, productAPI } from '../services/api';
import './Orders.css';

// hiển thị  khi loading
const LoadingSpinner = () => (
    <div className="spinner-container" style={{ textAlign: 'center', padding: '50px' }}>
        <div className="spinner">Đang tải...</div>
    </div>
);

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [formData, setFormData] = useState({
        ma_kh: '',
        items: [{ ma_sp: '', so_luong: 1 }],
        trang_thai: 'Chờ xử lý', 
    });
    const [alert, setAlert] = useState({ type: '', message: '' });

    //  Load Data 
    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]); 
    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([loadOrders(), loadCustomers(), loadProducts()]);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu ban đầu:', error);
            showAlert('error', 'Lỗi khi tải dữ liệu ban đầu.');
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async () => {
        try {
            const response = await orderAPI.getAll(search);
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            showAlert('error', 'Lỗi khi tải danh sách đơn hàng');
        }
    };

    const loadCustomers = async () => {
        try {
            const response = await customerAPI.getAll();
            if (response.data.success) {
                setCustomers(response.data.data);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    };

    const loadProducts = async () => {
        try {
            // Lọc sản phẩm đang hoạt động/có sẵn
            const response = await productAPI.getAll('', false); 
            if (response.data.success) {
                setProducts(response.data.data.filter(p => p.trang_thai === 1));
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert({ type: '', message: '' }), 3000);
    };

    //  Modal & Form Logic 

    const handleOpenModal = () => {
        
        setFormData({
            ma_kh: '',
            items: [{ ma_sp: '', so_luong: 1 }],
            trang_thai: 'Chờ xử lý',
        });
        setOrderDetails(null); 
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setOrderDetails(null);
        setFormData({ ma_kh: '', items: [{ ma_sp: '', so_luong: 1 }], trang_thai: 'Chờ xử lý' });
    };

    const handleViewDetails = async (order) => {
        try {
            const response = await orderAPI.getById(order.ma_dh);
            if (response.data.success) {
                setOrderDetails(response.data.data);
                setShowModal(true);
            }
        } catch (error) {
            showAlert('error', 'Lỗi khi tải chi tiết đơn hàng');
        }
    };

    //  Product Item Logic 

    const addProductItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { ma_sp: '', so_luong: 1 }],
        });
    };

    const removeProductItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateProductItem = (index, field, value) => {
        const newItems = [...formData.items];
        
        // Chuyển đổi số lượng sang int
        if (field === 'so_luong') {
            const numValue = parseInt(value);
            newItems[index][field] = numValue < 1 ? 1 : numValue;
        } else {
            newItems[index][field] = value;
        }

        setFormData({ ...formData, items: newItems });
    };

    //  Submit & Delete 

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!formData.ma_kh) {
            showAlert('error', 'Vui lòng chọn khách hàng.');
            return;
        }

        const validItems = formData.items.filter(item => item.ma_sp && item.so_luong > 0);
        if (validItems.length === 0) {
            showAlert('error', 'Vui lòng thêm ít nhất một sản phẩm hợp lệ.');
            return;
        }

        try {
            // Chuẩn bị data, chỉ gửi items hợp lệ
            const dataToSubmit = {
                ...formData,
                items: validItems,
            };
            
            await orderAPI.create(dataToSubmit);
            showAlert('success', 'Tạo đơn hàng thành công!');
            handleCloseModal();
            loadOrders();
        } catch (error) {
            showAlert('error', error.response?.data?.error || 'Có lỗi xảy ra. Vui lòng kiểm tra tồn kho.');
        }
    };

    const handleDelete = async (order) => {
        if (window.confirm(`Bạn có chắc muốn xóa đơn hàng ${order.ma_dh}? Thao tác này không thể hoàn tác.`)) {
            try {
                await orderAPI.delete(order.ma_dh);
                showAlert('success', 'Xóa đơn hàng thành công');
                loadOrders();
            } catch (error) {
                showAlert('error', 'Lỗi khi xóa đơn hàng.');
            }
        }
    };

    // Utility Functions 

    const getCustomerName = (ma_kh) => {
        const customer = customers.find(c => c.ma_kh === ma_kh);
        return customer ? customer.ho_ten : `(Mã KH: ${ma_kh})`;
    };
    
    //  Badge trạng thái
    const getStatusBadge = (trang_thai) => {
        trang_thai = trang_thai || 'Chờ xử lý';
        switch (trang_thai) {
            case 'Hoàn thành':
            case 'Đã giao':
                return <span className="badge badge-success">{trang_thai}</span>;
            case 'Đang xử lý':
            case 'Chờ xử lý':
                return <span className="badge badge-warning">{trang_thai}</span>;
            case 'Đã hủy':
            case 'Thất bại':
                return <span className="badge badge-danger">{trang_thai}</span>;
            default:
                return <span className="badge badge-info">{trang_thai}</span>;
        }
    };
    
    // Tính toán tổng tiền tạm thời cho form tạo đơn hàng 
    const totalAmount = useMemo(() => {
        return formData.items.reduce((total, item) => {
            const product = products.find(p => p.ma_sp === item.ma_sp);
            const price = product ? product.gia_ban : 0;
            return total + (price * item.so_luong);
        }, 0);
    }, [formData.items, products]);

    //  Render 
    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="orders-page">
            <div className="card">
                <div className="card-header">
                    <h2>🛒 Quản Lý Đơn Hàng</h2>
                    <button className="btn btn-primary" onClick={handleOpenModal}>
                        + Tạo Đơn Hàng Mới
                    </button>
                </div>

                {alert.message && (
                    <div className={`alert alert-${alert.type}`}>
                        {alert.message}
                    </div>
                )}

                <div className="search-bar order-search-bar">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã, khách hàng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-control search-input"
                    />
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã ĐH</th>
                                <th>Khách Hàng</th>
                                <th>Thời Gian</th>
                                <th>Số Lượng SP</th>
                                <th>Tổng Tiền</th>
                                <th>Trạng Thái</th>
                                <th>Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Không có đơn hàng nào
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.ma_dh}>
                                        <td>{order.ma_dh}</td>
                                        <td>{order.ten_khach_hang || getCustomerName(order.ma_kh)}</td>
                                        <td>{new Date(order.ngay_mua).toLocaleString('vi-VN')}</td>
                                        <td>{order.tong_so_luong || order.item_count || 0}</td>
                                        <td>{parseInt(order.tong_tien || 0).toLocaleString('vi-VN')} đ</td>
                                        <td>
                                            {getStatusBadge(order.trang_thai)}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleViewDetails(order)}
                                                >
                                                    Chi Tiết
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(order)}
                                                    style={{ marginLeft: '0.5rem' }}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  Modal  */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className={`modal ${orderDetails ? 'modal-details' : 'modal-form'}`} onClick={(e) => e.stopPropagation()}> 
                        <div className="modal-header">
                            <h3>{orderDetails ? `Chi Tiết Đơn Hàng #${orderDetails.ma_dh}` : 'Tạo Đơn Hàng Mới'}</h3>
                            <button className="close-btn" onClick={handleCloseModal}>×</button>
                        </div>

                        {orderDetails ? (
                            // Render Chi Tiết Đơn Hàng
                            <div className="order-details">
                                <p className="detail-row"><strong>Khách Hàng:</strong> {getCustomerName(orderDetails.ma_kh)}</p>
                                <p className="detail-row"><strong>Thời Gian:</strong> {new Date(orderDetails.ngay_mua).toLocaleString('vi-VN')}</p>
                                <p className="detail-row"><strong>Trạng Thái:</strong> {getStatusBadge(orderDetails.trang_thai)}</p>
                                
                                <div className="detail-section table-container">
                                    <h4 style={{ marginBottom: '1rem', marginTop: '1rem', color: '#457b9d' }}>Danh Sách Sản Phẩm</h4>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Sản Phẩm</th>
                                                <th style={{ width: '100px' }}>Số Lượng</th>
                                                <th>Đơn Giá</th>
                                                <th>Thành Tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderDetails.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.ten_sp || item.ma_sp}</td>
                                                    <td style={{ textAlign: 'center' }}>{item.so_luong}</td>
                                                    <td>{parseInt(item.don_gia).toLocaleString('vi-VN')} đ</td>
                                                    <td>{parseInt(item.thanh_tien).toLocaleString('vi-VN')} đ</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Tổng Tiền:</td>
                                                <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {parseInt(orderDetails.tong_tien).toLocaleString('vi-VN')} đ
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Render Form Tạo Mới
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Khách Hàng *</label>
                                    <select
                                        required
                                        value={formData.ma_kh}
                                        onChange={(e) => setFormData({ ...formData, ma_kh: e.target.value })}
                                    >
                                        <option value="">-- Chọn khách hàng --</option>
                                        {customers.map((customer) => (
                                            <option key={customer.ma_kh} value={customer.ma_kh}>
                                                {customer.ho_ten}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group product-list-group">
                                    <label>Sản Phẩm *</label>
                                    {formData.items.map((item, index) => {
                                        const selectedProduct = products.find(p => p.ma_sp === item.ma_sp);
                                        const currentPrice = selectedProduct ? parseInt(selectedProduct.gia_ban) : 0;
                                        const availableStock = selectedProduct?.so_luong_ton || 0;
                                        
                                        return (
                                            <div key={index} className="product-item-row">
                                                <select
                                                    required
                                                    value={item.ma_sp}
                                                    onChange={(e) => updateProductItem(index, 'ma_sp', e.target.value)}
                                                    style={{ flex: 3 }}
                                                >
                                                    <option value="">Chọn sản phẩm</option>
                                                    {products.map((product) => (
                                                        <option key={product.ma_sp} value={product.ma_sp} disabled={product.so_luong_ton <= 0}>
                                                            {product.ten_sp} (Tồn: {product.so_luong_ton} - Giá: {parseInt(product.gia_ban).toLocaleString('vi-VN')} đ)
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    max={availableStock}
                                                    value={item.so_luong}
                                                    onChange={(e) => updateProductItem(index, 'so_luong', e.target.value)}
                                                    placeholder="SL"
                                                    style={{ flex: 1.5 }}
                                                    disabled={!item.ma_sp}
                                                />
                                                <span className="item-sub-info" style={{ flex: 2 }}>
                                                    {item.ma_sp ? `${(currentPrice * item.so_luong).toLocaleString('vi-VN')} đ` : 'Chọn SP'}
                                                </span>
                                                {formData.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => removeProductItem(index)}
                                                        style={{ flex: 1, minWidth: 'unset' }}
                                                    >
                                                        Xóa
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div className="add-product-row">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={addProductItem}
                                        >
                                            + Thêm Sản Phẩm
                                        </button>
                                        <div className="total-amount-display">
                                            <strong>Tổng tiền tạm tính:</strong> 
                                            <span style={{ color: '#e74c3c', marginLeft: '10px' }}>{totalAmount.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary-modal">
                                        Tạo Đơn Hàng
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;