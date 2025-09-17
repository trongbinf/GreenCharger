using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;

namespace GreenChargerAPI.Services
{
    public class CloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration configuration)
        {
            var cloudinarySettings = configuration.GetSection("CloudinarySettings");
            var account = new Account(
                cloudinarySettings["CloudName"],
                cloudinarySettings["ApiKey"],
                cloudinarySettings["ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadFileAsync(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    throw new ArgumentException("File is empty or null");

                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    PublicId = $"mocviet/{Guid.NewGuid()}",
                    Transformation = new Transformation().Quality("auto").FetchFormat("auto")
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                    throw new Exception($"Cloudinary upload error: {uploadResult.Error.Message}");

                return uploadResult.SecureUrl.ToString();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error uploading file to Cloudinary: {ex.Message}", ex);
            }
        }

        public async Task<bool> DeleteFileAsync(string publicId)
        {
            try
            {
                var deleteParams = new DeletionParams(publicId);
                var result = await _cloudinary.DestroyAsync(deleteParams);
                return result.Result == "ok";
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting file from Cloudinary: {ex.Message}", ex);
            }
        }

        public async Task<bool> DeleteFileByUrlAsync(string imageUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(imageUrl))
                    return true;

                var publicId = ExtractPublicIdFromUrl(imageUrl);
                if (string.IsNullOrEmpty(publicId))
                    return true;

                return await DeleteFileAsync(publicId);
            }
            catch (Exception ex)
            {
                // Log error but don't throw - we don't want to fail the update if old image deletion fails
                Console.WriteLine($"Warning: Could not delete old image: {ex.Message}");
                return false;
            }
        }

        private string ExtractPublicIdFromUrl(string imageUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(imageUrl) || !imageUrl.Contains("cloudinary.com"))
                    return string.Empty;

                // Extract public ID from Cloudinary URL
                // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
                var uri = new Uri(imageUrl);
                var pathSegments = uri.AbsolutePath.Split('/');
                
                // Find the public ID (usually after /upload/ or /upload/v{version}/)
                for (int i = 0; i < pathSegments.Length; i++)
                {
                    if (pathSegments[i] == "upload" && i + 1 < pathSegments.Length)
                    {
                        var nextSegment = pathSegments[i + 1];
                        // Skip version if present (starts with 'v' followed by digits)
                        if (nextSegment.StartsWith("v") && nextSegment.Length > 1 && char.IsDigit(nextSegment[1]))
                        {
                            if (i + 2 < pathSegments.Length)
                            {
                                var publicIdWithExtension = pathSegments[i + 2];
                                // Remove file extension
                                var lastDotIndex = publicIdWithExtension.LastIndexOf('.');
                                return lastDotIndex > 0 ? publicIdWithExtension.Substring(0, lastDotIndex) : publicIdWithExtension;
                            }
                        }
                        else
                        {
                            // Remove file extension
                            var lastDotIndex = nextSegment.LastIndexOf('.');
                            return lastDotIndex > 0 ? nextSegment.Substring(0, lastDotIndex) : nextSegment;
                        }
                        break;
                    }
                }

                return string.Empty;
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }
    }
}
