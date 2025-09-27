using AutoMapper;
using GreenChargerAPI.Models;
using GreenChargerAPI.Models.DTOs;
using GreenChargerAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ProductController(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        // GET: api/product
        [HttpGet]
        public async Task<ActionResult<List<ProductDto>>> GetProducts()
        {
            var products = await _unitOfWork.Products.GetAllAsync(includeProperties: q => q.Include(p => p.Category));
            var productDtos = _mapper.Map<List<ProductDto>>(products);
            
            // Map additional fields for frontend compatibility
            foreach (var dto in productDtos)
            {
                dto.QuantityInStock = dto.StockQuantity;
                dto.FinalPrice = dto.Discount > 0 ? dto.Price * (1 - dto.Discount / 100) : dto.Price;
                dto.DiscountPrice = dto.Discount > 0 ? dto.Price - dto.FinalPrice : null;
                dto.ImageUrls = dto.DetailImageUrls;
                dto.IsNew = (DateTime.UtcNow - dto.CreatedAt).Days <= 30;
                dto.IsOnSale = dto.Discount > 0;
                dto.IsFeatured = dto.AverageRating >= 4.0;
            }
            
            return Ok(productDtos);
        }

        // GET: api/product/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetById(int id)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(id, includeProperties: q => q.Include(p => p.Category));
            if (product == null) return NotFound();
            
            var dto = _mapper.Map<ProductDto>(product);
            
            // Map additional fields for frontend compatibility
            dto.QuantityInStock = dto.StockQuantity;
            dto.FinalPrice = dto.Discount > 0 ? dto.Price * (1 - dto.Discount / 100) : dto.Price;
            dto.DiscountPrice = dto.Discount > 0 ? dto.Price - dto.FinalPrice : null;
            dto.ImageUrls = dto.DetailImageUrls;
            dto.IsNew = (DateTime.UtcNow - dto.CreatedAt).Days <= 30;
            dto.IsOnSale = dto.Discount > 0;
            dto.IsFeatured = dto.AverageRating >= 4.0;
            
            return Ok(dto);
        }

        // POST: api/product
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] ProductCreateDto productDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var product = new Product
            {
                Name = productDto.Name,
                Description = productDto.Description,
                Price = productDto.Price,
                Discount = productDto.Discount,
                StockQuantity = productDto.StockQuantity,
                // Xử lý null values - cho phép null
                MainImageUrl = productDto.MainImageUrl ?? "",
                DetailImageUrls = productDto.DetailImageUrls ?? new List<string>(),
                CategoryId = productDto.CategoryId,
                IsActive = productDto.IsActive,
                CreatedAt = DateTime.UtcNow,
                OrderDetails = new List<OrderDetail>()
            };

            await _unitOfWork.Products.AddAsync(product);
            await _unitOfWork.CompleteAsync();

            // Load product with category for response
            var createdProduct = await _unitOfWork.Products.GetByIdAsync(product.Id, includeProperties: q => q.Include(p => p.Category));
            var resultDto = _mapper.Map<ProductDto>(createdProduct);
            
            // Map additional fields for frontend compatibility
            resultDto.QuantityInStock = resultDto.StockQuantity;
            resultDto.FinalPrice = resultDto.Discount > 0 ? resultDto.Price * (1 - resultDto.Discount / 100) : resultDto.Price;
            resultDto.DiscountPrice = resultDto.Discount > 0 ? resultDto.Price - resultDto.FinalPrice : null;
            resultDto.ImageUrls = resultDto.DetailImageUrls;
            resultDto.IsNew = (DateTime.UtcNow - resultDto.CreatedAt).Days <= 30;
            resultDto.IsOnSale = resultDto.Discount > 0;
            resultDto.IsFeatured = resultDto.AverageRating >= 4.0;
            
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, resultDto);
        }

        // POST: api/product/upload-main-image
        [HttpPost("upload-main-image")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ImageUploadResponse>> UploadMainImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            if (file.Length > 5 * 1024 * 1024) // 5MB limit
                return BadRequest("File size exceeds 5MB limit");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest("Invalid file type. Only JPG, JPEG, PNG, GIF, and WebP are allowed");

            try
            {
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine("wwwroot", "images", "products", "main", fileName);
                
                // Ensure directory exists
                Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);
                
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"/images/products/main/{fileName}";
                return Ok(new ImageUploadResponse 
                { 
                    ImageUrl = imageUrl,
                    FileName = fileName,
                    FileSize = file.Length,
                    Message = "Main image uploaded successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error uploading file: {ex.Message}");
            }
        }

        // POST: api/product/upload-detail-images
        [HttpPost("upload-detail-images")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ImageUploadResponse>> UploadDetailImages(List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded");

            if (files.Count > 10)
                return BadRequest("Maximum 10 detail images allowed");

            var uploadedUrls = new List<string>();
            var errors = new List<string>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                if (file.Length > 5 * 1024 * 1024) // 5MB limit
                {
                    errors.Add($"File {file.FileName} exceeds 5MB limit");
                    continue;
                }

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    errors.Add($"File {file.FileName} has invalid type");
                    continue;
                }

                try
                {
                    var fileName = $"{Guid.NewGuid()}{fileExtension}";
                    var filePath = Path.Combine("wwwroot", "images", "products", "details", fileName);
                    
                    // Ensure directory exists
                    Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);
                    
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var imageUrl = $"/images/products/details/{fileName}";
                    uploadedUrls.Add(imageUrl);
                }
                catch (Exception ex)
                {
                    errors.Add($"Error uploading {file.FileName}: {ex.Message}");
                }
            }

            return Ok(new ImageUploadResponse 
            { 
                ImageUrls = uploadedUrls,
                Message = $"Uploaded {uploadedUrls.Count} images successfully",
                Errors = errors
            });
        }

        // PATCH: api/product/{id}/images - Cập nhật ảnh cho sản phẩm
        [HttpPatch("{id}/images")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProductDto>> UpdateProductImages(int id, [FromBody] ProductImageUploadDto imageDto)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(id, includeProperties: q => q.Include(p => p.Category));
            if (product == null) return NotFound();

            // Cập nhật ảnh chính
            if (!string.IsNullOrEmpty(imageDto.MainImageUrl))
            {
                product.MainImageUrl = imageDto.MainImageUrl;
            }

            // Cập nhật ảnh phụ
            if (imageDto.DetailImageUrls != null)
            {
                product.DetailImageUrls = imageDto.DetailImageUrls;
            }

            product.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.CompleteAsync();

            var resultDto = _mapper.Map<ProductDto>(product);
            
            // Map additional fields for frontend compatibility
            resultDto.QuantityInStock = resultDto.StockQuantity;
            resultDto.FinalPrice = resultDto.Discount > 0 ? resultDto.Price * (1 - resultDto.Discount / 100) : resultDto.Price;
            resultDto.DiscountPrice = resultDto.Discount > 0 ? resultDto.Price - resultDto.FinalPrice : null;
            resultDto.ImageUrls = resultDto.DetailImageUrls;
            resultDto.IsNew = (DateTime.UtcNow - resultDto.CreatedAt).Days <= 30;
            resultDto.IsOnSale = resultDto.Discount > 0;
            resultDto.IsFeatured = resultDto.AverageRating >= 4.0;
            
            return Ok(resultDto);
        }

        // PUT: api/product/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] ProductUpdateDto productDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var product = await _unitOfWork.Products.GetByIdAsync(id, includeProperties: q => q.Include(p => p.Category));
            if (product == null) return NotFound();

            product.Name = productDto.Name;
            product.Description = productDto.Description;
            product.Price = productDto.Price;
            product.Discount = productDto.Discount ?? 0;
            product.StockQuantity = productDto.StockQuantity;
            product.MainImageUrl = productDto.MainImageUrl ?? "";
            product.DetailImageUrls = productDto.DetailImageUrls ?? new List<string>();
            product.CategoryId = productDto.CategoryId;
            product.IsActive = productDto.IsActive;
            product.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CompleteAsync();

            var resultDto = _mapper.Map<ProductDto>(product);
            
            // Map additional fields for frontend compatibility
            resultDto.QuantityInStock = resultDto.StockQuantity;
            resultDto.FinalPrice = resultDto.Discount > 0 ? resultDto.Price * (1 - resultDto.Discount / 100) : resultDto.Price;
            resultDto.DiscountPrice = resultDto.Discount > 0 ? resultDto.Price - resultDto.FinalPrice : null;
            resultDto.ImageUrls = resultDto.DetailImageUrls;
            resultDto.IsNew = (DateTime.UtcNow - resultDto.CreatedAt).Days <= 30;
            resultDto.IsOnSale = resultDto.Discount > 0;
            resultDto.IsFeatured = resultDto.AverageRating >= 4.0;
            
            return Ok(resultDto);
        }

        // DELETE: api/product/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(id);
            if (product == null) return NotFound();

            _unitOfWork.Products.Remove(product);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }
    }

    public class ImageUploadResponse
    {
        public string? ImageUrl { get; set; }
        public List<string>? ImageUrls { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<string>? Errors { get; set; }
    }
}
