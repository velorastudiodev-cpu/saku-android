package com.velorastudio.saku;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class SakuWidget extends AppWidgetProvider {
    static SharedPreferences preferences(Context context) { return context.getSharedPreferences("SakuWidget", Context.MODE_PRIVATE); }
    static boolean hide(Context context) {
        boolean saved = preferences(context).edit().clear().commit();
        refresh(context);
        return saved;
    }
    static void refresh(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        new SakuWidget().onUpdate(context, manager, manager.getAppWidgetIds(new ComponentName(context, SakuWidget.class)));
    }
    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences p = preferences(context);
        boolean locked = context.getSharedPreferences("SakuPrivacy", Context.MODE_PRIVATE).getBoolean("lock", false);
        boolean visible = p.getBoolean("visible", false) && !locked;
        String month = new SimpleDateFormat("yyyy-MM", Locale.ROOT).format(new Date());
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.saku_widget);
            views.setTextViewText(R.id.widget_balance, visible ? p.getString("balance", "—") : "Nominal disembunyikan");
            views.setTextViewText(R.id.widget_budget, visible ? "Sisa anggaran: " + (month.equals(p.getString("month", "")) ? p.getString("budget", "—") : "buka Saku untuk perbarui") : "Buka Saku untuk melihat catatan");
            views.setTextViewText(R.id.widget_updated, visible ? "Diperbarui " + p.getString("date", "") : "Privat · offline");
            Intent open = new Intent(context, MainActivity.class).setAction(Intent.ACTION_VIEW).setData(Uri.parse("saku://home")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            Intent add = new Intent(context, MainActivity.class).setAction(Intent.ACTION_VIEW).setData(Uri.parse("saku://transaction")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(context, 15, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            views.setOnClickPendingIntent(R.id.widget_add, PendingIntent.getActivity(context, 16, add, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            manager.updateAppWidget(id, views);
        }
    }
}
