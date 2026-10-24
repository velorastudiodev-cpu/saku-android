package com.velorastudio.saku;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

@CapacitorPlugin(name = "SecureWallet")
public class SecureWalletPlugin extends Plugin {
    private static final String ALIAS = "com.velorastudio.saku.wallet.v1";
    private static final int MAX_BYTES = 10 * 1024 * 1024;

    private AtomicFile walletFile() {
        return new AtomicFile(new File(getContext().getNoBackupFilesDir(), "wallet.v1.enc"));
    }

    private SecretKey key(boolean create) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(ALIAS)) return (SecretKey) store.getKey(ALIAS, null);
        if (!create) throw new IOException("Wallet key unavailable");
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build());
        return generator.generateKey();
    }

    @PluginMethod
    public synchronized void read(PluginCall call) {
        try {
            AtomicFile file = walletFile();
            // AtomicFile also recovers an interrupted write from its backup.
            if (!file.getBaseFile().exists() && !new File(file.getBaseFile() + ".bak").exists()) {
                JSObject result = new JSObject();
                result.put("value", JSONObject.NULL);
                call.resolve(result);
                return;
            }
            byte[] data = file.readFully();
            if (data.length < 29 || data.length > MAX_BYTES + 29 || data[0] != 1)
                throw new IOException("Invalid wallet envelope");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(false),
                new GCMParameterSpec(128, Arrays.copyOfRange(data, 1, 13)));
            cipher.updateAAD(ALIAS.getBytes(StandardCharsets.UTF_8));
            byte[] plain = cipher.doFinal(data, 13, data.length - 13);
            JSObject result = new JSObject();
            result.put("value", new String(plain, StandardCharsets.UTF_8));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Catatan terenkripsi belum bisa dibuka. Data tidak dihapus; coba lagi atau pulihkan cadangan JSON.");
        }
    }

    @PluginMethod
    public synchronized void write(PluginCall call) {
        AtomicFile file = walletFile();
        FileOutputStream output = null;
        try {
            String value = call.getString("value");
            if (value == null || value.length() > MAX_BYTES) throw new IOException("Invalid wallet size");
            byte[] plain = value.getBytes(StandardCharsets.UTF_8);
            if (plain.length > MAX_BYTES) throw new IOException("Wallet too large");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(true));
            cipher.updateAAD(ALIAS.getBytes(StandardCharsets.UTF_8));
            byte[] encrypted = cipher.doFinal(plain);
            byte[] iv = cipher.getIV();
            if (iv.length != 12) throw new IOException("Invalid IV length");
            byte[] data = ByteBuffer.allocate(1 + iv.length + encrypted.length)
                .put((byte) 1).put(iv).put(encrypted).array();
            output = file.startWrite();
            output.write(data);
            output.getFD().sync();
            file.finishWrite(output);
            output = null;
            if (!Arrays.equals(data, file.readFully()))
                throw new IOException("Wallet persistence incomplete");
            call.resolve();
        } catch (Exception error) {
            if (output != null) file.failWrite(output);
            call.reject("Catatan belum tersimpan. Pastikan ruang penyimpanan tersedia lalu coba lagi.");
        }
    }

    @PluginMethod
    public void clearLegacy(PluginCall call) {
        android.content.SharedPreferences legacy = getContext()
            .getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        if (legacy.contains("saku.wallet.v1") && !legacy.edit().remove("saku.wallet.v1").commit()) {
            call.reject("Pembersihan catatan lama belum selesai. Coba buka ulang aplikasi.");
            return;
        }
        call.resolve();
    }

    @Override
    public void load() {
        long cutoff = System.currentTimeMillis() - 24 * 60 * 60 * 1000L;
        File[] exports = new File(getContext().getCacheDir(), "exports").listFiles();
        if (exports != null) {
            for (File file : exports) {
                if (file.isFile() && file.lastModified() < cutoff) file.delete();
            }
        }
        File[] legacyExports = getContext().getCacheDir().listFiles();
        if (legacyExports != null) {
            for (File file : legacyExports) {
                String name = file.getName();
                if (file.isFile() && name.startsWith("saku-") &&
                    (name.endsWith(".json") || name.endsWith(".csv")) && file.lastModified() < cutoff)
                    file.delete();
            }
        }
    }
}
