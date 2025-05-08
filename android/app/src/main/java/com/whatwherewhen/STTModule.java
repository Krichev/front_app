package com.whatwherewhen;

import com.facebook.react.bridge.ReactApplicationContext; import com.facebook.react.bridge.ReactContextBaseJavaModule; import com.facebook.react.bridge.ReactMethod; import com.facebook.react.modules.core.DeviceEventManagerModule; import yandex.cloud.ai.stt.v3.SttServiceOuterClass; import android.util.Base64;

public class STTModule extends ReactContextBaseJavaModule { private STTClient sttClient; private final ReactApplicationContext reactContext;
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
}}