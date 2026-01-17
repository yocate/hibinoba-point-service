package com.example.pointsystem

import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor

interface ApiService {
    @GET("users")
    suspend fun getUsers(): List<User>

    @POST("transactions/transfer")
    suspend fun sendPoints(@Body request: TransactionRequest): Response<TransactionResponse>

    @retrofit2.http.PUT("users/{id}")
    suspend fun updateUser(@retrofit2.http.Path("id") id: String, @Body user: User): Response<User>

    @GET("transactions")
    suspend fun getTransactions(@retrofit2.http.Query("user_id") userId: String): List<Transaction>
}

object NetworkClient {
    // 10.0.2.2 is the localhost of the host machine from Android Emulator
    private const val BASE_URL = "http://10.0.2.2:8080/api/"

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logging)
        .build()

    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(client)
            .build()
            .create(ApiService::class.java)
    }
}
