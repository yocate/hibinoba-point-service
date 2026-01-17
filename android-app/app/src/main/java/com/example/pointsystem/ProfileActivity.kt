package com.example.pointsystem

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

class ProfileActivity : AppCompatActivity() {

    private lateinit var etName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnSave: Button
    private lateinit var btnCancel: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        etName = findViewById(R.id.etName)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnSave = findViewById(R.id.btnSave)
        btnCancel = findViewById(R.id.btnCancel)

        // Load current user data passed via Intent extras or Global state
        // For simple demo, we rely on the intent extras
        val id = intent.getStringExtra("EXTRA_ID") ?: ""
        val name = intent.getStringExtra("EXTRA_NAME") ?: ""
        val email = intent.getStringExtra("EXTRA_EMAIL") ?: ""
        val role = intent.getStringExtra("EXTRA_ROLE") ?: "user"
        val balance = intent.getLongExtra("EXTRA_BALANCE", 0)

        etName.setText(name)
        etEmail.setText(email)

        btnCancel.setOnClickListener { finish() }

        btnSave.setOnClickListener {
            val newName = etName.text.toString()
            val newEmail = etEmail.text.toString()
            val newPassword = etPassword.text.toString()

            if (newName.isEmpty() || newEmail.isEmpty()) {
                Toast.makeText(this, "Name and Email required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val updatedUser = User(
                id = id,
                name = newName,
                email = newEmail,
                role = role,
                balance = balance,
                password = if (newPassword.isNotEmpty()) newPassword else null
            )

            lifecycleScope.launch {
                try {
                    val response = NetworkClient.api.updateUser(id, updatedUser)
                    if (response.isSuccessful) {
                        Toast.makeText(this@ProfileActivity, "Profile Updated", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@ProfileActivity, "Update Failed: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(this@ProfileActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
