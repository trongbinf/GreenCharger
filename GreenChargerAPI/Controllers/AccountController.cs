using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using GreenChargerAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using GreenChargerAPI.Models.DTOs;
using GreenChargerAPI.Services;
using System.Web;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Caching.Memory;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GreenChargerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _cache;
        private readonly RoleManager<IdentityRole> _roleManager;

        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            IEmailService emailService,
            IMemoryCache cache,
            RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _emailService = emailService;
            _cache = cache;
            _roleManager = roleManager;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = new ApplicationUser 
            { 
                UserName = model.Email, 
                Email = model.Email,          
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (!string.IsNullOrEmpty(model.FullName))
            {
                var names = model.FullName.Split(' ', 2);
                user.FirstName = names.FirstOrDefault() ?? string.Empty;
                user.LastName = names.Length > 1 ? names[1] : string.Empty;
            }

            if (!string.IsNullOrEmpty(model.PhoneNumber))
            {
                user.PhoneNumber = model.PhoneNumber;
            }

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                // Tạo token xác nhận email
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                Console.WriteLine($"[Register] Token: {token}");
                
                var confirmLink = $"http://localhost:4200/confirm-email?email={System.Web.HttpUtility.UrlEncode(user.Email)}&token={System.Web.HttpUtility.UrlEncode(token)}";
                // var confirmLink = $"http://localhost:4200/confirm-email?email={System.Web.HttpUtility.UrlEncode(user.Email)}&token={System.Web.HttpUtility.UrlEncode(token)}";

                // Gửi email xác nhận
                await _emailService.SendRegistrationEmailAsync(user.Email ?? "", confirmLink);

                // Gán role cho tài khoản mới
                string role = !string.IsNullOrEmpty(model.Role) ? model.Role : "User";
                
                // Đảm bảo role tồn tại
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new IdentityRole(role));
                }
                
                // Gán role cho user
                var roleResult = await _userManager.AddToRoleAsync(user, role);
                if (!roleResult.Succeeded)
                {
                    return BadRequest(new { message = "Không thể gán quyền cho tài khoản", errors = roleResult.Errors });
                }

                // Thêm role claim thủ công để đảm bảo
                await _userManager.AddClaimAsync(user, new Claim(ClaimTypes.Role, role));

                return Ok(new { message = "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản." });
            }
            else
            {
                return BadRequest(result.Errors);
            }
        }

        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(string email, string token)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
                return BadRequest(new { message = "Thiếu thông tin xác nhận" });

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return BadRequest(new { message = "Không tìm thấy người dùng" });

            if (user.EmailConfirmed)
                return BadRequest(new { message = "Email đã được xác nhận trước đó" });

            var fixedToken = token.Replace(' ', '+');
            var result = await _userManager.ConfirmEmailAsync(user, fixedToken);
            if (result.Succeeded)
                return Ok(new { message = "Xác nhận email thành công" });

            return BadRequest(new { message = "Xác nhận email thất bại", errors = result.Errors });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return Unauthorized(new { message = "Thông tin đăng nhập không hợp lệ" });

            if (!await _userManager.IsEmailConfirmedAsync(user))
                return Unauthorized(new { message = "Vui lòng xác nhận email trước khi đăng nhập" });

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
                return Unauthorized(new { success = false, message = "Thông tin đăng nhập không hợp lệ" });

            // Tạo JWT token
            var token = await GenerateJwtToken(user);
            
            // Lấy thông tin người dùng để trả về
            var roles = await _userManager.GetRolesAsync(user);
            var userInfo = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                
                
                EmailConfirmed = user.EmailConfirmed,
                Roles = roles.ToList(),
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
            
            // Trả về cả token và thông tin người dùng
            return Ok(new { success = true, token, user = userInfo });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return BadRequest(new { message = "Email chưa được đăng ký." });

            // Chỉ cho phép quên mật khẩu nếu email đã xác nhận
            if (!await _userManager.IsEmailConfirmedAsync(user))
                return BadRequest(new { message = "Email chưa xác nhận, vui lòng xác nhận email trước khi đặt lại mật khẩu." });

            // Throttle: chỉ cho phép gửi lại sau 2 phút
            var cacheKey = $"forgotpw_{user.Email}";
            if (_cache.TryGetValue(cacheKey, out _))
            {
                return BadRequest(new { message = "Bạn chỉ có thể gửi lại yêu cầu sau 2 phút." });
            }
            _cache.Set(cacheKey, true, TimeSpan.FromMinutes(2));

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetLink = $"http://localhost:4200/reset-password?email={HttpUtility.UrlEncode(user.Email)}&token={HttpUtility.UrlEncode(token)}";

            await _emailService.SendPasswordResetEmailAsync(user.Email ?? "", resetLink);

            return Ok(new { message = "Nếu email của bạn đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return BadRequest(new { message = "Yêu cầu không hợp lệ" });

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
            if (result.Succeeded)
                return Ok(new { message = "Mật khẩu đã được đặt lại thành công" });

            return BadRequest(new { message = "Token không hợp lệ hoặc đặt lại mật khẩu thất bại" });
        }

        [HttpGet("check-email-status")]
        public async Task<IActionResult> CheckEmailStatus([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest(new { success = false, message = "Thiếu email" });

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return Ok(new { exists = false, message = "Email chưa được đăng ký" });

            return Ok(new { exists = true, message = "Email đã tồn tại trong hệ thống" });
        }

        [HttpPost("resend-confirmation")]
        public async Task<IActionResult> ResendConfirmation([FromBody] ForgotPasswordModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return BadRequest(new { message = "Email chưa được đăng ký." });

            if (user.EmailConfirmed)
                return BadRequest(new { message = "Email đã được xác nhận trước đó." });

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var confirmLink = $"http://localhost:4200/confirm-email?email={System.Web.HttpUtility.UrlEncode(user.Email)}&token={System.Web.HttpUtility.UrlEncode(token)}";
            await _emailService.SendRegistrationEmailAsync(user.Email ?? "", confirmLink);

            return Ok(new { message = "Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư." });
        }

        [HttpGet("users")]
        
        public IActionResult GetUsers()
        {
            var users = _userManager.Users.ToList();
            var dtos = users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email ?? "",
                FirstName = u.FirstName,
                LastName = u.LastName,
                
                
                EmailConfirmed = u.EmailConfirmed,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            });
            return Ok(dtos);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            // Get the current authenticated user
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            var roles = await _userManager.GetRolesAsync(user);
            if (user == null) return NotFound();

            var dto = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                
                
                EmailConfirmed = user.EmailConfirmed,
                Roles = roles.ToList(),
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
            return Ok(dto);
        }
        
        [HttpGet("users/{id}")]
      
        public async Task<IActionResult> GetUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            var roles = await _userManager.GetRolesAsync(user);
            if (user == null) return NotFound();
            var dto = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                
                
                EmailConfirmed = user.EmailConfirmed,
                Roles = roles.ToList(),
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
            return Ok(dto);
        }

        [HttpPut("users/{id}")]
       
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UserUpdateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = await _userManager.FindByIdAsync(id);
            var roles = await _userManager.GetRolesAsync(user);
                if (user == null) return NotFound();
                
                Console.WriteLine($"Updating user {id}: {JsonSerializer.Serialize(dto)}");
                Console.WriteLine($"Current phone: {user.PhoneNumber}, New phone: {dto.PhoneNumber}");
                
                // Update name
                var names = (dto.FullName ?? "").Split(' ', 2);
                user.FirstName = names.FirstOrDefault() ?? "";
                user.LastName = names.Length > 1 ? names[1] : "";
                
                // Update phone number if provided
                if (dto.PhoneNumber != null)
                {
                    user.PhoneNumber = dto.PhoneNumber;
                    Console.WriteLine($"Setting phone number to: {dto.PhoneNumber}");
                }
                
                user.UpdatedAt = DateTime.UtcNow;
                var result = await _userManager.UpdateAsync(user);
                
                if (!result.Succeeded)
                {
                    Console.WriteLine($"User update failed: {JsonSerializer.Serialize(result.Errors)}");
                    return BadRequest(new { message = "Không thể cập nhật thông tin người dùng", errors = result.Errors });
                }
                
                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateUser: {ex}");
                return BadRequest(new { message = "Lỗi khi cập nhật thông tin người dùng", error = ex.Message });
            }
        }

        [HttpPost("users/{id}/lock")]
       
        public async Task<IActionResult> LockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            var roles = await _userManager.GetRolesAsync(user);
            if (user == null) return NotFound();
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            return Ok(new { message = "Đã khóa tài khoản" });
        }

        [HttpPost("users/{id}/unlock")]
       
        public async Task<IActionResult> UnlockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            var roles = await _userManager.GetRolesAsync(user);
            if (user == null) return NotFound();
            await _userManager.SetLockoutEndDateAsync(user, null);
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            return Ok(new { message = "Đã mở khóa tài khoản" });
        }

        [HttpGet("roles")]
        public IActionResult GetRoles()
        {
            var roles = _roleManager.Roles.Select(r => r.Name).ToList();
            return Ok(roles);
        }

        [HttpPost("users/{id}/role")]
     
        public async Task<IActionResult> UpdateUserRole(string id, [FromBody] JsonElement body)
        {
            try 
            {
                string role = "";
                
                // Try to get the Role property first (Pascal case for C#)
                if (body.TryGetProperty("Role", out JsonElement roleElement))
                {
                    role = roleElement.GetString() ?? "";
                }
                // Fallback to role property (camel case from JavaScript)
                else if (body.TryGetProperty("role", out roleElement))
                {
                    role = roleElement.GetString() ?? "";
                }
                
                if (string.IsNullOrEmpty(role))
                {
                    return BadRequest(new { message = "Vai trò không được cung cấp hoặc không hợp lệ" });
                }
                
                var user = await _userManager.FindByIdAsync(id);
            var roles = await _userManager.GetRolesAsync(user);
                if (user == null) return NotFound();
                
                // Validate that the role exists
                var roleExists = await _roleManager.RoleExistsAsync(role);
                if (!roleExists)
                {
                    return BadRequest(new { message = $"Vai trò '{role}' không tồn tại" });
                }
                
                var currentRoles = await _userManager.GetRolesAsync(user);
                
                // Remove all current roles and their claims
                if (currentRoles.Any())
                {
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                    // Remove old role claims
                    var userClaims = await _userManager.GetClaimsAsync(user);
                    var roleClaims = userClaims.Where(c => c.Type == ClaimTypes.Role).ToList();
                    if (roleClaims.Any())
                    {
                        await _userManager.RemoveClaimsAsync(user, roleClaims);
                    }
                }
                
                // Add new role
                var result = await _userManager.AddToRoleAsync(user, role);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = "Không thể cập nhật vai trò", errors = result.Errors });
                }
                
                // Add role claim to ensure it exists
                await _userManager.AddClaimAsync(user, new Claim(ClaimTypes.Role, role));
                
                user.UpdatedAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);
                
                return Ok(new { message = "Cập nhật quyền thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi cập nhật vai trò", error = ex.Message });
            }
        }

        [HttpPut("update-profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UserUpdateDto model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var user = await _userManager.FindByIdAsync(userId);
            var roles = await _userManager.GetRolesAsync(user);
                if (user == null) return NotFound(new { message = "User not found" });
                
                // Update name if provided
                if (!string.IsNullOrEmpty(model.FullName))
                {
                    var names = model.FullName.Split(' ', 2);
                    user.FirstName = names.FirstOrDefault() ?? "";
                    user.LastName = names.Length > 1 ? names[1] : "";
                }
                
                // Update phone number if provided
                if (model.PhoneNumber != null)
                {
                    user.PhoneNumber = model.PhoneNumber;
                }
                
                user.UpdatedAt = DateTime.UtcNow;
                var result = await _userManager.UpdateAsync(user);
                
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = "Không thể cập nhật thông tin người dùng", errors = result.Errors });
                }
                
                return Ok(new { message = "Cập nhật thông tin thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi cập nhật thông tin người dùng", error = ex.Message });
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            var roles = await _userManager.GetRolesAsync(user);
            if (user == null) return NotFound(new { message = "User not found" });
            
            // Kiểm tra mật khẩu hiện tại
            if (!(await _userManager.CheckPasswordAsync(user, model.CurrentPassword)))
            {
                return BadRequest(new { message = "CURRENT_PASSWORD_INCORRECT" });
            }

            // Kiểm tra mật khẩu mới có giống mật khẩu cũ không
            if (await _userManager.CheckPasswordAsync(user, model.NewPassword))
            {
                return BadRequest(new { message = "NEW_PASSWORD_SAME_AS_OLD" });
            }

            // Thay đổi mật khẩu
            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to change password", errors = result.Errors });
            }

            return Ok(new { message = "Password changed successfully" });
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? "supersecretkey1234567890";
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            // Lấy các roles của user và thêm vào claims
            var userRoles = await _userManager.GetRolesAsync(user);
            
            // Lấy các claims hiện tại của user
            var userClaims = await _userManager.GetClaimsAsync(user);
            
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };
            
            // Thêm claims về role từ roles
            foreach (var role in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
            
            // Thêm các claims khác của user (bao gồm role claims nếu có)
            foreach (var claim in userClaims)
            {
                // Tránh duplicate role claims
                if (claim.Type == ClaimTypes.Role && !claims.Any(c => c.Type == ClaimTypes.Role && c.Value == claim.Value))
                {
                    claims.Add(new Claim(claim.Type, claim.Value));
                }
                else if (claim.Type != ClaimTypes.Role)
                {
                    claims.Add(new Claim(claim.Type, claim.Value));
                }
            }

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class RegisterModel
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public required string Password { get; set; }

        [Compare("Password")]
        public required string ConfirmPassword { get; set; }

        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Role { get; set; }
    }

    public class LoginModel
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        public required string Password { get; set; }
    }

    public class ForgotPasswordModel
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
    }

    public class ResetPasswordModel
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        public required string Token { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public required string NewPassword { get; set; }

        [Compare("NewPassword")]
        public required string ConfirmPassword { get; set; }
    }

    public class ChangePasswordModel
    {
        [Required]
        public required string CurrentPassword { get; set; }
        
        [Required]
        [StringLength(100, MinimumLength = 6)]
        public required string NewPassword { get; set; }
    }

    public class UserUpdateDto
    {
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
    }
}