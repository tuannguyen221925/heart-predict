import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Lấy token trực tiếp từ Server-side Cookies (Đọc được cả HttpOnly Cookie)
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { detail: "Phiên làm việc đã hết hạn hoặc chưa đăng nhập." }, 
        { status: 401 }
      );
    }

    // 2. Lấy tham số username từ URL Client gửi lên (ví dụ: ?username=tuan2205)
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || "tuan2205";

    console.log(`[Proxy Server] Đang gửi yêu cầu lưu kết quả cho: ${username}`);

    // 3. Gọi trung gian sang Backend FastAPI thực tế trên Render kèm theo Bearer Token chuẩn
    const backendResponse = await fetch(`${API_ENDPOINTS.predict}?username=${username}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Đính kèm token xác thực lấy từ HttpOnly Cookie
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error(`[Proxy Server] Backend trả về lỗi ${backendResponse.status}:`, data);
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // 4. Trả kết quả thành công về cho Frontend Client Component
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy Server] Lỗi hệ thống route trung gian:", error);
    return NextResponse.json(
      { detail: "Không thể kết nối đến máy chủ lưu dữ liệu." }, 
      { status: 500 }
    );
  }
}