import { motion } from "framer-motion";
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiDollarSign } from "react-icons/fi";
import { useState } from "react";

export default function PointOfSale() {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const productos = [
    { id: 1, nombre: "Proteína Whey 1kg", precio: 450, stock: 50, categoria: "Suplementos" },
    { id: 2, nombre: "Creatina 300g", precio: 280, stock: 30, categoria: "Suplementos" },
    { id: 3, nombre: "BCAA 200 caps", precio: 320, stock: 25, categoria: "Suplementos" },
    { id: 4, nombre: "Pre-Workout", precio: 380, stock: 20, categoria: "Suplementos" },
    { id: 5, nombre: "Shaker 600ml", precio: 80, stock: 100, categoria: "Accesorios" },
    { id: 6, nombre: "Toalla deportiva", precio: 120, stock: 60, categoria: "Accesorios" },
    { id: 7, nombre: "Guantes gimnasio", precio: 150, stock: 40, categoria: "Accesorios" },
    { id: 8, nombre: "Botella agua 1L", precio: 95, stock: 80, categoria: "Accesorios" },
    { id: 9, nombre: "Barra proteína", precio: 35, stock: 200, categoria: "Snacks" },
    { id: 10, nombre: "Electrolitos", precio: 180, stock: 45, categoria: "Bebidas" },
  ];

  const addToCart = (producto) => {
    const existingItem = cart.find(item => item.id === producto.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...producto, cantidad: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
        return newQty > 0 ? { ...item, cantidad: newQty } : item;
      }
      return item;
    }).filter(item => item.cantidad > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  return (
    <motion.div 
      className="pos-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '24px', height: '100vh', overflow: 'auto' }}
    >
      <motion.div 
        className="pos-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ marginBottom: '24px' }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiShoppingCart size={32} />
          Punto de Venta
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Vista de demostración - Funcionalidad en desarrollo
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', height: 'calc(100% - 100px)' }}>
        {/* PRODUCTOS */}
        <motion.div 
          className="products-grid"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Productos Disponibles</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {productos.map((producto, idx) => (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(producto)}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {producto.categoria}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  {producto.nombre}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-color)' }}>
                    ${producto.precio}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Stock: {producto.stock}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CARRITO */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Carrito de Compra</h2>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', paddingTop: '40px' }}>
                <FiShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>Carrito vacío</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.nombre}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger-color)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <FiTrash2 size={16} />
                    </motion.button>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: 'none',
                          borderRadius: '4px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <FiMinus size={14} />
                      </motion.button>
                      
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '600' }}>
                        {item.cantidad}
                      </span>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: 'none',
                          borderRadius: '4px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <FiPlus size={14} />
                      </motion.button>
                    </div>
                    
                    <span style={{ fontWeight: '700', color: 'var(--accent-color)' }}>
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* TOTAL Y CHECKOUT */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>
              <span>Total:</span>
              <span style={{ color: 'var(--accent-color)' }}>${getTotal().toFixed(2)}</span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '14px',
                background: cart.length === 0 ? 'var(--bg-tertiary)' : 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: cart.length === 0 ? 0.5 : 1
              }}
            >
              <FiDollarSign size={20} />
              Procesar Venta
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}