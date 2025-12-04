
import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './Login.css'; 

const Login = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false); 
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '' 
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Xử lý khi người dùng nhập liệu
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Xử lý khi bấm nút Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isRegister) {
        // --- LOGIC ĐĂNG KÝ ---
        const res = await authAPI.register({
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name
        });
        
        if (res.data.success) {
          setMessage('Đăng ký thành công! Vui lòng đăng nhập.');
          setIsRegister(false); 
          setFormData({ username: '', password: '', full_name: '' }); 
        }
      } else {
        // --- LOGIC ĐĂNG NHẬP ---
        const res = await authAPI.login({
          username: formData.username,
          password: formData.password
        });
        
        if (res.data.success) {
          // Lưu token 
          localStorage.setItem('token', res.data.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.data.user));
          
          
          onLoginSuccess(res.data.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">
          {isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Hệ Thống'}
        </h2>

        {/*  lỗi hoặc  thành công */}
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          {/*  Họ tên  khi Đăng ký */}
          {isRegister && (
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required={isRegister}
                placeholder="Nhập họ tên đầy đủ"
              />
            </div>
          )}

          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? 'Đang xử lý...' : (isRegister ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP')}
          </button>
        </form>

        {/* chuyển  Đăng nhập và Đăng ký */}
        <div className="switch-mode">
          {isRegister ? (
            <span>
              Đã có tài khoản?{' '}
              <button
                onClick={() => { setIsRegister(false); setError(''); setMessage(''); setFormData({ username: '', password: '', full_name: '' }); }}
                className="btn-switch"
              >
                Đăng nhập ngay
              </button>
            </span>
          ) : (
            <span>
              Chưa có tài khoản?{' '}
              <button
                onClick={() => { setIsRegister(true); setError(''); setMessage(''); setFormData({ username: '', password: '', full_name: '' }); }}
                className="btn-switch"
              >
                Đăng ký miễn phí
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;