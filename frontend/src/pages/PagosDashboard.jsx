import { useEffect, useState } from "react";
import { getPagos, registrarPago } from "../api/pagos";
import { getMiembros } from "../api/miembros";

export default function PagosDashboard() {
  const [pagos, setPagos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [form, setForm] = useState({
    id_miembro: "",
    monto: "",
    metodo: "Efectivo",
  });

  const loadData = async () => {
    const pagosRes = await getPagos();
    const miembrosRes = await getMiembros();
    setPagos(pagosRes.data);
    setMiembros(miembrosRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await registrarPago(form);
    setForm({ id_miembro: "", monto: "", metodo: "Efectivo" });
    loadData();
  };

  return (
    <div className="dashboard-content">
      <h2>Pagos</h2>

      <form onSubmit={handleSubmit} className="card">
        <select
          value={form.id_miembro}
          onChange={(e) =>
            setForm({ ...form, id_miembro: e.target.value })
          }
          required
        >
          <option value="">Seleccione miembro</option>
          {miembros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Monto"
          value={form.monto}
          onChange={(e) => setForm({ ...form, monto: e.target.value })}
          required
        />

        <select
          value={form.metodo}
          onChange={(e) =>
            setForm({ ...form, metodo: e.target.value })
          }
        >
          <option>Efectivo</option>
          <option>Tarjeta</option>
          <option>Transferencia</option>
        </select>

        <button className="btn-primary">Registrar Pago</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Miembro</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((p) => (
            <tr key={p.id}>
              <td>{p.miembro}</td>
              <td>${p.monto}</td>
              <td>{p.metodo}</td>
              <td>{p.fecha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
