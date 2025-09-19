using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using GreenChargerAPI.Models;

namespace GreenChargerAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<Slider> Sliders { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Wishlist> Wishlists { get; set; }
        public DbSet<Coupon> Coupons { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId);

            modelBuilder.Entity<OrderDetail>()
                .HasOne(od => od.Order)
                .WithMany(o => o.OrderDetails)
                .HasForeignKey(od => od.OrderId);

            modelBuilder.Entity<OrderDetail>()
                .HasOne(od => od.Product)
                .WithMany(p => p.OrderDetails)
                .HasForeignKey(od => od.ProductId);

            // Cart: thiết lập quan hệ mới, không còn Items JSON
            modelBuilder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cart>()
                .HasOne(c => c.Product)
                .WithMany()
                .HasForeignKey(c => c.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Order relationships
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasOne(o => o.User)
                      .WithMany()
                      .HasForeignKey(o => o.UserId)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(o => o.Address)
                      .WithMany()
                      .HasForeignKey(o => o.AddressId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(o => o.Coupon)
                      .WithMany(c => c.Orders)
                      .HasForeignKey(o => o.CouponId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Address relationships
            modelBuilder.Entity<Address>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Review relationships
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasOne(r => r.User)
                      .WithMany()
                      .HasForeignKey(r => r.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.Product)
                      .WithMany()
                      .HasForeignKey(r => r.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.Order)
                      .WithMany()
                      .HasForeignKey(r => r.OrderId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ReviewHelpful relationships - avoid cascade conflicts
            modelBuilder.Entity<ReviewHelpful>(entity =>
            {
                entity.HasOne(rh => rh.User)
                      .WithMany()
                      .HasForeignKey(rh => rh.UserId)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(rh => rh.Review)
                      .WithMany(r => r.ReviewHelpfuls)
                      .HasForeignKey(rh => rh.ReviewId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // CouponUsage relationships - avoid cascade conflicts
            modelBuilder.Entity<CouponUsage>(entity =>
            {
                entity.HasOne(cu => cu.User)
                      .WithMany()
                      .HasForeignKey(cu => cu.UserId)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(cu => cu.Coupon)
                      .WithMany(c => c.CouponUsages)
                      .HasForeignKey(cu => cu.CouponId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(cu => cu.Order)
                      .WithMany()
                      .HasForeignKey(cu => cu.OrderId)
                      .OnDelete(DeleteBehavior.NoAction);
            });

            // Wishlist relationships
            modelBuilder.Entity<Wishlist>()
                .HasOne(w => w.User)
                .WithMany()
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Wishlist>()
                .HasOne(w => w.Product)
                .WithMany()
                .HasForeignKey(w => w.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // Coupon configuration
            modelBuilder.Entity<Coupon>()
                .Property(c => c.Value)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Coupon>()
                .Property(c => c.MaxDiscountAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Coupon>()
                .Property(c => c.MinOrderAmount)
                .HasColumnType("decimal(18,2)");

            // Coupon relationships
            modelBuilder.Entity<Coupon>(entity =>
            {
                entity.HasOne(c => c.Category)
                      .WithMany()
                      .HasForeignKey(c => c.CategoryId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(c => c.Product)
                      .WithMany()
                      .HasForeignKey(c => c.ProductId)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasIndex(c => c.Code).IsUnique();
            });

            // Product price configuration
            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasColumnType("decimal(18,2)");

            // Order total configuration
            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OrderDetail>()
                .Property(od => od.UnitPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OrderDetail>()
                .Property(od => od.Subtotal)
                .HasColumnType("decimal(18,2)");
        }
    }
}