package com.rhythmgame;

import com.google.protobuf.ByteString;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Metadata;
import io.grpc.stub.StreamObserver;
import yandex.cloud.ai.stt.v3.SttServiceGrpc;
import yandex.cloud.ai.stt.v3.SttServiceOuterClass;

public class STTClient {
    private ManagedChannel channel;
    private SttServiceGrpc.SttServiceStub stub;
    private StreamObserver<SttServiceOuterClass.StreamingRequest> requestObserver;

    public void startStreaming(String iamToken, String folderId, StreamObserver<SttServiceOuterClass.StreamingResponse> responseObserver) {
        channel = ManagedChannelBuilder.forAddress("stt.api.cloud.yandex.net", 443).build();
        stub = SttServiceGrpc.newStub(channel);

        Metadata metadata = new Metadata();
        Metadata.Key<String> authKey = Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);
        metadata.put(authKey, "Bearer " + iamToken);

        requestObserver = stub.withInterceptors(io.grpc.ClientInterceptors.intercept(stub, metadata))
            .recognizeStreaming(responseObserver);

        SttServiceOuterClass.StreamingRequest initialRequest = SttServiceOuterClass.StreamingRequest.newBuilder()
            .setSessionOptions(SttServiceOuterClass.SessionOptions.newBuilder()
                .setRecognitionModel(SttServiceOuterClass.RecognitionModelOptions.newBuilder()
                    .setAudioFormat(SttServiceOuterClass.AudioFormatOptions.newBuilder()
                        .setRawAudio(SttServiceOuterClass.RawAudio.newBuilder()
                            .setAudioEncoding(SttServiceOuterClass.RawAudio.AudioEncoding.LINEAR16_PCM)
                            .setSampleRateHertz(16000)
                            .setAudioChannelCount(1)
                        )
                    )
                    .setTextNormalization(SttServiceOuterClass.TextNormalizationOptions.newBuilder()
                        .setTextNormalization(SttServiceOuterClass.TextNormalizationOptions.TextNormalization.TEXT_NORMALIZATION_ENABLED)
                    )
                )
                .setLanguageCode("ru-RU")
                .setPartialResults(true)
                .setFolderId(folderId)
            )
            .build();
        requestObserver.onNext(initialRequest);
    }

    public void sendAudioChunk(byte[] chunk) {
        if (requestObserver != null) {
            SttServiceOuterClass.StreamingRequest audioRequest = SttServiceOuterClass.StreamingRequest.newBuilder()
                .setAudioContent(ByteString.copyFrom(chunk))
                .build();
            requestObserver.onNext(audioRequest);
        }
    }

    public void stopStreaming() {
        if (requestObserver != null) {
            requestObserver.onCompleted();
        }
        if (channel != null) {
            channel.shutdown();
        }
    }
}