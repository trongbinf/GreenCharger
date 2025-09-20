using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GreenChargerAPI.Models;
using GreenChargerAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Services;
using AutoMapper;

using GreenChargerAPI.Models.DTOs;
namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly CloudinaryService _cloudinaryService;

        public CategoryController(IUnitOfWork unitOfWork, IMapper mapper, CloudinaryService cloudinaryService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cloudinaryService = cloudinaryService;
        }  

        // GET: api/category
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _unitOfWork.Categories.GetAllAsync(
                includeProperties: q => q.Include(c => c.Products)
            );
            var dtos = _mapper.Map<IEnumerable<CategoryDto>>(categories);
            return Ok(dtos);
        }

        // GET: api/category/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id, 
                includeProperties: q => q.Include(c => c.Products));
            if (category == null) return NotFound();
            var dto = _mapper.Map<CategoryDto>(category);
            return Ok(dto);
        }

        // POST: api/category
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CategoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var category = _mapper.Map<Category>(dto);
            await _unitOfWork.Categories.AddAsync(category);
            await _unitOfWork.CompleteAsync();
            var resultDto = _mapper.Map<CategoryDto>(category);
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, resultDto);
        }

        // PUT: api/category/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryDto dto)
        {
            if (id != dto.Id)
                return BadRequest();
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            var category = await _unitOfWork.Categories.GetByIdAsync(id);
            if (category == null)
                return NotFound();

            // Delete old image if URL is changing
            if (!string.IsNullOrEmpty(category.ImageUrl) && 
                category.ImageUrl != dto.ImageUrl)
            {
                await _cloudinaryService.DeleteFileByUrlAsync(category.ImageUrl);
            }

            _mapper.Map(dto, category);
            _unitOfWork.Categories.Update(category);
            await _unitOfWork.CompleteAsync();
            return NoContent();
        }

        // DELETE: api/category/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id);
            if (category == null) return NotFound();

            // Delete image if exists
            if (!string.IsNullOrEmpty(category.ImageUrl))
            {
                await _cloudinaryService.DeleteFileByUrlAsync(category.ImageUrl);
            }

            _unitOfWork.Categories.Remove(category);
            await _unitOfWork.CompleteAsync();
            return NoContent();
        }

        // POST: api/category/upload-image
        [HttpPost("upload-image")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadImageMinio(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var url = await _cloudinaryService.UploadFileAsync(file);

            return Ok(new { url });
        }

       
    }
} 