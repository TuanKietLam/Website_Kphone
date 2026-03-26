/**
 * Script migrate dữ liệu ảnh từ cột images (JSON) sang bảng product_images
 * 
 * Chạy script này sau khi đã tạo bảng product_images:
 * node backend/scripts/migrate_product_images.js
 */

const db = require('../config/database');

async function migrateProductImages() {
  try {
    console.log('🚀 Bắt đầu migrate ảnh sản phẩm...\n');

    // Lấy tất cả sản phẩm có ảnh
    const products = await db.query(
      `SELECT id, image, images 
       FROM products 
       WHERE (image IS NOT NULL AND image != '') 
          OR (images IS NOT NULL AND images != '')`
    );

    console.log(`📦 Tìm thấy ${products.length} sản phẩm có ảnh\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Kiểm tra xem sản phẩm đã có ảnh trong product_images chưa
        const existingImages = await db.query(
          'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
          [product.id]
        );

        if (existingImages[0].count > 0) {
          console.log(`⏭️  Sản phẩm #${product.id} đã có ảnh, bỏ qua`);
          skippedCount++;
          continue;
        }

        const imagesToInsert = [];

        // 1. Thêm ảnh chính (nếu có)
        if (product.image) {
          imagesToInsert.push({
            image_url: product.image,
            is_primary: 1,
            display_order: 0
          });
        }

        // 2. Parse và thêm ảnh từ JSON array
        if (product.images) {
          try {
            const imagesArray = JSON.parse(product.images);
            if (Array.isArray(imagesArray) && imagesArray.length > 0) {
              imagesArray.forEach((imageUrl, index) => {
                // Bỏ qua ảnh đầu tiên nếu đã có ảnh chính
                if (index === 0 && product.image && imageUrl === product.image) {
                  return;
                }
                imagesToInsert.push({
                  image_url: imageUrl,
                  is_primary: imagesToInsert.length === 0 ? 1 : 0, // Set ảnh đầu làm primary nếu chưa có
                  display_order: imagesToInsert.length
                });
              });
            }
          } catch (e) {
            console.log(`⚠️  Không thể parse JSON cho sản phẩm #${product.id}: ${e.message}`);
          }
        }

        // 3. Insert vào database
        if (imagesToInsert.length > 0) {
          for (const img of imagesToInsert) {
            await db.query(
              `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
               VALUES (?, ?, ?, ?)`,
              [product.id, img.image_url, img.is_primary, img.display_order]
            );
          }
          console.log(`✅ Migrate sản phẩm #${product.id}: ${imagesToInsert.length} ảnh`);
          migratedCount++;
        } else {
          console.log(`⚠️  Sản phẩm #${product.id} không có ảnh hợp lệ`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Lỗi khi migrate sản phẩm #${product.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Tóm tắt:');
    console.log(`   ✅ Đã migrate: ${migratedCount} sản phẩm`);
    console.log(`   ⏭️  Đã bỏ qua: ${skippedCount} sản phẩm`);
    console.log(`   ❌ Lỗi: ${errorCount} sản phẩm`);
    console.log('\n✨ Hoàn thành migrate!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi migrate:', error);
    process.exit(1);
  }
}

// Chạy migration
migrateProductImages();

