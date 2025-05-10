package com.rhythmgame;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Base64;

import androidx.core.app.ActivityCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import io.grpc.stub.StreamObserver;
import yandex.cloud.ai.stt.v3.SttServiceOuterClass;

public class STTModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private STTClient sttClient;

    public STTModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.sttClient = new STTClient();
    }

    @Override
    public String getName() {
        return "STTModule";
    }

    @ReactMethod
    public void startStreaming(String iamToken, String folderId) {
        sttClient.startStreaming(iamToken, folderId, new StreamObserver<SttServiceOuterClass.StreamingResponse>() {
            @Override
            public void onNext(SttServiceOuterClass.StreamingResponse response) {
                String transcription = response.getFinalResult().getAlternatives(0).getText();
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onTranscription", transcription);
            }

            @Override
            public void onError(Throwable t) {
                // Handle error
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onSTTError", t.getMessage());
            }

            @Override
            public void onCompleted() {
                // Streaming completed
            }
        });
    }

    @ReactMethod
    public void sendAudioChunk(String base64Chunk) {
        byte[] chunk = Base64.decode(base64Chunk, Base64.DEFAULT);
        sttClient.sendAudioChunk(chunk);
    }

    @ReactMethod
    public void stopStreaming() {
        sttClient.stopStreaming();
    }

    @ReactMethod
    public void requestAudioPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (reactContext.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                promise.resolve(true);
            } else {
                ActivityCompat.requestPermissions(
                    getCurrentActivity(),
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    1234
                );
                promise.resolve(false);
            }
        } else {
            promise.resolve(true);
        }
    }
}