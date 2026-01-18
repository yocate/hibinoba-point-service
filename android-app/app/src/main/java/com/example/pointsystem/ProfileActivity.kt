package com.example.pointsystem

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream

class ProfileActivity : AppCompatActivity() {

    private lateinit var etName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnSave: Button
    private lateinit var btnCancel: Button
    private lateinit var ivAvatar: ImageView
    private lateinit var btnChangePhoto: Button

    private var currentAvatarBase64: String? = null

    private val pickImage = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            val bitmap = uriToBitmap(it)
            val resized = resizeBitmap(bitmap, 500) // Max 500px
            currentAvatarBase64 = bitmapToBase64(resized)
            ivAvatar.setImageBitmap(resized)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        etName = findViewById(R.id.etName)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnSave = findViewById(R.id.btnSave)
        btnCancel = findViewById(R.id.btnCancel)
        ivAvatar = findViewById(R.id.ivAvatar)
        btnChangePhoto = findViewById(R.id.btnChangePhoto)

        // Load ID passed via Intent
        val userId = intent.getStringExtra("EXTRA_ID") ?: return

        btnChangePhoto.setOnClickListener {
            pickImage.launch("image/*")
        }

        btnCancel.setOnClickListener { finish() }

        loadUserProfile(userId)
        btnSave.setOnClickListener {
            val newName = etName.text.toString()
            val newEmail = etEmail.text.toString()
            val newPassword = etPassword.text.toString()

            if (newName.isEmpty() || newEmail.isEmpty()) {
                Toast.makeText(this, "Name and Email required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // We need original user data for role/balance if we don't want to overwrite them with defaults?
            // Since we fetched fresh data, we should store it in a member var or just pass what we have?
            // The API updateUser might expect full object.
            
            // Let's assume we maintain `currentUser` in this activity
            val current = this.currentUser ?: return@setOnClickListener

            val updatedUser = User(
                id = userId,
                name = newName,
                email = newEmail,
                role = current.role,
                balance = current.balance,
                password = if (newPassword.isNotEmpty()) newPassword else null,
                avatarData = currentAvatarBase64
            )

            lifecycleScope.launch {
                try {
                    val response = NetworkClient.api.updateUser(userId, updatedUser)
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

    private var currentUser: User? = null

    private fun loadUserProfile(userId: String) {
        lifecycleScope.launch {
            try {
                // Determine if we use getUsers or if we should add getUser to API.
                // Using getUsers for now as per plan.
                // Use getUser(id) for efficiency
                val response = NetworkClient.api.getUser(userId)
                
                if (response.isSuccessful && response.body() != null) {
                    val user = response.body()!!
                    currentUser = user
                    etName.setText(user.name)
                    etEmail.setText(user.email)
                    currentAvatarBase64 = user.avatarData
                    
                    if (!user.avatarData.isNullOrEmpty()) {
                        try {
                            val decodedBytes = Base64.decode(user.avatarData, Base64.DEFAULT)
                            val decodedBitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                            ivAvatar.setImageBitmap(decodedBitmap)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                } else {
                    Toast.makeText(this@ProfileActivity, "User not found", Toast.LENGTH_SHORT).show()
                    finish()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ProfileActivity, "Error loading profile: ${e.message}", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun uriToBitmap(uri: Uri): Bitmap {
        return contentResolver.openInputStream(uri).use {
            BitmapFactory.decodeStream(it)
        }
    }

    private fun resizeBitmap(bitmap: Bitmap, maxSize: Int): Bitmap {
        var width = bitmap.width
        var height = bitmap.height

        val bitmapRatio = width.toFloat() / height.toFloat()
        if (bitmapRatio > 1) {
            width = maxSize
            height = (width / bitmapRatio).toInt()
        } else {
            height = maxSize
            width = (height * bitmapRatio).toInt()
        }
        return Bitmap.createScaledBitmap(bitmap, width, height, true)
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 70, outputStream)
        return Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)
    }
}
