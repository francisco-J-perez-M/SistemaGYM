/**
 * components/compartido/EmailDomainInput.jsx
 *
 * Campo de correo con selector de dominio -- separa el input en "usuario"
 * + un <select> con los dominios de correo mas comunes (mas "Otro..." para
 * escribir cualquier otro dominio a mano). Pensado para reducir errores de
 * captura al dar de alta miembros/staff: un dominio mal tecleado significa
 * que el correo de bienvenida con la contrasena nunca le llega a nadie.
 *
 * Se comporta como un <input type="email"> controlado normal hacia afuera:
 * recibe `value` (el correo completo) y dispara `onChange(nuevoCorreo)` --
 * reemplaza a un input de email existente sin tocar el resto del estado
 * del formulario que lo contiene.
 *
 * Si `value` ya trae un dominio que no esta en la lista (p. ej. al editar
 * un registro existente con correo de empresa propia), arranca mostrando
 * el dominio completo en el campo de texto libre en vez de forzarlo a uno
 * de la lista.
 */
import { useState } from "react";

export const DOMINIOS_COMUNES = [
  "@gmail.com", "@hotmail.com", "@outlook.com", "@yahoo.com",
  "@icloud.com", "@live.com", "@msn.com",
];

function partirCorreo(correo) {
  const i = (correo || "").lastIndexOf("@");
  if (i === -1) return { usuario: correo || "", dominio: "" };
  return { usuario: correo.slice(0, i), dominio: correo.slice(i) };
}

export default function EmailDomainInput({
  value, onChange, placeholder = "usuario", required = false, disabled = false,
  inputStyle = {}, selectStyle = null,
}) {
  const { usuario, dominio } = partirCorreo(value);
  const [modoManual, setModoManual] = useState(
    () => dominio !== "" && !DOMINIOS_COMUNES.includes(dominio)
  );

  const actualizar = (nuevoUsuario, nuevoDominio) => onChange(`${nuevoUsuario}${nuevoDominio}`);

  const onSelectDominio = (e) => {
    if (e.target.value === "__otro__") {
      setModoManual(true);
      actualizar(usuario, "");
    } else {
      setModoManual(false);
      actualizar(usuario, e.target.value);
    }
  };

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <input
        type="text"
        autoComplete="off"
        value={usuario}
        onChange={(e) => actualizar(
          e.target.value.replace(/@/g, "").trim(),
          modoManual ? dominio : (dominio || "@gmail.com")
        )}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{ flex: "2 1 130px", minWidth: 0, ...inputStyle }}
      />
      {modoManual && (
        <input
          type="text"
          autoComplete="off"
          value={dominio.replace(/^@/, "")}
          onChange={(e) => actualizar(usuario, `@${e.target.value.replace(/^@/, "").trim()}`)}
          placeholder="tudominio.com"
          required={required}
          disabled={disabled}
          style={{ flex: "1 1 120px", minWidth: 0, ...inputStyle }}
        />
      )}
      <select
        value={modoManual ? "__otro__" : (dominio || "@gmail.com")}
        onChange={onSelectDominio}
        disabled={disabled}
        style={{ flex: "1 1 125px", minWidth: 0, cursor: "pointer", ...(selectStyle || inputStyle) }}
      >
        {DOMINIOS_COMUNES.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
        <option value="__otro__">Otro…</option>
      </select>
    </div>
  );
}
