package com.nbang.GongguMinjok.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3ImageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private final S3Client s3Client;

    @Value("${aws.s3.bucket:}")
    private String bucket;

    @Value("${aws.s3.region:ap-northeast-2}")
    private String region;

    @Value("${aws.s3.public-base-url:}")
    private String publicBaseUrl;

    @Value("${aws.s3.profile-image-prefix:profile-images}")
    private String profileImagePrefix;

    @Value("${aws.s3.group-buy-image-prefix:group-buy-images}")
    private String groupBuyImagePrefix;

    @Value("${aws.s3.max-image-size-bytes:5242880}")
    private long maxImageSizeBytes;

    public String uploadProfileImage(Long userId, MultipartFile file) {
        validateS3Config();
        validateImage(file);

        String contentType = file.getContentType();
        String key = profileImagePrefix + "/user-" + userId + "/" + UUID.randomUUID() + extensionFor(contentType);

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return publicUrl(key);
        } catch (IOException e) {
            throw new IllegalStateException("프로필 이미지를 읽을 수 없습니다.");
        }
    }

    public String uploadGroupBuyImage(Long hostId, MultipartFile file) {
        validateS3Config();
        validateImage(file);

        String contentType = file.getContentType();
        String key = groupBuyImagePrefix + "/host-" + hostId + "/" + UUID.randomUUID() + extensionFor(contentType);

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return publicUrl(key);
        } catch (IOException e) {
            throw new IllegalStateException("공동구매 이미지를 읽을 수 없습니다.");
        }
    }

    private void validateS3Config() {
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("S3 bucket 설정이 필요합니다.");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 프로필 이미지를 선택해주세요.");
        }
        if (file.getSize() > maxImageSizeBytes) {
            throw new IllegalArgumentException("프로필 이미지는 5MB 이하만 업로드할 수 있습니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("jpg, png, gif, webp 이미지만 업로드할 수 있습니다.");
        }
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> "";
        };
    }

    private String publicUrl(String key) {
        if (publicBaseUrl != null && !publicBaseUrl.isBlank()) {
            return publicBaseUrl.replaceAll("/+$", "") + "/" + key;
        }
        String encodedKey = URLEncoder.encode(key, StandardCharsets.UTF_8)
                .replace("+", "%20")
                .replace("%2F", "/");
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + encodedKey;
    }
}
