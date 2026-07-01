"use client";

import { CheckCircle2, HeartPulse, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/lib/api-config";
import { useState } from "react";

export default function PricingTable() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    // 1. Bật trạng thái loading để tránh người dùng nhấn liên tục
    setLoading(true);
    
    try {
      // 2. Lấy Token đăng nhập từ localStorage để xác thực danh tính
      const token = localStorage.getItem("token"); 
      
      if (!token) {
        alert("Vui lòng đăng nhập trước khi thực hiện nâng cấp tài khoản!");
        setLoading(false);
        return;
      }

      // 3. Gọi API POST lên Backend để kích hoạt gói Premium
      const response = await fetch(API_ENDPOINTS.upgradeUser, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      // 4. Xử lý kết quả trả về từ Backend
      if (response.ok) {
        alert("🎉 Tuyệt vời! Tài khoản của bạn đã được nâng cấp lên gói Premium thành công.");
        // Tải lại trang hoặc điều hướng người dùng về trang chatbot
        window.location.reload(); 
      } else {
        // Hiển thị lỗi chi tiết trả về từ `HTTPException` của FastAPI
        alert(data.detail || "Đã xảy ra lỗi trong quá trình nâng cấp gói.");
      }
    } catch (error) {
      console.error("Lỗi khi kết nối API nâng cấp:", error);
      alert("Không thể kết nối đến máy chủ Backend. Vui lòng thử lại sau!");
    } finally {
      // 5. Tắt trạng thái loading sau khi xử lý xong
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Nâng cấp trải nghiệm HeartGuard AI
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Mở khóa toàn bộ sức mạnh của trợ lý y tế cá nhân.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Gói Cơ bản (Miễn phí) */}
        <Card className="border-2 border-gray-200 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <HeartPulse className="text-gray-500" /> Tiêu chuẩn
            </CardTitle>
            <CardDescription>Dành cho nhu cầu kiểm tra sức khỏe cơ bản.</CardDescription>
            <div className="mt-4 text-4xl font-extrabold text-gray-900">
              Miễn phí
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Dự đoán nguy cơ bệnh tim mạch cơ bản</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Chat với AI (Giới hạn 5 tin nhắn/ngày)</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Lưu trữ lịch sử khám gần nhất</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              Gói hiện tại
            </Button>
          </CardFooter>
        </Card>

        {/* Gói Premium */}
        <Card className="border-2 border-rose-500 shadow-xl relative flex flex-col">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
            <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Khuyên dùng
            </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-rose-600">
              <Zap className="text-rose-500 fill-rose-500" /> Premium
            </CardTitle>
            <CardDescription>Phân tích chuyên sâu và trợ lý AI không giới hạn.</CardDescription>
            <div className="mt-4 text-4xl font-extrabold text-gray-900">
              99.000đ <span className="text-xl font-medium text-gray-500">/tháng</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-800 font-medium">
                <CheckCircle2 className="h-5 w-5 text-rose-500" />
                <span>Mọi tính năng của gói Tiêu chuẩn</span>
              </li>
              <li className="flex items-center gap-3 text-gray-800">
                <CheckCircle2 className="h-5 w-5 text-rose-500" />
                <span>Nhắn tin với AI <strong className="text-rose-600">Không giới hạn</strong></span>
              </li>
              <li className="flex items-center gap-3 text-gray-800">
                <CheckCircle2 className="h-5 w-5 text-rose-500" />
                <span>Phân tích biểu đồ chỉ số sức khỏe chi tiết</span>
              </li>
              <li className="flex items-center gap-3 text-gray-800">
                <CheckCircle2 className="h-5 w-5 text-rose-500" />
                <span>Tạo báo cáo y tế định dạng PDF</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2" 
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Nâng cấp ngay"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}