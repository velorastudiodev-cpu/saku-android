package com.velorastudio.saku;

import android.os.Bundle;
import android.webkit.WebSettings;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SecureWalletPlugin.class);
        super.onCreate(savedInstanceState);
        applyLightSystemBars();
        if (getBridge() == null) return;
        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setAllowFileAccess(false);
        settings.setBlockNetworkLoads(true);
        settings.setGeolocationEnabled(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
    }
    private void applyLightSystemBars() {
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightStatusBars(true);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightNavigationBars(true);
    }

    @Override
    public void onResume() {
        super.onResume();
        applyLightSystemBars();
    }
}
