using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GreenChargerAPI.Models;
using GreenChargerAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Services;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SliderController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly CloudinaryService _cloudinaryService;

        public SliderController(IUnitOfWork unitOfWork, CloudinaryService cloudinaryService)
        {
            _unitOfWork = unitOfWork;
            _cloudinaryService = cloudinaryService;
        }

        // GET: api/slider
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Slider>>> GetSliders()
        {
            var sliders = await _unitOfWork.Sliders.GetAllAsync();
            return Ok(sliders);
        }        // GET: api/slider/admin
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Slider>>> GetAllSliders()
        {
            var sliders = await _unitOfWork.Sliders.GetAllAsync();
            return Ok(sliders);
        }

        // GET: api/slider/active
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<Slider>>> GetActiveSliders()
        {
            var sliders = await _unitOfWork.Sliders.GetAllAsync();
            var now = DateTime.UtcNow;
            
            var activeSliders = sliders
                .Where(s => s.IsActive && s.StartDate <= now && s.EndDate >= now)
                .OrderBy(s => s.DisplayOrder)
                .ToList();

            return Ok(activeSliders);
        }

        // GET: api/slider/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Slider>> GetSlider(int id)
        {
            var slider = await _unitOfWork.Sliders.GetByIdAsync(id);
            if (slider == null)
            {
                return NotFound();
            }
            return Ok(slider);
        }

        // POST: api/slider
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Slider>> CreateSlider([FromBody] Slider slider)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (slider.StartDate >= slider.EndDate)
                return BadRequest("End date must be after start date");

            slider.CreatedAt = DateTime.UtcNow;
            await _unitOfWork.Sliders.AddAsync(slider);
            await _unitOfWork.CompleteAsync();

            return CreatedAtAction(nameof(GetSlider), new { id = slider.Id }, slider);
        }
        
        // PUT: api/slider/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSlider(int id, [FromBody] Slider slider)
        {
            if (id != slider.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (slider.StartDate >= slider.EndDate)
                return BadRequest("End date must be after start date");

            var existingSlider = await _unitOfWork.Sliders.GetByIdAsync(id);
            if (existingSlider == null)
                return NotFound();

            // Delete old image if URL is changing
            if (!string.IsNullOrEmpty(existingSlider.ImageUrl) && 
                existingSlider.ImageUrl != slider.ImageUrl)
            {
                await _cloudinaryService.DeleteFileByUrlAsync(existingSlider.ImageUrl);
            }

            slider.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Sliders.Update(slider);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // DELETE: api/slider/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSlider(int id)
        {
            var slider = await _unitOfWork.Sliders.GetByIdAsync(id);
            if (slider == null)
                return NotFound();

            // Delete image if exists
            if (!string.IsNullOrEmpty(slider.ImageUrl))
            {
                await _cloudinaryService.DeleteFileByUrlAsync(slider.ImageUrl);
            }

            _unitOfWork.Sliders.Remove(slider);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // PUT: api/slider/5/status
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSliderStatus(int id, [FromBody] bool isActive)
        {
            var slider = await _unitOfWork.Sliders.GetByIdAsync(id);
            if (slider == null)
                return NotFound();

            slider.IsActive = isActive;
            slider.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Sliders.Update(slider);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // PUT: api/slider/5/order
        [HttpPut("{id}/order")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSliderOrder(int id, [FromBody] int displayOrder)
        {
            var slider = await _unitOfWork.Sliders.GetByIdAsync(id);
            if (slider == null)
                return NotFound();

            slider.DisplayOrder = displayOrder;
            slider.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Sliders.Update(slider);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // POST: api/slider/upload-image
        [HttpPost("upload-image")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var url = await _cloudinaryService.UploadFileAsync(file);
            return Ok(new { url });
        }

        // POST: api/slider/{id}/upload-image
        [HttpPost("{id}/upload-image")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadSliderImage(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var slider = await _unitOfWork.Sliders.GetByIdAsync(id);
            if (slider == null)
                return NotFound();

            // Delete old image if exists
            if (!string.IsNullOrEmpty(slider.ImageUrl))
            {
                await _cloudinaryService.DeleteFileByUrlAsync(slider.ImageUrl);
            }

            var url = await _cloudinaryService.UploadFileAsync(file);
            
            slider.ImageUrl = url;
            slider.UpdatedAt = DateTime.UtcNow;
            
            _unitOfWork.Sliders.Update(slider);
            await _unitOfWork.CompleteAsync();

            return Ok(new { url });
        }

        // POST: api/slider/update-dates/{id} - Temporary endpoint to fix dates
        [HttpPost("update-dates/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSliderDates(int id)
        {
            var slider = await _unitOfWork.Sliders.GetByIdAsync(id);
            if (slider == null)
                return NotFound();

            // Update dates to current year
            slider.StartDate = new DateTime(2025, 6, 1);
            slider.EndDate = new DateTime(2025, 12, 31, 23, 59, 59);
            slider.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Sliders.Update(slider);
            await _unitOfWork.CompleteAsync();

            return Ok(slider);
        }
    }
}