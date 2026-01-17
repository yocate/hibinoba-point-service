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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Session Check
        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val userId = sharedPref.getString("user_id", null)
        if (userId == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_main)

        tvBalance = findViewById(R.id.tvBalance)
        tvReceived = findViewById(R.id.tvReceived)
        tvSent = findViewById(R.id.tvSent)
        tvCurrentUser = findViewById(R.id.tvCurrentUser)
        btnSend = findViewById(R.id.btnSend)
        btnLogout = findViewById(R.id.btnLogout)
        
        btnSend.setOnClickListener { showSendDialog() }
        btnLogout.setOnClickListener { logout() }

        fetchData()
    }
    
    override fun onResume() {
        super.onResume()
        fetchData()
    }
    
    fun logout() {
         val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            clear()
            apply()
        }
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }

    private fun fetchData() {
        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val currentUserId = sharedPref.getString("user_id", "") ?: return

        lifecycleScope.launch {
            try {
                // Fetch Users for current user info & spinner list
                val users = NetworkClient.api.getUsers()
                currentUser = users.find { it.id == currentUserId }
                
                currentUser?.let {
                    val formatted = java.text.NumberFormat.getNumberInstance().format(it.balance)
                    tvBalance.text = formatted
                    tvCurrentUser.text = "${it.name}さん、こんにちは"
                }

                // Fetch Transactions for Stats
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
        
        // Show top 5
        val recent = transactions.take(5)
        
        recent.forEach { tx ->
            val row = android.widget.LinearLayout(this)
            row.orientation = android.widget.LinearLayout.HORIZONTAL
            row.weightSum = 1f
            row.setPadding(0, 16, 0, 16)
            
            // Icon / Type
            val isReceived = tx.receiverId == currentUserId
            val iconText = if (isReceived) "↓" else "↑"
            val color = if (isReceived) "#00C853" else "#D50000" // Green/Red
            
            val tvIcon = TextView(this)
            tvIcon.text = iconText
            tvIcon.textSize = 18f
            tvIcon.setTextColor(android.graphics.Color.parseColor(color))
            tvIcon.layoutParams = android.widget.LinearLayout.LayoutParams(0, -2, 0.1f)
            
            // Details (Name)
            // Resolve Name: We need allUsers list. 
            // NOTE: allUsers is currently local var in fetchUsers, need to make it class property or pass it.
            // Let's assume we have it or can find it. 
            // Wait, fetchUsers makes allUsers local? No, line 95 `allUsers = users`. It is a class property?
            // Checking previous code... line 29 `private var allUsers: List<User> = emptyList()`. Yes property.
            
            val otherId = if (isReceived) tx.senderId else tx.receiverId
            
            val otherName = if (otherId == null) {
                "システム" // System
            } else {
                val otherUser = allUsers.find { it.id == otherId }
                otherUser?.name ?: "Unknown"
            }
            
            val tvName = TextView(this)
            tvName.text = otherName
            tvName.textSize = 16f
            tvName.setTextColor(android.graphics.Color.parseColor("#212121"))
            tvName.layoutParams = android.widget.LinearLayout.LayoutParams(0, -2, 0.6f)
            
            // Amount
            val tvAmount = TextView(this)
            tvAmount.text = "${if(isReceived) "+" else "-"}${java.text.NumberFormat.getNumberInstance().format(tx.amount)}"
            tvAmount.textSize = 16f
            tvAmount.setTypeface(null, android.graphics.Typeface.BOLD)
            tvAmount.setTextColor(android.graphics.Color.parseColor("#212121"))
            tvAmount.gravity = android.view.Gravity.END
            tvAmount.layoutParams = android.widget.LinearLayout.LayoutParams(0, -2, 0.3f)
            
            row.addView(tvIcon)
            row.addView(tvName)
            row.addView(tvAmount)
            
            container.addView(row)
            
            // Divider
            val divider = android.view.View(this)
            divider.layoutParams = android.widget.LinearLayout.LayoutParams(-1, 1)
            divider.setBackgroundColor(android.graphics.Color.parseColor("#EEEEEE"))
            container.addView(divider)
        }
    }

    private fun showSendDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_send_points, null)
        val spinner = dialogView.findViewById<Spinner>(R.id.spinnerReceiverDialog)
        val etAmt = dialogView.findViewById<EditText>(R.id.etAmountDialog)
        
        lifecycleScope.launch {
            try {
                // Populate spinner
                // For MVP, we fetch all users
                val users = NetworkClient.api.getUsers()
                allUsers = users // Assign to class property
                val currentUserId = currentUser?.id 
                val receivers = users.filter { it.id != currentUserId }
                
                val adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_item, receivers)
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                spinner.adapter = adapter
                
            } catch(e: Exception) {}
        }


            
        val builder = android.app.AlertDialog.Builder(this)
        // builder.setTitle("ポイントを送る") // Title removed, can use TextView if needed, but clean is better
        builder.setView(dialogView)
        
        val dialog = builder.create()
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        // Wire up custom buttons
        val btnCancel = dialogView.findViewById<Button>(R.id.btnCancelDialog)
        val btnSend = dialogView.findViewById<Button>(R.id.btnSendDialog)

        btnCancel.setOnClickListener { dialog.dismiss() }
        btnSend.setOnClickListener {
            val receiver = spinner.selectedItem as? User
            val amountStr = etAmt.text.toString()
            val amount = amountStr.toIntOrNull()
            
            if (receiver != null && amount != null && amount > 0) {
                performSend(receiver, amount)
                dialog.dismiss()
            } else {
                Toast.makeText(this, "入力が正しくありません", Toast.LENGTH_SHORT).show()
            }
        }
        
        // Preset Logic
        val btn100 = dialogView.findViewById<Button>(R.id.btnAdd100)
        val btn500 = dialogView.findViewById<Button>(R.id.btnAdd500)
        val btn1000 = dialogView.findViewById<Button>(R.id.btnAdd1000)
        val btnClear = dialogView.findViewById<Button>(R.id.btnClearAmount)
        
        fun addAmount(add: Int) {
            val current = etAmt.text.toString().toIntOrNull() ?: 0
            etAmt.setText((current + add).toString())
            etAmt.setSelection(etAmt.text.length) // Move cursor to end
        }
        
        btn100.setOnClickListener { addAmount(100) }
        btn500.setOnClickListener { addAmount(500) }
        btn1000.setOnClickListener { addAmount(1000) }
        btnClear.setOnClickListener { etAmt.text.clear() }
        
        dialog.show()
    }

    private fun performSend(receiver: User, amount: Int) {
         val currentUser = this.currentUser ?: return
         lifecycleScope.launch {
            try {
                val req = TransactionRequest(
                    senderId = currentUser.id,
                    receiverId = receiver.id,
                    amount = amount
                )
                NetworkClient.api.sendPoints(req)
                Toast.makeText(this@MainActivity, "Sent!", Toast.LENGTH_SHORT).show()
                fetchData() // Refresh
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
