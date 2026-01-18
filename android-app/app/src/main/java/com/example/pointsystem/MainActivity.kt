package com.example.pointsystem

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import com.journeyapps.barcodescanner.BarcodeEncoder
import com.google.zxing.BarcodeFormat
import android.widget.ImageView


class MainActivity : AppCompatActivity() {

    private lateinit var tvBalance: TextView
    private lateinit var tvReceived: TextView
    private lateinit var tvSent: TextView
    private lateinit var tvCurrentUser: TextView
    private lateinit var btnSend: Button
    private lateinit var btnLogout: ImageButton
    
    // Class property to store users for name resolution
    private var allUsers: List<User> = emptyList()

    private var currentUser: User? = null
    
    // QR Code Scanning
    private var currentSendDialog: android.app.AlertDialog? = null
    private var spinnerReceiver: Spinner? = null
    
    private val scanLauncher = registerForActivityResult(ScanContract()) { result ->
        if (result.contents != null) {
            handleScanResult(result.contents)
        }
    }

    private lateinit var ivCurrentUserAvatar: ImageView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Session Check
        val (userId, token) = TokenManager.getSession(this)

        if (userId == null || token == null) {
            TokenManager.clearSession(this)
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }
        
        NetworkClient.authToken = token

        setContentView(R.layout.activity_main)

        tvBalance = findViewById(R.id.tvBalance)
        tvReceived = findViewById(R.id.tvReceived)
        tvSent = findViewById(R.id.tvSent)
        tvCurrentUser = findViewById(R.id.tvCurrentUser)
        ivCurrentUserAvatar = findViewById(R.id.ivCurrentUserAvatar)
        btnSend = findViewById(R.id.btnSend)
        btnLogout = findViewById(R.id.btnLogout)
        
        btnSend.setOnClickListener { showSendDialog() }
        btnLogout.setOnClickListener { logout() }
        findViewById<android.widget.ImageButton>(R.id.btnReceiveQr).setOnClickListener { showReceiveQr() }
        
        findViewById<android.widget.ImageButton>(R.id.btnRefresh).setOnClickListener {
            // Animate rotation
            it.animate().rotationBy(360f).setDuration(500).start()
            fetchData() 
            Toast.makeText(this, "更新しました", Toast.LENGTH_SHORT).show()
        }

        // Profile Navigation
        ivCurrentUserAvatar.setOnClickListener {
            currentUser?.let { user ->
                val intent = Intent(this, ProfileActivity::class.java)
                intent.putExtra("EXTRA_ID", user.id)
                startActivity(intent)
            }
        }

        fetchData()
    }
    
    override fun onResume() {
        super.onResume()
        fetchData()
    }
    
    fun logout() {
        NetworkClient.authToken = null 
        TokenManager.clearSession(this)
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }

    private fun fetchData() {
        val (currentUserId, _) = TokenManager.getSession(this)
        if (currentUserId == null) return

        lifecycleScope.launch {
            try {
                val users = NetworkClient.api.getUsers()
                allUsers = users 
                currentUser = users.find { it.id == currentUserId }
                
                currentUser?.let {
                    val formatted = java.text.NumberFormat.getNumberInstance().format(it.balance)
                    tvBalance.text = formatted
                    tvCurrentUser.text = "${it.name}さん、こんにちは"
                    
                    // Set Avatar
                    if (!it.avatarData.isNullOrEmpty()) {
                        try {
                            val decodedBytes = android.util.Base64.decode(it.avatarData, android.util.Base64.DEFAULT)
                            val decodedBitmap = android.graphics.BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                             // Rounded? For now square/circleCrop
                            ivCurrentUserAvatar.setImageBitmap(decodedBitmap)
                        } catch (e: Exception) { e.printStackTrace() }
                    } else {
                        // Default placeholder capability if needed
                        ivCurrentUserAvatar.setImageDrawable(null) // or resource
                    }
                }

                val transactions = NetworkClient.api.getTransactions(currentUserId)
                
                var totalSent = 0
                var totalReceived = 0
                
                transactions.forEach { tx ->
                    if (tx.senderId == currentUserId) {
                        totalSent += tx.amount
                    }
                    if (tx.receiverId == currentUserId) {
                        totalReceived += tx.amount
                    }
                }
                
                val fmt = java.text.NumberFormat.getNumberInstance()
                tvReceived.text = fmt.format(totalReceived)
                tvSent.text = fmt.format(totalSent)
                
                updateHistoryList(transactions, currentUserId)

            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun updateHistoryList(transactions: List<Transaction>, currentUserId: String) {
        val container = findViewById<android.widget.LinearLayout>(R.id.llHistoryContainer)
        container.removeAllViews()
        
        if (transactions.isEmpty()) {
            val placeholder = TextView(this)
            placeholder.text = "まだ履歴はありません"
            placeholder.setTextColor(android.graphics.Color.parseColor("#757575"))
            placeholder.gravity = android.view.Gravity.CENTER
            placeholder.setPadding(0, 20, 0, 20)
            container.addView(placeholder)
            return
        }
        
        val recent = transactions.take(5)
        
        recent.forEach { tx ->
            val row = android.widget.LinearLayout(this)
            row.orientation = android.widget.LinearLayout.HORIZONTAL
            row.gravity = android.view.Gravity.CENTER_VERTICAL
            row.setPadding(0, 16, 0, 16)
            
            val isReceived = tx.receiverId == currentUserId
            val otherId = if (isReceived) tx.senderId else tx.receiverId
            
            // Resolve User & Avatar
            val otherUser = if (otherId != null) allUsers.find { it.id == otherId } else null
            val otherAvatar = otherUser?.avatarData

            // Resolve Name (Prioritize description if received, else User Name)
            val otherName = if (isReceived && !tx.description.isNullOrEmpty()) {
                tx.description
            } else if (otherId == null) {
                "システム"
            } else {
                otherUser?.name ?: "Unknown"
            }
            
            // Avatar
            val ivHistoryAvatar = ImageView(this)
            val params = android.widget.LinearLayout.LayoutParams(80, 80)
            params.marginEnd = 24
            ivHistoryAvatar.layoutParams = params
            ivHistoryAvatar.scaleType = ImageView.ScaleType.CENTER_CROP
            ivHistoryAvatar.setBackgroundColor(android.graphics.Color.parseColor("#EEEEEE")) // Placeholder
            
            if (!otherAvatar.isNullOrEmpty()) {
                try {
                    val decodedBytes = android.util.Base64.decode(otherAvatar, android.util.Base64.DEFAULT)
                    val bmp = android.graphics.BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                    ivHistoryAvatar.setImageBitmap(bmp)
                } catch(e: Exception) {}
            }
            // Add icon overlay for direction? Or utilize text color.
            // Simplified for now.

            val textLayout = android.widget.LinearLayout(this)
            textLayout.orientation = android.widget.LinearLayout.VERTICAL
            textLayout.layoutParams = android.widget.LinearLayout.LayoutParams(0, -2, 1f)

            // Name + Reason Row
            val nameReasonRow = android.widget.LinearLayout(this)
            nameReasonRow.orientation = android.widget.LinearLayout.HORIZONTAL
            nameReasonRow.gravity = android.view.Gravity.CENTER_VERTICAL
            
            val density = resources.displayMetrics.density
            val nameWidthPx = (140 * density).toInt()

            val tvName = TextView(this)
            tvName.text = otherName
            tvName.textSize = 16f
            tvName.setTextColor(android.graphics.Color.parseColor("#212121"))
            tvName.layoutParams = android.widget.LinearLayout.LayoutParams(nameWidthPx, android.view.ViewGroup.LayoutParams.WRAP_CONTENT)
            tvName.ellipsize = android.text.TextUtils.TruncateAt.END
            tvName.setSingleLine()

            nameReasonRow.addView(tvName)

            // Reason (Description)
            if (!tx.description.isNullOrEmpty()) {
                val tvReason = TextView(this)
                tvReason.text = tx.description
                tvReason.textSize = 14f
                tvReason.setTextColor(android.graphics.Color.parseColor("#5D4037")) // Brownish
                tvReason.setPadding((8 * density).toInt(), 0, 0, 0)
                nameReasonRow.addView(tvReason)
            }
            
            textLayout.addView(nameReasonRow)

            val tvDate = TextView(this)
            tvDate.text = try {
                val inputFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
                val outputFormat = java.text.SimpleDateFormat("MM/dd HH:mm", java.util.Locale.getDefault())
                val date = inputFormat.parse(tx.createdAt)
                if (date != null) {
                    outputFormat.format(date)
                } else {
                    tx.createdAt.take(10)
                }
            } catch (e: Exception) {
                tx.createdAt.take(10)
            }
            tvDate.textSize = 12f
            tvDate.setTextColor(android.graphics.Color.parseColor("#757575"))

            textLayout.addView(tvDate)

            // Amount
            val tvAmount = TextView(this)
            tvAmount.text = "${if(isReceived) "+" else "-"}${java.text.NumberFormat.getNumberInstance().format(tx.amount)}"
            tvAmount.textSize = 18f
            tvAmount.setTypeface(null, android.graphics.Typeface.BOLD)
            tvAmount.setTextColor(android.graphics.Color.parseColor(if(isReceived) "#00C853" else "#D50000"))

            row.addView(ivHistoryAvatar)
            row.addView(textLayout)
            row.addView(tvAmount)
            
            container.addView(row)
            
            val divider = android.view.View(this)
            divider.layoutParams = android.widget.LinearLayout.LayoutParams(-1, 1)
            divider.setBackgroundColor(android.graphics.Color.parseColor("#EEEEEE"))
            container.addView(divider)
        }
    }

    private fun showSendDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_send_points, null)
        val spinner = dialogView.findViewById<Spinner>(R.id.spinnerReceiverDialog)
        val spinnerReason = dialogView.findViewById<Spinner>(R.id.spinnerReasonDialog)
        val etAmt = dialogView.findViewById<EditText>(R.id.etAmountDialog)
        val btnScan = dialogView.findViewById<android.widget.ImageButton>(R.id.btnScanQr)
        
        spinnerReceiver = spinner // Save reference

        // TextWatcher for Comma Formatting
        etAmt.addTextChangedListener(object : android.text.TextWatcher {
            override fun afterTextChanged(s: android.text.Editable?) {}
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (s.isNullOrEmpty()) return
                
                etAmt.removeTextChangedListener(this)
                try {
                    val originalString = s.toString().replace(",", "")
                    if (originalString.isNotEmpty()) {
                        val longVal = originalString.toLong()
                        val formatter = java.text.DecimalFormat("#,###")
                        val formattedString = formatter.format(longVal)
                        etAmt.setText(formattedString)
                        etAmt.setSelection(etAmt.text.length)
                    }
                } catch (nfe: NumberFormatException) {
                    nfe.printStackTrace()
                }
                etAmt.addTextChangedListener(this)
            }
        })
        
        lifecycleScope.launch {
            try {
                // Populate users spinner
                val users = NetworkClient.api.getUsers()
                allUsers = users 
                val currentUserId = currentUser?.id 
                val receivers = users.filter { it.id != currentUserId }
                
                val adapter = ArrayAdapter(this@MainActivity, R.layout.item_spinner, receivers)
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                spinner.adapter = adapter

                // Populate reasons spinner
                try {
                    val reasons = NetworkClient.api.getReasons()
                    val activeReasons = reasons.filter { true } // Filter inactive if needed, model has plain name
                    val reasonAdapter = ArrayAdapter(this@MainActivity, R.layout.item_spinner, activeReasons)
                    reasonAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                    spinnerReason.adapter = reasonAdapter
                } catch(e: Exception) {
                     // Fallback or empty
                }
                
            } catch(e: Exception) {}
        }

        val builder = android.app.AlertDialog.Builder(this)
        builder.setView(dialogView)
        
        val dialog = builder.create()
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
        currentSendDialog = dialog // Save reference

        // Wire up custom buttons
        val btnCancel = dialogView.findViewById<Button>(R.id.btnCancelDialog)
        val btnSend = dialogView.findViewById<Button>(R.id.btnSendDialog)

        btnCancel.setOnClickListener { dialog.dismiss() }
        btnSend.setOnClickListener {
            val receiver = spinner.selectedItem as? User
            val reasonItem = spinnerReason.selectedItem as? TransactionReason
            
            // Strip commas
            val amountStr = etAmt.text.toString().replace(",", "")
            val amount = amountStr.toIntOrNull()
            
            if (receiver != null && amount != null && amount > 0) {
                performSend(receiver, amount, reasonItem?.name)
                dialog.dismiss()
            } else {
                Toast.makeText(this, "いくつおくるかきめてね", Toast.LENGTH_SHORT).show()
            }
        }
        
        // Scan Button
        btnScan.setOnClickListener {
            // Launch Scanner
            val options = ScanOptions()
            options.setCaptureActivity(CustomScannerActivity::class.java)
            options.setDesiredBarcodeFormats(ScanOptions.QR_CODE)
            options.setPrompt("") // Handled in layout
            options.setCameraId(0) 
            options.setBeepEnabled(false)
            options.setOrientationLocked(true)
            scanLauncher.launch(options)
        }
        
        // Preset Logic
        val btn100 = dialogView.findViewById<Button>(R.id.btnAdd100)
        val btn500 = dialogView.findViewById<Button>(R.id.btnAdd500)
        val btn1000 = dialogView.findViewById<Button>(R.id.btnAdd1000)
        val btnClear = dialogView.findViewById<Button>(R.id.btnClearAmount)
        
        fun addAmount(add: Int) {
            val currentStr = etAmt.text.toString().replace(",", "")
            val current = currentStr.toIntOrNull() ?: 0
            val newVal = current + add
            
            val formatter = java.text.DecimalFormat("#,###")
            etAmt.setText(formatter.format(newVal))
            etAmt.setSelection(etAmt.text.length) // Move cursor to end
        }
        
        btn100.setOnClickListener { addAmount(100) }
        btn500.setOnClickListener { addAmount(500) }
        btn1000.setOnClickListener { addAmount(1000) }
        btnClear.setOnClickListener { etAmt.text.clear() }
        
        dialog.setOnDismissListener {
            currentSendDialog = null
            spinnerReceiver = null
        }
        
        dialog.show()
    }

    private fun showReceiveQr() {
        val userId = currentUser?.id ?: return
        
        try {
            val barcodeEncoder = BarcodeEncoder()
            val bitmap = barcodeEncoder.encodeBitmap(userId, BarcodeFormat.QR_CODE, 600, 600)
            
            val dialogView = layoutInflater.inflate(R.layout.dialog_receive_qr, null)
            val ivQr = dialogView.findViewById<ImageView>(R.id.ivQrCode)
            val btnClose = dialogView.findViewById<Button>(R.id.btnCloseQr)
            
            ivQr.setImageBitmap(bitmap)
            
            val builder = android.app.AlertDialog.Builder(this)
            builder.setView(dialogView)
            val dialog = builder.create()
            dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
            
            btnClose.setOnClickListener { dialog.dismiss() }
            
            dialog.show()
            
        } catch (e: Exception) {
            Toast.makeText(this, "QRコードがつくれなかったよ: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    @Suppress("UNCHECKED_CAST")
    private fun handleScanResult(scannedId: String) {
        val dialog = currentSendDialog
        val spinner = spinnerReceiver
        
        if (dialog != null && dialog.isShowing && spinner != null) {
            val adapter = spinner.adapter as? ArrayAdapter<User> ?: return
            
            var found = false
            for (i in 0 until adapter.count) {
                val user = adapter.getItem(i)
                if (user?.id == scannedId) {
                    spinner.setSelection(i)
                    found = true
                    Toast.makeText(this, "このひとにおくるよ: ${user.name}", Toast.LENGTH_SHORT).show()
                    break
                }
            }
            if (!found) {
                Toast.makeText(this, "このアプリをつかっているひとじゃないみたい: $scannedId", Toast.LENGTH_LONG).show()
            }
        } else {
             Toast.makeText(this, "よみとったよ: $scannedId", Toast.LENGTH_SHORT).show()
        }
    }

    private fun performSend(receiver: User, amount: Int, description: String?) {
         val currentUser = this.currentUser ?: return
         lifecycleScope.launch {
            try {
                val req = TransactionRequest(
                    senderId = currentUser.id,
                    receiverId = receiver.id,
                    amount = amount,
                    description = description
                )
                NetworkClient.api.sendPoints(req)
                Toast.makeText(this@MainActivity, "送りました！", Toast.LENGTH_SHORT).show()
                fetchData() // Refresh
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "送信失敗: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
