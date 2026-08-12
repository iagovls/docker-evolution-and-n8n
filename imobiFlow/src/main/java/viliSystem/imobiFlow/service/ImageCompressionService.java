package viliSystem.imobiFlow.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import net.coobird.thumbnailator.Thumbnails;

@Service
public class ImageCompressionService {

    private final long maxThresholdBytes;
    private final float lowQualityFactor;
    private final int maxWidth;

    public ImageCompressionService(
            @Value("${aws.s3.compression-threshold-bytes:2097152}") long maxThresholdBytes,
            @Value("${aws.s3.low-quality-factor:0.6}") float lowQualityFactor,
            @Value("${aws.s3.image-max-width:1920}") int maxWidth) {
        this.maxThresholdBytes = maxThresholdBytes;
        this.lowQualityFactor = lowQualityFactor;
        this.maxWidth = maxWidth;
    }

    public byte[] compressIfNeeded(MultipartFile file) throws IOException {
        if (file.getSize() <= maxThresholdBytes) {
            return file.getBytes();
        }

        return compress(file);
    }

    public boolean needsCompression(MultipartFile file) {
        return file.getSize() > maxThresholdBytes;
    }

    private byte[] compress(MultipartFile file) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        Thumbnails.of(file.getInputStream())
                .width(maxWidth)
                .outputFormat("jpg")
                .outputQuality(lowQualityFactor)
                .toOutputStream(outputStream);

        return outputStream.toByteArray();
    }
}
