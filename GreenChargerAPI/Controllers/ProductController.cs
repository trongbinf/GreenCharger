using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GreenChargerAPI.Models;
using GreenChargerAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.IO;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using GreenChargerAPI.Services;
using GreenChargerAPI.Helpers;
using System.Linq;
using AutoMapper;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly CloudinaryService _cloudinaryService;
        private readonly IMapper _mapper;

        public ProductController(IUnitOfWork unitOfWork, IMapper mapper, CloudinaryService cloudinaryService)
        {
            _unitOfWork = unitOfWork;
            _cloudinaryService = cloudinaryService;
            _mapper = mapper;
        }

        // GET: api/product
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var products = await _unitOfWork.Products.GetAllAsync(
                null,
                q => q.Include(p => p.Category!)
            );
            var dtos = _mapper.Map<IEnumerable<ProductDto>>(products);
            return Ok(dtos);
        }

        // GET: api/product/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(
                id,
                q => q.Include(p => p.Category!)
            );
            if (product == null) return NotFound();
            var dto = _mapper.Map<ProductDto>(product);
            return Ok(dto);
        }

        // POST: api/product
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] Product product)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            product.Category = await _unitOfWork.Categories.GetByIdAsync(product.CategoryId);

            product.CreatedAt = DateTime.UtcNow;
            await _unitOfWork.Products.AddAsync(product);
            await _unitOfWork.CompleteAsync();

            var dto = _mapper.Map<ProductDto>(product);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, dto);
        }

        // PUT: api/product/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product product)
        {
            if (id != product.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingProduct = await _unitOfWork.Products.GetByIdAsync(id);
            if (existingProduct == null)
                return NotFound();

            // Delete old main image if URL is changing
            if (!string.IsNullOrEmpty(existingProduct.MainImageUrl) && 
                existingProduct.MainImageUrl != product.MainImageUrl)
            {
                await _cloudinaryService.DeleteFileByUrlAsync(existingProduct.MainImageUrl);
            }

            // Delete old detail images if URLs are changing
            if (existingProduct.DetailImageUrls != null && existingProduct.DetailImageUrls.Any())
            {
                var newDetailUrls = product.DetailImageUrls ?? new List<string>();

                // Delete images that are no longer in the new list
                foreach (var oldUrl in existingProduct.DetailImageUrls)
                {
                    if (!string.IsNullOrWhiteSpace(oldUrl) && !newDetailUrls.Contains(oldUrl))
                    {
                        await _cloudinaryService.DeleteFileByUrlAsync(oldUrl);
                    }
                }
            }

            // Cập nhật từng property
            existingProduct.Name = product.Name;
            existingProduct.Description = product.Description;
            existingProduct.Price = product.Price;
            existingProduct.Discount = product.Discount;
            existingProduct.StockQuantity = product.StockQuantity;
            existingProduct.MainImageUrl = product.MainImageUrl;
            existingProduct.DetailImageUrls = product.DetailImageUrls ?? new List<string>();
            existingProduct.CategoryId = product.CategoryId;
            existingProduct.Category = await _unitOfWork.Categories.GetByIdAsync(product.CategoryId);
            existingProduct.IsActive = product.IsActive;
            existingProduct.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Products.Update(existingProduct);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // DELETE: api/product/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(id);
            if (product == null) return NotFound();

            // Delete main image if exists
            if (!string.IsNullOrEmpty(product.MainImageUrl))
            {
                await _cloudinaryService.DeleteFileByUrlAsync(product.MainImageUrl);
            }

            // Delete detail images if exist
            if (product.DetailImageUrls != null && product.DetailImageUrls.Any())
            {
                foreach (var imageUrl in product.DetailImageUrls)
                {
                    if (!string.IsNullOrWhiteSpace(imageUrl))
                    {
                        await _cloudinaryService.DeleteFileByUrlAsync(imageUrl);
                    }
                }
            }

            _unitOfWork.Products.Remove(product);
            await _unitOfWork.CompleteAsync();
            return NoContent();
        }

        // GET: api/product/category/5
        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProductsByCategory(int categoryId)
        {
            var products = await _unitOfWork.Products.GetAllAsync(
                p => p.CategoryId == categoryId,
                q => q.Include(p => p.Category!)
            );
            var dtos = _mapper.Map<IEnumerable<ProductDto>>(products);
            return Ok(dtos);
        }

        // POST: api/product/upload-main-image
        [HttpPost("upload-main-image")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadMainImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var url = await _cloudinaryService.UploadFileAsync(file);
            return Ok(new { url });
        }

        // POST: api/product/upload-detail-images
        [HttpPost("upload-detail-images")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadDetailImages(List<IFormFile> files)
        {
            if (files == null || !files.Any())
                return BadRequest("No files uploaded");

            var urls = new List<string>();
            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var url = await _cloudinaryService.UploadFileAsync(file);
                    urls.Add(url);
                }
            }

            return Ok(new { urls });
        }

        // PATCH: api/product/5/status
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] bool status)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(id);
            if (product == null)
                return NotFound();

            product.IsActive = status;
            product.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Products.Update(product);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // GET: api/product/search?q=query
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(Array.Empty<ProductDto>());

            var allProducts = await _unitOfWork.Products.GetAllAsync(
                null,
                query => query.Include(p => p.Category!)
            );

            var searchResults = allProducts
                .Where(p => 
                    // Check normalized Vietnamese names and descriptions
                    p.Name.ContainsIgnoreDiacritics(q) ||
                    (p.Description != null && p.Description.ContainsIgnoreDiacritics(q)) ||
                    (p.Category != null && p.Category.Name.ContainsIgnoreDiacritics(q)) ||
                    // Also check original strings
                    p.Name.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                    (p.Description != null && p.Description.Contains(q, StringComparison.OrdinalIgnoreCase)) ||
                    (p.Category != null && p.Category.Name.Contains(q, StringComparison.OrdinalIgnoreCase))
                )
                .ToList();

            var dtos = _mapper.Map<IEnumerable<ProductDto>>(searchResults);
            return Ok(dtos);
        }

        // POST: api/product/{id}/upload-image
        [HttpPost("{id}/upload-image")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadProductImage(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var product = await _unitOfWork.Products.GetByIdAsync(id);
            if (product == null)
                return NotFound();

            // Delete old image if exists
            if (!string.IsNullOrEmpty(product.MainImageUrl))
            {
                await _cloudinaryService.DeleteFileByUrlAsync(product.MainImageUrl);
            }

            var url = await _cloudinaryService.UploadFileAsync(file);
            
            product.MainImageUrl = url;
            product.UpdatedAt = DateTime.UtcNow;
            
            _unitOfWork.Products.Update(product);
            await _unitOfWork.CompleteAsync();

            return Ok(new { url });
        }
    }
}