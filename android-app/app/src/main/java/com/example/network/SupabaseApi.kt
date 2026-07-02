package com.example.network

import com.example.BuildConfig
import com.example.model.BankNotification
import com.example.model.BankPattern
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

interface SupabaseApi {

    @GET("rest/v1/bank_patterns")
    suspend fun getBankPatterns(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Query("select") select: String = "*"
    ): List<BankPattern>

    @POST("rest/v1/bank_notifications")
    suspend fun createNotification(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Body notification: BankNotification
    )

    @POST("rest/v1/rpc/link_device")
    suspend fun linkDevice(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Body request: com.example.model.LinkDeviceRequest
    ): com.example.model.LinkDeviceResponse
}

object SupabaseClient {

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    val isConfigured: Boolean
        get() {
            val baseUrl = try { BuildConfig.SUPABASE_URL } catch (e: Throwable) { "" }
            val key = try { BuildConfig.SUPABASE_ANON_KEY } catch (e: Throwable) { "" }
            return baseUrl.trim().isNotEmpty() && key.trim().isNotEmpty() && baseUrl.startsWith("http")
        }

    val url: String
        get() {
            val endpoint = try { BuildConfig.SUPABASE_URL } catch (e: Throwable) { "" }
            return if (endpoint.trim().isEmpty() || !endpoint.startsWith("http")) {
                "https://placeholder-url.supabase.co/"
            } else {
                if (endpoint.endsWith("/")) endpoint else "$endpoint/"
            }
        }

    val apiKey: String
        get() {
            val key = try { BuildConfig.SUPABASE_ANON_KEY } catch (e: Throwable) { "" }
            return key.trim()
        }

    val api: SupabaseApi by lazy {
        Retrofit.Builder()
            .baseUrl(url)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(SupabaseApi::class.java)
    }
}
