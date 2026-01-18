package com.example.pointsystem

import androidx.appcompat.app.AppCompatActivity
import com.journeyapps.barcodescanner.CaptureManager
import com.journeyapps.barcodescanner.DecoratedBarcodeView
import android.os.Bundle

class CustomScannerActivity : AppCompatActivity() {
    private lateinit var captureManager: CaptureManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_custom_scanner)
        
        val barcodeScannerView = findViewById<DecoratedBarcodeView>(R.id.zxing_barcode_scanner)
        
        captureManager = CaptureManager(this, barcodeScannerView)
        captureManager.initializeFromIntent(intent, savedInstanceState)
        captureManager.decode()
    }
    
    override fun onResume() {
        super.onResume()
        captureManager.onResume()
    }
    
    override fun onPause() {
        super.onPause()
        captureManager.onPause()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        captureManager.onDestroy()
    }
    
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        captureManager.onSaveInstanceState(outState)
    }
    
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        captureManager.onRequestPermissionsResult(requestCode, permissions, grantResults)
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    }
}
