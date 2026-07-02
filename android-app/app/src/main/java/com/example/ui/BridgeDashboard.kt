package com.example.ui

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.CapturedLog
import com.example.model.SyncStatus
import com.example.state.BridgeState
import com.example.util.BridgePreferences
import com.example.viewmodel.BridgeViewModel
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BridgeDashboard(
    viewModel: BridgeViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val isLinked by viewModel.isLinked.collectAsState()

    // Query linkage status immediately on draw
    LaunchedEffect(Unit) {
        viewModel.checkLinkStatus(context)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.SwapHorizontalCircle,
                            contentDescription = null,
                            tint = Color(0xFF005AC1)
                        )
                        Text(
                            text = "Puente",
                            fontWeight = FontWeight.ExtraBold,
                            fontFamily = FontFamily.SansSerif,
                            color = Color(0xFF1A1C1E)
                        )
                        Surface(
                            color = Color(0xFFE1E2EC),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.padding(start = 4.dp)
                        ) {
                            Text(
                                text = "SaaS Conciliación",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF44474E),
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFFF3F4F9)
                )
            )
        },
        containerColor = Color(0xFFF3F4F9),
        contentWindowInsets = WindowInsets.safeDrawing,
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (!isLinked) {
                // SCREEN 1: Device Handshake / Vinculación
                DeviceHandshakeScreen(viewModel = viewModel)
            } else {
                // SCREEN 2: Principal Management Panel
                MainDashboardContent(viewModel = viewModel)
            }
        }
    }
}

/**
 * Screen 1: Vinculación flow, showing input code pins to register the UUID.
 */
@Composable
fun DeviceHandshakeScreen(viewModel: BridgeViewModel) {
    val context = LocalContext.current
    var activationCode by remember { mutableStateOf("") }
    val isRegistering by viewModel.isRegistering.collectAsState()
    val registerError by viewModel.registerError.collectAsState()
    val generatedId = remember { BridgePreferences.getOrCreateDeviceId(context) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, Color(0xFFE1E2EC)),
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 480.dp)
                .testTag("handshake_card")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Security Icon banner
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color(0xFFE3F2FD), Color(0xFFBBDEFB))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Key,
                        contentDescription = "Security handshake key",
                        tint = Color(0xFF0D47A1),
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text = "Vincular Dispositivo",
                    fontWeight = FontWeight.Bold,
                    fontSize = 22.sp,
                    color = Color(0xFF1A1C1E),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Ingresa el código de 6 dígitos generado en tu Panel Administrativo SaaS para enlazar este transceptor.",
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    color = Color(0xFF44474E),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))

                OutlinedTextField(
                    value = activationCode,
                    onValueChange = { input ->
                        if (input.length <= 6 && input.all { it.isDigit() }) {
                            activationCode = input
                        }
                    },
                    label = { Text("Código de Enlace (6 dígitos)") },
                    placeholder = { Text("Ej. 482931") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF005AC1),
                        unfocusedBorderColor = Color(0xFFC4C6D0),
                        focusedLabelColor = Color(0xFF005AC1)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("activation_code_input"),
                    leadingIcon = {
                        Icon(imageVector = Icons.Filled.Pin, contentDescription = null, tint = Color(0xFF005AC1))
                    }
                )

                registerError?.let { errorText ->
                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = errorText,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        viewModel.linkDevice(context, activationCode) {
                            // Link complete callback handled inside
                        }
                    },
                    enabled = !isRegistering && activationCode.length == 6,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF005AC1),
                        contentColor = Color.White,
                        disabledContainerColor = Color(0xFFE1E2EC)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("link_device_button")
                ) {
                    if (isRegistering) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Enlazando...", fontWeight = FontWeight.Bold)
                    } else {
                        Text("Vincular Ahora", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Device Signature display
        Text(
            text = "ID del Dispositivo:\n$generatedId",
            fontSize = 11.sp,
            textAlign = TextAlign.Center,
            color = Color(0xFF74777F),
            fontWeight = FontWeight.Medium
        )
    }
}

/**
 * Screen 2: Central management console once associated.
 */
@Composable
fun MainDashboardContent(viewModel: BridgeViewModel) {
    val context = LocalContext.current
    val isBridgeActive by viewModel.isBridgeActive.collectAsState()
    val isServiceRunning by viewModel.isServiceRunning.collectAsState()
    val logs by viewModel.logs.collectAsState()
    val lastSyncTime by viewModel.lastSuccessfulResponseTime.collectAsState()

    val tenantId = remember { BridgePreferences.getTenantId(context) ?: "N/D" }
    val deviceId = remember { BridgePreferences.getOrCreateDeviceId(context) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // A: Operational Toggle Switch Board
        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE1E2EC)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("core_dashboard_control")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Puente de Escucha",
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp,
                                color = Color(0xFF1A1C1E)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Captura y automatiza la conciliación de SMS y Notificaciones bancarias locales en tiempo real.",
                                fontSize = 12.sp,
                                lineHeight = 16.sp,
                                color = Color(0xFF44474E)
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Switch(
                            checked = isBridgeActive,
                            onCheckedChange = { active ->
                                viewModel.toggleBridge(context, active)
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = Color(0xFF005AC1)
                            ),
                            modifier = Modifier.testTag("bridge_active_switch")
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    HorizontalDivider(color = Color(0xFFE1E2EC))

                    Spacer(modifier = Modifier.height(14.dp))

                    // Foreground Sync Service Status Indicator
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(if (isServiceRunning && isBridgeActive) Color(0xFF2E7D32) else Color(0xFFC62828))
                        )
                        Text(
                            text = if (isServiceRunning && isBridgeActive) 
                                "Servicio activo de fondo en primer plano" 
                            else 
                                "Servicio inactivo o en espera (Switch está apagado)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isServiceRunning && isBridgeActive) Color(0xFF2E7D32) else Color(0xFFC62828)
                        )
                    }

                    if (isBridgeActive && !isServiceRunning) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Surface(
                            color = Color(0xFFFFF3E0),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "Atención requerida:",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = Color(0xFFE65100)
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "Debes habilitar el permiso de Acceso a Notificaciones del sistema para habilitar la sincronización en segundo plano de notificaciones.",
                                    fontSize = 10.sp,
                                    lineHeight = 14.sp,
                                    color = Color(0xFFE65100)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = {
                                        context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE65100)),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.height(28.dp)
                                ) {
                                    Text("Dar Acceso en Ajustes", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // B: Device Credentials Card
        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE1E2EC)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(imageVector = Icons.Filled.Domain, contentDescription = null, tint = Color(0xFF005AC1))
                        Text(
                            text = "Enlace de Conciliación",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF1A1C1E)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "Tenant Enlazado: $tenantId",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF44474E)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Device UUID: $deviceId",
                        fontSize = 11.sp,
                        color = Color(0xFF74777F)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    HorizontalDivider(color = Color(0xFFE1E2EC))

                    Spacer(modifier = Modifier.height(10.dp))

                    // Log out / Unlink Device Option
                    TextButton(
                        onClick = { viewModel.unlinkDevice(context) },
                        contentPadding = PaddingValues(0.dp),
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFC62828)),
                        modifier = Modifier.align(Alignment.Start)
                    ) {
                        Icon(imageVector = Icons.Filled.LinkOff, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Desvincular Transceptor (Reset)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // C: Transaction Load Stress test
        item {
            val isStressTesting by viewModel.isStressTesting.collectAsState()
            val stressTestCount by viewModel.stressTestCount.collectAsState()
            val stressTestMetrics by viewModel.stressTestMetrics.collectAsState()

            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFC4C6D0)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("stress_test_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFFFF3E0)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Bolt,
                                contentDescription = null,
                                tint = Color(0xFFE65100),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Text(
                            text = "Prueba de Carga (10,000 Tx)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = Color(0xFF1A1C1E)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Ejecuta un motor concurrente que simula y analiza 10,000 transacciones para verificar que el sistema de filtros Regex y la interfaz aguanten un flujo masivo sin congelamientos del hilo principal.",
                        fontSize = 12.sp,
                        color = Color(0xFF44474E),
                        lineHeight = 16.sp
                    )

                    if (isStressTesting) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Sometiendo sistema a prueba de estrés...",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF005AC1)
                                )
                                Text(
                                    text = "$stressTestCount / 10,000",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF005AC1)
                                )
                            }
                            LinearProgressIndicator(
                                progress = { stressTestCount.toFloat() / 10000f },
                                modifier = Modifier.fillMaxWidth().clip(CircleShape),
                                color = Color(0xFF005AC1),
                                trackColor = Color(0xFFE1E2EC)
                              )
                        }
                    }

                    stressTestMetrics?.let { metrics ->
                        Spacer(modifier = Modifier.height(14.dp))
                        Surface(
                            color = Color(0xFFE8F5E9),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.Top
                              ) {
                                  Icon(
                                      imageVector = Icons.Filled.CheckCircle,
                                      contentDescription = null,
                                      tint = Color(0xFF2E7D32),
                                      modifier = Modifier.size(20.dp).padding(top = 2.dp)
                                  )
                                  Column {
                                      Text(
                                          text = "DIAGNÓSTICO COMPLETO EXCELENTE",
                                          fontSize = 9.sp,
                                          fontWeight = FontWeight.Bold,
                                          color = Color(0xFF2E7D32),
                                          letterSpacing = 0.5.sp
                                      )
                                      Spacer(modifier = Modifier.height(4.dp))
                                      Text(
                                          text = metrics,
                                          fontSize = 12.sp,
                                          lineHeight = 16.sp,
                                          color = Color(0xFF1B5E20),
                                          fontWeight = FontWeight.Medium
                                      )
                                  }
                              }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { viewModel.runHighImpactStressTest() },
                        enabled = !isStressTesting,
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isStressTesting) Color(0xFFE1E2EC) else Color(0xFF005AC1),
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("run_stress_test_button")
                    ) {
                        if (isStressTesting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = Color(0xFF005AC1)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Analizando 10k transacciones...", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        } else {
                            Icon(
                                imageVector = Icons.Filled.Bolt,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Lanzar Prueba de Estrés", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // D: Telemetry Sync History Logs
        item {
            val connectionEvents by viewModel.connectionEvents.collectAsState()

            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE1E2EC)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Filled.Analytics, contentDescription = null, tint = Color(0xFF005AC1))
                            Text(
                                text = "Historial de Telemetría",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = Color(0xFF1A1C1E)
                            )
                        }

                        if (connectionEvents.isNotEmpty()) {
                            TextButton(
                                onClick = { viewModel.clearConnectionHistory() },
                                colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFF74777F))
                            ) {
                                Text("Limpiar", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    lastSyncTime?.let { time ->
                        val dateLabel = java.text.DateFormat.getDateTimeInstance().format(java.util.Date(time))
                        Surface(
                            color = Color(0xFFE8F5E9),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(imageVector = Icons.Filled.CloudDone, contentDescription = null, tint = Color(0xFF2E7D32), modifier = Modifier.size(16.dp))
                                Text(
                                    text = "Sincronización SaaS Exitosa: $dateLabel",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF2E7D32)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                    }

                    if (connectionEvents.isEmpty()) {
                        Text(
                            text = "Sin eventos de conexión recientes.",
                            fontSize = 12.sp,
                            color = Color(0xFF74777F),
                            textAlign = TextAlign.Center,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp)
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            connectionEvents.forEach { event ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = event.type,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF1A1C1E)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = event.message,
                                            fontSize = 11.sp,
                                            color = Color(0xFF44474E)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Surface(
                                        color = if (event.isSuccess) Color(0xFFE8F5E9) else Color(0xFFFFEBEE),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text(
                                            text = if (event.isSuccess) "Éxito" else "Fallo",
                                            color = if (event.isSuccess) Color(0xFF2E7D32) else Color(0xFFC62828),
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                HorizontalDivider(color = Color(0xFFF3F4F9))
                            }
                        }
                    }
                }
            }
        }

        // WEBHOOK RECEPTION AND SIMULATION CARD
        item {
            var selectedProviderIndex by remember { mutableStateOf(0) }
            val providers = listOf(
                "Banesco Pay REST", "BDV Automatizado", "Mercantil Webhook", "BBVA Provincial",
                "BNC Consolidado", "Bancaribe API", "Banco Exterior API", "Banplus Cash",
                "Banco Plaza Link", "BFC Enlace", "Banco del Tesoro", "Banco Bicentenario",
                "BVC Transceptor", "Banco Caroní", "Delsur Conector", 
                "Binance Pay API", "PayPal Business", "Zelle Integration", "Stripe Gateway"
            )
            val defaultBanks = listOf(
                "Banesco", "BDV", "Mercantil", "Provincial",
                "BNC", "Bancaribe", "Exterior", "Banplus",
                "Banco Plaza", "BFC", "Tesoro", "Bicentenario",
                "BVC", "Banco Caroní", "Delsur",
                "Binance Pay", "PayPal", "Zelle", "Stripe"
            )
            val defaultSenders = listOf(
                "BANESCO_PAY_API", "BDV_API_PUSH", "MERCANTIL_WH", "PROVINCIAL_NET",
                "BNC_CONNECT_API", "BANCARIBE_TICKET", "EXTERIOR_S2S", "BANPLUS_GATEWAY",
                "PLAZA_TRANSACT", "BFC_PAGOS_REST", "TESORO_CORE_PUSH", "BICENTENARIO_PUSH",
                "BVC_METRIC_S2S", "CARONI_WH_CORE", "DELSUR_LINK_API",
                "BINANCE_PAY_API", "PAYPAL_WH_SVC", "ZELLE_CONFIRM_API", "STRIPE_TX_CALLBACK"
            )
            
            var amountStr by remember { mutableStateOf("1500.00") }
            var referenceStr by remember { mutableStateOf(java.util.UUID.randomUUID().toString().take(8).uppercase()) }
            var showSnackbarMsg by remember { mutableStateOf(false) }
            var snackbarMsg by remember { mutableStateOf("") }

            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Color(0xFFE1E2EC)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("webhook_simulator_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFE8F5E9)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.CloudSync,
                                contentDescription = null,
                                tint = Color(0xFF2E7D32),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "Recepción de Webhooks & Push",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = Color(0xFF1A1C1E)
                            )
                            Text(
                                text = "Integración directa de pasarelas y APIs",
                                fontSize = 11.sp,
                                color = Color(0xFF74777F)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "El Puente permite la entrega de eventos vía Webhook. Al simular la recepción, la aplicación parsea el payload bancario, dispara una alarma push física de alta prioridad y sincroniza con Supabase.",
                        fontSize = 12.sp,
                        color = Color(0xFF44474E),
                        lineHeight = 16.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Seleccionar Proveedor Bancario API:",
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = Color(0xFF1A1C1E),
                        letterSpacing = 0.5.sp
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    ScrollableTabRow(
                        selectedTabIndex = selectedProviderIndex,
                        edgePadding = 0.dp,
                        containerColor = Color.Transparent,
                        divider = {},
                        indicator = {},
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        providers.forEachIndexed { index, name ->
                            val isSelected = selectedProviderIndex == index
                            Tab(
                                selected = isSelected,
                                onClick = { selectedProviderIndex = index },
                                modifier = Modifier.padding(end = 4.dp)
                            ) {
                                Surface(
                                    color = if (isSelected) Color(0xFF005AC1) else Color(0xFFF3F4F9),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, if (isSelected) Color.Transparent else Color(0xFFE1E2EC)),
                                    modifier = Modifier.padding(vertical = 4.dp)
                                ) {
                                    Text(
                                        text = name,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) Color.White else Color(0xFF44474E),
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = amountStr,
                            onValueChange = { amountStr = it },
                            label = { Text("Monto") },
                            placeholder = { Text("0.00") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF2E7D32),
                                focusedLabelColor = Color(0xFF2E7D32)
                            ),
                            modifier = Modifier.weight(1.0f).testTag("webhook_amount_input")
                        )

                        OutlinedTextField(
                            value = referenceStr,
                            onValueChange = { referenceStr = it },
                            label = { Text("Referencia") },
                            placeholder = { Text("MOCK-REF") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            trailingIcon = {
                                IconButton(onClick = {
                                    referenceStr = java.util.UUID.randomUUID().toString().take(8).uppercase()
                                }) {
                                    Icon(imageVector = Icons.Filled.Refresh, contentDescription = "Generar", tint = Color(0xFF74777F))
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF2E7D32),
                                focusedLabelColor = Color(0xFF2E7D32)
                            ),
                            modifier = Modifier.weight(1.0f).testTag("webhook_ref_input")
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            val parsedAmount = amountStr.toDoubleOrNull() ?: 150.0
                            val selectedProvider = providers[selectedProviderIndex]
                            val selectedBank = defaultBanks[selectedProviderIndex]
                            val selectedSender = defaultSenders[selectedProviderIndex]

                            // Generar el payload simulado que vendría de un webhook real del banco
                            val payloadJson = """
                                {
                                    "bank_name": "$selectedBank",
                                    "sender": "$selectedSender",
                                    "original_text": "Callback Webhook del proveedor $selectedProvider procesado de forma automatizada por el broker de conciliacion.",
                                    "amount": $parsedAmount,
                                    "reference": "$referenceStr",
                                    "type": "NOTIFICATION"
                                }
                            """.trimIndent()

                            val success = viewModel.receiveWebhook(context, payloadJson, selectedProvider)
                            if (success) {
                                snackbarMsg = "¡Webhook de $selectedBank procesado! Alerta Push simulada."
                                showSnackbarMsg = true
                                referenceStr = java.util.UUID.randomUUID().toString().take(8).uppercase()
                            } else {
                                snackbarMsg = "Activa el Puente e inicia sesión con código para recibir webhooks."
                                showSnackbarMsg = true
                            }
                        },
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF2E7D32),
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("submit_webhook_simulation_button")
                    ) {
                        Icon(
                            imageVector = Icons.Filled.RssFeed,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Simular Recepción de Webhook (Push)", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }

                    if (showSnackbarMsg) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Surface(
                            color = Color(0xFFE8F5E9),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = snackbarMsg,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF2E7D32),
                                    modifier = Modifier.weight(1f)
                                )
                                IconButton(
                                    onClick = { showSnackbarMsg = false },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Close,
                                        contentDescription = "Cerrar",
                                        tint = Color(0xFF2E7D32),
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // E: Live Transaction Feed Heading
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(imageVector = Icons.Filled.ListAlt, contentDescription = null, tint = Color(0xFF1A1C1E))
                    Text(
                        text = "Transacciones Capturadas",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Color(0xFF1A1C1E)
                    )
                }

                if (logs.isNotEmpty()) {
                    TextButton(
                        onClick = { viewModel.clearLogHistory() },
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFF74777F))
                    ) {
                        Text("Limpiar Todo", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // F: Lazy list items for Captures
        if (logs.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Color(0xFFE1E2EC)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Sintonización excelente de canales. En espera de nuevas notificaciones o SMS de bancos venezolanos...",
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        color = Color(0xFF74777F),
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        } else {
            items(logs, key = { it.id }) { log ->
                InteractiveLogCard(log)
            }
        }
    }
}

@Composable
fun InteractiveLogCard(log: CapturedLog) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color(0xFFE1E2EC)),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("captured_log_item")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(
                                when (log.type.lowercase()) {
                                    "sms" -> Color(0xFFE1F5FE)
                                    "webhook" -> Color(0xFFE8F5E9)
                                    else -> Color(0xFFEDE7F6)
                                }
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = when (log.type.lowercase()) {
                                "sms" -> Icons.Filled.Sms
                                "webhook" -> Icons.Filled.CloudSync
                                else -> Icons.Filled.Notifications
                            },
                            contentDescription = null,
                            tint = when (log.type.lowercase()) {
                                "sms" -> Color(0xFF0288D1)
                                "webhook" -> Color(0xFF2E7D32)
                                else -> Color(0xFF5E35B1)
                            },
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Column {
                        Text(
                            text = log.bankName,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF1A1C1E)
                        )
                        Text(
                            text = log.sender,
                            fontSize = 10.sp,
                            color = Color(0xFF74777F)
                        )
                    }
                }

                Surface(
                    color = when (log.syncStatus) {
                        SyncStatus.SUCCESS -> Color(0xFFE8F5E9)
                        SyncStatus.PENDING -> Color(0xFFFFF3E0)
                        SyncStatus.FAILED -> Color(0xFFFFEBEE)
                    },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = when (log.syncStatus) {
                            SyncStatus.SUCCESS -> "Sincronizado"
                            SyncStatus.PENDING -> "Sincronizando..."
                            SyncStatus.FAILED -> "En cola"
                        },
                        color = when (log.syncStatus) {
                            SyncStatus.SUCCESS -> Color(0xFF2E7D32)
                            SyncStatus.PENDING -> Color(0xFFE65100)
                            SyncStatus.FAILED -> Color(0xFFC62828)
                        },
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = log.text,
                fontSize = 12.sp,
                color = Color(0xFF44474E),
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "MONTO", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF74777F))
                    Text(
                        text = log.amount?.let { "Bs. %,.2f".format(Locale.US, it) } ?: "No extraído",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (log.amount != null) Color(0xFF2E7D32) else Color(0xFF74777F)
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "REFERENCIA", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF74777F))
                    Text(
                        text = log.reference ?: "No extraída",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (log.reference != null) Color(0xFF1A1C1E) else Color(0xFF74777F)
                    )
                }
            }

            log.errorMessage?.let { error ->
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    color = Color(0xFFFFEBEE),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Mensaje: $error",
                        color = Color(0xFFC62828),
                        fontSize = 10.sp,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }
        }
    }
}
