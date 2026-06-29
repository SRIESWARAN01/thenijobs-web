package com.thenijobs.thenijobs;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.ValueCallback;
import android.view.KeyEvent;
import android.content.Intent;
import android.os.Message;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request runtime permissions on launch (Android 13+ Notification permission)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE);
            }
        }

        // Get the Capacitor WebView after the bridge initializes
        getBridge().getWebView().post(() -> {
            WebView webView = getBridge().getWebView();

            // Enable JavaScript and DOM storage
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setSupportMultipleWindows(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setLoadWithOverviewMode(true);
            settings.setUseWideViewPort(true);

            // Bypass Google OAuth "disallowed_useragent" restriction
            String userAgent = settings.getUserAgentString();
            if (userAgent != null) {
                // Stripping "Version/4.0" (or similar) from user agent makes it identify as normal browser to Google
                userAgent = userAgent.replaceAll("Version/[0-9.]+ ", "");
                settings.setUserAgentString(userAgent);
            }

            // Override WebViewClient to keep ALL URLs in-app
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    Uri url = request.getUrl();
                    String scheme = url.getScheme();

                    // Allow tel:, mailto:, sms: to open native handlers
                    if (scheme != null && (scheme.equals("tel") || scheme.equals("mailto") || scheme.equals("sms"))) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, url);
                            startActivity(intent);
                        } catch (Exception e) {
                            // Silently handle if no handler found
                        }
                        return true;
                    }

                    // Everything else loads inside the WebView
                    view.loadUrl(url.toString());
                    return true;
                }
            });

            // Handle target="_blank" and window.open links — load in same WebView
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(view);
                    resultMsg.sendToTarget();
                    return true;
                }
            });
        });
    }

    /**
     * Handle hardware back button — navigate WebView history instead of closing the app.
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            WebView webView = getBridge().getWebView();
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }
}
