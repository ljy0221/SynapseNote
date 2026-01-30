package com.synapse.api.modules.image.service;

import com.synapse.api.modules.image.dto.request.UploadUrlRequest;
import com.synapse.api.modules.image.dto.response.ReadUrlResponse;
import com.synapse.api.modules.image.dto.response.UploadUrlResponse;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.entity.NoteRole;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;

    private static final Set<String> ALLOWED_IMAGE_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${cloud.aws.s3.image-prefix}")
    private String imagePrefix;

    @Value("${cloud.aws.s3.presign.put-exp-min}")
    private long putExpMin;

    @Value("${cloud.aws.s3.presign.get-exp-min}")
    private long getExpMin;

    public UploadUrlResponse createPresignedUploadUrl(UploadUrlRequest request) {
        validateContentType(request.contentType());
        validateFileNameExtensionMatchesContentType(request.originalFileName(), request.contentType());

        String key = buildKey(request.contentType());

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(request.contentType())
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(p -> p
                .signatureDuration(Duration.ofMinutes(putExpMin))
                .putObjectRequest(putObjectRequest)
        );

        long expiresInSec = calculateRemainingSeconds(presigned.expiration());

        return UploadUrlResponse.builder()
                .key(key)
                .putUrl(presigned.url().toString())
                .expiresInSec(expiresInSec)
                .build();
    }

    public ReadUrlResponse createPresignedReadUrl(String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(p -> p
                .signatureDuration(Duration.ofMinutes(getExpMin))
                .getObjectRequest(getObjectRequest)
        );

        long expiresInSec = calculateRemainingSeconds(presigned.expiration());

        return ReadUrlResponse.builder()
                .key(key)
                .getUrl(presigned.url().toString())
                .expiresInSec(expiresInSec)
                .build();
    }

    public void deleteImageAtNote(UUID memberId, UUID noteId, String key) {

        noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        NoteMember noteMember = noteMemberRepository
                .findByNoteIdAndMemberId(noteId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_ACCESS_DENIED));

        if (!canDeleteImage(noteMember.getRole())) {
            throw new BusinessException(ErrorCode.IMAGE_DELETE_FAIL);
        }

        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.IMAGE_DELETE_FAIL);
        }
    }

    private boolean canDeleteImage(NoteRole role) {
        return role == NoteRole.OWNER || role == NoteRole.EDITOR;
    }

    private void validateContentType(String contentType) {
        if (contentType == null || !ALLOWED_IMAGE_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.IMAGE_INVALID_EXTENSION); // 혹은 IMAGE_INVALID_CONTENT_TYPE 같은 코드가 더 명확
        }
    }

    private void validateFileNameExtensionMatchesContentType(String originalFileName, String contentType) {
        String ext = extractExtension(originalFileName);

        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BusinessException(ErrorCode.IMAGE_INVALID_EXTENSION);
        }

        // contentType ↔ extension 매칭 검증
        boolean matches = switch (contentType) {
            case "image/jpeg" -> ext.equals("jpg") || ext.equals("jpeg");
            case "image/png" -> ext.equals("png");
            default -> false;
        };

        if (!matches) {
            throw new BusinessException(ErrorCode.IMAGE_INVALID_EXTENSION);
        }
    }

    private String extractExtension(String originalFileName) {
        if (originalFileName == null) {
            throw new BusinessException(ErrorCode.IMAGE_INVALID_EXTENSION);
        }

        int lastDot = originalFileName.lastIndexOf('.');
        if (lastDot < 0 || lastDot == originalFileName.length() - 1) {
            throw new BusinessException(ErrorCode.IMAGE_INVALID_EXTENSION);
        }

        return originalFileName.substring(lastDot + 1).toLowerCase(Locale.ROOT);
    }

    private long calculateRemainingSeconds(Instant expiration) {
        long nowEpochSec = Instant.now().getEpochSecond();
        return expiration.getEpochSecond() - nowEpochSec;
    }

    private String buildKey(String contentType) {
        String extension = switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            default -> throw new BusinessException(ErrorCode.IMAGE_INVALID_EXTENSION);
        };

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String filename = timestamp + "_" + UUID.randomUUID() + "." + extension;

        return imagePrefix + "/" + filename;
    }
}
