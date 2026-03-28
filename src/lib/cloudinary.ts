import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

/**
 * Upload ảnh lên Cloudinary
 * @param fileStr - Đường dẫn file, base64 hoặc URL
 * @param folder - Thư mục lưu trữ trên Cloudinary
 */
export const uploadImage = async (fileStr: string, folder: string) => {
  try {
    const result = await cloudinary.uploader.upload(fileStr, {
      folder: `food-rescue/${folder}`,
      resource_type: "auto",
    })
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error("Cloudinary Upload Error:", error)
    return { success: false, error: "Không thể tải ảnh lên." }
  }
}

/**
 * Xóa ảnh trên Cloudinary dựa trên publicId
 * @param publicId - ID định danh của ảnh trên Cloudinary
 */
export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return { success: result.result === "ok" }
  } catch (error) {
    console.error("Cloudinary Delete Error:", error)
    return { success: false, error: "Không thể xóa ảnh." }
  }
}

/**
 * Trích xuất publicId từ URL Cloudinary
 * @param url - URL đầy đủ của ảnh
 */
export const getPublicIdFromUrl = (url: string) => {
  try {
    const parts = url.split("/")
    const fileName = parts.pop() || ""
    const publicIdWithExtension = fileName.split(".")[0]

    // Tìm phần folder trong URL (nếu có)
    const folderIndex = parts.indexOf("food-rescue")
    if (folderIndex !== -1) {
      const folderPath = parts.slice(folderIndex).join("/")
      return `${folderPath}/${publicIdWithExtension}`
    }

    return publicIdWithExtension
  } catch (error) {
    return null
  }
}
