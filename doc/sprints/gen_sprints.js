'use strict';
/**
 * gen_sprints.js — GymPro SaaS
 * Genera GymPro_Sprint2_Plan.docx y GymPro_Sprint3_Plan.docx
 * Uso: npm install && node gen_sprints.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── CONSTANTES ───────────────────────────────────────────────────────────────

const TEAM = [
  'Maximiliano Arriaga Mora',
  'Miguel Angel Hernandez Cervantes',
  'Jesus Francisco Perez Medina',
  'Juan Carlos Perez Nava',
];

const C = {
  primary:   '1F4E79',
  secondary: '2E75B6',
  accent:    'D6E4F0',
  light:     'F2F2F2',
  white:     'FFFFFF',
  muted:     '666666',
  success:   '375623',
  successBg: 'E2EFDA',
  warnBg:    'FFF2CC',
  warn:      '7F6000',
  errBg:     'FCE4D6',
  err:       'C00000',
};

const CONTENT_W = 9360; // US Letter 8.5" - 2x1" margins

// ── BORDES ──────────────────────────────────────────────────────────────────

const bdr  = (color = 'CCCCCC', size = 1) => ({ style: BorderStyle.SINGLE, size, color });
const bdrs = (c) => ({ top: bdr(c), bottom: bdr(c), left: bdr(c), right: bdr(c) });

// ── PÁRRAFOS ─────────────────────────────────────────────────────────────────

const h1 = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Arial', bold: true, size: 32, color: C.primary })],
  spacing:  { before: 480, after: 200 },
  border:   { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.secondary, space: 4 } },
});

const h2 = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Arial', bold: true, size: 26, color: C.secondary })],
  spacing:  { before: 360, after: 160 },
});

const h3 = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Arial', bold: true, size: 22, color: C.primary })],
  spacing:  { before: 240, after: 100 },
});

const p = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Arial', size: 22 })],
  spacing:  { before: 80, after: 80 },
});

const pBold = (text, color) => new Paragraph({
  children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: color || undefined })],
  spacing:  { before: 80, after: 80 },
});

const gap = (lines = 1) => new Paragraph({
  children: [new TextRun('')],
  spacing:  { before: lines * 140, after: 0 },
});

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const bullet = (text, ref = 'bullets') => new Paragraph({
  numbering: { reference: ref, level: 0 },
  children:  [new TextRun({ text, font: 'Arial', size: 22 })],
  spacing:   { before: 60, after: 60 },
});

const bulletBold = (label, text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  children:  [
    new TextRun({ text: label + ': ', font: 'Arial', size: 22, bold: true }),
    new TextRun({ text, font: 'Arial', size: 22 }),
  ],
  spacing: { before: 60, after: 60 },
});

// ── CELDAS / TABLAS ──────────────────────────────────────────────────────────

const hCell = (text, w, center = true) => new TableCell({
  width:         { size: w, type: WidthType.DXA },
  shading:       { fill: C.accent, type: ShadingType.CLEAR },
  borders:       bdrs(C.secondary),
  margins:       { top: 100, bottom: 100, left: 140, right: 140 },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({
    alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children:  [new TextRun({ text, font: 'Arial', bold: true, size: 20, color: C.primary })],
  })],
});

const dCell = (text, w, opts = {}) => new TableCell({
  width:         { size: w, type: WidthType.DXA },
  shading:       { fill: opts.fill || C.white, type: ShadingType.CLEAR },
  borders:       bdrs(),
  margins:       { top: 80, bottom: 80, left: 140, right: 140 },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children:  [new TextRun({ text, font: 'Arial', size: 20, bold: opts.bold || false, color: opts.color || undefined })],
  })],
});

const mkTable = (colWidths, headers, rows) => {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width:       { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => hCell(h, colWidths[i])),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => {
          const text = typeof cell === 'string' ? cell : cell.text || '';
          const opts = typeof cell === 'object' ? cell : {};
          return dCell(text, colWidths[ci], {
            fill: ri % 2 === 1 ? C.light : C.white,
            ...opts,
          });
        }),
      })),
    ],
  });
};

// ── HEADER / FOOTER ──────────────────────────────────────────────────────────

const mkHeader = (title) => new Header({
  children: [new Paragraph({
    children: [
      new TextRun({ text: `GymPro SaaS  |  ${title}`, font: 'Arial', size: 18, color: C.primary }),
      new TextRun({ text: '\t' }),
      new TextRun({ text: 'Instituto Tecnológico de Tijuana', font: 'Arial', size: 16, color: C.muted }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    border:   { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.secondary, space: 1 } },
  })],
});

const mkFooter = () => new Footer({
  children: [new Paragraph({
    children: [
      new TextRun({ text: 'Página ', font: 'Arial', size: 18, color: C.muted }),
      new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: C.muted }),
      new TextRun({ text: ' de ', font: 'Arial', size: 18, color: C.muted }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18, color: C.muted }),
    ],
    alignment: AlignmentType.RIGHT,
    border:    { top: { style: BorderStyle.SINGLE, size: 6, color: C.secondary, space: 1 } },
  })],
});

// ── PORTADA ──────────────────────────────────────────────────────────────────

function makeCover(num, title, subtitle, period) {
  return [
    gap(6),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 120 },
      children:  [new TextRun({ text: 'Instituto Tecnológico de Tijuana', font: 'Arial', size: 28, bold: true, color: C.muted })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 800 },
      children:  [new TextRun({ text: 'Ingeniería en Sistemas Computacionales', font: 'Arial', size: 24, color: C.muted })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 100 },
      children:  [new TextRun({ text: 'GymPro', font: 'Arial', size: 80, bold: true, color: C.primary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 600 },
      children:  [new TextRun({ text: 'Sistema de Gestión de Gimnasios — SaaS', font: 'Arial', size: 28, color: C.secondary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 80 },
      children:  [new TextRun({ text: `Sprint ${num}`, font: 'Arial', size: 56, bold: true, color: C.secondary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 80 },
      children:  [new TextRun({ text: title, font: 'Arial', size: 40, bold: true, color: C.primary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 120 },
      children:  [new TextRun({ text: subtitle, font: 'Arial', size: 26, color: C.muted })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 800 },
      children:  [new TextRun({ text: `Período: ${period}`, font: 'Arial', size: 24, color: C.muted })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 160 },
      children:  [new TextRun({ text: 'Equipo de Desarrollo', font: 'Arial', size: 26, bold: true, color: C.primary })],
    }),
    ...TEAM.map(name => new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 60, after: 60 },
      children:  [new TextRun({ text: name, font: 'Arial', size: 22, color: C.muted })],
    })),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 600, after: 0 },
      children:  [new TextRun({ text: 'Mayo 2026', font: 'Arial', size: 22, color: C.muted })],
    }),
    pageBreak(),
  ];
}

// ── NUMERACIÓN (bullets) ─────────────────────────────────────────────────────

const numbering = {
  config: [
    {
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    },
    {
      reference: 'numbers',
      levels: [{
        level: 0,
        format: LevelFormat.DECIMAL,
        text: '%1.',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// SPRINT 2 — Multi-tenant + Dual Database
// ════════════════════════════════════════════════════════════════════════════

function buildSprint2() {
  const title   = 'Multi-tenant + Dual Database';
  const docTitle = `Sprint 2 — ${title}`;

  const children = [
    ...makeCover(
      '2',
      title,
      'PostgreSQL + MongoDB: Arquitectura dual de base de datos',
      '19 Mayo – 30 Mayo 2026'
    ),

    // ── 1. Resumen ejecutivo ─────────────────────────────────────────────────
    h1('1. Resumen del Sprint'),
    gap(),

    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['Sprint',        'Sprint 2 de 5'],
        ['Nombre',        'Multi-tenant + Dual Database'],
        ['Período',       '19 Mayo – 30 Mayo 2026  (2 semanas)'],
        ['Estado',        'Planificado'],
        ['Rama Git',      'feature/sprint2-dual-db'],
        ['Equipo',        TEAM.join(' / ')],
        ['Dependencias',  'Sprint 1 completado (Docker + Seguridad Crítica)'],
      ]
    ),
    gap(2),

    // ── 2. Sprint Goal ───────────────────────────────────────────────────────
    h1('2. Sprint Goal'),
    gap(),
    p('Implementar la arquitectura multi-tenant dual-database de GymPro: PostgreSQL para entidades de plataforma y datos ACID-críticos (usuarios, roles, gimnasios), y MongoDB para datos operacionales de alta escritura (progreso físico, asistencias, rutinas). Al terminar el sprint el API debe operar completamente bajo aislamiento por gimnasio mediante tenant middleware y JWT multi-tenant.'),
    gap(),

    // ── 3. Contexto ──────────────────────────────────────────────────────────
    h1('3. Contexto y Decisiones de Arquitectura'),
    gap(),
    h2('3.1 Distribución de Datos por Motor'),
    gap(),
    p('La decisión de usar dos bases de datos responde a criterios técnicos específicos por entidad, no por preferencia tecnológica. La siguiente tabla resume la distribución y el criterio de cada entidad:'),
    gap(),

    mkTable(
      [2800, 2000, 4560],
      ['Entidad', 'Motor', 'Criterio de decisión'],
      [
        ['Usuarios',          { text: 'PostgreSQL', bold: true, color: C.secondary }, 'Autenticación ACID. FK estrictas con roles y gimnasio.'],
        ['Roles',             { text: 'PostgreSQL', bold: true, color: C.secondary }, 'Catálogo estático. Referenciado por FK desde usuarios.'],
        ['Gimnasios',         { text: 'PostgreSQL', bold: true, color: C.secondary }, 'Anchor del multi-tenant. Requiere transacciones atómicas.'],
        ['Pagos',             { text: 'PostgreSQL', bold: true, color: C.secondary }, 'Financiero. Falla parcial = inconsistencia crítica.'],
        ['Membresías',        { text: 'PostgreSQL', bold: true, color: C.secondary }, 'Contrato financiero. ACID requerido.'],
        ['Ventas',            { text: 'PostgreSQL', bold: true, color: C.secondary }, 'Decremento atómico de stock. Race conditions sin ACID.'],
        ['Productos',         { text: 'PostgreSQL', bold: true, color: C.secondary }, 'Stock transaccional. FK con ventas.'],
        ['Tipos Dieta',       { text: 'PostgreSQL', bold: true, color: C.secondary }, 'Catálogo semi-estático. SQL limpio con JOINs.'],
        ['Recetas',           { text: 'PostgreSQL', bold: true, color: C.secondary }, 'Catálogo semi-estático. Relación con tipos_dieta.'],
        ['Rutinas',           { text: 'MongoDB', bold: true, color: C.err },          'Jerarquía variable (rutina > días > ejercicios). 3 JOINs en SQL.'],
        ['Progreso Físico',   { text: 'MongoDB', bold: true, color: C.err },          'Time-series, alta escritura. PySpark Mongo-Spark nativo.'],
        ['Asistencias',       { text: 'MongoDB', bold: true, color: C.err },          'Time-series IoT. Schema append-only.'],
        ['Evaluaciones',      { text: 'MongoDB', bold: true, color: C.err },          'Schema variable por entrenador.'],
        ['Logros Entrenador', { text: 'MongoDB', bold: true, color: C.err },          'Append-only. Flexible schema.'],
      ]
    ),
    gap(2),

    h2('3.2 PySpark con Dual Database'),
    gap(),
    bullet('MongoDB: conector Mongo-Spark existente (colecciones: progreso_fisico, asistencias)'),
    bullet('PostgreSQL: JDBC connector (org.postgresql:postgresql:42.x). Lectura de pagos, membresías para analytics.'),
    bullet('spark_config.py: se agrega helper get_spark_pg_df(query) para queries JDBC sobre Postgres'),
    gap(2),

    // ── 4. User Stories ──────────────────────────────────────────────────────
    h1('4. User Stories'),
    gap(),

    // US7
    h2('US7 — PostgreSQL en Docker'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US7'],
        ['Título',       'Integrar PostgreSQL como servicio Docker'],
        ['Estimación',   '3 puntos'],
        ['Rama',         'feature/us7-postgres-docker'],
        ['Archivos',     'docker-compose.yml, api/.env.example'],
      ]
    ),
    gap(),
    h3('Descripción'),
    bullet('Agregar servicio postgres:16-alpine al docker-compose.yml con healthcheck pg_isready'),
    bullet('Volumen persistente pg_data para persistencia de datos entre reinicios'),
    bullet('Variables de entorno: POSTGRES_URI, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD'),
    bullet('El servicio api debe declarar depends_on: postgres con condition: service_healthy'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('docker compose up levanta Postgres y pasa healthcheck antes de iniciar api'),
    bullet('psql -U gymuser -d gymprodb ejecuta correctamente desde WSL'),
    bullet('Variable POSTGRES_URI disponible en el contenedor api'),
    gap(2),

    // US8
    h2('US8 — Modelos SQLAlchemy + Alembic (Gimnasio, Usuario, Rol)'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US8'],
        ['Título',       'Modelos SQLAlchemy y migraciones Alembic para entidades de plataforma'],
        ['Estimación',   '8 puntos'],
        ['Rama',         'feature/us8-sqlalchemy-models'],
        ['Archivos',     'api/app/models/pg/ (gimnasio.py, usuario.py, rol.py), api/migrations/'],
      ]
    ),
    gap(),
    h3('Modelos a implementar'),
    bullet('Rol: id (PK), nombre (UNIQUE NOT NULL), created_at'),
    bullet('Gimnasio: id (PK), nombre, plan (enum: basico/pro/enterprise), activo (bool), stripe_customer_id, created_at'),
    bullet('Usuario: id (PK), email (UNIQUE), password_hash, id_gimnasio (FK Gimnasio), id_rol (FK Rol), activo, created_at'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('alembic upgrade head corre sin errores con Postgres limpio'),
    bullet('FK Gimnasio->Usuario y Rol->Usuario aplicadas con CASCADE configurado'),
    bullet('Datos de prueba (seed) con 1 gimnasio, 3 roles (Administrador, Entrenador, Recepcionista), 1 usuario admin'),
    gap(2),

    // US9
    h2('US9 — Tenant Middleware'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US9'],
        ['Título',       'Middleware Flask para propagación del tenant (id_gimnasio)'],
        ['Estimación',   '5 puntos'],
        ['Rama',         'feature/us9-tenant-middleware'],
        ['Archivos',     'api/app/utils/tenant.py, api/app/__init__.py, todos los blueprints'],
      ]
    ),
    gap(),
    h3('Descripción'),
    bullet('Middleware @before_request que extrae id_gimnasio del JWT y lo asigna a flask.g.tenant_id'),
    bullet('Rutas exentas: /auth/login, /auth/register, /health'),
    bullet('Aplicar a blueprints: miembros, pagos, rutinas, salud, backups, ventas, analíticos'),
    bullet('Función helper get_tenant_filter() retorna {"id_gimnasio": g.tenant_id} para queries Mongo y WHERE para Postgres'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('Request sin JWT válido con id_gimnasio → 401 Unauthorized'),
    bullet('Request válido → g.tenant_id disponible en cualquier ruta protegida'),
    bullet('Test de integración: usuario de gimnasio A no accede a datos de gimnasio B'),
    gap(2),

    // US10
    h2('US10 — JWT Multi-tenant Claims'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US10'],
        ['Título',       'Emitir JWT con claims multi-tenant (id_gimnasio, rol, plan)'],
        ['Estimación',   '3 puntos'],
        ['Rama',         'feature/us10-jwt-claims'],
        ['Archivos',     'api/app/auth/routes.py'],
      ]
    ),
    gap(),
    h3('Claims a incluir en el token JWT'),
    bullet('identity: user.id'),
    bullet('additional_claims.id_gimnasio: el ID del gimnasio del usuario'),
    bullet('additional_claims.rol: nombre del rol (Administrador, Entrenador, etc.)'),
    bullet('additional_claims.plan: plan del gimnasio (basico, pro, enterprise)'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('Token decodificado contiene los 4 claims (identity + 3 adicionales)'),
    bullet('Tenant middleware lee id_gimnasio desde get_jwt()["id_gimnasio"] sin error'),
    bullet('Login devuelve error 401 si usuario.activo = False o gimnasio.activo = False'),
    gap(2),

    // US11
    h2('US11 — PySpark JDBC Connector para PostgreSQL'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US11'],
        ['Título',       'Configurar PySpark con JDBC para leer desde PostgreSQL'],
        ['Estimación',   '3 puntos'],
        ['Rama',         'feature/us11-spark-jdbc'],
        ['Archivos',     'api/app/routes/spark_config.py, api/Dockerfile'],
      ]
    ),
    gap(),
    h3('Descripción'),
    bullet('Agregar org.postgresql:postgresql:42.7.3 a spark.jars.packages en spark_config.py'),
    bullet('Función get_spark_pg_df(query: str) -> DataFrame para leer tablas PG desde Spark'),
    bullet('Mantener función get_spark_df() existente para colecciones MongoDB'),
    bullet('Agregar POSTGRES_URI a las variables de entorno disponibles en spark_config.py'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('Script de prueba que lee SELECT COUNT(*) FROM usuarios desde Spark sin error'),
    bullet('Colecciones MongoDB (progreso_fisico, asistencias) siguen funcionando con get_spark_df()'),
    gap(2),

    // ── 5. Backlog ───────────────────────────────────────────────────────────
    h1('5. Sprint Backlog'),
    gap(),

    mkTable(
      [600, 3600, 1600, 1560, 2000],
      ['ID', 'Título', 'Estimación', 'Estado', 'Responsable'],
      [
        ['US7',  'PostgreSQL en Docker',                       '3 pts',  'Pendiente', 'Equipo'],
        ['US8',  'Modelos SQLAlchemy + Alembic',               '8 pts',  'Pendiente', 'Equipo'],
        ['US9',  'Tenant Middleware',                          '5 pts',  'Pendiente', 'Equipo'],
        ['US10', 'JWT Multi-tenant Claims',                    '3 pts',  'Pendiente', 'Equipo'],
        ['US11', 'PySpark JDBC Connector',                     '3 pts',  'Pendiente', 'Equipo'],
        [{ text: 'TOTAL', bold: true }, { text: '22 Story Points', bold: true }, { text: '22 pts', bold: true }, '', ''],
      ]
    ),
    gap(2),

    // ── 6. Definition of Done ────────────────────────────────────────────────
    h1('6. Definition of Done'),
    gap(),
    bullet('Código revisado y mergeado en rama feature/sprint2-dual-db'),
    bullet('docker compose up --build levanta los 4 servicios (api, web, mongo, postgres, redis) sin errores'),
    bullet('alembic upgrade head ejecuta sin errores en Postgres limpio'),
    bullet('Tenant middleware verificado: datos entre gimnasios completamente aislados'),
    bullet('PySpark JDBC lee desde PostgreSQL y Mongo-Spark desde MongoDB en la misma sesión Spark'),
    bullet('Variables de entorno documentadas en api/.env.example'),
    bullet('Commit en rama saas con mensaje convencional feat(sprint2): ...'),
    gap(2),

    // ── 7. Deuda técnica identificada ────────────────────────────────────────
    h1('7. Deuda Técnica del Sprint Anterior'),
    gap(),
    mkTable(
      [3000, 4560, 1800],
      ['Deuda', 'Descripción', 'Sprint Target'],
      [
        ['Variables VITE vs REACT_APP', 'El .env usa VITE_API_URL pero el proyecto es CRA (requiere REACT_APP_*). Las variables VITE_* son ignoradas por react-scripts.', 'Sprint 3'],
        ['URLs hardcodeadas en src/api/', 'Todos los archivos src/api/*.jsx tienen localhost:5000 directo. Impide deploy a producción sin build manual.', 'Sprint 3'],
        ['mongodump en Dockerfile', 'Resuelto en US6. mongodb-database-tools incluido en runtime stage.', 'Completado'],
      ]
    ),
    gap(2),
  ];

  return new Document({
    numbering,
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size:   { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: { default: mkHeader(docTitle) },
      footers: { default: mkFooter() },
      children,
    }],
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SPRINT 3 — Pagos, Membresías y Refactor Web
// ════════════════════════════════════════════════════════════════════════════

function buildSprint3() {
  const title    = 'Pagos, Membresias y Refactor Web';
  const docTitle = `Sprint 3 — ${title}`;

  const children = [
    ...makeCover(
      '3',
      title,
      'Stripe Billing + Migracion Financiera + Frontend Refactor',
      '2 Junio – 13 Junio 2026'
    ),

    // ── 1. Resumen ejecutivo ─────────────────────────────────────────────────
    h1('1. Resumen del Sprint'),
    gap(),

    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['Sprint',        'Sprint 3 de 5'],
        ['Nombre',        'Pagos, Membresias y Refactor Web'],
        ['Período',       '2 Junio – 13 Junio 2026  (2 semanas)'],
        ['Estado',        'Planificado'],
        ['Rama Git',      'feature/sprint3-billing-web'],
        ['Equipo',        TEAM.join(' / ')],
        ['Dependencias',  'Sprint 2 completado (Dual DB + Multi-tenant activo)'],
      ]
    ),
    gap(2),

    // ── 2. Sprint Goal ───────────────────────────────────────────────────────
    h1('2. Sprint Goal'),
    gap(),
    p('Migrar todas las entidades financieras a PostgreSQL con migraciones Alembic auditables, integrar Stripe para billing multi-tenant con webhooks, y refactorizar el frontend React eliminando URLs hardcodeadas, corrigiendo la configuración de variables de entorno (REACT_APP_*) y preparando el build para producción en nginx.'),
    gap(),

    // ── 3. User Stories ──────────────────────────────────────────────────────
    h1('3. User Stories'),
    gap(),

    // US12
    h2('US12 — Migrar Entidades Financieras a PostgreSQL'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US12'],
        ['Título',       'Migrar pagos, membresías, ventas y productos a PostgreSQL con Alembic'],
        ['Estimación',   '13 puntos'],
        ['Rama',         'feature/us12-financial-migration'],
        ['Archivos',     'api/app/models/pg/ (pago.py, membresia.py, venta.py, producto.py), api/migrations/'],
      ]
    ),
    gap(),
    h3('Modelos a implementar'),
    bullet('Producto: id, nombre, descripcion, precio, stock (int), id_gimnasio (FK), activo'),
    bullet('Membresia: id, nombre, precio_mensual, duracion_dias, id_gimnasio (FK), activo'),
    bullet('MiembroMembresia: id, id_miembro, id_membresia (FK), fecha_inicio, fecha_fin, estado (enum)'),
    bullet('Pago: id, id_gimnasio (FK), id_miembro, monto, tipo, metodo_pago, stripe_payment_id, fecha, estado'),
    bullet('Venta: id, id_gimnasio (FK), id_miembro, fecha, total — con tabla VentaDetalle(id_venta FK, id_producto FK, cantidad, precio_unitario)'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('alembic upgrade head crea todas las tablas con FK, índices en id_gimnasio y fecha'),
    bullet('Endpoints de pagos, membresías y ventas leen/escriben desde PostgreSQL (no MongoDB)'),
    bullet('Script de migración de datos existentes de Mongo a PG incluido en migrations/data/'),
    bullet('PySpark JDBC lee tabla pagos sin error: SELECT * FROM pagos WHERE id_gimnasio = ?'),
    gap(2),

    // US13
    h2('US13 — Stripe Billing Integration'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US13'],
        ['Título',       'Integrar Stripe para billing multi-tenant por gimnasio'],
        ['Estimación',   '8 puntos'],
        ['Rama',         'feature/us13-stripe-billing'],
        ['Archivos',     'api/app/billing/ (routes.py, service.py, webhooks.py), api/.env.example'],
      ]
    ),
    gap(),
    h3('Descripción'),
    bullet('Crear Stripe Customer al registrar nuevo gimnasio (stripe.Customer.create)'),
    bullet('Crear suscripción Stripe al seleccionar plan (basico/pro/enterprise)'),
    bullet('Webhook endpoint POST /billing/webhook — validar firma con STRIPE_WEBHOOK_SECRET'),
    bullet('Eventos manejados: payment_intent.succeeded, customer.subscription.updated, customer.subscription.deleted'),
    bullet('Al recibir webhook: actualizar campo plan y activo en tabla gimnasios (PostgreSQL)'),
    bullet('Variables nuevas: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_BASICO, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('stripe listen --forward-to localhost:5000/billing/webhook no arroja errores de firma'),
    bullet('Pago exitoso con tarjeta 4242 4242 4242 4242 actualiza plan en base de datos'),
    bullet('Suscripción cancelada → gimnasio.activo = False → login devuelve 401'),
    bullet('Clave STRIPE_SECRET_KEY en .env.example como placeholder, nunca en código'),
    gap(2),

    // US14
    h2('US14 — Migrar Catálogos a PostgreSQL'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US14'],
        ['Título',       'Migrar tipos de dieta y recetas a PostgreSQL'],
        ['Estimación',   '3 puntos'],
        ['Rama',         'feature/us14-catalogs-migration'],
        ['Archivos',     'api/app/models/pg/dieta.py, api/app/models/pg/receta.py, api/migrations/'],
      ]
    ),
    gap(),
    h3('Modelos a implementar'),
    bullet('TipoDieta: id, nombre, descripcion, id_gimnasio (FK), activo'),
    bullet('Receta: id, nombre, calorias, proteinas, carbohidratos, grasas, id_tipo_dieta (FK), id_gimnasio (FK)'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('Endpoints de dietas y recetas responden con datos desde PostgreSQL'),
    bullet('Datos existentes migrados desde colecciones MongoDB a tablas PG'),
    gap(2),

    // US15
    h2('US15 — Refactor Frontend: Eliminar URLs Hardcodeadas'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US15'],
        ['Título',       'Refactorizar frontend React: variables de entorno y eliminación de localhost:5000'],
        ['Estimación',   '5 puntos'],
        ['Rama',         'feature/us15-web-refactor'],
        ['Archivos',     'web/src/api/*.jsx, web/.env, web/.env.example, web/package.json'],
      ]
    ),
    gap(),
    h3('Problemas actuales identificados en Sprint 1'),
    bullet('Todos los archivos web/src/api/*.jsx (auth, miembros, pagos, dashboard, membresias, backups) tienen http://localhost:5000 hardcodeado.'),
    bullet('El archivo web/.env declara VITE_API_URL pero el proyecto usa CRA (react-scripts). Las variables VITE_* son ignoradas completamente.'),
    bullet('nginx.conf ya tiene configurado proxy_pass /api/ -> api:5000 (resuelto en US3).'),
    gap(),
    h3('Acciones a realizar'),
    bullet('Reemplazar todas las ocurrencias de http://localhost:5000 por process.env.REACT_APP_API_URL en web/src/api/*.jsx'),
    bullet('Actualizar web/.env: renombrar VITE_API_URL a REACT_APP_API_URL con valor http://localhost:5000 para desarrollo local'),
    bullet('Crear web/.env.example con REACT_APP_API_URL=/api (valor para producción via nginx)'),
    bullet('Evaluar migración CRA -> Vite: si se decide migrar, actualizar vite.config.js y referencias a import.meta.env en lugar de process.env'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('npm run build en web/ completa sin errores con REACT_APP_API_URL=/api'),
    bullet('grep -r "localhost:5000" web/src/ no devuelve ningún resultado'),
    bullet('Frontend en Docker hace peticiones a /api/... (relativo), nginx proxea a api:5000 internamente'),
    bullet('La aplicación funciona completa sin CORS errors en docker compose up'),
    gap(2),

    // US16
    h2('US16 — Onboarding Flow para Nuevos Gimnasios'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['ID',           'US16'],
        ['Título',       'Flujo de onboarding multi-step para registro de nuevo gimnasio'],
        ['Estimación',   '8 puntos'],
        ['Rama',         'feature/us16-onboarding'],
        ['Archivos',     'api/app/onboarding/ (routes.py, service.py), web/src/pages/Onboarding.jsx'],
      ]
    ),
    gap(),
    h3('Flujo del proceso'),
    bullet('Paso 1 — Datos del Gimnasio: nombre, dirección, teléfono, email de contacto'),
    bullet('Paso 2 — Datos del Administrador: nombre, email, contraseña, confirmación'),
    bullet('Paso 3 — Selección de Plan: Básico / Pro / Enterprise con precios y features'),
    bullet('Paso 4 — Pago: Stripe Checkout o Card Element según plan'),
    bullet('Confirmación: dashboard del administrador con gimnasio activo'),
    gap(),
    h3('Backend: transacción atómica'),
    bullet('Crear Gimnasio en PostgreSQL (activo = False hasta confirmación de pago)'),
    bullet('Crear Usuario Administrador con hash bcrypt, FK a Gimnasio, FK a Rol Administrador'),
    bullet('Crear Stripe Customer + iniciar suscripción del plan seleccionado'),
    bullet('Webhook payment_intent.succeeded activa el gimnasio (activo = True) y emite JWT de bienvenida'),
    gap(),
    h3('Criterios de Aceptación'),
    bullet('Flujo completo de registro desde /register crea: 1 gimnasio + 1 usuario admin + 1 suscripción Stripe'),
    bullet('Gimnasio.activo = False hasta que el webhook de pago exitoso lo activa'),
    bullet('Email de bienvenida enviado al completar onboarding (integrar Flask-Mail o SendGrid básico)'),
    gap(2),

    // ── 4. Backlog ───────────────────────────────────────────────────────────
    h1('4. Sprint Backlog'),
    gap(),

    mkTable(
      [600, 4200, 1400, 1560, 1800],
      ['ID', 'Título', 'Estimación', 'Estado', 'Prioridad'],
      [
        ['US12', 'Migrar Entidades Financieras a PG',     '13 pts', 'Pendiente', 'Alta'],
        ['US13', 'Stripe Billing Integration',            '8 pts',  'Pendiente', 'Alta'],
        ['US14', 'Migrar Catálogos a PostgreSQL',         '3 pts',  'Pendiente', 'Media'],
        ['US15', 'Refactor Frontend URLs Hardcodeadas',   '5 pts',  'Pendiente', 'Alta'],
        ['US16', 'Onboarding Flow Nuevos Gimnasios',      '8 pts',  'Pendiente', 'Media'],
        [{ text: 'TOTAL', bold: true }, { text: '37 Story Points', bold: true }, { text: '37 pts', bold: true }, '', ''],
      ]
    ),
    gap(2),

    // ── 5. Riesgos ───────────────────────────────────────────────────────────
    h1('5. Riesgos e Impedimentos'),
    gap(),

    mkTable(
      [3000, 3480, 1380, 1500],
      ['Riesgo', 'Mitigación', 'Probabilidad', 'Impacto'],
      [
        ['Migraciones Alembic con datos existentes en Mongo pueden tener schema inconsistente',
         'Script de validación pre-migración que detecta documentos con campos faltantes',
         'Media', 'Alto'],
        ['Webhooks de Stripe requieren URL pública (ngrok en desarrollo)',
         'Usar stripe listen --forward-to localhost:5000/billing/webhook en dev',
         'Baja', 'Medio'],
        ['Refactor de web/src/api/*.jsx puede romper funcionalidad si hay referencias implícitas',
         'Revisar todos los archivos con grep antes del commit. Test manual de cada sección.',
         'Media', 'Medio'],
        ['Onboarding con Stripe en sandbox puede requerir cuenta Stripe activa',
         'Usar Stripe Test Mode con claves sk_test_*. No requiere cuenta verificada.',
         'Baja', 'Bajo'],
      ]
    ),
    gap(2),

    // ── 6. Definition of Done ────────────────────────────────────────────────
    h1('6. Definition of Done'),
    gap(),
    bullet('Todas las US mergeadas en rama feature/sprint3-billing-web sin conflictos'),
    bullet('docker compose up --build levanta todos los servicios sin errores'),
    bullet('alembic upgrade head crea tablas de entidades financieras y catálogos sin error'),
    bullet('grep -r "localhost:5000" web/src/ no devuelve resultados'),
    bullet('Pago de prueba con tarjeta Stripe 4242 4242 4242 4242 funciona end-to-end'),
    bullet('Onboarding completo crea gimnasio + usuario + suscripción en una sola transacción'),
    bullet('Commit en rama saas con mensaje: feat(sprint3): Billing + Financial Migration + Web Refactor'),
    gap(2),

    // ── 7. Dependencias ──────────────────────────────────────────────────────
    h1('7. Dependencias y Librerías Nuevas'),
    gap(),

    mkTable(
      [2400, 2000, 4960],
      ['Librería', 'Versión', 'Propósito'],
      [
        ['stripe',        '^9.x',   'SDK Python oficial de Stripe para pagos y webhooks'],
        ['alembic',       '^1.13.x', 'Migraciones de esquema para SQLAlchemy + PostgreSQL'],
        ['Flask-Mail',    '^0.10.x', 'Email de bienvenida en onboarding (o SendGrid)'],
        ['psycopg2-binary','>=2.9.9', 'Adaptador PostgreSQL para SQLAlchemy (ya en requirements si se configuró US7)'],
      ]
    ),
    gap(2),

    // ── 8. Preview Sprint 4 ──────────────────────────────────────────────────
    h1('8. Preview Sprint 4'),
    gap(),
    p('Con la infraestructura dual-database estable y el billing activo, Sprint 4 se enfocará en:'),
    bullet('Analytics avanzados con PySpark: regresión lineal sobre histórico de pagos, K-Means para segmentación de miembros por actividad, MapReduce para reportes de asistencia por período'),
    bullet('Dashboard de analytics para el rol Administrador con visualizaciones en tiempo real'),
    bullet('Expansión de modelos ML: predicción de cancelaciones de membresía, recomendaciones de rutina personalizadas'),
    bullet('API de reportes exportables (CSV/PDF) generados con Spark sobre datos PostgreSQL y MongoDB'),
    gap(2),
  ];

  return new Document({
    numbering,
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size:   { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: { default: mkHeader(docTitle) },
      footers: { default: mkFooter() },
      children,
    }],
  });
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const outDir = __dirname;

  console.log('Generando Sprint 2...');
  const s2 = buildSprint2();
  const s2buf = await Packer.toBuffer(s2);
  fs.writeFileSync(path.join(outDir, 'GymPro_Sprint2_Plan.docx'), s2buf);
  console.log('  -> GymPro_Sprint2_Plan.docx');

  console.log('Generando Sprint 3...');
  const s3 = buildSprint3();
  const s3buf = await Packer.toBuffer(s3);
  fs.writeFileSync(path.join(outDir, 'GymPro_Sprint3_Plan.docx'), s3buf);
  console.log('  -> GymPro_Sprint3_Plan.docx');

  console.log('\nDone. Archivos generados en doc/sprints/');
  console.log('\nLimpia los archivos temporales con:');
  console.log('  rm gen_sprints.js package.json package-lock.json');
  console.log('  rm -rf node_modules');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
