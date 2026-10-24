package com.velorastudio.saku;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SecureWalletPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() == null) return;
        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setAllowFileAccess(false);
        settings.setBlockNetworkLoads(true);
        settings.setGeolocationEnabled(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
    }
}
