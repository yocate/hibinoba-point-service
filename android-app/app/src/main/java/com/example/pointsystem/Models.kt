package com.example.pointsystem

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    @SerializedName("balance") val balance: Long,
    val password: String? = null,
    @SerializedName("avatar_data") val avatarData: String? = null
) {
    override fun toString(): String {
        return name
    }
}

data class TransactionReason(
    val id: String,
    val name: String
) {
    override fun toString(): String {
        return name
    }
}

data class TransactionRequest(
    @SerializedName("sender_id") val senderId: String,
    @SerializedName("receiver_id") val receiverId: String,
    val amount: Int,
    val description: String? = null
)

data class TransactionResponse(
    val message: String
)

data class Transaction(
    val id: String,
    @SerializedName("sender_id") val senderId: String?,
    @SerializedName("receiver_id") val receiverId: String,
    val amount: Int,
    val type: String,
    val description: String?,
    @SerializedName("created_at") val createdAt: String
)
