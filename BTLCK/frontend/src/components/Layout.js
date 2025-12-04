import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';
import { FiPackage, FiUsers, FiShoppingCart, FiTruck, FiBarChart2, FiLogOut } from 'react-icons/fi';

//  menu điều hướng
const navItems = [
    { path: '/products', label: 'Sản Phẩm', icon: FiPackage },
    { path: '/orders', label: 'Đơn Hàng', icon: FiShoppingCart },
    { path: '/stock', label: 'Nhập/Xuất Kho', icon: FiTruck },
    { path: '/customers', label: 'Khách Hàng', icon: FiUsers },
    { path: '/reports', label: 'Thống Kê', icon: FiBarChart2 },
];

const Layout = ({ children, user, onLogout }) => {
    const location = useLocation();
    
    // kiểm tra đường dẫn đang hoạt động
    const isActive = (path) => {
        
        if (path === '/products' || path === '/') {
            return location.pathname === '/' || location.pathname.startsWith('/products');
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="layout">
            <nav className="navbar">
                
                <div className="nav-brand">
                    
                    <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
                        <h1>✨ Quản Lý Cửa Hàng</h1>
                    </Link>
                </div>
                
                {/* 2. Menu chínhh */}
                <ul className="nav-menu">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const itemPath = item.path === '/' ? '/products' : item.path; 
                        return (
                            <li key={item.path}>
                                <Link 
                                    to={item.path} 
                                    className={isActive(itemPath) ? 'active' : ''}
                                    title={item.label}
                                >
                                    {/*  Icon + Label */}
                                    <Icon size={18} className="nav-icon" />
                                    <span className="nav-label">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* 3. Phần User và Đăng xuất  */}
                {user && (
                    <div className="nav-user">
                        {/*  tên người dùng */}
                        <span className="user-greeting">
                            Xin chào, <strong>{user.full_name || user.username}</strong>
                        </span>
                        
                        {/* Nút đăng xuất  */}
                        <button 
                            onClick={onLogout} 
                            className="btn-logout"
                            title="Đăng Xuất"
                        >
                            <FiLogOut size={18} />
                            <span>Đăng Xuất</span>
                        </button>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;