
const express = require("express");
const router = express.Router();
const db = require("../config/database");
router.post("/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(200).json({
        success: false,
        message: "Vui lòng nhập nội dung cần tư vấn.",
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        message: "AI chưa được cấu hình.",
      });
    }

    const products = await db.query(`
      SELECT name, price
      FROM products
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const productContext =
      products.length > 0
        ? products
            .map(
              (p) =>
                `- ${p.name} (Giá ${Number(p.price).toLocaleString(
                  "vi-VN"
                )} đ)`
            )
            .join("\n")
        : "Hiện cửa hàng chưa có sản phẩm nào.";

    const systemPrompt = `
      Bạn là trợ lý tư vấn bán hàng cho website KPhone.

      QUY TẮC BẮT BUỘC:
      - CHỈ tư vấn sản phẩm CÓ trong cửa hàng dựa trên danh sách được cung cấp.
      - TUYỆT ĐỐI KHÔNG bịa sản phẩm không tồn tại.
      - Nếu khách hỏi sản phẩm hoặc hãng KHÔNG có → trả lời rõ là cửa hàng chưa kinh doanh.
      - Nếu khách hỏi chung chung → gợi ý các sản phẩm đang bán.
      - Trả lời bằng tiếng Việt, giọng thân thiện, đúng nghiệp vụ bán hàng.
      `;


    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.FRONTEND_URL || "http://localhost:3000",
          "X-Title": "Shop Phone AI Chat",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct",
          temperature: 0.6,
          max_tokens: 800,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "system",
              content: `Danh sách sản phẩm hiện có trong cửa hàng:\n${productContext}`,
            },
            ...conversationHistory.slice(-6),
            { role: "user", content: message.trim() },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error("OpenRouter error:", await response.text());
      return res.status(200).json({
        success: false,
        message: "AI hiện không khả dụng. Vui lòng thử lại sau.",
      });
    }

    const data = await response.json();
    const aiResponse =
      data.choices?.[0]?.message?.content ||
      "Xin lỗi, tôi chưa thể trả lời câu hỏi này.";

    return res.status(200).json({
      success: true,
      message: aiResponse,
      usage: data.usage || null,
    });
  } catch (error) {
    console.error("Chatbox error:", error);
    return res.status(200).json({
      success: false,
      message: "Có lỗi xảy ra khi xử lý yêu cầu.",
    });
  }
});

module.exports = router;
