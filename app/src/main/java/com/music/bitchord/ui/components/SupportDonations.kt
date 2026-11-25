package com.music.bitchord.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import com.music.bitchord.R

/**
 * Donation rails. Eva Music ships none.
 */
object SupportDonations {

    data class Rail(val label: String, val address: String, val note: String)

    val rails: List<Rail> = emptyList()

    /** The upstream author's tip page — credit where credit is due. */
    const val KOFI_URL = ""

    /** Direct support for the Auris project. */
    const val PATREON_URL = ""

    fun copyAddress(context: Context, address: String) {
        val clipboard = context.getSystemService(ClipboardManager::class.java)
        clipboard?.setPrimaryClip(ClipData.newPlainText("donation address", address))
        Toast.makeText(context, context.getString(R.string.address_copied), Toast.LENGTH_SHORT).show()
    }

    fun openKoFi(context: Context) {
        runCatching {
            context.startActivity(Intent(Intent.ACTION_VIEW, KOFI_URL.toUri()))
        }
    }

    fun openPatreon(context: Context) {
        runCatching {
            context.startActivity(Intent(Intent.ACTION_VIEW, PATREON_URL.toUri()))
        }
    }

    private const val FILE = "bitchord_support"
    private const val KEY_SEEN = "support_popup_seen"

    fun isSeen(context: Context): Boolean =
        runCatching {
            context.getSharedPreferences(FILE, Context.MODE_PRIVATE).getBoolean(KEY_SEEN, false)
        }.getOrDefault(true)

    fun markSeen(context: Context) {
        runCatching {
            context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_SEEN, true).apply()
        }
    }
}

/** Patreon support artwork used in the support popup and Settings. */
@Composable
fun PatreonSupportButton(modifier: Modifier = Modifier) {
    val context = androidx.compose.ui.platform.LocalContext.current
    Image(
        painter = painterResource(R.drawable.patreon_support),
        contentDescription = stringResource(R.string.support),
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(800f / 217f)
            .clickable { SupportDonations.openPatreon(context) },
    )
}

/**
 * First-launch popup: this app is free, who built what, and where
 * donations go. Shown once; reopenable from Settings → Support.
 */
@Composable
fun SupportPopup(
    onDismiss: () -> Unit,
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.support_popup_title)) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
            ) {
                Text(
                    text = stringResource(R.string.support_popup_body),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(12.dp))
                PatreonSupportButton()
                Spacer(Modifier.height(12.dp))
                SupportDonations.rails.forEach { rail ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${rail.label} · ${rail.note}",
                                style = MaterialTheme.typography.labelLarge,
                            )
                            Text(
                                text = rail.address,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.MiddleEllipsis,
                            )
                        }
                        IconButton(onClick = { SupportDonations.copyAddress(context, rail.address) }) {
                            Icon(
                                Icons.Rounded.ContentCopy,
                                contentDescription = stringResource(R.string.copy_address),
                            )
                        }
                    }
                }
                Spacer(Modifier.height(4.dp))
                TextButton(onClick = { SupportDonations.openKoFi(context) }) {
                    Text(stringResource(R.string.support_kushagra_kofi))
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(stringResource(R.string.close))
            }
        },
    )
}

/** One truncated address row for Settings → Support (tap copies). */
@Composable
fun DonationRow(rail: SupportDonations.Rail) {
    val context = androidx.compose.ui.platform.LocalContext.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "${rail.label} · ${rail.note}",
                style = MaterialTheme.typography.labelLarge,
            )
            Text(
                text = rail.address,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.MiddleEllipsis,
            )
        }
        Spacer(Modifier.width(4.dp))
        IconButton(onClick = { SupportDonations.copyAddress(context, rail.address) }) {
            Icon(
                Icons.Rounded.ContentCopy,
                contentDescription = stringResource(R.string.copy_address),
            )
        }
    }
}
