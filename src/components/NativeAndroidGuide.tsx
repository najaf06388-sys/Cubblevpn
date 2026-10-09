import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  Smartphone,
  Server,
  Wifi,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Zap
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const NativeAndroidGuide: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'service' | 'activity' | 'manifest' | 'gradle'>('service');

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const kotlinFtpServiceCode = `package com.bubble.wifishare

import android.app.*
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Environment
import android.os.IBinder
import android.text.format.Formatter
import androidx.core.app.NotificationCompat
import org.apache.ftpserver.FtpServer
import org.apache.ftpserver.FtpServerFactory
import org.apache.ftpserver.listener.ListenerFactory
import org.apache.ftpserver.usermanager.impl.BaseUser

/**
 * Bubble - WiFi FTP Server Background Service
 * Runs on port 2221 over WiFi router or Zong EVO hotspot
 */
class BubbleFtpServerService : Service() {

    private var ftpServer: FtpServer? = null
    private val PORT = 2221

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForegroundServiceNotification()
        startFtpServer()
        return START_STICKY
    }

    private fun startFtpServer() {
        try {
            val serverFactory = FtpServerFactory()
            val listenerFactory = ListenerFactory()
            listenerFactory.port = PORT

            serverFactory.addListener("default", listenerFactory.createListener())

            // Create user with access to DCIM / Camera & Storage
            val user = BaseUser().apply {
                name = "anonymous"
                homeDirectory = Environment.getExternalStorageDirectory().absolutePath
            }
            serverFactory.userManager.save(user)

            ftpServer = serverFactory.createServer()
            ftpServer?.start()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun startForegroundServiceNotification() {
        val channelId = "bubble_server_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Bubble Server Active",
                NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }

        val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val ipAddress = Formatter.formatIpAddress(wifiManager.connectionInfo.ipAddress)

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("🫧 Bubble Server is Running")
            .setContentText("Access at ftp://$ipAddress:$PORT")
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .build()

        startForeground(101, notification)
    }

    override fun onDestroy() {
        ftpServer?.stop()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`;

  const composeActivityCode = `package com.bubble.wifishare

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            BubbleAppTheme {
                BubbleServerScreen(
                    onStartServer = {
                        startService(Intent(this, BubbleFtpServerService::class.java))
                    },
                    onStopServer = {
                        stopService(Intent(this, BubbleFtpServerService::class.java))
                    }
                )
            }
        }
    }
}

@Composable
fun BubbleServerScreen(onStartServer: () -> Unit, onStopServer: () -> Unit) {
    var isRunning by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("🫧 Bubble WiFi Server", fontSize = 24.sp, color = Color.White)
        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                if (isRunning) {
                    onStopServer()
                    isRunning = false
                } else {
                    onStartServer()
                    isRunning = true
                }
            },
            shape = CircleShape,
            modifier = Modifier.size(180.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isRunning) Color(0xFF4F46E5) else Color(0xFF1E293B)
            )
        ) {
            Text(if (isRunning) "STOP" else "START SERVER", fontSize = 18.sp)
        }

        Spacer(modifier = Modifier.height(24.dp))
        if (isRunning) {
            Text("ftp://192.168.0.1:2221", color = Color(0xFF38BDF8), fontSize = 16.sp)
        }
    }
}`;

  const manifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions required for WiFi Local File Server -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Bubble"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/Theme.Bubble">

        <service
            android:name=".BubbleFtpServerService"
            android:foregroundServiceType="dataSync"
            android:exported="false" />

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const gradleCode = `dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")

    // Apache MINA FTP Server library for Android port 2221
    implementation("org.apache.ftpserver:ftpserver-core:1.2.0")
    implementation("org.slf4j:slf4j-android:1.7.36")
}`;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Overview Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🫧</span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                How to Use Bubble on Your Android Mobile
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              You asked for an Android app where you press <strong>Connect</strong> on your phone (connected to your router or Zong EVO device), and your other phone opens the browser or file manager to copy photos and videos!
            </p>
          </div>

          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Install Bubble on Android Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Ways to Run */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Method 1: PWA */}
        <div className="rounded-2xl bg-slate-900 border border-indigo-500/30 p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Method 1: Instant Android App (PWA)</h3>
              <p className="text-[11px] text-emerald-400 font-medium">Ready in 5 seconds • No PC needed</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            This web app is a <strong>full Progressive Web App (PWA)</strong>. When you open this in Chrome on your Android phone:
          </p>
          <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>Tap the <strong>&quot;Install Bubble App&quot;</strong> button above or Chrome&apos;s 3 dots menu.</li>
            <li>Tap <strong>&quot;Install App&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.</li>
            <li>The <strong>Bubble 🫧</strong> app icon appears on your phone&apos;s home screen.</li>
            <li>Tap it to launch in standalone full-screen with no browser address bar!</li>
          </ol>
        </div>

        {/* Method 2: Native APK */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Method 2: Native Android Studio APK</h3>
              <p className="text-[11px] text-sky-400 font-medium">Port 2221 FTP Server • Kotlin Code</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            If you want to compile your own standalone <code>.apk</code> file in Android Studio with a raw TCP FTP daemon on port <code>2221</code>, the complete source code is provided below!
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>Apache MINA FTP Server daemon on port 2221</li>
            <li>Auto-detects Zong EVO &amp; WiFi IP addresses</li>
            <li>Foreground service so it doesn&apos;t sleep</li>
          </ul>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Android Studio Project Code
            </span>
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { id: 'service', label: 'BubbleFtpServerService.kt' },
                { id: 'activity', label: 'MainActivity.kt' },
                { id: 'manifest', label: 'AndroidManifest.xml' },
                { id: 'gradle', label: 'build.gradle.kts' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCodeTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  activeCodeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Code Content */}
        <div className="relative p-4 bg-slate-950 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => {
              const codeMap = {
                service: kotlinFtpServiceCode,
                activity: composeActivityCode,
                manifest: manifestCode,
                gradle: gradleCode,
              };
              copyCode(codeMap[activeCodeTab], activeCodeTab);
            }}
            className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-medium flex items-center gap-1.5 border border-slate-700 transition active:scale-95"
          >
            {copiedKey === activeCodeTab ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedKey === activeCodeTab ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <pre className="text-slate-300 leading-relaxed pt-2">
            {activeCodeTab === 'service' && kotlinFtpServiceCode}
            {activeCodeTab === 'activity' && composeActivityCode}
            {activeCodeTab === 'manifest' && manifestCode}
            {activeCodeTab === 'gradle' && gradleCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
