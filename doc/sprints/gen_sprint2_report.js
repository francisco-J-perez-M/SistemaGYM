'use strict';
/**
 * gen_sprint2_report.js — GymPro SaaS
 * Genera GymPro_Sprint2_Report.docx (Reporte de Cierre Sprint 2)
 * Uso: node gen_sprint2_report.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TabStopPosition,
} = require('docx');
const fs = require('fs');

// ── COLORES ──────────────────────────────────────────────────────────────────
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

const TEAM = [
  'Maximiliano Arriaga Mora',
  'Miguel Angel Hernandez Cervantes',
  'Jesus Francisco Perez Medina',
  'Juan Carlos Perez Nava',
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
const bdr  = (color = 'CCCCCC', size = 1) => ({ style: BorderStyle.SINGLE, size, color });
const bdrs = (c) => ({ top: bdr(c), bottom: bdr(c), left: bdr(c), right: bdr(c) });

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const gap = (lines = 1) => new Paragraph({
  children: [new TextRun('')],
  spacing:  { before: lines * 140, after: 0 },
});

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

const bullet = (text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  children:  [new TextRun({ text, font: 'Arial', size: 22 })],
  spacing:   { before: 60, after: 60 },
});

const bulletBold = (label, text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  children: [
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
    width:        { size: total, type: WidthType.DXA },
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

const numbering = {
  config: [
    {
      reference: 'bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    },
    {
      reference: 'numbers',
      levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// PORTADA
// ════════════════════════════════════════════════════════════════════════════
function makeCover() {
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
      children:  [new TextRun({ text: 'Sprint 2', font: 'Arial', size: 56, bold: true, color: C.secondary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 80 },
      children:  [new TextRun({ text: 'Reporte de Cierre', font: 'Arial', size: 40, bold: true, color: C.primary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 80 },
      children:  [new TextRun({ text: 'Multi-tenant + Dual Database', font: 'Arial', size: 30, bold: false, color: C.secondary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 120 },
      children:  [new TextRun({ text: 'Período: 19 Mayo – 13 Mayo 2026', font: 'Arial', size: 24, color: C.muted })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 160 },
      children:  [new TextRun({ text: 'Estado: ', font: 'Arial', size: 26, bold: true, color: C.primary }),
                  new TextRun({ text: 'COMPLETADO', font: 'Arial', size: 26, bold: true, color: C.success })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { before: 200, after: 160 },
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

// ════════════════════════════════════════════════════════════════════════════
// CONTENIDO DEL REPORTE
// ════════════════════════════════════════════════════════════════════════════
function buildReport() {
  const children = [
    ...makeCover(),

    // ── 1. Resumen ejecutivo ─────────────────────────────────────────────────
    h1('1. Resumen Ejecutivo'),
    gap(),
    mkTable(
      [2600, 6760],
      ['Campo', 'Detalle'],
      [
        ['Sprint',            'Sprint 2 de 5'],
        ['Nombre',            'Multi-tenant + Dual Database'],
        ['Período planificado','19 Mayo – 30 Mayo 2026'],
        ['Período real',      '19 Mayo – 13 Mayo 2026'],
        ['Estado',            { text: 'COMPLETADO — 5/5 User Stories entregadas', bold: true, color: C.success }],
        ['Velocity',          '22 story points entregados (100% del sprint)'],
        ['Rama Git',          'feature/sprint2-dual-db'],
        ['Equipo',            TEAM.join(' / ')],
      ]
    ),
    gap(2),
    p('El Sprint 2 alcanzó el 100% de sus objetivos planificados. Se implementó la arquitectura dual de base de datos (PostgreSQL + MongoDB), el sistema multi-tenant con aislamiento por gimnasio, y el conector PySpark JDBC para analíticas sobre datos relacionales. Adicionalmente se resolvieron 9 defectos de estabilización no planificados que dejaron el stack completamente operativo al cierre del sprint.'),
    gap(2),

    // ── 2. Sprint Goal — ¿se cumplió? ────────────────────────────────────────
    h1('2. Sprint Goal'),
    gap(),
    new Paragraph({
      children: [
        new TextRun({ text: 'Goal: ', font: 'Arial', size: 22, bold: true }),
        new TextRun({ text: 'Implementar arquitectura multi-tenant dual-database. Al terminar, el API debe operar bajo aislamiento por gimnasio mediante tenant middleware y JWT multi-tenant.', font: 'Arial', size: 22 }),
      ],
      spacing: { before: 80, after: 80 },
    }),
    gap(),
    new Paragraph({
      children: [
        new TextRun({ text: 'Resultado: ', font: 'Arial', size: 22, bold: true, color: C.success }),
        new TextRun({ text: 'CUMPLIDO. Todos los endpoints protegidos propagan tenant_id desde el JWT. Los 5 contenedores (postgres, mongo, redis, api, web) pasan healthcheck. Analíticas K-Means, Regresión y MapReduce operativas con datos reales.', font: 'Arial', size: 22, color: C.success }),
      ],
      spacing: { before: 80, after: 80 },
    }),
    gap(2),

    // ── 3. User Stories entregadas ───────────────────────────────────────────
    h1('3. User Stories Entregadas'),
    gap(),

    mkTable(
      [600, 3800, 1400, 1400, 2160],
      ['ID', 'Título', 'Estimado', 'Real', 'Estado'],
      [
        ['US7',  'PostgreSQL en Docker',              '3 pts', '3 pts', { text: 'Completado', color: C.success, bold: true }],
        ['US8',  'Modelos SQLAlchemy + Alembic',      '8 pts', '8 pts', { text: 'Completado', color: C.success, bold: true }],
        ['US9',  'Tenant Middleware',                 '5 pts', '5 pts', { text: 'Completado', color: C.success, bold: true }],
        ['US10', 'JWT Multi-tenant Claims',           '3 pts', '3 pts', { text: 'Completado', color: C.success, bold: true }],
        ['US11', 'PySpark JDBC Connector',            '3 pts', '3 pts', { text: 'Completado', color: C.success, bold: true }],
        [{ text: 'TOTAL', bold: true }, { text: '5 / 5 User Stories', bold: true }, { text: '22 pts', bold: true }, { text: '22 pts', bold: true }, { text: '100%', bold: true, color: C.success }],
      ]
    ),
    gap(2),

    // US7
    h2('US7 — PostgreSQL en Docker'),
    gap(),
    h3('Criterios de Aceptación — Resultado'),
    bullet('docker compose up levanta PostgreSQL 16-alpine con healthcheck pg_isready antes de iniciar api — CUMPLIDO'),
    bullet('Volumen persistente pg_data mantiene datos entre reinicios — CUMPLIDO'),
    bullet('Variables POSTGRES_URI, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD disponibles en el contenedor api — CUMPLIDO'),
    bullet('Puerto 5432 expuesto al host para gestión con DBeaver — CUMPLIDO'),
    gap(),
    h3('Archivos modificados'),
    bullet('docker-compose.yml — servicio postgres:16-alpine con healthcheck, volumen pg_data, red gympro'),
    bullet('api/.env — variables POSTGRES_* añadidas'),
    gap(2),

    // US8
    h2('US8 — Modelos SQLAlchemy + Alembic'),
    gap(),
    h3('Criterios de Aceptación — Resultado'),
    bullet('alembic upgrade head ejecuta sin errores con Postgres limpio — CUMPLIDO'),
    bullet('Modelo Rol: id, nombre (UNIQUE NOT NULL), created_at — CUMPLIDO'),
    bullet('Modelo Gimnasio: id, nombre, plan (enum: basico/pro/enterprise), activo, stripe_customer_id — CUMPLIDO'),
    bullet('Modelo Usuario: id, email (UNIQUE), password_hash, FK id_gimnasio, FK id_rol, activo — CUMPLIDO'),
    bullet('entrypoint.sh ejecuta alembic upgrade head antes de iniciar Gunicorn — CUMPLIDO'),
    gap(),
    h3('Archivos modificados'),
    bullet('api/app/models/pg/gimnasio.py — PGEnum con create_type=False para evitar duplicados en recreaciones'),
    bullet('api/app/models/pg/usuario.py, rol.py — modelos SQLAlchemy con FKs y columnas auditables'),
    bullet('api/entrypoint.sh (nuevo) — orquesta migraciones antes del servidor WSGI'),
    bullet('api/migrations/ — revisiones Alembic generadas con autogenerate'),
    gap(2),

    // US9
    h2('US9 — Tenant Middleware'),
    gap(),
    h3('Criterios de Aceptación — Resultado'),
    bullet('Middleware @before_request extrae id_gimnasio del JWT y lo asigna a flask.g.tenant_id — CUMPLIDO'),
    bullet('Rutas exentas /auth/login, /auth/register, /health no requieren tenant — CUMPLIDO'),
    bullet('Helper get_tenant_filter() retorna filtro para queries Mongo y WHERE para Postgres — CUMPLIDO'),
    bullet('Request sin id_gimnasio en JWT retorna 401 Unauthorized — CUMPLIDO'),
    gap(),
    h3('Archivos modificados'),
    bullet('api/app/utils/tenant.py — lógica completa del middleware y helpers'),
    bullet('api/app/__init__.py — registro del middleware en el factory create_app()'),
    gap(2),

    // US10
    h2('US10 — JWT Multi-tenant Claims'),
    gap(),
    h3('Criterios de Aceptación — Resultado'),
    bullet('Token incluye claims: identity (user.id), id_gimnasio, rol, plan — CUMPLIDO'),
    bullet('Tenant middleware lee id_gimnasio desde get_jwt()["id_gimnasio"] sin error — CUMPLIDO'),
    bullet('Login retorna 401 si usuario.activo = False o gimnasio.activo = False — CUMPLIDO'),
    gap(),
    h3('Archivos modificados'),
    bullet('api/app/auth/routes.py — additional_claims con id_gimnasio, rol y plan; guard hasattr para enum vs string'),
    gap(2),

    // US11
    h2('US11 — PySpark JDBC Connector para PostgreSQL'),
    gap(),
    h3('Criterios de Aceptación — Resultado'),
    bullet('org.postgresql:postgresql:42.7.3 configurado en spark.jars.packages — CUMPLIDO'),
    bullet('Función get_spark_pg_df(query) lee tablas PostgreSQL desde Spark — CUMPLIDO'),
    bullet('Colecciones MongoDB (progreso_fisico, asistencias) siguen operando con get_spark_df() — CUMPLIDO'),
    bullet('Analíticas K-Means, Regresión lineal y MapReduce retornan resultados con datos reales (7,883 docs) — CUMPLIDO'),
    gap(),
    h3('Archivos modificados'),
    bullet('api/app/routes/spark_config.py — JDBC packages, helper get_spark_pg_df(), función get_mongo_db(), flags Java 17 --add-opens'),
    bullet('api/requirements.txt — pyspark==3.5.3 (pinned), setuptools>=70.0, flask-migrate==4.0.7'),
    gap(2),

    pageBreak(),

    // ── 4. Trabajo adicional ─────────────────────────────────────────────────
    h1('4. Trabajo Adicional Completado'),
    gap(),
    p('Durante el sprint se identificaron y resolvieron 9 defectos de estabilización no planificados que eran bloqueantes para la entrega funcional del sistema:'),
    gap(),

    mkTable(
      [3200, 4400, 1760],
      ['Defecto', 'Causa raíz / Solución', 'Impacto'],
      [
        ['URLs hardcodeadas localhost:5000 en React', 'src/api/*.jsx apuntaban directamente al puerto Flask. Migración a URLs relativas /api/... enrutadas por nginx.', 'Crítico'],
        ['PySpark 4.0 incompatible con mongo-spark-connector 10.3.0', 'ExpressionEncoder.resolveAndBind removido en Spark 4. Pinned a pyspark==3.5.3.', 'Crítico'],
        ['distutils removido en Python 3.12', 'pyspark.ml.image importa distutils que fue eliminado. Fix: setuptools>=70.0 que lo backportea.', 'Crítico'],
        ['Campo bmi vs imc en analytics routes', 'Seed usa campo "imc"; rutas K-Means y Regresión leían "bmi". Fix: alias en Spark select.', 'Alto'],
        ['Campo cintura ausente en seed', 'Ruta de regresión referenciaba cintura no definida en seed. Fix: F.lit(None).cast("double").alias("cintura").', 'Alto'],
        ['plan_enum duplicado en recreación de DB', 'PGEnum con create_type=True intentaba crear el tipo dos veces. Fix: create_type=False.', 'Alto'],
        ['Axios interceptor inicializado con token null', 'Header Authorization se establecía al importar el módulo (token aún nulo). Fix: interceptor dinámico.', 'Medio'],
        ['Modelos rechazan campos extra del seed', 'Constructores de Miembro y Pago no aceptaban kwargs del seed masivo. Fix: **kwargs en constructores.', 'Medio'],
        ['Puerto MongoDB 27017 ocupado por instalación local', 'Conflicto con MongoDB instalado en el host. Fix: mapeo 27018:27017 en docker-compose.', 'Bajo'],
      ]
    ),
    gap(2),

    h2('Seed Dual-Database'),
    gap(),
    p('Se implementó un seed completo de datos de prueba para validar el sistema con volumen real:'),
    gap(),
    mkTable(
      [3000, 2000, 4360],
      ['Entidad', 'Cantidad', 'Motor'],
      [
        ['Gimnasios',      '3',      'PostgreSQL'],
        ['Roles',         '3',      'PostgreSQL'],
        ['Usuarios',      '120',    'PostgreSQL'],
        ['Miembros',      '~1,500', 'MongoDB'],
        ['Rutinas',       '~900',   'MongoDB'],
        ['Progreso físico','~2,500','MongoDB'],
        ['Asistencias',   '~1,800', 'MongoDB'],
        ['Pagos',         '~1,183', 'MongoDB'],
        [{ text: 'TOTAL documentos MongoDB', bold: true }, { text: '7,883', bold: true }, ''],
      ]
    ),
    gap(2),

    // ── 5. Métricas ──────────────────────────────────────────────────────────
    h1('5. Métricas del Sprint'),
    gap(),

    mkTable(
      [3500, 5860],
      ['Métrica', 'Valor'],
      [
        ['Story Points planificados',           '22'],
        ['Story Points entregados',             '22 (100%)'],
        ['User Stories planificadas',           '5'],
        ['User Stories entregadas',             '5 (100%)'],
        ['Defectos resueltos (no planificados)','9'],
        ['Servicios Docker en producción',      '5 (postgres, mongo, redis, api, web)'],
        ['Documentos seed MongoDB',             '7,883'],
        ['Registros seed PostgreSQL',           '126 (3 gimnasios, 3 roles, 120 usuarios)'],
        ['Endpoints analíticos operativos',     '3 (K-Means, Regresión, MapReduce)'],
        ['Cobertura de healthchecks',           '100% (todos los servicios con healthcheck)'],
      ]
    ),
    gap(2),

    // ── 6. Estado del sistema al cierre ──────────────────────────────────────
    h1('6. Estado del Sistema al Cierre del Sprint'),
    gap(),

    mkTable(
      [3000, 2000, 4360],
      ['Componente', 'Estado', 'Detalle'],
      [
        ['API Flask + Gunicorn',    { text: 'Healthy', color: C.success, bold: true }, 'Responde en /api/health con 200'],
        ['PostgreSQL 16',          { text: 'Healthy', color: C.success, bold: true }, 'pg_isready pasa. Acceso en localhost:5432'],
        ['MongoDB 7',              { text: 'Healthy', color: C.success, bold: true }, 'mongosh ping OK. Acceso Compass en localhost:27018'],
        ['Redis 7',                { text: 'Healthy', color: C.success, bold: true }, 'redis-cli ping retorna PONG'],
        ['Web React + nginx',      { text: 'Healthy', color: C.success, bold: true }, 'Disponible en http://localhost:3000'],
        ['Login / JWT',            { text: 'Operativo', color: C.success, bold: true }, 'Roles: Admin, Entrenador, Recepcionista. Pass: Gym2024!'],
        ['Analytics K-Means',      { text: 'Operativo', color: C.success, bold: true }, 'k=3 clusters con Silhouette score calculado'],
        ['Analytics Regresión',    { text: 'Operativo', color: C.success, bold: true }, 'Predicción de progreso con 5 features'],
        ['Analytics MapReduce',    { text: 'Operativo', color: C.success, bold: true }, 'Conteos por categoría sobre colecciones Mongo'],
        ['Tenant aislamiento',     { text: 'Operativo', color: C.success, bold: true }, 'id_gimnasio propagado desde JWT a todas las queries'],
      ]
    ),
    gap(2),

    pageBreak(),

    // ── 7. Retrospectiva ─────────────────────────────────────────────────────
    h1('7. Retrospectiva'),
    gap(),

    h2('7.1 ¿Qué salió bien?'),
    gap(),
    bullet('Arquitectura dual-database funcionó exactamente como fue diseñada: ACID en Postgres para finanzas y usuarios, schema flexible en Mongo para datos operacionales.'),
    bullet('El patrón entrypoint.sh con alembic upgrade head antes de Gunicorn es robusto y se mantendrá en sprints futuros para garantizar migraciones en deploys automáticos.'),
    bullet('El seed masivo de 7,883 documentos permitió validar las analíticas PySpark con volumen real desde el primer día.'),
    bullet('La decisión de usar nginx como proxy inverso y URLs relativas en React eliminó de raíz el problema de CORS y configuración por ambiente.'),
    bullet('El pinning de pyspark==3.5.3 resolvió la incompatibilidad con mongo-spark-connector 10.3.0 sin necesidad de cambiar el conector.'),
    gap(2),

    h2('7.2 ¿Qué mejorar?'),
    gap(),
    bullet('La deuda técnica de las URLs hardcodeadas en React debió resolverse en Sprint 1. Impactó la estabilización de Sprint 2.'),
    bullet('Los nombres de campos entre seed y rutas Spark (bmi vs imc, cintura) indican falta de contrato de datos documentado. Se debe definir un schema explícito al inicio de cada sprint.'),
    bullet('El proceso de detección de incompatibilidades de versiones (PySpark 4.0 vs mongo-spark-connector) fue reactivo. Para Sprint 3 se debe verificar la matriz de compatibilidad antes de actualizaciones.'),
    bullet('La creación del tipo PGEnum debe manejarse con cuidado en entornos con bases de datos reutilizadas. Documentar el procedimiento de reset de volumen en el README.'),
    gap(2),

    h2('7.3 Acciones para Sprint 3'),
    gap(),
    bullet('Definir schema de campos MongoDB al inicio del sprint para evitar mismatch con rutas Spark.'),
    bullet('Incluir paso de verificación de compatibilidad de versiones en el checklist de dependencias.'),
    bullet('Agregar contrato de API (OpenAPI/Swagger) para endpoints críticos antes de implementación.'),
    bullet('Continuar con la estrategia nginx proxy para todos los nuevos endpoints.'),
    gap(2),

    // ── 8. Deuda técnica ─────────────────────────────────────────────────────
    h1('8. Deuda Técnica al Cierre'),
    gap(),

    mkTable(
      [3000, 4200, 1160, 1000],
      ['Deuda', 'Descripción', 'Sprint Target', 'Prioridad'],
      [
        ['Tests de integración multi-tenant', 'No se implementaron tests automáticos que verifiquen aislamiento entre gimnasios A y B.', 'Sprint 4', 'Alta'],
        ['Validación de esquema MongoDB',    'No existe validación explícita de campos en colecciones MongoDB. Posibles inconsistencias con seed vs código.', 'Sprint 3', 'Media'],
        ['Rate limiting por tenant',         'Flask-Limiter configurado globalmente. No diferencia límites por gimnasio o plan.', 'Sprint 4', 'Media'],
        ['Variables VITE_* vs REACT_APP_*',  'Vestigio de Sprint 1. Ya resuelto con proxy nginx, pero .env.example tiene variables residuales.', 'Sprint 3', 'Baja'],
      ]
    ),
    gap(2),

    // ── 9. Próximos pasos ────────────────────────────────────────────────────
    h1('9. Próximos Pasos — Sprint 3'),
    gap(),
    p('Sprint 3: Pagos, Membresías y Refactor Web (2 Junio – 13 Junio 2026)'),
    gap(),
    mkTable(
      [600, 4000, 3000, 1760],
      ['ID', 'Título', 'Objetivo', 'Estimación'],
      [
        ['US12', 'Modelos PG: Membresias y Pagos',          'Esquema financiero ACID en PostgreSQL', '8 pts'],
        ['US13', 'Stripe Billing Integration',              'Checkout, webhooks y actualización de plan', '8 pts'],
        ['US14', 'Migración financiera desde MongoDB',      'Mover pagos legacy a PostgreSQL con scripts', '5 pts'],
        ['US15', 'React: Context API + estado global',      'Eliminar prop drilling, centralizar auth', '5 pts'],
        ['US16', 'Dashboard métricas financieras',          'Widget de ingresos con datos reales PG', '3 pts'],
        [{ text: 'TOTAL', bold: true }, '', '', { text: '29 pts', bold: true }],
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
      headers: { default: mkHeader('Sprint 2 — Reporte de Cierre') },
      footers: { default: mkFooter() },
      children,
    }],
  });
}

// ── GENERAR ARCHIVO ──────────────────────────────────────────────────────────
const doc = buildReport();
Packer.toBuffer(doc).then(buffer => {
  const outPath = __dirname + '/GymPro_Sprint2_Report.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('Generado:', outPath);
});
