using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Interfaces;
using GreenChargerAPI.Models;
using GreenChargerAPI.Models.DTOs;
using AutoMapper;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AddressController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMapper _mapper;

        public AddressController(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
            _mapper = mapper;
        }

        // GET: api/Address
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Address>>> GetAddresses()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var addresses = await _unitOfWork.Addresses
                .GetAllAsync(a => a.UserId == user.Id && a.IsActive);

            return Ok(addresses.OrderByDescending(a => a.IsDefault).ThenBy(a => a.FullName));
        }

        // GET: api/Address/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AddressDto>> GetAddress(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var address = await _unitOfWork.Addresses
                .GetByIdAsync(id);

            if (address == null || address.UserId != userId)
                return NotFound();

            return Ok(_mapper.Map<AddressDto>(address));
        }

                // POST: api/Address
        [HttpPost]
        public async Task<ActionResult<AddressDto>> CreateAddress(CreateAddressDto createDto)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var address = _mapper.Map<Address>(createDto);
            address.UserId = userId;

            // Nếu đây là địa chỉ mặc định, cập nhật các địa chỉ khác
            if (address.IsDefault)
            {
                var existingDefaults = await _unitOfWork.Addresses
                    .GetAllAsync(a => a.UserId == userId && a.IsDefault);
                
                foreach (var existingDefault in existingDefaults)
                {
                    existingDefault.IsDefault = false;
                    _unitOfWork.Addresses.Update(existingDefault);
                }
            }

            await _unitOfWork.Addresses.AddAsync(address);
            await _unitOfWork.CompleteAsync();

            return CreatedAtAction(nameof(GetAddress), new { id = address.Id }, _mapper.Map<AddressDto>(address));
        }

                // PUT: api/Address/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAddress(int id, UpdateAddressDto updateDto)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var address = await _unitOfWork.Addresses.GetByIdAsync(id);
            if (address == null || address.UserId != userId)
                return NotFound();

            _mapper.Map(updateDto, address);
            address.UpdatedAt = DateTime.UtcNow;

            // Nếu đây là địa chỉ mặc định, cập nhật các địa chỉ khác
            if (address.IsDefault)
            {
                var existingDefaults = await _unitOfWork.Addresses
                    .GetAllAsync(a => a.UserId == userId && a.IsDefault && a.Id != id);
                
                foreach (var existingDefault in existingDefaults)
                {
                    existingDefault.IsDefault = false;
                    _unitOfWork.Addresses.Update(existingDefault);
                }
            }

            _unitOfWork.Addresses.Update(address);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

                // DELETE: api/Address/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var address = await _unitOfWork.Addresses.GetByIdAsync(id);
            if (address == null || address.UserId != userId)
                return NotFound();

            // Soft delete
            address.IsActive = false;
            address.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Addresses.Update(address);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        // PUT: api/Address/5/set-default
        [HttpPut("{id}/set-default")]
        public async Task<IActionResult> SetDefaultAddress(int id)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var address = await _unitOfWork.Addresses.GetByIdAsync(id);
            if (address == null || address.UserId != userId)
                return NotFound();

            // Cập nhật các địa chỉ mặc định khác
            var existingDefaults = await _unitOfWork.Addresses
                .GetAllAsync(a => a.UserId == userId && a.IsDefault);

            foreach (var existingDefault in existingDefaults)
            {
                existingDefault.IsDefault = false;
                _unitOfWork.Addresses.Update(existingDefault);
            }

            // Đặt địa chỉ hiện tại làm mặc định
            address.IsDefault = true;
            address.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Addresses.Update(address);

            await _unitOfWork.CompleteAsync();

            return NoContent();
        }
    }
}