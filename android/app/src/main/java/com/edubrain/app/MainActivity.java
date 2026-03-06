package com.edubrain.app;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private View errorView;
    private SwipeRefreshLayout swipeRefresh;
    private static final String WEB_URL = BuildConfig.WEB_URL;
    private static final String GITHUB_REPO = BuildConfig.GITHUB_REPO;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge
        Window window = getWindow();
        window.setStatusBarColor(getResources().getColor(R.color.primary, getTheme()));

        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        errorView = findViewById(R.id.errorView);
        swipeRefresh = findViewById(R.id.swipeRefresh);

        setupWebView();
        setupSwipeRefresh();

        if (isNetworkAvailable()) {
            webView.loadUrl(WEB_URL);
            checkForUpdates();
        } else {
            showError();
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setUserAgentString(settings.getUserAgentString() + " EduBrainApp/" + getAppVersion());

        // Enable cookies
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // Keep internal URLs in WebView, open external in browser
                if (url.startsWith(WEB_URL) || url.startsWith("http://localhost") || url.startsWith("http://10.0.2.2")) {
                    return false;
                }
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                errorView.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError();
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    private void setupSwipeRefresh() {
        swipeRefresh.setColorSchemeResources(R.color.primary);
        swipeRefresh.setOnRefreshListener(() -> webView.reload());
    }

    private void showError() {
        progressBar.setVisibility(View.GONE);
        errorView.setVisibility(View.VISIBLE);
        swipeRefresh.setRefreshing(false);

        TextView retryBtn = errorView.findViewById(R.id.retryButton);
        if (retryBtn != null) {
            retryBtn.setOnClickListener(v -> {
                errorView.setVisibility(View.GONE);
                progressBar.setVisibility(View.VISIBLE);
                webView.reload();
            });
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
        return caps != null && (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                || caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR));
    }

    private String getAppVersion() {
        try {
            PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            return pInfo.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "1.0.0";
        }
    }

    private void checkForUpdates() {
        new Thread(() -> {
            try {
                URL url = new URL("https://api.github.com/repos/" + GITHUB_REPO + "/releases/latest");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestProperty("Accept", "application/vnd.github.v3+json");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);

                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    JSONObject release = new JSONObject(sb.toString());
                    String latestVersion = release.getString("tag_name").replace("v", "");
                    String currentVersion = getAppVersion();

                    if (isNewerVersion(latestVersion, currentVersion)) {
                        // Find APK asset
                        String downloadUrl = "";
                        String notes = release.optString("body", "");
                        org.json.JSONArray assets = release.getJSONArray("assets");
                        for (int i = 0; i < assets.length(); i++) {
                            JSONObject asset = assets.getJSONObject(i);
                            if (asset.getString("name").endsWith(".apk")) {
                                downloadUrl = asset.getString("browser_download_url");
                                break;
                            }
                        }

                        final String finalUrl = downloadUrl;
                        final String finalVersion = latestVersion;
                        final String finalNotes = notes;

                        new Handler(Looper.getMainLooper()).post(() ->
                            showUpdateDialog(finalVersion, finalUrl, finalNotes)
                        );
                    }
                }
                conn.disconnect();
            } catch (Exception e) {
                // Silently ignore update check failures
            }
        }).start();
    }

    private boolean isNewerVersion(String latest, String current) {
        try {
            String[] l = latest.split("\\.");
            String[] c = current.split("\\.");
            for (int i = 0; i < 3; i++) {
                int lv = i < l.length ? Integer.parseInt(l[i]) : 0;
                int cv = i < c.length ? Integer.parseInt(c[i]) : 0;
                if (lv > cv) return true;
                if (lv < cv) return false;
            }
        } catch (Exception ignored) {}
        return false;
    }

    private void showUpdateDialog(String version, String downloadUrl, String notes) {
        new AlertDialog.Builder(this)
            .setTitle("새 버전 v" + version + " 사용 가능")
            .setMessage(notes.isEmpty() ? "새 버전이 출시되었습니다. 업데이트하시겠습니까?" : notes)
            .setPositiveButton("업데이트", (d, w) -> {
                if (!downloadUrl.isEmpty()) {
                    downloadApk(downloadUrl, version);
                } else {
                    Intent intent = new Intent(Intent.ACTION_VIEW,
                        Uri.parse("https://github.com/" + GITHUB_REPO + "/releases/latest"));
                    startActivity(intent);
                }
            })
            .setNegativeButton("나중에", null)
            .show();
    }

    private void downloadApk(String url, String version) {
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle("EduBrain v" + version);
        request.setDescription("업데이트 다운로드 중...");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "EduBrain-v" + version + ".apk");
        request.setMimeType("application/vnd.android.package-archive");

        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        long downloadId = dm.enqueue(request);

        // Listen for download completion
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (id == downloadId) {
                    installApk(version);
                    unregisterReceiver(this);
                }
            }
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(receiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(receiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        }
    }

    private void installApk(String version) {
        File file = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                "EduBrain-v" + version + ".apk");
        if (file.exists()) {
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
