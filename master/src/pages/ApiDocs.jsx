import { useState } from 'react'
import {
  Code,
  Copy,
  Check,
  Smartphone,
  Globe,
  Terminal,
  Server,
  Key,
  Shield,
  Database,
  Webhook,
  FileCode,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Book,
  Download,
  Apple,
  Android,
} from 'lucide-react'

const codeExamples = {
  restApi: {
    title: 'REST API',
    description: 'API REST para integración directa desde cualquier plataforma',
    baseUrl: 'https://sjwmnprpezkjwvibhihp.supabase.co/rest/v1',
    endpoints: [
      {
        method: 'GET',
        path: '/transactions',
        description: 'Obtener transacciones',
        params: ['tenant_id', 'status', 'limit', 'offset'],
        example: `curl -X GET "https://sjwmnprpezkjwvibhihp.supabase.co/rest/v1/transactions?tenant_id=eq.TENANT_ID&status=eq.approved" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"`,
      },
      {
        method: 'POST',
        path: '/transactions',
        description: 'Crear transacción',
        example: `curl -X POST "https://sjwmnprpezkjwvibhihp.supabase.co/rest/v1/transactions" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "TENANT_ID",
    "amount": 150.00,
    "reference": "REF-001",
    "bank": "Banco Nacional",
    "status": "pending"
  }'`,
      },
      {
        method: 'GET',
        path: '/tenants',
        description: 'Obtener información del tenant',
        example: `curl -X GET "https://sjwmnprpezkjwvibhihp.supabase.co/rest/v1/tenants?id=eq.TENANT_ID" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
    ],
  },
  javascript: {
    title: 'JavaScript / Node.js',
    description: 'SDK oficial de Supabase para JavaScript',
    install: 'npm install @supabase/supabase-js',
    code: `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjwmnprpezkjwvibhihp.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// Obtener transacciones aprobadas
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('status', 'approved')
  .order('created_at', { ascending: false })

// Crear transacción
const { data, error } = await supabase
  .from('transactions')
  .insert({
    tenant_id: 'YOUR_TENANT_ID',
    amount: 250.00,
    reference: 'REF-12345',
    bank: 'Banco Nacional',
    status: 'pending'
  })

// Escuchar cambios en tiempo real
supabase
  .channel('transactions')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
    console.log('Cambio detectado:', payload)
  })
  .subscribe()`,
  },
  python: {
    title: 'Python',
    description: 'Supabase Python Client',
    install: 'pip install supabase',
    code: `from supabase import create_client, Client

url: str = "https://sjwmnprpezkjwvibhihp.supabase.co"
key: str = "YOUR_ANON_KEY"
supabase: Client = create_client(url, key)

# Obtener transacciones
response = supabase.table("transactions").select("*").eq("status", "approved").execute()
print(response.data)

# Crear transacción
response = supabase.table("transactions").insert({
    "tenant_id": "YOUR_TENANT_ID",
    "amount": 300.00,
    "reference": "REF-PY-001",
    "bank": "Banco Nacional",
    "status": "pending"
}).execute()`,
  },
  php: {
    title: 'PHP',
    description: 'Supabase PHP Client',
    install: 'composer require supabase/functions-php',
    code: `<?php
require_once 'vendor/autoload.php';

use Supabase\\Client;

$client = new Client(
    'https://sjwmnprpezkjwvibhihp.supabase.co',
    'YOUR_ANON_KEY'
);

// Obtener transacciones
$response = $client->from('transactions')
    ->select('*')
    ->eq('status', 'approved')
    ->execute();

echo json_encode($response->body());`,
  },
  java: {
    title: 'Java / Android',
    description: 'Supabase Java Client',
    install: 'implementation "io.github.jan-tennert.supabase:postgrest-kt:2.0.0"',
    code: `import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.from

val client = createSupabaseClient(
    supabaseUrl = "https://sjwmnprpezkjwvibhihp.supabase.co",
    supabaseKey = "YOUR_ANON_KEY"
)

// Obtener transacciones
val transactions = client.from("transactions")
    .select {
        eq("status", "approved")
    }
    .decodeList<Transaction>()`,
  },
  reactNative: {
    title: 'React Native',
    description: 'SDK para aplicaciones móviles React Native',
    install: 'npm install @supabase/supabase-js',
    code: `import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://sjwmnprpezkjwvibhihp.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})`,
  },
}

const installationGuides = {
  android: {
    title: 'Android (APK)',
    icon: Android,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    steps: [
      {
        title: '1. Descargar la APK',
        content: 'Descarga el archivo .apk desde el enlace proporcionado por tu administrador o desde el portal de descargas.',
      },
      {
        title: '2. Habilitar fuentes desconocidas',
        content: 'Ve a Configuración > Seguridad > Fuentes desconocidas y actívalo para tu navegador o file manager.',
      },
      {
        title: '3. Instalar la APK',
        content: 'Abre el archivo .apk descargado y toca "Instalar". Sigue las instrucciones en pantalla.',
      },
      {
        title: '4. Configurar conexión',
        content: 'Al abrir la app, ingresa tu URL de Supabase y API Key en la pantalla de configuración.',
      },
      {
        title: '5. Iniciar sesión',
        content: 'Usa las credenciales proporcionadas por tu administrador para acceder al sistema.',
      },
    ],
  },
  ios: {
    title: 'iOS (iPhone/iPad)',
    icon: Apple,
    color: 'text-slate-800',
    bgColor: 'bg-slate-50',
    steps: [
      {
        title: '1. Instalar desde TestFlight',
        content: 'Abre el enlace de TestFlight en tu iPhone/iPad. Sigue las instrucciones para instalar la app.',
      },
      {
        title: '2. O instalar PWA',
        content: 'Abre Safari y navega a la URL de la app. Toca el botón de compartir y selecciona "Agregar a pantalla de inicio".',
      },
      {
        title: '3. Configurar conexión',
        content: 'Al abrir la app, ingresa tu URL de Supabase y API Key.',
      },
      {
        title: '4. Iniciar sesión',
        content: 'Usa las credenciales proporcionadas por tu administrador.',
      },
    ],
  },
  web: {
    title: 'Web App (PWA)',
    icon: Globe,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    steps: [
      {
        title: '1. Acceder al portal',
        content: 'Abre tu navegador y navega a la URL de la aplicación proporcionada por tu administrador.',
      },
      {
        title: '2. Instalar como PWA',
        content: 'Haz clic en el ícono de "Instalar" en la barra de direcciones, o ve a menú > "Instalar Pago-M".',
      },
      {
        title: '3. Configurar acceso directo',
        content: 'La app se instalará como una aplicación de escritorio con acceso directo.',
      },
      {
        title: '4. Iniciar sesión',
        content: 'Usa las credenciales proporcionadas por tu administrador.',
      },
    ],
  },
  ecommerce: {
    title: 'Integración E-commerce',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    steps: [
      {
        title: '1. Obtener API Key',
        content: 'Contacta a tu administrador para obtener tu API Key y Tenant ID.',
      },
      {
        title: '2. Instalar SDK',
        content: 'Instala el SDK de Supabase en tu proyecto: npm install @supabase/supabase-js',
      },
      {
        title: '3. Configurar cliente',
        content: 'Inicializa el cliente de Supabase con tu URL y API Key.',
      },
      {
        title: '4. Crear transacción',
        content: 'Usa la API REST o el SDK para crear transacciones desde tu tienda online.',
      },
      {
        title: '5. Webhook de notificación',
        content: 'Configura un webhook para recibir notificaciones cuando el estado de la transacción cambie.',
      },
    ],
  },
  pos: {
    title: 'Sistema POS',
    icon: Terminal,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    steps: [
      {
        title: '1. Instalar cliente',
        content: 'Descarga e instala el cliente Pago-M POS en tu terminal.',
      },
      {
        title: '2. Configurar conexión',
        content: 'Ingresa la URL de Supabase y tu API Key en la configuración del POS.',
      },
      {
        title: '3. Autenticar cajero',
        content: 'El cajero inicia sesión con sus credenciales. El sistema verifica su rol y permisos.',
      },
      {
        title: '4. Procesar transacciones',
        content: 'El POS sincroniza transacciones automáticamente con Supabase en tiempo real.',
      },
      {
        title: '5. Conciliación automática',
        content: 'El sistema compara transacciones POS con extractos bancarios automáticamente.',
      },
    ],
  },
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-t-lg">
        <span className="text-xs text-slate-400 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-b-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState('restApi')
  const [expandedGuide, setExpandedGuide] = useState(null)
  const [expandedEndpoint, setExpandedEndpoint] = useState(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">APIs e Integración</h1>
        <p className="text-slate-500 mt-1">Documentación de APIs, guías de instalación e integración</p>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Base URL</p>
              <p className="text-sm font-mono text-slate-900">supabase.co/rest/v1</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Autenticación</p>
              <p className="text-sm text-slate-900">Bearer Token / API Key</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Base de Datos</p>
              <p className="text-sm text-slate-900">PostgreSQL (Supabase)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Guides */}
      <div className="bento-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Guías de Instalación
        </h2>
        <div className="space-y-3">
          {Object.entries(installationGuides).map(([key, guide]) => (
            <div key={key} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedGuide(expandedGuide === key ? null : key)}
                className={`w-full flex items-center justify-between p-4 ${guide.bgColor} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-3">
                  <guide.icon className={`h-5 w-5 ${guide.color}`} />
                  <span className="font-medium text-slate-900">{guide.title}</span>
                </div>
                {expandedGuide === key ? (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                )}
              </button>
              {expandedGuide === key && (
                <div className="p-4 bg-white border-t border-slate-200">
                  <ol className="space-y-3">
                    {guide.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700">{i + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{step.title}</p>
                          <p className="text-sm text-slate-600">{step.content}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API Code Examples */}
      <div className="bento-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Code className="h-5 w-5" />
          Ejemplos de Código
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
          {Object.entries(codeExamples).map(([key, example]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {example.title}
            </button>
          ))}
        </div>

        {/* Active Example */}
        {codeExamples[activeTab] && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900">{codeExamples[activeTab].title}</h3>
              <p className="text-sm text-slate-500">{codeExamples[activeTab].description}</p>
            </div>

            {codeExamples[activeTab].install && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Instalación:</p>
                <code className="text-sm text-slate-700">{codeExamples[activeTab].install}</code>
              </div>
            )}

            {codeExamples[activeTab].baseUrl && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Base URL:</p>
                <code className="text-sm text-slate-700">{codeExamples[activeTab].baseUrl}</code>
              </div>
            )}

            {codeExamples[activeTab].endpoints ? (
              <div className="space-y-3">
                {codeExamples[activeTab].endpoints.map((ep, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedEndpoint(expandedEndpoint === `${activeTab}-${i}` ? null : `${activeTab}-${i}`)}
                      className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        ep.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-sm text-slate-700">{ep.path}</code>
                      <span className="text-sm text-slate-500 ml-auto">{ep.description}</span>
                      {expandedEndpoint === `${activeTab}-${i}` ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    {expandedEndpoint === `${activeTab}-${i}` && (
                      <div className="p-4 border-t border-slate-200">
                        {ep.params && (
                          <div className="mb-3">
                            <p className="text-xs text-slate-500 mb-1">Parámetros:</p>
                            <div className="flex flex-wrap gap-2">
                              {ep.params.map((p) => (
                                <code key={p} className="text-xs bg-slate-100 px-2 py-1 rounded">{p}</code>
                              ))}
                            </div>
                          </div>
                        )}
                        <CodeBlock code={ep.example} language="bash" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <CodeBlock code={codeExamples[activeTab].code} language={activeTab === 'restApi' ? 'bash' : activeTab} />
            )}
          </div>
        )}
      </div>

      {/* Webhooks Info */}
      <div className="bento-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhooks y Eventos
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Configura webhooks para recibir notificaciones en tiempo real cuando ocurran eventos en el sistema.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">Eventos Disponibles</h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li><code className="bg-slate-200 px-1 rounded">transaction.created</code> - Nueva transacción</li>
              <li><code className="bg-slate-200 px-1 rounded">transaction.updated</code> - Transacción actualizada</li>
              <li><code className="bg-slate-200 px-1 rounded">subscription.expiring</code> - Suscripción por vencer</li>
              <li><code className="bg-slate-200 px-1 rounded">tenant.paused</code> - Tenant pausado</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">Configurar Webhook</h4>
            <CodeBlock
              code={`// En tu servidor
const webhook = {
  url: 'https://tu-servidor.com/webhook',
  events: ['transaction.created'],
  secret: 'TU_WEBHOOK_SECRET'
}`}
              language="json"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
