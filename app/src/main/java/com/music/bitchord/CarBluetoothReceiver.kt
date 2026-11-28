package com.music.bitchord

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.bluetooth.BluetoothClass
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.app.NotificationCompat

/**
 * Car mode trigger: when the phone joins a car's Bluetooth, offer to open Eva's car screen.
 * Android stops apps opening screens from the background, so this posts a full-screen
 * notification (it opens straight away when the phone is locked or the system allows it)
 * that opens car mode with one tap otherwise.
 */
class CarBluetoothReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != BluetoothDevice.ACTION_ACL_CONNECTED) return
        val prefs = context.getSharedPreferences("eva", Context.MODE_PRIVATE)
        if (!prefs.getBoolean("car_auto", false)) return
        val device: BluetoothDevice? = if (android.os.Build.VERSION.SDK_INT >= 33)
            intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
        else @Suppress("DEPRECATION") intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
        val isCar = runCatching {
            val major = device?.bluetoothClass?.deviceClass
            val name = device?.name?.lowercase().orEmpty()
            major == BluetoothClass.Device.AUDIO_VIDEO_CAR_AUDIO ||
                major == BluetoothClass.Device.AUDIO_VIDEO_HANDSFREE ||
                listOf("car", "auto", "mycar", "carplay", "toyota", "honda", "hyundai", "kia", "tata", "mahindra",
                    "maruti", "suzuki", "ford", "bmw", "audi", "mercedes", "skoda", "vw", "mg ").any { name.contains(it) }
        }.getOrDefault(false)
        if (!isCar) return
        val open = Intent(context, EvaWebActivity::class.java)
            .setAction(Intent.ACTION_VIEW).setData(Uri.parse("evamusic://car"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pi = PendingIntent.getActivity(context, 77, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (android.os.Build.VERSION.SDK_INT >= 26)
            nm.createNotificationChannel(NotificationChannel("eva_car", "Car mode", NotificationManager.IMPORTANCE_HIGH))
        val n = NotificationCompat.Builder(context, "eva_car")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Connected to your car")
            .setContentText("Tap to open Eva Music car mode")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_NAVIGATION)
            .setContentIntent(pi).setFullScreenIntent(pi, true).setAutoCancel(true).build()
        runCatching { nm.notify(7701, n) }
    }
}
