/ (Página de Aterrizaje / Landing)
├── /login (Auth única)
├── /dashboard
│   ├── /master (Rol: Master)
│   │   ├── /tenants (Gestión de comercios)
│   │   ├── /subscriptions (Control de planes)
│   │   └── /logs (Centro de monitoreo y errores de RegEx)
│   │
│   ├── /admin (Rol: Admin Tienda)
│   │   ├── /cajeros (CRUD de cajeros)
│   │   ├── /vinculacion (Generar código para APK)
│   │   ├── /reportes (Cuadre diario y histórico)
│   │   └── /config (Ajustes de tienda)
│   │
│   └── /cashier (Rol: Cajero)
│       ├── /registrar-pago (Input monto/ref)
│       └── /historial (Últimas transacciones del día)




# Mapa del Sitio (Sitemap) del Sistema

## 1. Landing Page (Conversión y Ventas)
/ (Página de inicio profesional)
├── /planes (Detalle de Inicia, Profesional, Empresarial)
├── /como-funciona (Explicación del proceso: Puente + PWA)
├── /contacto (Formulario para soporte o ventas)
├── /registro (Formulario de registro inicial para prueba gratuita)
└── /login (Acceso directo para usuarios existentes)

## 2. Paneles PWA (Acceso Restringido - Dashboard)
/dashboard
├── /master (Rol: Master - Dueño SaaS)
│   ├── /tenants (Gestión de comercios)
│   ├── /subscriptions (Control de planes)
│   └── /logs (Monitoreo de salud y errores)
│
├── /admin (Rol: Admin Tienda)
│   ├── /cajeros (CRUD de cajeros)
│   ├── /vinculacion (Generar código para APK)
│   ├── /reportes (Cuadre diario y histórico)
│   └── /config (Ajustes de tienda)
│
└── /cashier (Rol: Cajero)
    ├── /registrar-pago (Input monto/ref)
    └── /historial (Últimas transacciones del día)

## 3. Aplicación Móvil (El Puente - APK)
[ Splash Screen ]
├── [ Vinculación (Código 6 dígitos) ]
└── [ Dashboard Servicio (Toggle ON/OFF + Monitor Realtime) ]

## 4. API (Integración B2B)
/api/v1/
├── /validate-payment (Validación de pagos)
├── /webhooks (Notificaciones hacia tiendas)
└── /health-check (Monitoreo de estado de dispositivo)